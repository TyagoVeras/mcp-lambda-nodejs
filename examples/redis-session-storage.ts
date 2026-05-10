/**
 * RedisSessionStorage — reference implementation of SessionStorage backed by Redis.
 *
 * Prerequisites (not bundled in the SDK):
 *   npm install ioredis
 *
 * Each session is stored as a JSON string at key "mcp:session:<sessionId>" with
 * a TTL derived from the session's expiresAt field. Redis handles expiry
 * automatically — cleanup() is a no-op.
 *
 * Usage:
 *   import Redis from 'ioredis';
 *   import { MCPHandlerFactory, MCPSessionManager } from 'mcp-lambda-nodejs';
 *   import { RedisSessionStorage } from './redis-session-storage';
 *
 *   const redis = new Redis({ host: 'localhost', port: 6379 });
 *   const sessionManager = new MCPSessionManager(new RedisSessionStorage(redis));
 *   export const handler = MCPHandlerFactory.createHandler(MyServer, 'my-server', sessionManager);
 */

import type Redis from 'ioredis';
import type { MCPSession, SessionStorage } from 'mcp-lambda-nodejs';

const KEY_PREFIX = 'mcp:session:';

export class RedisSessionStorage implements SessionStorage {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async get(sessionId: string): Promise<MCPSession | null> {
    const raw = await this.redis.get(`${KEY_PREFIX}${sessionId}`);
    if (!raw) return null;
    return JSON.parse(raw) as MCPSession;
  }

  async set(session: MCPSession): Promise<void> {
    const ttlSeconds = Math.max(
      1,
      Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)
    );
    await this.redis.set(
      `${KEY_PREFIX}${session.sessionId}`,
      JSON.stringify(session),
      'EX',
      ttlSeconds
    );
  }

  async delete(sessionId: string): Promise<void> {
    await this.redis.del(`${KEY_PREFIX}${sessionId}`);
  }

  // Redis TTL handles expiry automatically — no manual scan needed.
  async cleanup(): Promise<void> {}
}
