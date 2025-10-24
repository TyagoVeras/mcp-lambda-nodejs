import { MCPServer, MCPSessionManager, MCPTool, z } from 'mcp-lambda-sdk';

/**
 * Example MCP server demonstrating decorator usage with session management
 */
@MCPServer({
  name: 'example-mcp-server',
  version: '1.0.0'
})
export class ExampleMCPServer {
  private sessionManager: MCPSessionManager;

  constructor() {
    this.sessionManager = new MCPSessionManager();
  }

  /**
   * Simple math tool that adds two numbers
   */
  @MCPTool({
    title: 'Add Numbers',
    description: 'Adds two numbers together',
    inputSchema: {
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
      sessionId: z.string().optional().describe('Session ID for tracking')
    },
    outputSchema: {
      result: z.number().describe('Sum of the two numbers'),
      operation: z.string().describe('Operation performed'),
      timestamp: z.string().describe('When the calculation was performed')
    }
  })
  async add(params: { a: number; b: number; sessionId?: string }) {
    const result = params.a + params.b;
    const timestamp = new Date().toISOString();

    // Store calculation in session if sessionId provided
    if (params.sessionId) {
      await this.sessionManager.updateSessionState(params.sessionId, {
        lastCalculation: {
          operation: 'add',
          operands: [params.a, params.b],
          result,
          timestamp
        }
      });
    }

    return {
      result,
      operation: `${params.a} + ${params.b}`,
      timestamp
    };
  }

  /**
   * Tool that multiplies two numbers
   */
  @MCPTool({
    title: 'Multiply Numbers',
    description: 'Multiplies two numbers together',
    inputSchema: {
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
      sessionId: z.string().optional().describe('Session ID for tracking')
    },
    outputSchema: {
      result: z.number().describe('Product of the two numbers'),
      operation: z.string().describe('Operation performed'),
      timestamp: z.string().describe('When the calculation was performed')
    }
  })
  async multiply(params: { a: number; b: number; sessionId?: string }) {
    const result = params.a * params.b;
    const timestamp = new Date().toISOString();

    // Store calculation in session if sessionId provided
    if (params.sessionId) {
      await this.sessionManager.updateSessionState(params.sessionId, {
        lastCalculation: {
          operation: 'multiply',
          operands: [params.a, params.b],
          result,
          timestamp
        }
      });
    }

    return {
      result,
      operation: `${params.a} × ${params.b}`,
      timestamp
    };
  }

  /**
   * Tool to create a new session
   */
  @MCPTool({
    title: 'Create Session',
    description: 'Creates a new MCP session for tracking state',
    inputSchema: {
      clientName: z.string().optional().describe('Name of the client application'),
      ttlHours: z.number().optional().describe('Session TTL in hours (default: 24)')
    },
    outputSchema: {
      sessionId: z.string().describe('Unique session identifier'),
      expiresAt: z.string().describe('Session expiration timestamp'),
      created: z.boolean().describe('Whether session was created successfully')
    }
  })
  async createSession(params: { clientName?: string; ttlHours?: number }) {
    const session = await this.sessionManager.createSession({
      ttlHours: params.ttlHours,
      clientInfo: {
        name: params.clientName || 'Unknown Client'
      },
      initialState: {
        calculationHistory: []
      }
    });

    return {
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
      created: true
    };
  }

  /**
   * Tool to get session information
   */
  @MCPTool({
    title: 'Get Session Info',
    description: 'Retrieves information about an existing session',
    inputSchema: {
      sessionId: z.string().describe('Session ID to retrieve')
    },
    outputSchema: {
      found: z.boolean().describe('Whether the session was found'),
      sessionInfo: z
        .object({
          sessionId: z.string(),
          createdAt: z.string(),
          expiresAt: z.string(),
          state: z.record(z.unknown())
        })
        .optional()
        .describe('Session information if found')
    }
  })
  async getSessionInfo(params: { sessionId: string }) {
    const session = await this.sessionManager.getSession(params.sessionId);

    if (!session) {
      return {
        found: false
      };
    }

    return {
      found: true,
      sessionInfo: {
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        state: session.state
      }
    };
  }

  /**
   * Tool to get current timestamp
   */
  @MCPTool({
    title: 'Get Current Time',
    description: 'Returns the current server timestamp and timezone information',
    inputSchema: {},
    outputSchema: {
      timestamp: z.string().describe('Current ISO timestamp'),
      timezone: z.string().describe('Server timezone'),
      unix: z.number().describe('Unix timestamp in milliseconds')
    }
  })
  async getCurrentTime() {
    const now = new Date();
    return {
      timestamp: now.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      unix: now.getTime()
    };
  }

  /**
   * Tool that generates a UUID
   */
  @MCPTool({
    title: 'Generate UUID',
    description: 'Generates a random UUID v4',
    inputSchema: {
      count: z.number().min(1).max(10).optional().describe('Number of UUIDs to generate (1-10, default: 1)')
    },
    outputSchema: {
      uuids: z.array(z.string()).describe('Generated UUIDs'),
      count: z.number().describe('Number of UUIDs generated')
    }
  })
  async generateUUID(params: { count?: number }) {
    const count = params.count || 1;
    const uuids: string[] = [];

    const { randomUUID } = await import('node:crypto');

    for (let i = 0; i < count; i++) {
      uuids.push(randomUUID());
    }

    return {
      uuids,
      count: uuids.length
    };
  }

  /**
   * Tool that processes text (example of string manipulation)
   */
  @MCPTool({
    title: 'Process Text',
    description: 'Processes text with various transformations',
    inputSchema: {
      text: z.string().describe('Text to process'),
      operation: z.enum(['uppercase', 'lowercase', 'reverse', 'wordcount']).describe('Operation to perform'),
      sessionId: z.string().optional().describe('Session ID for tracking')
    },
    outputSchema: {
      original: z.string().describe('Original text'),
      processed: z.string().describe('Processed text'),
      operation: z.string().describe('Operation performed'),
      metadata: z.record(z.unknown()).describe('Additional metadata about the operation')
    }
  })
  async processText(params: { text: string; operation: 'uppercase' | 'lowercase' | 'reverse' | 'wordcount'; sessionId?: string }) {
    let processed: string;
    let metadata: Record<string, unknown> = {};

    switch (params.operation) {
      case 'uppercase':
        processed = params.text.toUpperCase();
        break;
      case 'lowercase':
        processed = params.text.toLowerCase();
        break;
      case 'reverse':
        processed = params.text.split('').reverse().join('');
        break;
      case 'wordcount': {
        const wordCount = params.text.trim().split(/\s+/).length;
        processed = `Word count: ${wordCount}`;
        metadata = { wordCount, characterCount: params.text.length };
        break;
      }
      default:
        processed = params.text;
    }

    // Store text processing in session if sessionId provided
    if (params.sessionId) {
      await this.sessionManager.updateSessionState(params.sessionId, {
        lastTextProcessing: {
          operation: params.operation,
          originalLength: params.text.length,
          processedLength: processed.length,
          timestamp: new Date().toISOString()
        }
      });
    }

    return {
      original: params.text,
      processed,
      operation: params.operation,
      metadata
    };
  }
}
