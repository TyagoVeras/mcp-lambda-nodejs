/**
 * DynamoDBSessionStorage — reference implementation of SessionStorage backed by DynamoDB.
 *
 * Prerequisites (not bundled in the SDK):
 *   npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
 *
 * Required DynamoDB table schema:
 *   - Partition key: sessionId (String)
 *   - TTL attribute:  expiresAtEpoch (Number)  — enable TTL on this attribute in the console
 *
 * Example table creation via AWS CLI:
 *   aws dynamodb create-table \
 *     --table-name mcp-sessions \
 *     --attribute-definitions AttributeName=sessionId,AttributeType=S \
 *     --key-schema AttributeName=sessionId,KeyType=HASH \
 *     --billing-mode PAY_PER_REQUEST
 *
 *   aws dynamodb update-time-to-live \
 *     --table-name mcp-sessions \
 *     --time-to-live-specification Enabled=true,AttributeName=expiresAtEpoch
 */

import { DeleteItemCommand, DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import type { MCPSession, SessionStorage } from 'mcp-lambda-nodejs';

export class DynamoDBSessionStorage implements SessionStorage {
  private client: DynamoDBClient;
  private tableName: string;

  constructor(tableName: string, client?: DynamoDBClient) {
    this.tableName = tableName;
    this.client = client ?? new DynamoDBClient({});
  }

  async get(sessionId: string): Promise<MCPSession | null> {
    const response = await this.client.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: marshall({ sessionId })
      })
    );

    if (!response.Item) return null;

    const item = unmarshall(response.Item) as MCPSession & { expiresAtEpoch?: number };
    delete item.expiresAtEpoch;
    return item;
  }

  async set(session: MCPSession): Promise<void> {
    const expiresAtEpoch = Math.floor(new Date(session.expiresAt).getTime() / 1000);
    await this.client.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: marshall({ ...session, expiresAtEpoch }, { removeUndefinedValues: true })
      })
    );
  }

  async delete(sessionId: string): Promise<void> {
    await this.client.send(
      new DeleteItemCommand({
        TableName: this.tableName,
        Key: marshall({ sessionId })
      })
    );
  }

  // DynamoDB TTL handles expiry automatically — no manual scan needed.
  async cleanup(): Promise<void> {}
}
