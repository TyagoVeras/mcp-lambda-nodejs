import 'reflect-metadata';
import { z } from 'zod';
export declare const MCP_SERVER_METADATA: unique symbol;
export declare const MCP_TOOL_METADATA: unique symbol;
export interface ToolConfig {
    name: string;
    title: string;
    description: string;
    inputSchema: Record<string, z.ZodTypeAny>;
    outputSchema: Record<string, z.ZodTypeAny>;
}
export interface MCPServerConfig {
    name: string;
    version: string;
}
/**
 * Class decorator to mark a class as an MCP Server
 * @param config - Server configuration including name and version
 */
export declare function MCPServer(config: MCPServerConfig): <T extends new (...args: unknown[]) => object>(constructor: T) => T;
/**
 * Method decorator to register a method as an MCP tool
 * @param config - Tool configuration including schemas
 */
export declare function MCPTool(config: Omit<ToolConfig, 'name'>): (target: object, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => void;
/**
 * Helper function to get server metadata from a class
 */
export declare function getServerMetadata(target: object): MCPServerConfig | undefined;
/**
 * Helper function to get all tool metadata from a class
 */
export declare function getToolMetadata(target: object): Array<ToolConfig & {
    method: string | symbol;
    handler: (...args: unknown[]) => unknown;
}>;
//# sourceMappingURL=decorators.d.ts.map