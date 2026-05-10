import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import 'reflect-metadata';
import { MCPServerFactory } from './server-factory.js';
import { MCPSessionManager } from './session-manager.js';

// Simple in-memory store for server instances (for Lambda)
const serverInstances: { [key: string]: McpServer } = {};

/**
 * Generic MCP Handler Factory
 */
export class MCPHandlerFactory {
  /**
   * Creates a generic MCP handler for any decorated server class
   * @param ServerClass - The decorated MCP server class
   * @param serverName - Optional server name for instance management
   */
  static createHandler<T extends object>(ServerClass: new (...args: unknown[]) => T, serverName?: string, sessionManager?: MCPSessionManager) {
    return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
      try {
        // Handle CORS preflight
        if (event.requestContext.http.method === 'OPTIONS') {
          return corsResponse();
        }

        // Only handle POST requests for JSON-RPC
        if (event.requestContext.http.method !== 'POST') {
          return errorResponse(405, -32000, 'Method not allowed');
        }

        // Parse JSON-RPC request
        let jsonRpcRequest: JsonRpcRequest;
        try {
          jsonRpcRequest = event.body ? JSON.parse(event.body) : {};
        } catch {
          return errorResponse(400, -32700, 'Parse error: Invalid JSON');
        }

        // Validate JSON-RPC structure
        if (!jsonRpcRequest.jsonrpc || jsonRpcRequest.jsonrpc !== '2.0') {
          return errorResponse(400, -32600, 'Invalid JSON-RPC request');
        }

        // Get or create server instance
        const sessionId = event.headers['mcp-session-id'] || 'default';
        const instanceKey = `${serverName || ServerClass.name}-${sessionId}`;
        let server = serverInstances[instanceKey];

        if (!server) {
          // Create new server instance
          const serverInstance = new ServerClass();
          server = MCPServerFactory.createServer(ServerClass, serverInstance);
          serverInstances[instanceKey] = server;

          // Clean up old instances (simple cleanup - in production use Redis or similar)
          if (Object.keys(serverInstances).length > 100) {
            const oldestKey = Object.keys(serverInstances)[0];
            delete serverInstances[oldestKey];
          }
        }

        // Handle the JSON-RPC request
        const response = await handleJsonRpcRequest(server, jsonRpcRequest, sessionId, ServerClass, sessionManager);

        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id'
          },
          body: JSON.stringify(response)
        };
      } catch (error) {
        console.error('Error in MCP handler:', error);
        return errorResponse(500, -32603, 'Internal server error');
      }
    };
  }
}

/**
 * Handles JSON-RPC requests for any MCP server
 */
async function handleJsonRpcRequest<T extends object>(server: McpServer, request: JsonRpcRequest, sessionId: string, ServerClass: new (...args: unknown[]) => T, sessionManager?: MCPSessionManager): Promise<JsonRpcResponse> {
  try {
    switch (request.method) {
      case 'initialize': {
        const initResult: Record<string, unknown> = {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: { listChanged: true },
            resources: { subscribe: false, listChanged: false },
            prompts: { listChanged: false }
          },
          serverInfo: {
            name: `mcp-lambda-server-${ServerClass.name}`,
            version: '1.0.0'
          }
        };

        if (sessionManager && sessionId !== 'default') {
          const session = await sessionManager.getSession(sessionId);
          if (session) {
            const keys = Object.keys(session.state);
            initResult.instructions = `Active session ${session.sessionId}. State keys: ${keys.length > 0 ? keys.join(', ') : 'none'}. Last updated: ${session.updatedAt}.`;
          }
        }

        return { jsonrpc: '2.0', id: request.id, result: initResult };
      }

      case 'tools/list': {
        const tools = await getServerTools(server, ServerClass);
        if (sessionManager) {
          tools.push({
            name: 'session_recap',
            description: 'Returns a digest of the current session state. Call this after re-initialization to recover context lost to compaction.',
            inputSchema: { type: 'object', properties: {}, required: [] }
          });
        }
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: { tools }
        };
      }

      case 'tools/call': {
        if (!request.params?.name) {
          throw new Error('Tool name is required');
        }

        const toolName = request.params.name as string;

        if (toolName === 'session_recap' && sessionManager) {
          const session = await sessionManager.getSession(sessionId);
          if (!session) {
            throw new Error(`No session found for id: ${sessionId}`);
          }
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  sessionId: session.sessionId,
                  createdAt: session.createdAt,
                  updatedAt: session.updatedAt,
                  stateKeys: Object.keys(session.state),
                  state: session.state
                }, null, 2)
              }]
            }
          };
        }

        const toolResult = await callServerTool(server, toolName, (request.params.arguments as Record<string, unknown>) || {}, sessionId, ServerClass);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: toolResult
        };
      }

      case 'resources/list': {
        const resources = await getServerResources(server);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: { resources }
        };
      }

      case 'resources/read': {
        if (!request.params?.uri) {
          throw new Error('Resource URI is required');
        }

        const resourceContent = await readServerResource(server, request.params.uri as string, sessionId);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: resourceContent
        };
      }

      case 'resources/templates/list': {
        const resourceTemplates = await getServerResourceTemplates(server);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: { resourceTemplates }
        };
      }

      case 'prompts/list': {
        const prompts = await getServerPrompts(server);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: { prompts }
        };
      }

      case 'prompts/get': {
        if (!request.params?.name) {
          throw new Error('Prompt name is required');
        }

        const promptResult = await getServerPrompt(server, request.params.name as string, (request.params.arguments as Record<string, unknown>) || {}, sessionId);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: promptResult
        };
      }

      default:
        throw new Error(`Unknown method: ${request.method}`);
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Get available tools from any decorated server class
 */
async function getServerTools<T extends object>(_server: McpServer, ServerClass: new (...args: unknown[]) => T): Promise<Array<Record<string, unknown>>> {
  const { getToolMetadata } = await import('./decorators.js');
  const tools = getToolMetadata(ServerClass);

  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: convertZodSchemasToJsonSchema(tool.inputSchema)
  }));
}

/**
 * Call a tool on any decorated server class
 */
async function callServerTool<T extends object>(_server: McpServer, toolName: string, args: Record<string, unknown>, sessionId: string, ServerClass: new (...args: unknown[]) => T): Promise<unknown> {
  const serverInstance = new ServerClass();
  const { getToolMetadata } = await import('./decorators.js');
  const tools = getToolMetadata(ServerClass);

  const tool = tools.find((t) => t.name === toolName);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  // Add sessionId to args if not present
  if (!args.sessionId && sessionId !== 'default') {
    args.sessionId = sessionId;
  }

  // Call the tool method
  const result = await tool.handler.call(serverInstance, args);
  return result;
}

/**
 * Convert Zod schemas to JSON Schema format
 */
function convertZodSchemasToJsonSchema(schemas: Record<string, unknown>): Record<string, unknown> {
  const jsonSchema: Record<string, unknown> = {
    type: 'object',
    properties: {},
    required: []
  };

  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, schema] of Object.entries(schemas)) {
    // This is a simplified conversion - in production you'd want a proper Zod to JSON Schema converter
    if (typeof schema === 'object' && schema !== null) {
      const schemaObj = schema as any;
      if (schemaObj._def?.typeName === 'ZodNumber') {
        properties[key] = { type: 'number', description: schemaObj.description };
        if (!schemaObj._def.checks?.some((c: any) => c.kind === 'optional')) {
          required.push(key);
        }
      } else if (schemaObj._def?.typeName === 'ZodString') {
        properties[key] = { type: 'string', description: schemaObj.description };
        if (!schemaObj._def.checks?.some((c: any) => c.kind === 'optional')) {
          required.push(key);
        }
      } else if (schemaObj._def?.typeName === 'ZodOptional') {
        // Handle optional fields
        const innerType = schemaObj._def.innerType;
        if (innerType._def?.typeName === 'ZodNumber') {
          properties[key] = { type: 'number', description: innerType.description };
        } else if (innerType._def?.typeName === 'ZodString') {
          properties[key] = { type: 'string', description: innerType.description };
        }
      }
    }
  }

  jsonSchema.properties = properties;
  jsonSchema.required = required;

  return jsonSchema;
}

// Helper functions for resources and prompts (placeholder implementations)
async function getServerResources(_server: McpServer): Promise<Array<Record<string, unknown>>> {
  return [];
}

async function getServerResourceTemplates(_server: McpServer): Promise<Array<Record<string, unknown>>> {
  return [];
}

async function readServerResource(_server: McpServer, _uri: string, _sessionId: string): Promise<Record<string, unknown>> {
  throw new Error('Resource reading not implemented');
}

async function getServerPrompts(_server: McpServer): Promise<Array<Record<string, unknown>>> {
  return [];
}

async function getServerPrompt(_server: McpServer, _name: string, _args: Record<string, unknown>, _sessionId: string): Promise<Record<string, unknown>> {
  throw new Error('Prompt retrieval not implemented');
}

/**
 * Helper functions
 */
function corsResponse(): APIGatewayProxyResultV2 {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id'
    }
  };
}

function errorResponse(statusCode: number, code: number, message: string): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      error: { code, message },
      id: null
    })
  };
}

/**
 * Type definitions
 */
interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params?: Record<string, unknown>;
  id: string | number | null;
}

interface JsonRpcResponse {
  jsonrpc: string;
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}
