import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'mcp-lambda-sdk';
/**
 * Handler específico para o servidor MCP de Calculadora
 * Este handler usa o factory genérico para criar um handler customizado
 */
export declare const calculatorHandler: (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;
/**
 * Função principal para compatibilidade com Serverless Framework
 */
export declare function main(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2>;
