/**
 * MongoDBSessionStorage — reference implementation of SessionStorage backed by MongoDB.
 *
 * Prerequisites (not bundled in the SDK):
 *   npm install mongodb
 *
 * Required collection setup (run once):
 *   db.createCollection('mcp_sessions');
 *   db.mcp_sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
 *
 * The TTL index on the expiresAt field (a Date) lets MongoDB expire documents
 * automatically. cleanup() is a no-op.
 *
 * Usage:
 *   import { MongoClient } from 'mongodb';
 *   import { MCPHandlerFactory, MCPSessionManager } from 'mcp-lambda-nodejs';
 *   import { MongoDBSessionStorage } from './mongodb-session-storage';
 *
 *   const client = new MongoClient(process.env.MONGODB_URI!);
 *   await client.connect();
 *   const storage = new MongoDBSessionStorage(client.db('mydb'), 'mcp_sessions');
 *   const sessionManager = new MCPSessionManager(storage);
 *   export const handler = MCPHandlerFactory.createHandler(MyServer, 'my-server', sessionManager);
 */

import type { Collection, Db } from 'mongodb';
import type { MCPSession, SessionStorage } from 'mcp-lambda-nodejs';

type SessionDocument = Omit<MCPSession, 'expiresAt'> & {
  _id: string;
  expiresAt: Date;
};

export class MongoDBSessionStorage implements SessionStorage {
  private collection: Collection<SessionDocument>;

  constructor(db: Db, collectionName = 'mcp_sessions') {
    this.collection = db.collection<SessionDocument>(collectionName);
  }

  async get(sessionId: string): Promise<MCPSession | null> {
    const doc = await this.collection.findOne({ _id: sessionId });
    if (!doc) return null;

    const { _id, ...rest } = doc;
    return { ...rest, expiresAt: doc.expiresAt.toISOString() } as MCPSession;
  }

  async set(session: MCPSession): Promise<void> {
    const doc: SessionDocument = {
      ...session,
      _id: session.sessionId,
      expiresAt: new Date(session.expiresAt)
    };
    await this.collection.replaceOne({ _id: session.sessionId }, doc, { upsert: true });
  }

  async delete(sessionId: string): Promise<void> {
    await this.collection.deleteOne({ _id: sessionId });
  }

  // MongoDB TTL index handles expiry automatically — no manual scan needed.
  async cleanup(): Promise<void> {}
}
