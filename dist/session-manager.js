"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPSessionManager = exports.InMemorySessionStorage = void 0;
const node_crypto_1 = require("node:crypto");
class InMemorySessionStorage {
    constructor() {
        this.sessions = new Map();
    }
    async get(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return null;
        if (new Date(session.expiresAt) < new Date()) {
            this.sessions.delete(sessionId);
            return null;
        }
        return session;
    }
    async set(session) {
        this.sessions.set(session.sessionId, session);
    }
    async delete(sessionId) {
        this.sessions.delete(sessionId);
    }
    async cleanup() {
        const now = new Date();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (new Date(session.expiresAt) < now) {
                this.sessions.delete(sessionId);
            }
        }
    }
}
exports.InMemorySessionStorage = InMemorySessionStorage;
class MCPSessionManager {
    constructor(storage) {
        this.storage = storage || new InMemorySessionStorage();
    }
    async createSession(options = {}) {
        const sessionId = (0, node_crypto_1.randomUUID)();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + (options.ttlHours || 24) * 60 * 60 * 1000);
        const session = {
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
    async getSession(sessionId) {
        return await this.storage.get(sessionId);
    }
    async updateSessionState(sessionId, stateUpdate) {
        const session = await this.storage.get(sessionId);
        if (!session)
            return false;
        session.state = { ...session.state, ...stateUpdate };
        session.updatedAt = new Date().toISOString();
        await this.storage.set(session);
        return true;
    }
    async deleteSession(sessionId) {
        const session = await this.storage.get(sessionId);
        if (!session)
            return false;
        await this.storage.delete(sessionId);
        return true;
    }
}
exports.MCPSessionManager = MCPSessionManager;
//# sourceMappingURL=session-manager.js.map