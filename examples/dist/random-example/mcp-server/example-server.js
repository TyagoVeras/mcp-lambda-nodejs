"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExampleMCPServer = void 0;
const mcp_lambda_sdk_1 = require("mcp-lambda-sdk");
/**
 * Example MCP server demonstrating decorator usage with session management
 */
let ExampleMCPServer = class ExampleMCPServer {
    constructor() {
        this.sessionManager = new mcp_lambda_sdk_1.MCPSessionManager();
    }
    /**
     * Simple math tool that adds two numbers
     */
    async add(params) {
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
    async multiply(params) {
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
    async createSession(params) {
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
    async getSessionInfo(params) {
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
    async generateUUID(params) {
        const count = params.count || 1;
        const uuids = [];
        const { randomUUID } = await Promise.resolve().then(() => __importStar(require('node:crypto')));
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
    async processText(params) {
        let processed;
        let metadata = {};
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
};
exports.ExampleMCPServer = ExampleMCPServer;
__decorate([
    (0, mcp_lambda_sdk_1.MCPTool)({
        title: 'Add Numbers',
        description: 'Adds two numbers together',
        inputSchema: {
            a: mcp_lambda_sdk_1.z.number().describe('First number'),
            b: mcp_lambda_sdk_1.z.number().describe('Second number'),
            sessionId: mcp_lambda_sdk_1.z.string().optional().describe('Session ID for tracking')
        },
        outputSchema: {
            result: mcp_lambda_sdk_1.z.number().describe('Sum of the two numbers'),
            operation: mcp_lambda_sdk_1.z.string().describe('Operation performed'),
            timestamp: mcp_lambda_sdk_1.z.string().describe('When the calculation was performed')
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExampleMCPServer.prototype, "add", null);
__decorate([
    (0, mcp_lambda_sdk_1.MCPTool)({
        title: 'Multiply Numbers',
        description: 'Multiplies two numbers together',
        inputSchema: {
            a: mcp_lambda_sdk_1.z.number().describe('First number'),
            b: mcp_lambda_sdk_1.z.number().describe('Second number'),
            sessionId: mcp_lambda_sdk_1.z.string().optional().describe('Session ID for tracking')
        },
        outputSchema: {
            result: mcp_lambda_sdk_1.z.number().describe('Product of the two numbers'),
            operation: mcp_lambda_sdk_1.z.string().describe('Operation performed'),
            timestamp: mcp_lambda_sdk_1.z.string().describe('When the calculation was performed')
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExampleMCPServer.prototype, "multiply", null);
__decorate([
    (0, mcp_lambda_sdk_1.MCPTool)({
        title: 'Create Session',
        description: 'Creates a new MCP session for tracking state',
        inputSchema: {
            clientName: mcp_lambda_sdk_1.z.string().optional().describe('Name of the client application'),
            ttlHours: mcp_lambda_sdk_1.z.number().optional().describe('Session TTL in hours (default: 24)')
        },
        outputSchema: {
            sessionId: mcp_lambda_sdk_1.z.string().describe('Unique session identifier'),
            expiresAt: mcp_lambda_sdk_1.z.string().describe('Session expiration timestamp'),
            created: mcp_lambda_sdk_1.z.boolean().describe('Whether session was created successfully')
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExampleMCPServer.prototype, "createSession", null);
__decorate([
    (0, mcp_lambda_sdk_1.MCPTool)({
        title: 'Get Session Info',
        description: 'Retrieves information about an existing session',
        inputSchema: {
            sessionId: mcp_lambda_sdk_1.z.string().describe('Session ID to retrieve')
        },
        outputSchema: {
            found: mcp_lambda_sdk_1.z.boolean().describe('Whether the session was found'),
            sessionInfo: mcp_lambda_sdk_1.z
                .object({
                sessionId: mcp_lambda_sdk_1.z.string(),
                createdAt: mcp_lambda_sdk_1.z.string(),
                expiresAt: mcp_lambda_sdk_1.z.string(),
                state: mcp_lambda_sdk_1.z.record(mcp_lambda_sdk_1.z.unknown())
            })
                .optional()
                .describe('Session information if found')
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExampleMCPServer.prototype, "getSessionInfo", null);
__decorate([
    (0, mcp_lambda_sdk_1.MCPTool)({
        title: 'Get Current Time',
        description: 'Returns the current server timestamp and timezone information',
        inputSchema: {},
        outputSchema: {
            timestamp: mcp_lambda_sdk_1.z.string().describe('Current ISO timestamp'),
            timezone: mcp_lambda_sdk_1.z.string().describe('Server timezone'),
            unix: mcp_lambda_sdk_1.z.number().describe('Unix timestamp in milliseconds')
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExampleMCPServer.prototype, "getCurrentTime", null);
__decorate([
    (0, mcp_lambda_sdk_1.MCPTool)({
        title: 'Generate UUID',
        description: 'Generates a random UUID v4',
        inputSchema: {
            count: mcp_lambda_sdk_1.z.number().min(1).max(10).optional().describe('Number of UUIDs to generate (1-10, default: 1)')
        },
        outputSchema: {
            uuids: mcp_lambda_sdk_1.z.array(mcp_lambda_sdk_1.z.string()).describe('Generated UUIDs'),
            count: mcp_lambda_sdk_1.z.number().describe('Number of UUIDs generated')
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExampleMCPServer.prototype, "generateUUID", null);
__decorate([
    (0, mcp_lambda_sdk_1.MCPTool)({
        title: 'Process Text',
        description: 'Processes text with various transformations',
        inputSchema: {
            text: mcp_lambda_sdk_1.z.string().describe('Text to process'),
            operation: mcp_lambda_sdk_1.z.enum(['uppercase', 'lowercase', 'reverse', 'wordcount']).describe('Operation to perform'),
            sessionId: mcp_lambda_sdk_1.z.string().optional().describe('Session ID for tracking')
        },
        outputSchema: {
            original: mcp_lambda_sdk_1.z.string().describe('Original text'),
            processed: mcp_lambda_sdk_1.z.string().describe('Processed text'),
            operation: mcp_lambda_sdk_1.z.string().describe('Operation performed'),
            metadata: mcp_lambda_sdk_1.z.record(mcp_lambda_sdk_1.z.unknown()).describe('Additional metadata about the operation')
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExampleMCPServer.prototype, "processText", null);
exports.ExampleMCPServer = ExampleMCPServer = __decorate([
    (0, mcp_lambda_sdk_1.MCPServer)({
        name: 'example-mcp-server',
        version: '1.0.0'
    }),
    __metadata("design:paramtypes", [])
], ExampleMCPServer);
//# sourceMappingURL=example-server.js.map