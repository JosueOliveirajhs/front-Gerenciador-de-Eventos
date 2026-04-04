// src/services/logs.ts
import { api } from './api';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogEntry {
  id: number;
  level: LogLevel;
  message: string;
  timestamp: string;
  source?: string;
  user?: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
}

// Dados mockados para desenvolvimento
const MOCK_LOGS: LogEntry[] = [
  {
    id: 1,
    level: 'info',
    message: 'Sistema iniciado com sucesso',
    timestamp: new Date().toISOString(),
    source: 'Application',
    user: 'system'
  },
  {
    id: 2,
    level: 'info',
    message: 'Usuário admin realizou login',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    source: 'AuthService',
    user: 'admin@eventosfaceis.com'
  },
  {
    id: 3,
    level: 'warn',
    message: 'Tentativa de login falhou - CPF inválido',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    source: 'AuthService',
    user: '123.456.789-00'
  },
  {
    id: 4,
    level: 'error',
    message: 'Falha ao conectar com o banco de dados',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    source: 'DatabaseConnection',
    stackTrace: 'Connection refused: connect\n\tat com.mysql.jdbc...',
    metadata: { host: 'localhost:3306', database: 'eventosfaceis' }
  },
  {
    id: 5,
    level: 'info',
    message: 'Novo evento criado: Casamento Silva',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    source: 'EventService',
    user: 'joao.silva@eventosfaceis.com'
  },
  {
    id: 6,
    level: 'debug',
    message: 'Query executada: SELECT * FROM events WHERE id = 123',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    source: 'QueryExecutor',
    metadata: { executionTime: '45ms', rows: 1 }
  },
  {
    id: 7,
    level: 'warn',
    message: 'Estoque baixo para o item "Cadeiras Douradas"',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    source: 'StockService',
    metadata: { itemId: 123, currentStock: 5, minStock: 10 }
  },
  {
    id: 8,
    level: 'error',
    message: 'Erro ao processar pagamento - Gateway indisponível',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    source: 'PaymentService',
    stackTrace: 'Connection timeout\n\tat com.payment.gateway...',
    metadata: { amount: 299.90, method: 'credit_card' }
  },
  {
    id: 9,
    level: 'info',
    message: 'Relatório financeiro gerado com sucesso',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    source: 'ReportService',
    user: 'financeiro@eventosfaceis.com'
  },
  {
    id: 10,
    level: 'debug',
    message: 'Cache atualizado para o usuário 123',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    source: 'CacheService',
    metadata: { cacheKey: 'user:123', ttl: 3600 }
  }
];

export const logService = {
  /**
   * Busca todos os logs do sistema
   */
  getAllLogs: async (): Promise<LogEntry[]> => {
    console.log('📋 Buscando logs do sistema...');
    
    try {
      // Tentativa de buscar da API real
      const response = await api.get('/api/logs');
      console.log('✅ Logs carregados da API:', response.data.length);
      return response.data;
    } catch (error) {
      console.warn('⚠️ API de logs não disponível, usando dados mockados');
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log('✅ Logs mockados carregados:', MOCK_LOGS.length);
      return MOCK_LOGS;
    }
  },

  /**
   * Busca logs por nível
   */
  getLogsByLevel: async (level: LogLevel): Promise<LogEntry[]> => {
    console.log(`📋 Buscando logs de nível ${level}...`);
    
    try {
      const response = await api.get(`/api/logs/level/${level}`);
      return response.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return MOCK_LOGS.filter(log => log.level === level);
    }
  },

  /**
   * Busca logs por período
   */
  getLogsByDateRange: async (startDate: string, endDate: string): Promise<LogEntry[]> => {
    console.log(`📋 Buscando logs de ${startDate} até ${endDate}...`);
    
    try {
      const response = await api.get(`/api/logs/date-range`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return MOCK_LOGS.filter(log => 
        log.timestamp >= startDate && log.timestamp <= endDate
      );
    }
  },

  /**
   * Busca logs por fonte
   */
  getLogsBySource: async (source: string): Promise<LogEntry[]> => {
    console.log(`📋 Buscando logs da fonte ${source}...`);
    
    try {
      const response = await api.get(`/api/logs/source/${source}`);
      return response.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return MOCK_LOGS.filter(log => 
        log.source?.toLowerCase().includes(source.toLowerCase())
      );
    }
  },

  /**
   * Exporta logs em formato JSON
   */
  exportLogs: async (logs: LogEntry[]): Promise<string> => {
    console.log(`📤 Exportando ${logs.length} logs...`);
    return JSON.stringify(logs, null, 2);
  },

  /**
   * Limpa logs antigos
   */
  clearOldLogs: async (days: number): Promise<void> => {
    console.log(`🗑️ Limpando logs com mais de ${days} dias...`);
    
    try {
      await api.delete(`/api/logs/clear`, { params: { days } });
    } catch (error) {
      console.warn('⚠️ API de limpeza de logs não disponível');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  },

  /**
   * Obtém estatísticas dos logs
   */
  getLogStats: async (): Promise<{ 
    total: number; 
    byLevel: Record<LogLevel, number>;
    bySource: Record<string, number>;
    last24h: number;
  }> => {
    console.log('📊 Buscando estatísticas de logs...');
    
    try {
      const response = await api.get('/api/logs/stats');
      return response.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const byLevel: Record<LogLevel, number> = {
        error: MOCK_LOGS.filter(l => l.level === 'error').length,
        warn: MOCK_LOGS.filter(l => l.level === 'warn').length,
        info: MOCK_LOGS.filter(l => l.level === 'info').length,
        debug: MOCK_LOGS.filter(l => l.level === 'debug').length
      };
      
      const bySource: Record<string, number> = {};
      MOCK_LOGS.forEach(log => {
        if (log.source) {
          bySource[log.source] = (bySource[log.source] || 0) + 1;
        }
      });
      
      const last24h = MOCK_LOGS.filter(log => {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        const diffHours = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60);
        return diffHours <= 24;
      }).length;
      
      return {
        total: MOCK_LOGS.length,
        byLevel,
        bySource,
        last24h
      };
    }
  }
};