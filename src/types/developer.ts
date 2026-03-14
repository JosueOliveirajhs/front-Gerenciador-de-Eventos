// =============================================
// TIPOS PARA O PERFIL DE DESENVOLVEDOR
// =============================================

/**
 * Métricas do Sistema
 */
export interface SystemMetrics {
  cpu: {
    usage: number;           // Porcentagem de uso
    cores: number;            // Número de cores
    loadAverage: number[];    // Load average (1, 5, 15 minutos)
    temperature?: number;      // Temperatura da CPU (opcional)
    frequency?: number;        // Frequência atual em MHz
  };
  memory: {
    total: number;            // Total em bytes
    used: number;             // Usado em bytes
    free: number;             // Livre em bytes
    usagePercentage: number;  // Porcentagem de uso
    swapTotal?: number;        // Total de swap
    swapUsed?: number;         // Swap usado
    swapFree?: number;         // Swap livre
  };
  disk: {
    total: number;            // Total em bytes
    used: number;             // Usado em bytes
    free: number;             // Livre em bytes
    usagePercentage: number;  // Porcentagem de uso
    readSpeed?: number;        // Velocidade de leitura (MB/s)
    writeSpeed?: number;       // Velocidade de escrita (MB/s)
    iops?: number;             // IOPS atual
  };
  network: {
    bytesIn: number;           // Bytes recebidos
    bytesOut: number;          // Bytes enviados
    packetsIn: number;         // Pacotes recebidos
    packetsOut: number;        // Pacotes enviados
    connections: number;       // Conexões ativas
    latency?: number;           // Latência média (ms)
  };
  uptime: string;              // Tempo de atividade
  hostname: string;            // Nome do host
  platform: string;            // Plataforma (linux, win32, etc)
  arch: string;                // Arquitetura (x64, arm, etc)
  release: string;             // Versão do SO
}

/**
 * Estatísticas do Banco de Dados
 */
export interface DatabaseStats {
  connections: {
    active: number;            // Conexões ativas
    idle: number;              // Conexões ociosas
    max: number;               // Máximo de conexões
    waiting: number;           // Conexões esperando
  };
  queries: {
    perSecond: number;         // Queries por segundo
    total: number;             // Total de queries
    active: number;            // Queries em execução
    waiting: number;           // Queries em espera
    slowQueries: number;       // Queries lentas (> 1s)
    avgTime: number;           // Tempo médio (ms)
    maxTime: number;           // Tempo máximo (ms)
  };
  size: number;                // Tamanho total em bytes
  tables: number;              // Número de tabelas
  indexes: number;             // Número de índices
  cache: {
    hitRatio: number;          // Cache hit ratio (%)
    size: number;              // Tamanho do cache
    usage: number;             // Uso do cache
  };
  replication: {
    enabled: boolean;          // Replicação habilitada
    lag: number;               // Replication lag (ms)
    status: 'healthy' | 'degraded' | 'failed';
    nodes?: number;            // Número de nós
  };
  lastVacuum: string;          // Último VACUUM
  lastAnalyze: string;         // Último ANALYZE
  version: string;             // Versão do banco
}

/**
 * Métricas de Empresas
 */
export interface CompanyMetrics {
  total: number;               // Total de empresas
  active: number;              // Empresas ativas
  inactive: number;            // Empresas inativas
  suspended: number;           // Empresas suspensas
  newThisMonth: number;        // Novas empresas no mês
  newThisWeek: number;         // Novas empresas na semana
  growthRate: number;          // Taxa de crescimento (%)
  byPlan: {
    basic: number;             // Empresas no plano Basic
    pro: number;               // Empresas no plano Pro
    enterprise: number;        // Empresas no plano Enterprise
  };
  byStatus: {
    active: number;
    inactive: number;
    suspended: number;
  };
  revenue: {
    total: number;             // Receita total
    monthly: number[];         // Receita mensal (últimos 12 meses)
    growth: number;            // Crescimento da receita (%)
    averagePerCompany: number; // Receita média por empresa
    projected: number;         // Receita projetada
  };
  churnRate: number;           // Taxa de cancelamento (%)
  retentionRate: number;       // Taxa de retenção (%)
  lifetimeValue: number;       // Valor médio do cliente
}

/**
 * Entrada de Log
 */
export interface LogEntry {
  id: number;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug' | 'critical';
  service: string;
  message: string;
  details?: string;
  userId?: number;
  userEmail?: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  duration?: number;           // Duração da requisição (ms)
  statusCode?: number;         // Código HTTP
  method?: string;             // Método HTTP
  path?: string;               // Caminho da requisição
  metadata?: Record<string, any>;
  stack?: string;              // Stack trace (para erros)
}

/**
 * Informações de Backup
 */
export interface Backup {
  id: number;
  name: string;
  description?: string;
  size: number;                // Tamanho em bytes
  createdAt: string;
  completedAt?: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  database: string;            // Nome do banco
  location: string;            // Localização do arquivo
  checksum?: string;           // Checksum para verificação
  encrypted: boolean;          // Se está criptografado
  compressed: boolean;         // Se está comprimido
  downloaded: boolean;         // Se foi baixado
  downloadCount: number;       // Número de downloads
  restoredAt?: string;         // Quando foi restaurado
  restoredBy?: number;         // Quem restaurou
  metadata?: Record<string, any>;
}

/**
 * Alerta do Sistema
 */
export interface SystemAlert {
  id: number;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  service: string;
  host?: string;
  value?: number;              // Valor que disparou o alerta
  threshold?: number;          // Limiar configurado
  acknowledged: boolean;
  acknowledgedBy?: number;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Variável de Ambiente
 */
export interface EnvVariable {
  id: number;
  key: string;
  value: string;
  type: 'system' | 'database' | 'api' | 'security' | 'storage' | 'email' | 'notifications' | 'cache';
  sensitive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: number;
  service?: string;            // Serviço que usa a variável
  required: boolean;           // Se é obrigatória
  defaultValue?: string;       // Valor padrão
  validation?: string;         // Regex de validação
}

/**
 * Feature Flag
 */
export interface FeatureFlag {
  id: number;
  name: string;
  key: string;                 // Chave única para código
  description: string;
  enabled: boolean;
  percentage: number;          // Porcentagem de rollout (0-100)
  conditions?: {
    users?: number[];          // IDs de usuários específicos
    companies?: number[];       // IDs de empresas específicas
    plans?: string[];          // Planos específicos
    environments?: string[];    // Ambientes (dev, staging, prod)
  };
  expiresAt?: string;          // Data de expiração
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
  metadata?: Record<string, any>;
}

/**
 * Configuração do Sistema
 */
export interface SystemConfig {
  id: number;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  description: string;
  category: 'general' | 'security' | 'email' | 'database' | 'storage' | 'api' | 'notifications';
  environment?: string;        // Ambiente específico
  editable: boolean;           // Se pode ser editado via UI
  restartRequired?: boolean;   // Se requer restart para aplicar
  validation?: string;         // Validação
  defaultValue?: any;          // Valor padrão
  createdAt: string;
  updatedAt: string;
  updatedBy?: number;
}

/**
 * Serviço do Sistema
 */
export interface SystemService {
  name: string;
  displayName: string;
  description?: string;
  version: string;
  status: 'running' | 'stopped' | 'error' | 'restarting' | 'starting' | 'stopping';
  pid?: number;
  uptime: string;
  startTime: string;
  cpu: number;                 // Uso de CPU (%)
  memory: number;              // Uso de memória (bytes)
  connections: number;         // Conexões ativas
  requestsPerSecond: number;   // Requisições por segundo
  errorRate: number;           // Taxa de erro (%)
  responseTime: number;        // Tempo de resposta médio (ms)
  lastCheck: string;           // Última verificação
  logFile?: string;            // Caminho do arquivo de log
  configFile?: string;         // Caminho do arquivo de configuração
  dependencies?: string[];     // Serviços dependentes
  port?: number;               // Porta do serviço
  host?: string;               // Host do serviço
  endpoints?: string[];        // Endpoints da API
}

/**
 * Métrica de Performance
 */
export interface PerformanceMetric {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  activeUsers: number;
  databaseQueries: number;
  cacheHitRatio: number;
}

/**
 * Informação do Ambiente
 */
export interface EnvironmentInfo {
  name: string;                // Nome do ambiente (dev, staging, prod)
  version: string;             // Versão do sistema
  nodeVersion: string;         // Versão do Node.js
  npmVersion: string;          // Versão do NPM
  database: {
    type: string;              // Tipo do banco (postgres, mysql)
    version: string;           // Versão
    host: string;              // Host
    port: number;              // Porta
    name: string;              // Nome do banco
  };
  redis?: {
    version: string;
    host: string;
    port: number;
    connected: boolean;
  };
  storage: {
    type: string;              // local, s3, gcs
    bucket?: string;
    region?: string;
    endpoint?: string;
  };
  features: string[];          // Features habilitadas
  lastDeploy: string;          // Último deploy
  deployId?: string;           // ID do deploy
  commitHash?: string;         // Hash do commit
  branch?: string;             // Branch atual
}

/**
 * Estatísticas de Uso
 */
export interface UsageStats {
  users: {
    total: number;
    active: number;
    new: number;
    returning: number;
  };
  companies: {
    total: number;
    active: number;
    new: number;
  };
  events: {
    total: number;
    upcoming: number;
    completed: number;
    cancelled: number;
  };
  api: {
    totalRequests: number;
    uniqueUsers: number;
    averagePerUser: number;
    endpoints: Record<string, number>;
    errors: number;
    errorRate: number;
  };
  storage: {
    total: number;
    used: number;
    free: number;
    byType: Record<string, number>;
  };
  period: {
    start: string;
    end: string;
    days: number;
  };
}

/**
 * Job Agendado
 */
export interface ScheduledJob {
  id: number;
  name: string;
  description?: string;
  type: 'backup' | 'cleanup' | 'report' | 'notification' | 'sync' | 'other';
  schedule: string;            // Expressão cron
  status: 'active' | 'paused' | 'failed' | 'running';
  lastRun?: string;
  lastRunStatus?: 'success' | 'failed' | 'running';
  lastRunDuration?: number;    // Duração em ms
  nextRun?: string;
  successCount: number;
  failCount: number;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

/**
 * Relatório do Sistema
 */
export interface SystemReport {
  id: number;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  period: {
    start: string;
    end: string;
  };
  summary: {
    uptime: number;
    incidents: number;
    avgResponseTime: number;
    errorRate: number;
    totalRequests: number;
    uniqueUsers: number;
  };
  metrics: PerformanceMetric[];
  alerts: SystemAlert[];
  generatedAt: string;
  generatedBy?: number;
  format: 'pdf' | 'excel' | 'json';
  url?: string;                // URL para download
}

/**
 * Permissão do Desenvolvedor
 */
export interface DeveloperPermission {
  id: number;
  name: string;
  description: string;
  category: 'system' | 'database' | 'logs' | 'backup' | 'config' | 'feature' | 'env';
  granted: boolean;
  grantedAt?: string;
  grantedBy?: number;
}

/**
 * Cache Info
 */
export interface CacheInfo {
  type: 'redis' | 'memory' | 'database';
  status: 'healthy' | 'degraded' | 'down';
  size: number;                // Tamanho atual
  maxSize: number;             // Tamanho máximo
  items: number;               // Número de itens
  hitRate: number;             // Hit rate (%)
  missRate: number;            // Miss rate (%)
  evictions: number;           // Itens removidos
  memory: number;              // Memória usada (bytes)
  latency: number;             // Latência média (ms)
  uptime: string;              // Tempo de atividade
  version: string;             // Versão
}

/**
 * Queue Info
 */
export interface QueueInfo {
  name: string;
  type: 'bull' | 'rabbitmq' | 'kafka' | 'sqs';
  status: 'healthy' | 'degraded' | 'down';
  active: number;              // Jobs ativos
  waiting: number;             // Jobs esperando
  completed: number;           // Jobs completados
  failed: number;              // Jobs com falha
  delayed: number;             // Jobs atrasados
  paused: boolean;             // Se está pausado
  rateLimit?: number;          // Limite de taxa
  processed: number;           // Total processado
  avgProcessTime: number;      // Tempo médio de processamento
  lastJob?: string;            // Último job executado
  errors: {
    count: number;
    lastError?: string;
    lastErrorAt?: string;
  };
}

/**
 * Licença do Sistema
 */
export interface SystemLicense {
  id: string;
  type: 'trial' | 'pro' | 'enterprise' | 'custom';
  status: 'active' | 'expired' | 'invalid';
  issuedAt: string;
  expiresAt: string;
  issuedTo: string;
  issuedBy: string;
  maxCompanies: number;
  maxUsers: number;
  maxEvents: number;
  features: string[];
  supportLevel: 'basic' | 'priority' | '24/7';
  supportEmail: string;
  supportPhone?: string;
  metadata?: Record<string, any>;
}

/**
 * Webhook Configuration
 */
export interface WebhookConfig {
  id: number;
  name: string;
  url: string;
  events: string[];            // Eventos que disparam o webhook
  secret?: string;             // Segredo para assinatura
  active: boolean;
  retryCount: number;          // Número de tentativas
  timeout: number;             // Timeout em ms
  headers?: Record<string, string>;
  lastTrigger?: string;
  lastSuccess?: string;
  lastError?: string;
  successCount: number;
  failCount: number;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}