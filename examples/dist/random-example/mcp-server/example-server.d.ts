/**
 * Example MCP server demonstrating decorator usage with session management
 */
export declare class ExampleMCPServer {
    private sessionManager;
    constructor();
    /**
     * Simple math tool that adds two numbers
     */
    add(params: {
        a: number;
        b: number;
        sessionId?: string;
    }): Promise<{
        result: number;
        operation: string;
        timestamp: string;
    }>;
    /**
     * Tool that multiplies two numbers
     */
    multiply(params: {
        a: number;
        b: number;
        sessionId?: string;
    }): Promise<{
        result: number;
        operation: string;
        timestamp: string;
    }>;
    /**
     * Tool to create a new session
     */
    createSession(params: {
        clientName?: string;
        ttlHours?: number;
    }): Promise<{
        sessionId: string;
        expiresAt: string;
        created: boolean;
    }>;
    /**
     * Tool to get session information
     */
    getSessionInfo(params: {
        sessionId: string;
    }): Promise<{
        found: boolean;
        sessionInfo?: undefined;
    } | {
        found: boolean;
        sessionInfo: {
            sessionId: string;
            createdAt: string;
            expiresAt: string;
            state: Record<string, unknown>;
        };
    }>;
    /**
     * Tool to get current timestamp
     */
    getCurrentTime(): Promise<{
        timestamp: string;
        timezone: string;
        unix: number;
    }>;
    /**
     * Tool that generates a UUID
     */
    generateUUID(params: {
        count?: number;
    }): Promise<{
        uuids: string[];
        count: number;
    }>;
    /**
     * Tool that processes text (example of string manipulation)
     */
    processText(params: {
        text: string;
        operation: 'uppercase' | 'lowercase' | 'reverse' | 'wordcount';
        sessionId?: string;
    }): Promise<{
        original: string;
        processed: string;
        operation: "reverse" | "uppercase" | "lowercase" | "wordcount";
        metadata: Record<string, unknown>;
    }>;
}
