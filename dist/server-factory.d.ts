import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
export interface MCPToolHandler {
    (...args: unknown[]): unknown;
}
/**
 * Factory class for creating MCP servers from decorated classes
 */
export declare class MCPServerFactory {
    /**
     * Creates an MCP server instance from a decorated class
     * @param targetClass - The class decorated with @MCPServer
     * @param instance - Instance of the target class (optional, will create if not provided)
     */
    static createServer<T extends object>(targetClass: new (...args: unknown[]) => T, instance?: T): McpServer;
    /**
     * Registers a single tool with the MCP server
     */
    private static registerTool;
    /**
     * Converts Zod schemas to plain object format for MCP SDK
     */
    private static convertZodSchemas;
    /**
     * Validates input using Zod schemas
     */
    private static validateInput;
    /**
     * Validates output using Zod schemas
     */
    private static validateOutput;
}
//# sourceMappingURL=server-factory.d.ts.map