import 'reflect-metadata';
import { z } from 'zod';

// Metadata keys for reflection
export const MCP_SERVER_METADATA = Symbol('mcp:server');
export const MCP_TOOL_METADATA = Symbol('mcp:tool');

// Types for tool configuration
export interface ToolConfig {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, z.ZodTypeAny>;
  outputSchema: Record<string, z.ZodTypeAny>;
}

// Interface for MCP server configuration
export interface MCPServerConfig {
  name: string;
  version: string;
}

/**
 * Class decorator to mark a class as an MCP Server
 * @param config - Server configuration including name and version
 */
export function MCPServer(config: MCPServerConfig) {
  return function <T extends new (...args: unknown[]) => object>(constructor: T) {
    Reflect.defineMetadata(MCP_SERVER_METADATA, config, constructor);
    return constructor;
  };
}

/**
 * Method decorator to register a method as an MCP tool
 * @param config - Tool configuration including schemas
 */
export function MCPTool(config: Omit<ToolConfig, 'name'>) {
  return function (target: object, propertyKey: string | symbol, descriptor?: PropertyDescriptor) {
    const existingTools = Reflect.getMetadata(MCP_TOOL_METADATA, target.constructor) || [];

    const toolConfig: ToolConfig = {
      name: String(propertyKey),
      ...config
    };

    existingTools.push({
      ...toolConfig,
      method: propertyKey,
      handler: descriptor?.value
    });

    Reflect.defineMetadata(MCP_TOOL_METADATA, existingTools, target.constructor);
  };
}

/**
 * Helper function to get server metadata from a class
 */
export function getServerMetadata(target: object): MCPServerConfig | undefined {
  return Reflect.getMetadata(MCP_SERVER_METADATA, target);
}

/**
 * Helper function to get all tool metadata from a class
 */
export function getToolMetadata(target: object): Array<ToolConfig & { method: string | symbol; handler: (...args: unknown[]) => unknown }> {
  return Reflect.getMetadata(MCP_TOOL_METADATA, target) || [];
}
