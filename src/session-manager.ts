import { createHash, randomUUID } from 'node:crypto';

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

export class InMemorySessionStorage implements SessionStorage {
  private sessions = new Map<string, MCPSession>();

  async get(sessionId: string): Promise<MCPSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (new Date(session.expiresAt) < new Date()) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  async set(session: MCPSession): Promise<void> {
    this.sessions.set(session.sessionId, session);
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async cleanup(): Promise<void> {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (new Date(session.expiresAt) < now) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

export function deriveSessionId(parts: string[]): string {
  return createHash('sha256').update(parts.join('::')).digest('hex').slice(0, 32);
}

export class MCPSessionManager {
  private storage: SessionStorage;

  constructor(storage?: SessionStorage) {
    this.storage = storage || new InMemorySessionStorage();
  }

  async createSession(options: SessionCreateOptions = {}): Promise<MCPSession> {
    const sessionId = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (options.ttlHours || 24) * 60 * 60 * 1000);

    const session: MCPSession = {
      sessionId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      clientInfo: options.clientInfo || {},
      state: options.initialState || {},
      metadata: options.metadata || {}
    };

    await this.storage.set(session);
    return session;
  }

  async getSession(sessionId: string): Promise<MCPSession | null> {
    return await this.storage.get(sessionId);
  }

  async updateSessionState(sessionId: string, stateUpdate: Record<string, unknown>): Promise<boolean> {
    const session = await this.storage.get(sessionId);
    if (!session) return false;

    session.state = { ...session.state, ...stateUpdate };
    session.updatedAt = new Date().toISOString();

    await this.storage.set(session);
    return true;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const session = await this.storage.get(sessionId);
    if (!session) return false;

    await this.storage.delete(sessionId);
    return true;
  }
}
