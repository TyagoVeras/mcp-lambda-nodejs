# mcp-lambda-nodejs

TypeScript SDK for creating Model Context Protocol (MCP) servers that run on AWS Lambda using decorators.

## Build & Commands

```bash
pnpm build          # compile TypeScript (tsc) → dist/
pnpm dev            # watch mode
pnpm lint           # ESLint
pnpm lint:fix       # ESLint with auto-fix
pnpm prepublishOnly # runs build before npm publish
```

## Project Layout

```
src/
  index.ts           # public re-exports (the package entry point)
  decorators.ts      # @MCPServer / @MCPTool decorators + metadata helpers
  server-factory.ts  # MCPServerFactory — builds McpServer from decorated class
  mcp-handler.ts     # MCPHandlerFactory — wraps everything as a Lambda handler
  session-manager.ts # MCPSessionManager + SessionStorage interface
dist/                # compiled output (what npm ships)
examples/            # demo usage (excluded from npm package)
```

## Architecture

The decorator pipeline:

1. `@MCPServer` stores server config on the class via `reflect-metadata`.
2. `@MCPTool` appends tool configs (name, Zod schemas, handler ref) to class metadata.
3. `MCPServerFactory.createServer()` reads that metadata and calls `server.registerTool()` for each tool with Zod input/output validation.
4. `MCPHandlerFactory.createHandler()` returns an `APIGatewayProxyEventV2 → APIGatewayProxyResultV2` Lambda handler that:
   - Handles CORS preflight (`OPTIONS`).
   - Parses JSON-RPC 2.0 body.
   - Routes `initialize`, `tools/list`, `tools/call`, `resources/*`, `prompts/*`.
   - Maintains in-memory server instances keyed by `{serverName}-{mcp-session-id}` header (capped at 100 entries, oldest evicted first).

**Important:** the in-memory instance store is per-Lambda-container. Concurrent invocations on different containers will not share session state. For stateful tools, use a persistent `SessionStorage` (e.g. DynamoDB, Redis) and inject it into `MCPSessionManager`.

## Key Decisions

- **Decorators over config objects** — keeps the server class self-describing.
- **Zod for schema** — both validates at runtime and generates the JSON Schema exposed to MCP clients.
- **`reflect-metadata`** required — consumers must import it once at their entry point (the SDK imports it internally, so this is already handled).
- **MCP protocol version `2024-11-05`** hardcoded in `initialize` response — bump when upgrading `@modelcontextprotocol/sdk`.
- **ESM-compatible dist** — `tsconfig.json` targets `commonjs` output but package `exports` supports both `import` and `require`.

## TypeScript Config

- `experimentalDecorators: true` + `emitDecoratorMetadata: true` required.
- `strict: true` with `noUnusedLocals` and `noUnusedParameters` — enforce these in consumer projects too.
- `target: es2020`, `module: commonjs`.

## Consumer Integration (`uso-pacote-mcp/`)

The `uso-pacote-mcp/` sibling directory is a real Serverless Framework v4 project that consumes this package from npm. Use it to manually test end-to-end before publishing. See `CLAUDE.local.md` for local linking instructions.

## Conventions

- No comments unless the WHY is non-obvious.
- `convertZodSchemasToJsonSchema` in `mcp-handler.ts` is a simplified converter — only handles `ZodNumber`, `ZodString`, and `ZodOptional`. Extend it when adding array/enum/object support.
- All Lambda-facing response helpers (`corsResponse`, `errorResponse`) are module-private.
- Session IDs come from the `mcp-session-id` request header; defaults to `'default'` when absent.
