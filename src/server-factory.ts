import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getServerMetadata, getToolMetadata, ToolConfig } from './decorators.js';

export interface MCPToolHandler {
  (...args: unknown[]): unknown;
}

/**
 * Factory class for creating MCP servers from decorated classes
 */
export class MCPServerFactory {
  /**
   * Creates an MCP server instance from a decorated class
   * @param targetClass - The class decorated with @MCPServer
   * @param instance - Instance of the target class (optional, will create if not provided)
   */
  static createServer<T extends object>(targetClass: new (...args: unknown[]) => T, instance?: T): McpServer {
    // Get server metadata from decorator
    const serverConfig = getServerMetadata(targetClass);
    if (!serverConfig) {
      throw new Error(`Class ${targetClass.name} is not decorated with @MCPServer`);
    }

    // Create MCP server instance
    const server = new McpServer({
      name: serverConfig.name,
      version: serverConfig.version
    });

    // Create instance if not provided
    const classInstance = instance || new targetClass();

    // Get all tool metadata
    const tools = getToolMetadata(targetClass);

    // Register each tool
    for (const tool of tools) {
      this.registerTool(server, tool, classInstance);
    }

    return server;
  }

  /**
   * Registers a single tool with the MCP server
   */
  private static registerTool<T extends object>(server: McpServer, tool: ToolConfig & { method: string | symbol; handler: MCPToolHandler }, instance: T): void {
    // Convert Zod schemas to the format expected by MCP SDK
    const inputSchema = this.convertZodSchemas(tool.inputSchema);
    const outputSchema = this.convertZodSchemas(tool.outputSchema);

    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema,
        outputSchema
      },
      async (args: Record<string, unknown>) => {
        try {
          // Validate input using Zod schemas
          const validatedInput = this.validateInput(args, tool.inputSchema);

          // Call the decorated method
          const result = await tool.handler.call(instance, validatedInput);

          // Validate output
          const validatedOutput = this.validateOutput(result, tool.outputSchema);

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(validatedOutput)
              }
            ],
            structuredContent: validatedOutput
          };
        } catch (error) {
          console.error(`Error in tool ${tool.name}:`, error);
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
              }
            ],
            isError: true
          };
        }
      }
    );
  }

  /**
   * Converts Zod schemas to plain object format for MCP SDK
   */
  private static convertZodSchemas(schemas: Record<string, z.ZodTypeAny>): Record<string, z.ZodTypeAny> {
    return schemas;
  }

  /**
   * Validates input using Zod schemas
   */
  private static validateInput(input: Record<string, unknown>, schemas: Record<string, z.ZodTypeAny>): Record<string, unknown> {
    const validated: Record<string, unknown> = {};

    for (const [key, schema] of Object.entries(schemas)) {
      validated[key] = schema.parse(input[key]);
    }

    return validated;
  }

  /**
   * Validates output using Zod schemas
   */
  private static validateOutput(output: unknown, schemas: Record<string, z.ZodTypeAny>): Record<string, unknown> {
    if (typeof output !== 'object' || output === null) {
      throw new Error('Tool output must be an object');
    }

    const validated: Record<string, unknown> = {};
    const outputObj = output as Record<string, unknown>;

    for (const [key, schema] of Object.entries(schemas)) {
      validated[key] = schema.parse(outputObj[key]);
    }

    return validated;
  }
}
