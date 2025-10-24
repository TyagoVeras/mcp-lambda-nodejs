"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatorHandler = void 0;
exports.main = main;
const mcp_lambda_sdk_1 = require("mcp-lambda-sdk");
const calculator_server_1 = require("./mcp-server/calculator-server");
/**
 * Handler específico para o servidor MCP de Calculadora
 * Este handler usa o factory genérico para criar um handler customizado
 */
exports.calculatorHandler = mcp_lambda_sdk_1.MCPHandlerFactory.createHandler(calculator_server_1.CalculatorMCPServer, 'calculator-server');
/**
 * Função principal para compatibilidade com Serverless Framework
 */
async function main(event) {
    return await (0, exports.calculatorHandler)(event);
}
//# sourceMappingURL=calculator-handler.js.map