#!/usr/bin/env node

/**
 * Simple demonstration of how the MCP Lambda SDK works
 * This shows how easy it is to create an MCP server with decorators
 */

import { MCPHandlerFactory, MCPServer, MCPTool, z } from 'mcp-lambda-sdk';

// Step 1: Create a simple MCP server class with decorators
@MCPServer({
  name: 'demo-calculator',
  version: '1.0.0'
})
class DemoCalculator {
  @MCPTool({
    title: 'Add Two Numbers',
    description: 'Performs addition of two numbers',
    inputSchema: {
      a: z.number().describe('First number'),
      b: z.number().describe('Second number')
    },
    outputSchema: {
      result: z.number().describe('Sum of the two numbers'),
      equation: z.string().describe('The equation that was calculated')
    }
  })
  async add(params: { a: number; b: number }) {
    const result = params.a + params.b;
    return {
      result,
      equation: `${params.a} + ${params.b} = ${result}`
    };
  }

  @MCPTool({
    title: 'Generate Random Number',
    description: 'Generates a random number between min and max',
    inputSchema: {
      min: z.number().default(0).describe('Minimum value'),
      max: z.number().default(100).describe('Maximum value')
    },
    outputSchema: {
      randomNumber: z.number().describe('The generated random number'),
      range: z.string().describe('The range used')
    }
  })
  async random(params: { min?: number; max?: number }) {
    const min = params.min ?? 0;
    const max = params.max ?? 100;
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

    return {
      randomNumber,
      range: `${min} to ${max}`
    };
  }
}

// Step 2: Create the Lambda handler - it's this simple!
const handler = MCPHandlerFactory.createHandler(DemoCalculator, 'demo');

console.log('✅ MCP Lambda SDK Demo');
console.log('');
console.log('🎯 Key Features Demonstrated:');
console.log('  • Simple @MCPServer decorator to mark server classes');
console.log('  • @MCPTool decorator to expose methods as MCP tools');
console.log('  • Automatic Zod schema validation for inputs/outputs');
console.log('  • One-line handler creation with MCPHandlerFactory');
console.log('  • Full TypeScript support with type safety');
console.log('');
console.log('🚀 Ready to deploy to AWS Lambda!');
console.log('');
console.log('Example usage in your Lambda function:');
console.log('');
console.log('export async function main(event: APIGatewayProxyEventV2) {');
console.log('  return await handler(event);');
console.log('}');
console.log('');
console.log("That's it! Your MCP server is ready to receive JSON-RPC calls.");
console.log('');
