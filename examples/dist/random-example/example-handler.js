"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleServerHandler = void 0;
exports.main = main;
const mcp_lambda_sdk_1 = require("mcp-lambda-sdk");
const example_server_1 = require("./mcp-server/example-server");
/**
 * Handler específico para o servidor MCP de Calculadora
 * Este handler usa o factory genérico para criar um handler customizado
 */
exports.exampleServerHandler = mcp_lambda_sdk_1.MCPHandlerFactory.createHandler(example_server_1.ExampleMCPServer, 'example-server');
/**
 * Função principal para compatibilidade com Serverless Framework
 */
async function main(event) {
    return await (0, exports.exampleServerHandler)(event);
}
//# sourceMappingURL=example-handler.js.map