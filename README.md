# mcp-lambda-nodejs

[![npm version](https://img.shields.io/npm/v/mcp-lambda-nodejs)](https://www.npmjs.com/package/mcp-lambda-nodejs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

TypeScript SDK for building [Model Context Protocol](https://modelcontextprotocol.io) (MCP) servers that run as **AWS Lambda functions**.

Define your MCP tools with decorators, wire up a single handler, and deploy — the SDK handles JSON-RPC routing, Zod validation, CORS, and session management automatically.

## Requirements

- Node.js 18+
- TypeScript 5.0+ with `experimentalDecorators` and `emitDecoratorMetadata` enabled

## Installation

```bash
npm install mcp-lambda-nodejs
# peer dependency
npm install --save-dev @types/aws-lambda
```

## Quick Start

### 1. Enable decorator metadata in `tsconfig.json`

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 2. Create your MCP server class

```typescript
// calculator-server.ts
import { MCPServer, MCPTool, z } from 'mcp-lambda-nodejs';

@MCPServer({
  name: 'my-calculator',
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
      result: z.number().describe('The sum'),
      operation: z.string().describe('Human-readable equation')
    }
  })
  async add(params: { a: number; b: number }) {
    return {
      result: params.a + params.b,
      operation: `${params.a} + ${params.b} = ${params.a + params.b}`
    };
  }
}
```

### 3. Create the Lambda handler

```typescript
// handler.ts
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, MCPHandlerFactory } from 'mcp-lambda-nodejs';
import { CalculatorServer } from './calculator-server';

const handler = MCPHandlerFactory.createHandler(CalculatorServer, 'calculator');

export async function main(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  return handler(event);
}
```

### 4. Deploy (Serverless Framework example)

```yaml
# serverless.yml
service: my-mcp-server

provider:
  name: aws
  runtime: nodejs20.x
  build:
    esbuild:
      bundle: true

functions:
  calculator:
    handler: handler.main
    events:
      - httpApi:
          path: /calculator
          method: post
      - httpApi:
          path: /calculator
          method: options
```

```bash
serverless deploy
```

### 5. Call your MCP server

```bash
# List tools
curl -X POST https://<your-api>.execute-api.<region>.amazonaws.com/calculator \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Call a tool
curl -X POST https://<your-api>.execute-api.<region>.amazonaws.com/calculator \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": { "name": "add", "arguments": { "a": 5, "b": 3 } }
  }'
```

Response:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [{ "type": "text", "text": "{\"result\":8,\"operation\":\"5 + 3 = 8\"}" }],
    "structuredContent": { "result": 8, "operation": "5 + 3 = 8" }
  }
}
```

## API Reference

### `@MCPServer(config)`

Class decorator that registers an MCP server.

| Field     | Type     | Description       |
| --------- | -------- | ----------------- |
| `name`    | `string` | Server identifier |
| `version` | `string` | Server version    |

### `@MCPTool(config)`

Method decorator that exposes a method as an MCP tool.

| Field          | Type                      | Description                 |
| -------------- | ------------------------- | --------------------------- |
| `title`        | `string`                  | Human-readable tool name    |
| `description`  | `string`                  | What the tool does          |
| `inputSchema`  | `Record<string, ZodType>` | Zod schema per input field  |
| `outputSchema` | `Record<string, ZodType>` | Zod schema per output field |

The method name becomes the tool's `name` in the MCP protocol.

### `MCPHandlerFactory.createHandler(ServerClass, serverName?)`

Returns an AWS Lambda handler (`APIGatewayProxyEventV2 → APIGatewayProxyResultV2`).

| Parameter     | Type      | Description                              |
| ------------- | --------- | ---------------------------------------- |
| `ServerClass` | Class     | Decorated server class                   |
| `serverName`  | `string?` | Name used for instance keying (optional) |

Automatically handles:

- CORS preflight (`OPTIONS`)
- JSON-RPC 2.0 parsing and routing
- `initialize`, `tools/list`, `tools/call`, `resources/list`, `prompts/list`
- Input/output validation via Zod

### `MCPSessionManager`

Optional session state manager for tools that need to maintain state across calls.

```typescript
import { MCPSessionManager } from 'mcp-lambda-nodejs';

const sessionManager = new MCPSessionManager();

// Create session
const session = await sessionManager.createSession({ ttlHours: 2 });

// Update state
await sessionManager.updateSessionState(session.sessionId, { lastValue: 42 });

// Read session
const current = await sessionManager.getSession(session.sessionId);
```

Default storage is **in-memory**. For multi-container deployments inject a custom `SessionStorage`:

```typescript
import { MCPSessionManager, SessionStorage, MCPSession } from 'mcp-lambda-nodejs';

class DynamoDBSessionStorage implements SessionStorage {
  async get(sessionId: string): Promise<MCPSession | null> {
    /* ... */
  }
  async set(session: MCPSession): Promise<void> {
    /* ... */
  }
  async delete(sessionId: string): Promise<void> {
    /* ... */
  }
  async cleanup(): Promise<void> {
    /* ... */
  }
}

const sessionManager = new MCPSessionManager(new DynamoDBSessionStorage());
```

### Session ID in requests

Pass `mcp-session-id` as an HTTP header. The SDK extracts it automatically and injects it into tool arguments when not already present:

```bash
curl -X POST https://... \
  -H "mcp-session-id: user-abc-123" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{...}}'
```

## Advanced Usage

### Stateful tools

```typescript
import { MCPServer, MCPTool, MCPSessionManager, z } from 'mcp-lambda-nodejs';

@MCPServer({ name: 'stateful-server', version: '1.0.0' })
export class StatefulServer {
  private sessionManager = new MCPSessionManager();

  @MCPTool({
    title: 'Increment Counter',
    description: 'Increments a per-session counter',
    inputSchema: { sessionId: z.string().optional() },
    outputSchema: { count: z.number() }
  })
  async increment(params: { sessionId?: string }) {
    const session = params.sessionId ? await this.sessionManager.getSession(params.sessionId) : null;

    const count = ((session?.state.count as number) ?? 0) + 1;

    if (params.sessionId) {
      await this.sessionManager.updateSessionState(params.sessionId, { count });
    }

    return { count };
  }
}
```

### Error handling

Throw inside a tool method — the SDK catches it and returns a proper MCP error response:

```typescript
@MCPTool({
  title: 'Safe Divide',
  description: 'Divides two numbers',
  inputSchema: { dividend: z.number(), divisor: z.number() },
  outputSchema: { result: z.number() }
})
async divide(params: { dividend: number; divisor: number }) {
  if (params.divisor === 0) {
    throw new Error('Division by zero');
  }
  return { result: params.dividend / params.divisor };
}
```

## Supported JSON-RPC Methods

| Method           | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `initialize`     | Handshake — returns protocol version and capabilities |
| `tools/list`     | Lists all `@MCPTool`-decorated methods                |
| `tools/call`     | Calls a tool by name                                  |
| `resources/list` | Returns empty list (stub)                             |
| `resources/read` | Not implemented                                       |
| `prompts/list`   | Returns empty list (stub)                             |
| `prompts/get`    | Not implemented                                       |

## Dependencies

| Package                     | Purpose                     |
| --------------------------- | --------------------------- |
| `@modelcontextprotocol/sdk` | MCP protocol implementation |
| `zod`                       | Schema validation           |
| `reflect-metadata`          | Decorator metadata          |
| `uuid`                      | Session ID generation       |

## License

MIT © [Tyago Veras](https://github.com/TyagoVeras)

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make changes with tests
4. Open a pull request

Issues: <https://github.com/TyagoVeras/mcp-lambda-nodejs/issues>
