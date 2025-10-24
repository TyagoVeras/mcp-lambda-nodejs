/**
 * MCP Lambda SDK - Model Context Protocol for AWS Lambda
 *
 * This SDK provides decorators and utilities to easily create MCP servers
 * that run on AWS Lambda functions using TypeScript decorators.
 */
export { MCPServer, MCPTool, getServerMetadata, getToolMetadata, type MCPServerConfig, type ToolConfig } from './decorators.js';
export { MCPHandlerFactory } from './mcp-handler.js';
export { MCPServerFactory, type MCPToolHandler } from './server-factory.js';
export { MCPSessionManager } from './session-manager.js';
export type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
export type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
export { z } from 'zod';
//# sourceMappingURL=index.d.ts.map