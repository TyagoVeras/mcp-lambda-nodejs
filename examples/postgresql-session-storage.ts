/**
 * PostgreSQLSessionStorage — reference implementation of SessionStorage backed by PostgreSQL.
 *
 * Prerequisites (not bundled in the SDK):
 *   npm install pg
 *   npm install --save-dev @types/pg
 *
 * Required table (run once):
 *   CREATE TABLE mcp_sessions (
 *     session_id   TEXT        PRIMARY KEY,
 *     created_at   TIMESTAMPTZ NOT NULL,
 *     updated_at   TIMESTAMPTZ NOT NULL,
 *     expires_at   TIMESTAMPTZ NOT NULL,
 *     client_info  JSONB       NOT NULL DEFAULT '{}',
 *     state        JSONB       NOT NULL DEFAULT '{}',
 *     metadata     JSONB       NOT NULL DEFAULT '{}'
 *   );
 *   CREATE INDEX ON mcp_sessions (expires_at);
 *
 * Expired rows are not deleted automatically. Call cleanup() periodically
 * (e.g. from a scheduled Lambda or cron) or let get() silently skip them.
 *
 * Usage:
 *   import { Pool } from 'pg';
 *   import { MCPHandlerFactory, MCPSessionManager } from 'mcp-lambda-nodejs';
 *   import { PostgreSQLSessionStorage } from './postgresql-session-storage';
 *
 *   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
 *   const sessionManager = new MCPSessionManager(new PostgreSQLSessionStorage(pool));
 *   export const handler = MCPHandlerFactory.createHandler(MyServer, 'my-server', sessionManager);
 */

import type { Pool } from 'pg';
import type { MCPSession, SessionStorage } from 'mcp-lambda-nodejs';

export class PostgreSQLSessionStorage implements SessionStorage {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async get(sessionId: string): Promise<MCPSession | null> {
    const result = await this.pool.query(
      `SELECT session_id, created_at, updated_at, expires_at, client_info, state, metadata
         FROM mcp_sessions
        WHERE session_id = $1 AND expires_at > NOW()`,
      [sessionId]
    );
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      sessionId:  row.session_id,
      createdAt:  row.created_at.toISOString(),
      updatedAt:  row.updated_at.toISOString(),
      expiresAt:  row.expires_at.toISOString(),
      clientInfo: row.client_info,
      state:      row.state,
      metadata:   row.metadata
    };
  }

  async set(session: MCPSession): Promise<void> {
    await this.pool.query(
      `INSERT INTO mcp_sessions
         (session_id, created_at, updated_at, expires_at, client_info, state, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (session_id) DO UPDATE SET
         updated_at  = EXCLUDED.updated_at,
         expires_at  = EXCLUDED.expires_at,
         client_info = EXCLUDED.client_info,
         state       = EXCLUDED.state,
         metadata    = EXCLUDED.metadata`,
      [
        session.sessionId,
        session.createdAt,
        session.updatedAt,
        session.expiresAt,
        JSON.stringify(session.clientInfo ?? {}),
        JSON.stringify(session.state),
        JSON.stringify(session.metadata)
      ]
    );
  }

  async delete(sessionId: string): Promise<void> {
    await this.pool.query('DELETE FROM mcp_sessions WHERE session_id = $1', [sessionId]);
  }

  async cleanup(): Promise<void> {
    await this.pool.query('DELETE FROM mcp_sessions WHERE expires_at <= NOW()');
  }
}
