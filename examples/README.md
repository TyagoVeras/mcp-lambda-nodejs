# MCP Lambda SDK - Calculator Example

This example demonstrates how to use the `mcp-lambda-node` package to create a Model Context Protocol server that runs on AWS Lambda.

## Installation

First, install the package in your project:

```bash
npm install mcp-lambda-node
npm install --save-dev @types/aws-lambda typescript
```

## Usage

### 1. Create the MCP Server Class

Create a file `calculator-server.ts`:

```typescript
import { z, MCPServer, MCPTool, MCPSessionManager } from 'mcp-lambda-node';

@MCPServer({
  name: 'calculator-mcp-server',
  version: '1.0.0'
})
export class CalculatorMCPServer {
  private sessionManager: MCPSessionManager;

  constructor() {
    this.sessionManager = new MCPSessionManager();
  }

  @MCPTool({
    title: 'Add Numbers',
    description: 'Adds two numbers together',
    inputSchema: {
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
      sessionId: z.string().optional().describe('Session ID for tracking')
    },
    outputSchema: {
      result: z.number().describe('The sum of the two numbers'),
      operation: z.string().describe('Description of the operation'),
      timestamp: z.string().describe('Timestamp of the operation')
    }
  })
  async add(params: { a: number; b: number; sessionId?: string }) {
    const result = params.a + params.b;
    const timestamp = new Date().toISOString();

    // Store operation in session if sessionId provided
    if (params.sessionId) {
      await this.sessionManager.updateSessionState(params.sessionId, {
        lastOperation: {
          type: 'add',
          operands: [params.a, params.b],
          result,
          timestamp
        }
      });
    }

    return {
      result,
      operation: `Added ${params.a} + ${params.b}`,
      timestamp
    };
  }

  @MCPTool({
    title: 'Multiply Numbers',
    description: 'Multiplies two numbers',
    inputSchema: {
      a: z.number().describe('First number'),
      b: z.number().describe('Second number')
    },
    outputSchema: {
      result: z.number().describe('The product of the two numbers'),
      operation: z.string().describe('Description of the operation')
    }
  })
  async multiply(params: { a: number; b: number }) {
    return {
      result: params.a * params.b,
      operation: `Multiplied ${params.a} × ${params.b}`
    };
  }
}
```

### 2. Create the Lambda Handler

Create a file `calculator-handler.ts`:

```typescript
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, MCPHandlerFactory } from 'mcp-lambda-node';
import { CalculatorMCPServer } from './calculator-server';

// Create the handler using the factory
export const calculatorHandler = MCPHandlerFactory.createHandler(CalculatorMCPServer, 'calculator-server');

// Export the main function for the serverless framework
export async function main(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  return await calculatorHandler(event);
}
```

### 3. Deploy Configuration

Create a `serverless.yml` file:

```yaml
service: mcp-calculator-example

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1

functions:
  calculator:
    handler: dist/calculator-handler.main
    events:
      - httpApi:
          path: /calculator
          method: post
      - httpApi:
          path: /calculator
          method: options

plugins:
  - serverless-plugin-typescript
```

### 4. Build and Deploy

```bash
# Build the TypeScript code
npm run build

# Deploy using Serverless Framework
npx serverless deploy
```

## Testing

You can test your MCP server by sending JSON-RPC requests to the deployed endpoint:

```bash
curl -X POST https://your-api-gateway-url/calculator \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "add",
      "arguments": {
        "a": 5,
        "b": 3
      }
    }
  }'
```

Expected response:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"result\":8,\"operation\":\"Added 5 + 3\",\"timestamp\":\"2024-01-01T12:00:00.000Z\"}"
      }
    ],
    "structuredContent": {
      "result": 8,
      "operation": "Added 5 + 3",
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

## Features Demonstrated

- **Decorators**: Simple `@MCPServer` and `@MCPTool` decorators
- **Type Safety**: Full TypeScript support with Zod schemas
- **Session Management**: Optional session state tracking
- **Error Handling**: Automatic error handling and validation
- **AWS Lambda**: Seamless integration with AWS Lambda and API Gateway

## Next Steps

- Add more complex tools with different data types
- Implement custom session storage (Redis, DynamoDB)
- Add authentication and authorization
- Set up monitoring and logging
- Create integration tests
