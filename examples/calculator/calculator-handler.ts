import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, MCPHandlerFactory } from 'mcp-lambda-sdk';
import { CalculatorMCPServer } from './mcp-server/calculator-server';

/**
 * Handler específico para o servidor MCP de Calculadora
 * Este handler usa o factory genérico para criar um handler customizado
 */
export const calculatorHandler = MCPHandlerFactory.createHandler(CalculatorMCPServer, 'calculator-server');

/**
 * Função principal para compatibilidade com Serverless Framework
 */
export async function main(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  return await calculatorHandler(event);
}
