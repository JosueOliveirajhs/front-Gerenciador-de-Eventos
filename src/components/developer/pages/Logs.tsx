// src/pages/developer/Logs.tsx

import React, { useState, useEffect } from 'react';
import {
  MdSearch,
  MdFilterList,
  MdRefresh,
  MdDownload,
  MdDelete,
  MdWarning,
  MdError,
  MdInfo,
  MdBugReport,
  MdSchedule,
  MdPerson,
  MdComputer,
  MdClear,
  MdDateRange,
  MdCheckCircle,
  MdTerminal,  // ✅ IMPORT ADICIONADO
  MdClose
} from 'react-icons/md';
import { FaServer, FaDatabase, FaShieldAlt } from 'react-icons/fa';
import styles from './Logs.module.css';

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug' | 'critical';
  service: string;
  message: string;
  details?: string;
  userId?: number;
  ip?: string;
  userAgent?: string;
}

interface LogStats {
  total: number;
  errors: number;
  warnings: number;
  info: number;
  debug: number;
  lastHour: number;
}

export const Logs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadLogs();
    
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedTimeRange]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, selectedLevel, selectedService]);

  const loadLogs = () => {
    try {
      // Simulação de dados
      const mockLogs: LogEntry[] = generateMockLogs(100);
      setLogs(mockLogs);
      
      const stats: LogStats = {
        total: mockLogs.length,
        errors: mockLogs.filter(l => l.level === 'error' || l.level === 'critical').length,
        warnings: mockLogs.filter(l => l.level === 'warning').length,
        info: mockLogs.filter(l => l.level === 'info').length,
        debug: mockLogs.filter(l => l.level === 'debug').length,
        lastHour: mockLogs.filter(l => 
          new Date(l.timestamp).getTime() > Date.now() - 3600000
        ).length
      };
      setStats(stats);
      
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
      setError('Falha ao carregar logs do sistema');
      setLoading(false);
    }
  };

  const generateMockLogs = (count: number): LogEntry[] => {
    const services = ['API Gateway', 'Database', 'Auth Service', 'Storage', 'Email', 'WebSocket', 'Background Jobs'];
    const levels: ('info' | 'warning' | 'error' | 'debug' | 'critical')[] = ['info', 'warning', 'error', 'debug', 'critical'];
    const messages = [
      'Usuário autenticado com sucesso',
      'Falha na conexão com banco de dados',
      'Query lenta detectada',
      'Backup concluído com sucesso',
      'Erro ao processar pagamento',
      'Serviço reiniciado automaticamente',
      'Alta latência detectada no WebSocket',
      'Cache invalidado',
      'Nova empresa cadastrada',
      'Evento criado com sucesso'
    ];

    const logs: LogEntry[] = [];
    const now = Date.now();
    
    for (let i = 0; i < count; i++) {
      const level = levels[Math.floor(Math.random() * levels.length)];
      const service = services[Math.floor(Math.random() * services.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      const timeOffset = Math.random() * 7 * 24 * 3600000;
      
      logs.push({
        id: i + 1,
        timestamp: new Date(now - timeOffset).toISOString(),
        level,
        service,
        message,
        details: level === 'error' || level === 'critical' ? 'Stack trace: Error: Connection refused' : undefined,
        userId: Math.random() > 0.7 ? Math.floor(Math.random() * 1000) : undefined,
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
    }
    
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(term) ||
        log.service.toLowerCase().includes(term) ||
        log.details?.toLowerCase().includes(term)
      );
    }

    if (selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    if (selectedService !== 'all') {
      filtered = filtered.filter(log => log.service === selectedService);
    }

    setFilteredLogs(filtered);
  };

  const handleExportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `logs_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleClearLogs = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os logs?')) {
      setLogs([]);
      setFilteredLogs([]);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <MdInfo className={styles.levelInfo} />;
      case 'warning':
        return <MdWarning className={styles.levelWarning} />;
      case 'error':
        return <MdError className={styles.levelError} />;
      case 'critical':
        return <MdError className={styles.levelCritical} />;
      case 'debug':
        return <MdBugReport className={styles.levelDebug} />;
      default:
        return null;
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'info': return 'Info';
      case 'warning': return 'Aviso';
      case 'error': return 'Erro';
      case 'critical': return 'Crítico';
      case 'debug': return 'Debug';
      default: return level;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d atrás - ${date.toLocaleTimeString()}`;
    if (hours > 0) return `${hours}h atrás - ${date.toLocaleTimeString()}`;
    if (minutes > 0) return `${minutes}min atrás - ${date.toLocaleTimeString()}`;
    return 'agora mesmo';
  };

  const getUniqueServices = () => {
    const services = new Set(logs.map(log => log.service));
    return ['all', ...Array.from(services)];
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando logs do sistema...</p>
      </div>
    );
  }

  return (
    <div className={styles.logs}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <MdTerminal />  {/* ✅ AGORA FUNCIONA */}
            Logs do Sistema
          </h1>
          {stats && (
            <div className={styles.statsBadge}>
              <span>{stats.total} registros</span>
              <span className={styles.statsError}>{stats.errors} erros</span>
              <span className={styles.statsWarning}>{stats.warnings} avisos</span>
            </div>
          )}
        </div>

        <div className={styles.headerActions}>
          <div className={styles.autoRefresh}>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
            <span>Auto-refresh</span>
          </div>

          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className={styles.timeSelect}
          >
            <option value="1h">Última hora</option>
            <option value="6h">Últimas 6 horas</option>
            <option value="24h">Últimas 24 horas</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
          </select>

          <button onClick={loadLogs} className={styles.iconButton}>
            <MdRefresh />
          </button>
          <button onClick={handleExportLogs} className={styles.iconButton}>
            <MdDownload />
          </button>
          <button onClick={handleClearLogs} className={`${styles.iconButton} ${styles.dangerButton}`}>
            <MdDelete />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <MdInfo />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Info</span>
            <span className={styles.statValue}>{stats?.info || 0}</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.warningCard}`}>
          <div className={styles.statIcon}>
            <MdWarning />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Warnings</span>
            <span className={styles.statValue}>{stats?.warnings || 0}</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.errorCard}`}>
          <div className={styles.statIcon}>
            <MdError />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Errors</span>
            <span className={styles.statValue}>{stats?.errors || 0}</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.debugCard}`}>
          <div className={styles.statIcon}>
            <MdBugReport />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Debug</span>
            <span className={styles.statValue}>{stats?.debug || 0}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <MdSchedule />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Última Hora</span>
            <span className={styles.statValue}>{stats?.lastHour || 0}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <MdSearch />
          <input
            type="text"
            placeholder="Buscar em logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className={styles.clearSearch}
              onClick={() => setSearchTerm('')}
            >
              <MdClear />
            </button>
          )}
        </div>

        <button
          className={`${styles.filterButton} ${showFilters ? styles.active : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <MdFilterList />
          Filtros
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label>Nível:</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Serviço:</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
            >
              {getUniqueServices().map(service => (
                <option key={service} value={service}>
                  {service === 'all' ? 'Todos' : service}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className={styles.logsTable}>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Nível</th>
              <th>Serviço</th>
              <th>Mensagem</th>
              <th>Usuário</th>
              <th>IP</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id} className={styles[`levelRow_${log.level}`]}>
                <td className={styles.timestamp}>
                  <MdSchedule />
                  {formatTimestamp(log.timestamp)}
                </td>
                <td>
                  <span className={`${styles.levelBadge} ${styles[`level_${log.level}`]}`}>
                    {getLevelIcon(log.level)}
                    {getLevelText(log.level)}
                  </span>
                </td>
                <td>
                  <span className={styles.service}>
                    <FaServer />
                    {log.service}
                  </span>
                </td>
                <td className={styles.message}>
                  {log.message}
                </td>
                <td>
                  {log.userId ? (
                    <span className={styles.user}>
                      <MdPerson />
                      User #{log.userId}
                    </span>
                  ) : '-'}
                </td>
                <td>
                  <span className={styles.ip}>
                    <MdComputer />
                    {log.ip || '-'}
                  </span>
                </td>
                <td>
                  <button
                    className={styles.viewButton}
                    onClick={() => {
                      setSelectedLog(log);
                      setShowDetailsModal(true);
                    }}
                  >
                    Ver detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLogs.length === 0 && (
          <div className={styles.emptyState}>
            <MdSearch size={48} />
            <h3>Nenhum log encontrado</h3>
            <p>Tente ajustar seus filtros ou buscar por outros termos.</p>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedLog && (
        <div className={styles.modal} onClick={() => setShowDetailsModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                <MdBugReport />
                Detalhes do Log #{selectedLog.id}
              </h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowDetailsModal(false)}
              >
                <MdClose />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Timestamp:</span>
                <span className={styles.detailValue}>
                  {new Date(selectedLog.timestamp).toLocaleString('pt-BR')}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Nível:</span>
                <span className={`${styles.levelBadge} ${styles[`level_${selectedLog.level}`]}`}>
                  {getLevelIcon(selectedLog.level)}
                  {getLevelText(selectedLog.level)}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Serviço:</span>
                <span className={styles.detailValue}>{selectedLog.service}</span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Mensagem:</span>
                <span className={styles.detailValue}>{selectedLog.message}</span>
              </div>

              {selectedLog.details && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Detalhes:</span>
                  <pre className={styles.detailPre}>
                    {selectedLog.details}
                  </pre>
                </div>
              )}

              {selectedLog.userId && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Usuário ID:</span>
                  <span className={styles.detailValue}>{selectedLog.userId}</span>
                </div>
              )}

              {selectedLog.ip && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>IP:</span>
                  <span className={styles.detailValue}>{selectedLog.ip}</span>
                </div>
              )}

              {selectedLog.userAgent && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>User Agent:</span>
                  <span className={styles.detailValue}>{selectedLog.userAgent}</span>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.closeModalButton}
                onClick={() => setShowDetailsModal(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};