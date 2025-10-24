"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPHandlerFactory = void 0;
require("reflect-metadata");
const server_factory_js_1 = require("./server-factory.js");
// Simple in-memory store for server instances (for Lambda)
const serverInstances = {};
/**
 * Generic MCP Handler Factory
 */
class MCPHandlerFactory {
    /**
     * Creates a generic MCP handler for any decorated server class
     * @param ServerClass - The decorated MCP server class
     * @param serverName - Optional server name for instance management
     */
    static createHandler(ServerClass, serverName) {
        return async (event) => {
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
                let jsonRpcRequest;
                try {
                    jsonRpcRequest = event.body ? JSON.parse(event.body) : {};
                }
                catch {
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
                    server = server_factory_js_1.MCPServerFactory.createServer(ServerClass, serverInstance);
                    serverInstances[instanceKey] = server;
                    // Clean up old instances (simple cleanup - in production use Redis or similar)
                    if (Object.keys(serverInstances).length > 100) {
                        const oldestKey = Object.keys(serverInstances)[0];
                        delete serverInstances[oldestKey];
                    }
                }
                // Handle the JSON-RPC request
                const response = await handleJsonRpcRequest(server, jsonRpcRequest, sessionId, ServerClass);
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
            }
            catch (error) {
                console.error('Error in MCP handler:', error);
                return errorResponse(500, -32603, 'Internal server error');
            }
        };
    }
}
exports.MCPHandlerFactory = MCPHandlerFactory;
/**
 * Handles JSON-RPC requests for any MCP server
 */
async function handleJsonRpcRequest(server, request, sessionId, ServerClass) {
    try {
        switch (request.method) {
            case 'initialize':
                return {
                    jsonrpc: '2.0',
                    id: request.id,
                    result: {
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
                    }
                };
            case 'tools/list': {
                const tools = await getServerTools(server, ServerClass);
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
                const toolResult = await callServerTool(server, request.params.name, request.params.arguments || {}, sessionId, ServerClass);
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
                const resourceContent = await readServerResource(server, request.params.uri, sessionId);
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
                const promptResult = await getServerPrompt(server, request.params.name, request.params.arguments || {}, sessionId);
                return {
                    jsonrpc: '2.0',
                    id: request.id,
                    result: promptResult
                };
            }
            default:
                throw new Error(`Unknown method: ${request.method}`);
        }
    }
    catch (error) {
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
async function getServerTools(_server, ServerClass) {
    const { getToolMetadata } = await Promise.resolve().then(() => __importStar(require('./decorators.js')));
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
async function callServerTool(_server, toolName, args, sessionId, ServerClass) {
    const serverInstance = new ServerClass();
    const { getToolMetadata } = await Promise.resolve().then(() => __importStar(require('./decorators.js')));
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
function convertZodSchemasToJsonSchema(schemas) {
    const jsonSchema = {
        type: 'object',
        properties: {},
        required: []
    };
    const properties = {};
    const required = [];
    for (const [key, schema] of Object.entries(schemas)) {
        // This is a simplified conversion - in production you'd want a proper Zod to JSON Schema converter
        if (typeof schema === 'object' && schema !== null) {
            const schemaObj = schema;
            if (schemaObj._def?.typeName === 'ZodNumber') {
                properties[key] = { type: 'number', description: schemaObj.description };
                if (!schemaObj._def.checks?.some((c) => c.kind === 'optional')) {
                    required.push(key);
                }
            }
            else if (schemaObj._def?.typeName === 'ZodString') {
                properties[key] = { type: 'string', description: schemaObj.description };
                if (!schemaObj._def.checks?.some((c) => c.kind === 'optional')) {
                    required.push(key);
                }
            }
            else if (schemaObj._def?.typeName === 'ZodOptional') {
                // Handle optional fields
                const innerType = schemaObj._def.innerType;
                if (innerType._def?.typeName === 'ZodNumber') {
                    properties[key] = { type: 'number', description: innerType.description };
                }
                else if (innerType._def?.typeName === 'ZodString') {
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
async function getServerResources(_server) {
    return [];
}
async function getServerResourceTemplates(_server) {
    return [];
}
async function readServerResource(_server, _uri, _sessionId) {
    throw new Error('Resource reading not implemented');
}
async function getServerPrompts(_server) {
    return [];
}
async function getServerPrompt(_server, _name, _args, _sessionId) {
    throw new Error('Prompt retrieval not implemented');
}
/**
 * Helper functions
 */
function corsResponse() {
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id'
        }
    };
}
function errorResponse(statusCode, code, message) {
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
//# sourceMappingURL=mcp-handler.js.map