"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCP_TOOL_METADATA = exports.MCP_SERVER_METADATA = void 0;
exports.MCPServer = MCPServer;
exports.MCPTool = MCPTool;
exports.getServerMetadata = getServerMetadata;
exports.getToolMetadata = getToolMetadata;
require("reflect-metadata");
// Metadata keys for reflection
exports.MCP_SERVER_METADATA = Symbol('mcp:server');
exports.MCP_TOOL_METADATA = Symbol('mcp:tool');
/**
 * Class decorator to mark a class as an MCP Server
 * @param config - Server configuration including name and version
 */
function MCPServer(config) {
    return function (constructor) {
        Reflect.defineMetadata(exports.MCP_SERVER_METADATA, config, constructor);
        return constructor;
    };
}
/**
 * Method decorator to register a method as an MCP tool
 * @param config - Tool configuration including schemas
 */
function MCPTool(config) {
    return function (target, propertyKey, descriptor) {
        const existingTools = Reflect.getMetadata(exports.MCP_TOOL_METADATA, target.constructor) || [];
        const toolConfig = {
            name: String(propertyKey),
            ...config
        };
        existingTools.push({
            ...toolConfig,
            method: propertyKey,
            handler: descriptor?.value
        });
        Reflect.defineMetadata(exports.MCP_TOOL_METADATA, existingTools, target.constructor);
    };
}
/**
 * Helper function to get server metadata from a class
 */
function getServerMetadata(target) {
    return Reflect.getMetadata(exports.MCP_SERVER_METADATA, target);
}
/**
 * Helper function to get all tool metadata from a class
 */
function getToolMetadata(target) {
    return Reflect.getMetadata(exports.MCP_TOOL_METADATA, target) || [];
}
//# sourceMappingURL=decorators.js.map