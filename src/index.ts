/**
 * MCP Lambda SDK - Model Context Protocol for AWS Lambda
 *
 * This SDK provides decorators and utilities to easily create MCP servers
 * that run on AWS Lambda functions using TypeScript decorators.
 */

// Core decorators
export { MCPServer, MCPTool, getServerMetadata, getToolMetadata, type MCPServerConfig, type ToolConfig } from './decorators.js';

// Handler factory for creating Lambda handlers
export { MCPHandlerFactory } from './mcp-handler.js';

// Server factory for creating MCP servers from decorated classes
export { MCPServerFactory, type MCPToolHandler } from './server-factory.js';

// Session management
export { MCPSessionManager } from './session-manager.js';

// Re-export types from AWS Lambda for convenience
export type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

// Re-export common types from MCP SDK
export type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Re-export Zod for schema validation
export { z } from 'zod';
