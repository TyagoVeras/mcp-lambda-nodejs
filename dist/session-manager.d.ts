export interface MCPSession {
    sessionId: string;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
    clientInfo?: {
        name?: string;
        version?: string;
        userAgent?: string;
    };
    state: Record<string, unknown>;
    metadata: Record<string, unknown>;
}
export interface SessionCreateOptions {
    ttlHours?: number;
    clientInfo?: MCPSession['clientInfo'];
    initialState?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}
export interface SessionStorage {
    get(sessionId: string): Promise<MCPSession | null>;
    set(session: MCPSession): Promise<void>;
    delete(sessionId: string): Promise<void>;
    cleanup(): Promise<void>;
}
export declare class InMemorySessionStorage implements SessionStorage {
    private sessions;
    get(sessionId: string): Promise<MCPSession | null>;
    set(session: MCPSession): Promise<void>;
    delete(sessionId: string): Promise<void>;
    cleanup(): Promise<void>;
}
export declare function deriveSessionId(parts: string[]): string;
export declare class MCPSessionManager {
    private storage;
    constructor(storage?: SessionStorage);
    createSession(options?: SessionCreateOptions): Promise<MCPSession>;
    getSession(sessionId: string): Promise<MCPSession | null>;
    updateSessionState(sessionId: string, stateUpdate: Record<string, unknown>): Promise<boolean>;
    deleteSession(sessionId: string): Promise<boolean>;
}
//# sourceMappingURL=session-manager.d.ts.map