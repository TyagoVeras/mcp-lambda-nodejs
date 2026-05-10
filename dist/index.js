"use strict";
/**
 * MCP Lambda SDK to NodeJs - Model Context Protocol for AWS Lambda
 *
 * This SDK provides decorators and utilities to easily create MCP servers
 * that run on AWS Lambda functions using TypeScript decorators.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.z = exports.MCPSessionManager = exports.MCPServerFactory = exports.MCPHandlerFactory = exports.MCPTool = exports.MCPServer = exports.getToolMetadata = exports.getServerMetadata = void 0;
// Core decorators
var decorators_js_1 = require("./decorators.js");
Object.defineProperty(exports, "getServerMetadata", { enumerable: true, get: function () { return decorators_js_1.getServerMetadata; } });
Object.defineProperty(exports, "getToolMetadata", { enumerable: true, get: function () { return decorators_js_1.getToolMetadata; } });
Object.defineProperty(exports, "MCPServer", { enumerable: true, get: function () { return decorators_js_1.MCPServer; } });
Object.defineProperty(exports, "MCPTool", { enumerable: true, get: function () { return decorators_js_1.MCPTool; } });
// Handler factory for creating Lambda handlers
var mcp_handler_js_1 = require("./mcp-handler.js");
Object.defineProperty(exports, "MCPHandlerFactory", { enumerable: true, get: function () { return mcp_handler_js_1.MCPHandlerFactory; } });
// Server factory for creating MCP servers from decorated classes
var server_factory_js_1 = require("./server-factory.js");
Object.defineProperty(exports, "MCPServerFactory", { enumerable: true, get: function () { return server_factory_js_1.MCPServerFactory; } });
// Session management
var session_manager_js_1 = require("./session-manager.js");
Object.defineProperty(exports, "MCPSessionManager", { enumerable: true, get: function () { return session_manager_js_1.MCPSessionManager; } });
Object.defineProperty(exports, "InMemorySessionStorage", { enumerable: true, get: function () { return session_manager_js_1.InMemorySessionStorage; } });
Object.defineProperty(exports, "deriveSessionId", { enumerable: true, get: function () { return session_manager_js_1.deriveSessionId; } });
// Re-export Zod for schema validation
var zod_1 = require("zod");
Object.defineProperty(exports, "z", { enumerable: true, get: function () { return zod_1.z; } });
//# sourceMappingURL=index.js.map