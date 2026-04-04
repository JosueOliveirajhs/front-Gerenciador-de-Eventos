// src/components/DeveloperCompents/LogViewer/LogViewer.tsx
import React, { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiFilter, 
  FiDownload, 
  FiRefreshCw,
  FiX,
  FiInfo,
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle
} from 'react-icons/fi';
import { MdError, MdWarning, MdInfo } from 'react-icons/md';
import { logService, LogEntry, LogLevel } from '../../../services/logs';
import { LoadingSpinner } from '../../common/Loading/LoadingSpinner';
import { EmptyState } from '../../common/EmptyState/EmptyState';
import { ErrorModal } from '../../common/Alerts/ErrorModal';
import styles from './LogViewer.module.css';

interface LogFilters {
  level: LogLevel | 'all';
  search: string;
  startDate: string;
  endDate: string;
  source: string;
}

export const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<LogFilters>({
    level: 'all',
    search: '',
    startDate: '',
    endDate: '',
    source: ''
  });
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Carregar logs
  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await logService.getAllLogs();
      setLogs(data);
      setFilteredLogs(data);
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
      setError('Erro ao carregar logs. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 30000);
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...logs];

    if (filters.level !== 'all') {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        log.source?.toLowerCase().includes(searchLower) ||
        log.user?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.startDate) {
      filtered = filtered.filter(log => log.timestamp >= filters.startDate);
    }

    if (filters.endDate) {
      filtered = filtered.filter(log => log.timestamp <= filters.endDate);
    }

    if (filters.source) {
      filtered = filtered.filter(log => 
        log.source?.toLowerCase().includes(filters.source.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [logs, filters]);

  const getLevelCount = (level: LogLevel): number => {
    return logs.filter(log => log.level === level).length;
  };

  const getLevelIcon = (level: LogLevel) => {
    switch(level) {
      case 'error':
        return <MdError size={16} className={styles.iconError} />;
      case 'warn':
        return <FiAlertTriangle size={16} className={styles.iconWarn} />;
      case 'info':
        return <FiInfo size={16} className={styles.iconInfo} />;
      case 'debug':
        return <FiCheckCircle size={16} className={styles.iconDebug} />;
      default:
        return <FiInfo size={16} />;
    }
  };

  const getLevelClass = (level: LogLevel) => {
    switch(level) {
      case 'error': return styles.levelError;
      case 'warn': return styles.levelWarn;
      case 'info': return styles.levelInfo;
      case 'debug': return styles.levelDebug;
      default: return '';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'Data desconhecida';
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleFilterChange = (field: keyof LogFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      level: 'all',
      search: '',
      startDate: '',
      endDate: '',
      source: ''
    });
  };

  const handleExport = async () => {
    try {
      const data = await logService.exportLogs(filteredLogs);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs_${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar logs:', err);
      setError('Erro ao exportar logs.');
    }
  };

  const handleViewDetails = (log: LogEntry) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  if (loading) {
    return <LoadingSpinner text="Carregando logs do sistema..." fullScreen />;
  }

  const hasActiveFilters = filters.level !== 'all' || 
    filters.search !== '' || 
    filters.startDate !== '' || 
    filters.endDate !== '' || 
    filters.source !== '';

  const errorCount = getLevelCount('error');
  const warnCount = getLevelCount('warn');
  const infoCount = getLevelCount('info');
  const debugCount = getLevelCount('debug');

  return (
    <div className={styles.logViewer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Logs do Sistema</h2>
          <div className={styles.stats}>
            <span className={styles.statItem}>
              <MdError size={14} />
              {errorCount} erros
            </span>
            <span className={styles.statItem}>
              <FiAlertTriangle size={14} />
              {warnCount} alertas
            </span>
            <span className={styles.statItem}>
              <FiInfo size={14} />
              {infoCount} info
            </span>
            <span className={styles.statItem}>
              <FiCheckCircle size={14} />
              {debugCount} debug
            </span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            className={`${styles.filterButton} ${showFilters ? styles.active : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Filtros"
          >
            <FiFilter size={18} />
          </button>
          <button
            className={`${styles.autoRefreshButton} ${autoRefresh ? styles.active : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? 'Desativar auto-atualização' : 'Ativar auto-atualização'}
          >
            <FiRefreshCw size={18} />
            <span>Auto</span>
          </button>
          <button
            className={styles.exportButton}
            onClick={handleExport}
            title="Exportar logs"
          >
            <FiDownload size={18} />
            Exportar
          </button>
          <button
            className={styles.refreshButton}
            onClick={loadLogs}
            title="Atualizar"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>Nível</label>
              <select
                value={filters.level}
                onChange={(e) => handleFilterChange('level', e.target.value as LogLevel | 'all')}
                className={styles.filterSelect}
              >
                <option value="all">Todos</option>
                <option value="error">Erro</option>
                <option value="warn">Alerta</option>
                <option value="info">Informação</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Buscar</label>
              <div className={styles.searchInputWrapper}>
                <FiSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Mensagem, fonte, usuário..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className={styles.searchInput}
                />
                {filters.search && (
                  <button
                    className={styles.clearButton}
                    onClick={() => handleFilterChange('search', '')}
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label>Data Início</label>
              <input
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className={styles.dateInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Data Fim</label>
              <input
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className={styles.dateInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Fonte</label>
              <input
                type="text"
                placeholder="Fonte do log..."
                value={filters.source}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                className={styles.filterInput}
              />
            </div>

            {hasActiveFilters && (
              <button className={styles.clearFiltersButton} onClick={clearFilters}>
                <FiX size={14} />
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* Logs Table */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={hasActiveFilters ? <FiSearch size={48} /> : <FiInfo size={48} />}
          title={hasActiveFilters ? 'Nenhum log encontrado' : 'Nenhum log registrado'}
          description={hasActiveFilters
            ? 'Tente ajustar os filtros para encontrar os logs.'
            : 'Os logs do sistema aparecerão aqui quando ocorrerem eventos.'
          }
          action={hasActiveFilters ? {
            label: 'Limpar filtros',
            onClick: clearFilters,
            icon: <FiX />
          } : undefined}
        />
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.colLevel}>Nível</th>
                <th className={styles.colTimestamp}>Data/Hora</th>
                <th className={styles.colMessage}>Mensagem</th>
                <th className={styles.colSource}>Fonte</th>
                <th className={styles.colUser}>Usuário</th>
                <th className={styles.colActions}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className={getLevelClass(log.level)}>
                  <td className={styles.levelCell}>
                    {getLevelIcon(log.level)}
                    <span>{log.level.toUpperCase()}</span>
                  </td>
                  <td className={styles.timestampCell}>
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className={styles.messageCell}>
                    <div className={styles.messagePreview}>
                      {log.message.length > 100 
                        ? `${log.message.substring(0, 100)}...` 
                        : log.message}
                    </div>
                  </td>
                  <td className={styles.sourceCell}>
                    {log.source || '-'}
                  </td>
                  <td className={styles.userCell}>
                    {log.user || '-'}
                  </td>
                  <td className={styles.actionsCell}>
                    <button
                      className={styles.viewButton}
                      onClick={() => handleViewDetails(log)}
                      title="Ver detalhes"
                    >
                      <FiInfo size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Log Details Modal */}
      {showDetails && selectedLog && (
        <div className={styles.modalOverlay} onClick={() => setShowDetails(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                {getLevelIcon(selectedLog.level)}
                Detalhes do Log
              </h3>
              <button className={styles.closeButton} onClick={() => setShowDetails(false)}>
                <FiX size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailRow}>
                <strong>Nível:</strong>
                <span className={getLevelClass(selectedLog.level)}>
                  {selectedLog.level.toUpperCase()}
                </span>
              </div>
              <div className={styles.detailRow}>
                <strong>Data/Hora:</strong>
                <span>{formatTimestamp(selectedLog.timestamp)}</span>
              </div>
              <div className={styles.detailRow}>
                <strong>Mensagem:</strong>
                <pre className={styles.messageFull}>{selectedLog.message}</pre>
              </div>
              {selectedLog.source && (
                <div className={styles.detailRow}>
                  <strong>Fonte:</strong>
                  <span>{selectedLog.source}</span>
                </div>
              )}
              {selectedLog.user && (
                <div className={styles.detailRow}>
                  <strong>Usuário:</strong>
                  <span>{selectedLog.user}</span>
                </div>
              )}
              {selectedLog.stackTrace && (
                <div className={styles.detailRow}>
                  <strong>Stack Trace:</strong>
                  <pre className={styles.stackTrace}>{selectedLog.stackTrace}</pre>
                </div>
              )}
              {selectedLog.metadata && (
                <div className={styles.detailRow}>
                  <strong>Metadados:</strong>
                  <pre className={styles.metadata}>
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.closeModalButton} onClick={() => setShowDetails(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      <ErrorModal
        isOpen={!!error}
        message={error || ''}
        onClose={() => setError(null)}
      />
    </div>
  );
};

export default LogViewer;