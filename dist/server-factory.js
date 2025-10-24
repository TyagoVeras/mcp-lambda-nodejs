"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServerFactory = void 0;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const decorators_js_1 = require("./decorators.js");
/**
 * Factory class for creating MCP servers from decorated classes
 */
class MCPServerFactory {
    /**
     * Creates an MCP server instance from a decorated class
     * @param targetClass - The class decorated with @MCPServer
     * @param instance - Instance of the target class (optional, will create if not provided)
     */
    static createServer(targetClass, instance) {
        // Get server metadata from decorator
        const serverConfig = (0, decorators_js_1.getServerMetadata)(targetClass);
        if (!serverConfig) {
            throw new Error(`Class ${targetClass.name} is not decorated with @MCPServer`);
        }
        // Create MCP server instance
        const server = new mcp_js_1.McpServer({
            name: serverConfig.name,
            version: serverConfig.version
        });
        // Create instance if not provided
        const classInstance = instance || new targetClass();
        // Get all tool metadata
        const tools = (0, decorators_js_1.getToolMetadata)(targetClass);
        // Register each tool
        for (const tool of tools) {
            this.registerTool(server, tool, classInstance);
        }
        return server;
    }
    /**
     * Registers a single tool with the MCP server
     */
    static registerTool(server, tool, instance) {
        // Convert Zod schemas to the format expected by MCP SDK
        const inputSchema = this.convertZodSchemas(tool.inputSchema);
        const outputSchema = this.convertZodSchemas(tool.outputSchema);
        server.registerTool(tool.name, {
            title: tool.title,
            description: tool.description,
            inputSchema,
            outputSchema
        }, async (args) => {
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
                            type: 'text',
                            text: JSON.stringify(validatedOutput)
                        }
                    ],
                    structuredContent: validatedOutput
                };
            }
            catch (error) {
                console.error(`Error in tool ${tool.name}:`, error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }
                    ],
                    isError: true
                };
            }
        });
    }
    /**
     * Converts Zod schemas to plain object format for MCP SDK
     */
    static convertZodSchemas(schemas) {
        return schemas;
    }
    /**
     * Validates input using Zod schemas
     */
    static validateInput(input, schemas) {
        const validated = {};
        for (const [key, schema] of Object.entries(schemas)) {
            validated[key] = schema.parse(input[key]);
        }
        return validated;
    }
    /**
     * Validates output using Zod schemas
     */
    static validateOutput(output, schemas) {
        if (typeof output !== 'object' || output === null) {
            throw new Error('Tool output must be an object');
        }
        const validated = {};
        const outputObj = output;
        for (const [key, schema] of Object.entries(schemas)) {
            validated[key] = schema.parse(outputObj[key]);
        }
        return validated;
    }
}
exports.MCPServerFactory = MCPServerFactory;
//# sourceMappingURL=server-factory.js.map