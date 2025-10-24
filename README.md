# MCP Lambda SDK

A TypeScript SDK for creating Model Context Protocol (MCP) servers that run on AWS Lambda using decorators.

## Overview

The MCP Lambda SDK provides a simple, decorator-based approach to create MCP servers that run as AWS Lambda functions. With just a few decorators, you can expose your Lambda functions as MCP tools that can be called by AI systems following the Model Context Protocol specification.

## Installation

```bash
npm install mcp-lambda-sdk
```

## Quick Start

### 1. Create an MCP Server Class

```typescript
import { MCPServer, MCPTool, z } from 'mcp-lambda-sdk';

@MCPServer({
  name: 'my-calculator-server',
  version: '1.0.0'
})
export class CalculatorServer {
  @MCPTool({
    title: 'Add Numbers',
    description: 'Adds two numbers together',
    inputSchema: {
      a: z.number().describe('First number'),
      b: z.number().describe('Second number')
    },
    outputSchema: {
      result: z.number().describe('The sum of the two numbers'),
      operation: z.string().describe('Description of the operation')
    }
  })
  async add(params: { a: number; b: number }) {
    return {
      result: params.a + params.b,
      operation: `Added ${params.a} + ${params.b}`
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
      result: z.number().describe('The product of the two numbers')
    }
  })
  async multiply(params: { a: number; b: number }) {
    return {
      result: params.a * params.b
    };
  }
}
```

### 2. Create the Lambda Handler

```typescript
import { MCPHandlerFactory, APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'mcp-lambda-sdk';
import { CalculatorServer } from './calculator-server';

// Create the handler using the factory
export const calculatorHandler = MCPHandlerFactory.createHandler(CalculatorServer, 'calculator');

// Export the main function for the serverless framework
export async function main(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  return await calculatorHandler(event);
}
```

### 3. Deploy to AWS Lambda

Configure your `serverless.yml` (or preferred deployment method):

```yaml
service: my-mcp-server

provider:
  name: aws
  runtime: nodejs18.x

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
```

## API Reference

### Decorators

#### `@MCPServer(config)`

Marks a class as an MCP server.

**Parameters:**

- `config.name`: Server name identifier
- `config.version`: Server version

#### `@MCPTool(config)`

Marks a method as an MCP tool.

**Parameters:**

- `config.title`: Human-readable tool title
- `config.description`: Tool description
- `config.inputSchema`: Zod schema object for input validation
- `config.outputSchema`: Zod schema object for output validation

### Factory Methods

#### `MCPHandlerFactory.createHandler(ServerClass, serverName?)`

Creates a Lambda handler function for an MCP server class.

**Parameters:**

- `ServerClass`: The decorated MCP server class
- `serverName`: Optional server instance name

**Returns:** AWS Lambda handler function

### Session Management

The SDK includes built-in session management to maintain state across multiple tool calls from the same client session.

```typescript
import { MCPSessionManager } from 'mcp-lambda-sdk';

@MCPServer({
  name: 'stateful-server',
  version: '1.0.0'
})
export class StatefulServer {
  private sessionManager = new MCPSessionManager();

  @MCPTool({
    title: 'Store Value',
    description: 'Stores a value in the session',
    inputSchema: {
      key: z.string(),
      value: z.string(),
      sessionId: z.string().optional()
    },
    outputSchema: {
      success: z.boolean()
    }
  })
  async storeValue(params: { key: string; value: string; sessionId?: string }) {
    if (params.sessionId) {
      await this.sessionManager.updateSessionState(params.sessionId, {
        [params.key]: params.value
      });
    }
    return { success: true };
  }
}
```

## Advanced Features

### Custom Validation

You can use any Zod schema for input and output validation:

```typescript
@MCPTool({
  title: 'Process User',
  description: 'Processes user data',
  inputSchema: {
    user: z.object({
      name: z.string().min(1),
      email: z.string().email(),
      age: z.number().int().min(0).max(120)
    })
  },
  outputSchema: {
    processed: z.boolean(),
    userId: z.string().uuid()
  }
})
async processUser(params: { user: { name: string; email: string; age: number } }) {
  // Process user logic here
  return {
    processed: true,
    userId: crypto.randomUUID()
  };
}
```

### Error Handling

The SDK automatically handles errors and returns them in the proper MCP format:

```typescript
@MCPTool({
  title: 'Divide Numbers',
  description: 'Divides two numbers',
  inputSchema: {
    dividend: z.number(),
    divisor: z.number()
  },
  outputSchema: {
    result: z.number()
  }
})
async divide(params: { dividend: number; divisor: number }) {
  if (params.divisor === 0) {
    throw new Error('Division by zero is not allowed');
  }
  return {
    result: params.dividend / params.divisor
  };
}
```

## Examples

See the `/examples` directory for complete working examples:

- **Calculator Server**: Basic arithmetic operations
- **Data Processing Server**: Advanced data manipulation tools

## Requirements

- Node.js 18+
- TypeScript 5.0+
- AWS Lambda (for deployment)

## Dependencies

- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `zod`: Schema validation
- `reflect-metadata`: Decorator metadata support
- `uuid`: Session ID generation

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

- Create an issue on GitHub for bug reports
- Check the examples for usage patterns
- Review the MCP specification at [modelcontextprotocol.io](https://modelcontextprotocol.io)

## Usage

### Deployment

In order to deploy the example, you need to run the following command:

```
serverless deploy
```

After running deploy, you should see output similar to:

```
Deploying "serverless-http-api" to stage "dev" (us-east-1)

✔ Service deployed to stack serverless-http-api-dev (91s)

endpoint: GET - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/
functions:
  hello: serverless-http-api-dev-hello (1.6 kB)
```

_Note_: In current form, after deployment, your API is public and can be invoked by anyone. For production deployments, you might want to configure an authorizer. For details on how to do that, refer to [HTTP API (API Gateway V2) event docs](https://www.serverless.com/framework/docs/providers/aws/events/http-api).

### Invocation

After successful deployment, you can call the created application via HTTP:

```
curl https://xxxxxxx.execute-api.us-east-1.amazonaws.com/
```

Which should result in response similar to:

```json
{ "message": "Go Serverless v4! Your function executed successfully!" }
```

### Local development

The easiest way to develop and test your function is to use the `dev` command:

```
serverless dev
```

This will start a local emulator of AWS Lambda and tunnel your requests to and from AWS Lambda, allowing you to interact with your function as if it were running in the cloud.

Now you can invoke the function as before, but this time the function will be executed locally. Now you can develop your function locally, invoke it, and see the results immediately without having to re-deploy.

When you are done developing, don't forget to run `serverless deploy` to deploy the function to the cloud.
