import { MCPServer, MCPSessionManager, MCPTool, z } from 'mcp-lambda-nodejs';

/**
 * Servidor MCP de Calculadora com operações matemáticas avançadas
 */
@MCPServer({
  name: 'calculator-mcp-server',
  version: '1.0.0'
})
export class CalculatorMCPServer {
  private sessionManager: MCPSessionManager;

  constructor() {
    this.sessionManager = new MCPSessionManager();
  }

  /**
   * Operação de adição
   */
  @MCPTool({
    title: 'Somar',
    description: 'Soma dois números',
    inputSchema: {
      a: z.number().describe('Primeiro número'),
      b: z.number().describe('Segundo número'),
      sessionId: z.string().optional().describe('ID da sessão para rastreamento')
    },
    outputSchema: {
      result: z.number().describe('Resultado da soma'),
      operation: z.string().describe('Operação realizada'),
      timestamp: z.string().describe('Timestamp da operação')
    }
  })
  async add(params: { a: number; b: number; sessionId?: string }) {
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
  @MCPTool({
    title: 'Subtrair',
    description: 'Subtrai o segundo número do primeiro',
    inputSchema: {
      a: z.number().describe('Primeiro número (minuendo)'),
      b: z.number().describe('Segundo número (subtraendo)'),
      sessionId: z.string().optional().describe('ID da sessão para rastreamento')
    },
    outputSchema: {
      result: z.number().describe('Resultado da subtração'),
      operation: z.string().describe('Operação realizada'),
      timestamp: z.string().describe('Timestamp da operação')
    }
  })
  async subtract(params: { a: number; b: number; sessionId?: string }) {
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
  @MCPTool({
    title: 'Multiplicar',
    description: 'Multiplica dois números',
    inputSchema: {
      a: z.number().describe('Primeiro número'),
      b: z.number().describe('Segundo número'),
      sessionId: z.string().optional().describe('ID da sessão para rastreamento')
    },
    outputSchema: {
      result: z.number().describe('Resultado da multiplicação'),
      operation: z.string().describe('Operação realizada'),
      timestamp: z.string().describe('Timestamp da operação')
    }
  })
  async multiply(params: { a: number; b: number; sessionId?: string }) {
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
  @MCPTool({
    title: 'Dividir',
    description: 'Divide o primeiro número pelo segundo',
    inputSchema: {
      a: z.number().describe('Dividendo (número a ser dividido)'),
      b: z.number().describe('Divisor (número pelo qual dividir)'),
      sessionId: z.string().optional().describe('ID da sessão para rastreamento')
    },
    outputSchema: {
      result: z.number().describe('Resultado da divisão'),
      operation: z.string().describe('Operação realizada'),
      timestamp: z.string().describe('Timestamp da operação')
    }
  })
  async divide(params: { a: number; b: number; sessionId?: string }) {
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
  @MCPTool({
    title: 'Potência',
    description: 'Calcula a potência de um número',
    inputSchema: {
      base: z.number().describe('Número base'),
      exponent: z.number().describe('Expoente'),
      sessionId: z.string().optional().describe('ID da sessão para rastreamento')
    },
    outputSchema: {
      result: z.number().describe('Resultado da potenciação'),
      operation: z.string().describe('Operação realizada'),
      timestamp: z.string().describe('Timestamp da operação')
    }
  })
  async power(params: { base: number; exponent: number; sessionId?: string }) {
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
  @MCPTool({
    title: 'Raiz Quadrada',
    description: 'Calcula a raiz quadrada de um número',
    inputSchema: {
      number: z.number().min(0).describe('Número para calcular a raiz quadrada (deve ser não-negativo)'),
      sessionId: z.string().optional().describe('ID da sessão para rastreamento')
    },
    outputSchema: {
      result: z.number().describe('Resultado da raiz quadrada'),
      operation: z.string().describe('Operação realizada'),
      timestamp: z.string().describe('Timestamp da operação')
    }
  })
  async sqrt(params: { number: number; sessionId?: string }) {
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
  @MCPTool({
    title: 'Percentual',
    description: 'Calcula o percentual de um valor',
    inputSchema: {
      value: z.number().describe('Valor base'),
      percentage: z.number().describe('Percentual a ser calculado'),
      sessionId: z.string().optional().describe('ID da sessão para rastreamento')
    },
    outputSchema: {
      result: z.number().describe('Resultado do cálculo percentual'),
      operation: z.string().describe('Operação realizada'),
      timestamp: z.string().describe('Timestamp da operação')
    }
  })
  async percentage(params: { value: number; percentage: number; sessionId?: string }) {
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
  @MCPTool({
    title: 'Histórico de Operações',
    description: 'Recupera o histórico de operações da sessão',
    inputSchema: {
      sessionId: z.string().describe('ID da sessão para recuperar o histórico'),
      limit: z.number().optional().default(10).describe('Limite de operações a retornar (padrão: 10)')
    },
    outputSchema: {
      historyJson: z.string().describe('Histórico de operações em formato JSON'),
      count: z.number().describe('Número de operações no histórico'),
      sessionId: z.string().describe('ID da sessão'),
      timestamp: z.string().describe('Timestamp da consulta')
    }
  })
  async getOperationHistory(params: { sessionId: string; limit?: number }) {
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
}
