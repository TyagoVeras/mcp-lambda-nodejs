import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import 'reflect-metadata';
/**
 * Generic MCP Handler Factory
 */
export declare class MCPHandlerFactory {
    /**
     * Creates a generic MCP handler for any decorated server class
     * @param ServerClass - The decorated MCP server class
     * @param serverName - Optional server name for instance management
     */
    static createHandler<T extends object>(ServerClass: new (...args: unknown[]) => T, serverName?: string): (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;
}
//# sourceMappingURL=mcp-handler.d.ts.map