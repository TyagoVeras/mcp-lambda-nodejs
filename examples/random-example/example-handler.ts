import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, MCPHandlerFactory } from 'mcp-lambda-sdk';
import { ExampleMCPServer } from './mcp-server/example-server';

/**
 * Handler específico para o servidor MCP de Calculadora
 * Este handler usa o factory genérico para criar um handler customizado
 */
export const exampleServerHandler = MCPHandlerFactory.createHandler(ExampleMCPServer, 'example-server');

/**
 * Função principal para compatibilidade com Serverless Framework
 */
export async function main(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  return await exampleServerHandler(event);
}
