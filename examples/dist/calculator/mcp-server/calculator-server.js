"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculatorMCPServer = void 0;
const mcp_lambda_sdk_1 = require("mcp-lambda-sdk");
/**
 * Servidor MCP de Calculadora com operações matemáticas avançadas
 */
let CalculatorMCPServer = class CalculatorMCPServer {
    constructor() {
        this.sessionManager = new mcp_lambda_sdk_1.MCPSessionManager();
    }
    /**
     * Operação de adição
     */
    async add(params) {
        const result = params.a + params.b;
        const timestamp = new Date().toISOString();
        // Armazenar operação na sessão se sessionId fornecido
        if (params.sessionId) {
            await this.sessionManager.updateSessionState(params.sessionId, {
                lastOperation: {
                    type: 'add',
                    operands: [params.a, params.b],
                    result,
                    timestamp
                },
                operationHistory: {
                    [`operation_${Date.now()}`]: {
                        type: 'add',
                        operands: [params.a, params.b],
                        result,
                        timestamp
                    }
                }
            });
        }
        return {
            result,
            operation: `${params.a} + ${params.b} = ${result}`,
            timestamp
        };
    }
    /**
     * Operação de subtração
     */
    async subtract(params) {
        const result = params.a - params.b;
        const timestamp = new Date().toISOString();
        if (params.sessionId) {
            await this.sessionManager.updateSessionState(params.sessionId, {
                lastOperation: {
                    type: 'subtract',
                    operands: [params.a, params.b],
                    result,
                    timestamp
                }
            });
        }
        return {
            result,
            operation: `${params.a} - ${params.b} = ${result}`,
            timestamp
        };
    }
    /**
     * Operação de multiplicação
     */
    async multiply(params) {
        const result = params.a * params.b;
        const timestamp = new Date().toISOString();
        if (params.sessionId) {
            await this.sessionManager.updateSessionState(params.sessionId, {
                lastOperation: {
                    type: 'multiply',
                    operands: [params.a, params.b],
                    result,
                    timestamp
                }
            });
        }
        return {
            result,
            operation: `${params.a} × ${params.b} = ${result}`,
            timestamp
        };
    }
    /**
     * Operação de divisão
     */
    async divide(params) {
        // Verificar divisão por zero
        if (params.b === 0) {
            throw new Error('Divisão por zero não permitida');
        }
        const result = params.a / params.b;
        const timestamp = new Date().toISOString();
        if (params.sessionId) {
            await this.sessionManager.updateSessionState(params.sessionId, {
                lastOperation: {
                    type: 'divide',
                    operands: [params.a, params.b],
                    result,
                    timestamp
                }
            });
        }
        return {
            result,
            operation: `${params.a} ÷ ${params.b} = ${result}`,
            timestamp
        };
    }
    /**
     * Operação de potenciação
     */
    async power(params) {
        const result = Math.pow(params.base, params.exponent);
        const timestamp = new Date().toISOString();
        if (params.sessionId) {
            await this.sessionManager.updateSessionState(params.sessionId, {
                lastOperation: {
                    type: 'power',
                    base: params.base,
                    exponent: params.exponent,
                    result,
                    timestamp
                }
            });
        }
        return {
            result,
            operation: `${params.base}^${params.exponent} = ${result}`,
            timestamp
        };
    }
    /**
     * Operação de raiz quadrada
     */
    async sqrt(params) {
        if (params.number < 0) {
            throw new Error('Não é possível calcular raiz quadrada de número negativo');
        }
        const result = Math.sqrt(params.number);
        const timestamp = new Date().toISOString();
        if (params.sessionId) {
            await this.sessionManager.updateSessionState(params.sessionId, {
                lastOperation: {
                    type: 'sqrt',
                    number: params.number,
                    result,
                    timestamp
                }
            });
        }
        return {
            result,
            operation: `√${params.number} = ${result}`,
            timestamp
        };
    }
    /**
     * Operação de percentual
     */
    async percentage(params) {
        const result = (params.value * params.percentage) / 100;
        const timestamp = new Date().toISOString();
        if (params.sessionId) {
            await this.sessionManager.updateSessionState(params.sessionId, {
                lastOperation: {
                    type: 'percentage',
                    value: params.value,
                    percentage: params.percentage,
                    result,
                    timestamp
                }
            });
        }
        return {
            result,
            operation: `${params.percentage}% de ${params.value} = ${result}`,
            timestamp
        };
    }
    /**
     * Histórico de operações
     */
    async getOperationHistory(params) {
        const session = await this.sessionManager.getSession(params.sessionId);
        if (!session) {
            throw new Error('Sessão não encontrada');
        }
        const operationHistory = session.state.operationHistory || {};
        const historyEntries = Object.entries(operationHistory)
            .sort(([a], [b]) => b.localeCompare(a)) // Ordenar por timestamp (mais recente primeiro)
            .slice(0, params.limit || 10)
            .map(([key, value]) => ({ [key]: value }));
        return {
            historyJson: JSON.stringify(historyEntries, null, 2),
            count: historyEntries.length,
            sessionId: params.sessionId,
            timestamp: new Date().toISOString()
        };
    }
};
exports.CalculatorMCPServer = CalculatorMCPServer;
__decorate([
    (0, mcp_lambda_sdk_1.MCPTool)({
        title: 'Somar',
        description: 'Soma dois números',
        inputSchema: {
            a: mcp_lambda_sdk_1.z.number().describe('Primeiro número'),
            b: mcp_lambda_sdk_1.z.number().describe('Segundo número'),
            sessionId: mcp_lambda_sdk_1.z.string().optional().describe('ID da sessão para rastreamento')
        },
        outputSchema: {
            result: mcp_lambda_sdk_1.z.number().describe('Resultado da soma'),
            operation: mcp_lambda_sdk_1.z.string().describe('Operação realizada'),
            timestamp: mcp_lambda_sdk_1.z.string().describe('Timestamp da operação')
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalculatorMCPServer.prototype, "add", null);
__decorate([
    (0, mcp_lambda_sdk_1.MCPTool)({
        title: 'Subtrair',
        description: 'Subtrai o segundo número do primeiro',
        inputSchema: {
            a: mcp_lambda_sdk_1.z.number().describe('Primeiro número (minuendo)'),
            b: mcp_lambda_sdk_1.z.number().describe('Segundo número (subtraendo)'),
            sessionId: mcp_lambda_sdk_1.z.string().optional().describe('ID da sessão para rastreamento')
        },
        outputSchema: {
            result: mcp_lambda_sdk_1.z.number().describe('Resultado da subtração'),
            operation: mcp_lambda_sdk_1.z.string().describe('Operação realizada'),
            timestamp: mcp_lambda_sdk_1.z.string().describe('Timestamp da operação')
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalculatorMCPServer.prototype, "subtract", null);
__decorate([
    (0, mcp_lambda_sdk_1.MCPTool)({
        title: 'Multiplicar',
        description: 'Multiplica dois números',
        inputSchema: {
            a: mcp_lambda_sdk_1.z.number().describe('Primeiro número'),
            b: mcp_lambda_sdk_1.z.number().describe('Segundo número'),
            sessionId: mcp_lambda_sdk_1.z.string().optional().describe('ID da sessão para rastreamento')
        },
        outputSchema: {
            result: mcp_lambda_sdk_1.z.number().describe('Resultado da multiplicação'),
            operation: mcp_lambda_sdk_1.z.string().describe('Operação realizada'),
            timestamp: mcp_lambda_sdk_1.z.string().describe('Timestamp da operação')
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalculatorMCPServer.prototype, "multiply", null);
__decorate([
    (0, mcp_lambda_sdk_1.MCPTool)({
        title: 'Dividir',
        description: 'Divide o primeiro número pelo segundo',
        inputSchema: {
            a: mcp_lambda_sdk_1.z.number().describe('Dividendo (número a ser dividido)'),
            b: mcp_lambda_sdk_1.z.number().describe('Divisor (número pelo qual dividir)'),
            sessionId: mcp_lambda_sdk_1.z.string().optional().describe('ID da sessão para rastreamento')
        },
        outputSchema: {
            result: mcp_lambda_sdk_1.z.number().describe('Resultado da divisão'),
            operation: mcp_lambda_sdk_1.z.string().describe('Operação realizada'),
            timestamp: mcp_lambda_sdk_1.z.string().describe('Timestamp da operação')
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalculatorMCPServer.prototype, "divide", null);
__decorate([
    (0, mcp_lambda_sdk_1.MCPTool)({
        title: 'Potência',
        description: 'Calcula a potência de um número',
        inputSchema: {
            base: mcp_lambda_sdk_1.z.number().describe('Número base'),
            exponent: mcp_lambda_sdk_1.z.number().describe('Expoente'),
            sessionId: mcp_lambda_sdk_1.z.string().optional().describe('ID da sessão para rastreamento')
        },
        outputSchema: {
            result: mcp_lambda_sdk_1.z.number().describe('Resultado da potenciação'),
            operation: mcp_lambda_sdk_1.z.string().describe('Operação realizada'),
            timestamp: mcp_lambda_sdk_1.z.string().describe('Timestamp da operação')
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalculatorMCPServer.prototype, "power", null);
__decorate([
    (0, mcp_lambda_sdk_1.MCPTool)({
        title: 'Raiz Quadrada',
        description: 'Calcula a raiz quadrada de um número',
        inputSchema: {
            number: mcp_lambda_sdk_1.z.number().min(0).describe('Número para calcular a raiz quadrada (deve ser não-negativo)'),
            sessionId: mcp_lambda_sdk_1.z.string().optional().describe('ID da sessão para rastreamento')
        },
        outputSchema: {
            result: mcp_lambda_sdk_1.z.number().describe('Resultado da raiz quadrada'),
            operation: mcp_lambda_sdk_1.z.string().describe('Operação realizada'),
            timestamp: mcp_lambda_sdk_1.z.string().describe('Timestamp da operação')
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalculatorMCPServer.prototype, "sqrt", null);
__decorate([
    (0, mcp_lambda_sdk_1.MCPTool)({
        title: 'Percentual',
        description: 'Calcula o percentual de um valor',
        inputSchema: {
            value: mcp_lambda_sdk_1.z.number().describe('Valor base'),
            percentage: mcp_lambda_sdk_1.z.number().describe('Percentual a ser calculado'),
            sessionId: mcp_lambda_sdk_1.z.string().optional().describe('ID da sessão para rastreamento')
        },
        outputSchema: {
            result: mcp_lambda_sdk_1.z.number().describe('Resultado do cálculo percentual'),
            operation: mcp_lambda_sdk_1.z.string().describe('Operação realizada'),
            timestamp: mcp_lambda_sdk_1.z.string().describe('Timestamp da operação')
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalculatorMCPServer.prototype, "percentage", null);
__decorate([
    (0, mcp_lambda_sdk_1.MCPTool)({
        title: 'Histórico de Operações',
        description: 'Recupera o histórico de operações da sessão',
        inputSchema: {
            sessionId: mcp_lambda_sdk_1.z.string().describe('ID da sessão para recuperar o histórico'),
            limit: mcp_lambda_sdk_1.z.number().optional().default(10).describe('Limite de operações a retornar (padrão: 10)')
        },
        outputSchema: {
            historyJson: mcp_lambda_sdk_1.z.string().describe('Histórico de operações em formato JSON'),
            count: mcp_lambda_sdk_1.z.number().describe('Número de operações no histórico'),
            sessionId: mcp_lambda_sdk_1.z.string().describe('ID da sessão'),
            timestamp: mcp_lambda_sdk_1.z.string().describe('Timestamp da consulta')
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalculatorMCPServer.prototype, "getOperationHistory", null);
exports.CalculatorMCPServer = CalculatorMCPServer = __decorate([
    (0, mcp_lambda_sdk_1.MCPServer)({
        name: 'calculator-mcp-server',
        version: '1.0.0'
    }),
    __metadata("design:paramtypes", [])
], CalculatorMCPServer);
//# sourceMappingURL=calculator-server.js.map