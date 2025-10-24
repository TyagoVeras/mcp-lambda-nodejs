/**
 * Servidor MCP de Calculadora com operações matemáticas avançadas
 */
export declare class CalculatorMCPServer {
    private sessionManager;
    constructor();
    /**
     * Operação de adição
     */
    add(params: {
        a: number;
        b: number;
        sessionId?: string;
    }): Promise<{
        result: number;
        operation: string;
        timestamp: string;
    }>;
    /**
     * Operação de subtração
     */
    subtract(params: {
        a: number;
        b: number;
        sessionId?: string;
    }): Promise<{
        result: number;
        operation: string;
        timestamp: string;
    }>;
    /**
     * Operação de multiplicação
     */
    multiply(params: {
        a: number;
        b: number;
        sessionId?: string;
    }): Promise<{
        result: number;
        operation: string;
        timestamp: string;
    }>;
    /**
     * Operação de divisão
     */
    divide(params: {
        a: number;
        b: number;
        sessionId?: string;
    }): Promise<{
        result: number;
        operation: string;
        timestamp: string;
    }>;
    /**
     * Operação de potenciação
     */
    power(params: {
        base: number;
        exponent: number;
        sessionId?: string;
    }): Promise<{
        result: number;
        operation: string;
        timestamp: string;
    }>;
    /**
     * Operação de raiz quadrada
     */
    sqrt(params: {
        number: number;
        sessionId?: string;
    }): Promise<{
        result: number;
        operation: string;
        timestamp: string;
    }>;
    /**
     * Operação de percentual
     */
    percentage(params: {
        value: number;
        percentage: number;
        sessionId?: string;
    }): Promise<{
        result: number;
        operation: string;
        timestamp: string;
    }>;
    /**
     * Histórico de operações
     */
    getOperationHistory(params: {
        sessionId: string;
        limit?: number;
    }): Promise<{
        historyJson: string;
        count: number;
        sessionId: string;
        timestamp: string;
    }>;
}
