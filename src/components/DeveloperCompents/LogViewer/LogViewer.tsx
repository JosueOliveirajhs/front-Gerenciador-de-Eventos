// src/components/developer/LogViewer.tsx

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
  MdCheckCircle,
  MdClose,
  MdExpandMore,
  MdExpandLess
} from 'react-icons/md';
import { FaServer, FaDatabase, FaShieldAlt } from 'react-icons/fa';
import styles from './LogViewer.module.css';

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
  metadata?: Record<string, any>;
}

interface LogViewerProps {
  logs: LogEntry[];
  onRefresh: () => void;
  onExport: () => void;
  onClear: () => void;
  loading?: boolean;
}

export const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  onRefresh,
  onExport,
  onClear,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>(logs);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, selectedLevel, selectedService]);

  const filterLogs = () => {
    let filtered = [...logs];

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(term) ||
        log.service.toLowerCase().includes(term) ||
        log.details?.toLowerCase().includes(term)
      );
    }

    // Filtro por nível
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    // Filtro por serviço
    if (selectedService !== 'all') {
      filtered = filtered.filter(log => log.service === selectedService);
    }

    setFilteredLogs(filtered);
  };

  const toggleLogExpansion = (logId: number) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
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

  const getLevelCount = (level: string) => {
    return logs.filter(log => log.level === level).length;
  };

  return (
    <div className={styles.logViewer}>
      {/* Header */}
      <div className={styles.header}>
        <h3>
          <MdBugReport />
          Logs do Sistema
        </h3>
        <div className={styles.headerActions}>
          <button onClick={onRefresh} className={styles.iconButton} disabled={loading}>
            <MdRefresh className={loading ? styles.spinning : ''} />
          </button>
          <button onClick={onExport} className={styles.iconButton}>
            <MdDownload />
          </button>
          <button onClick={onClear} className={`${styles.iconButton} ${styles.dangerButton}`}>
            <MdDelete />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <MdInfo className={styles.statIconInfo} />
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Info</span>
            <span className={styles.statValue}>{getLevelCount('info')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <MdWarning className={styles.statIconWarning} />
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Warnings</span>
            <span className={styles.statValue}>{getLevelCount('warning')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <MdError className={styles.statIconError} />
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Errors</span>
            <span className={styles.statValue}>{getLevelCount('error') + getLevelCount('critical')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <MdBugReport className={styles.statIconDebug} />
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Debug</span>
            <span className={styles.statValue}>{getLevelCount('debug')}</span>
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

      {/* Logs List */}
      <div className={styles.logsList}>
        {filteredLogs.length === 0 ? (
          <div className={styles.emptyState}>
            <MdSearch size={48} />
            <h4>Nenhum log encontrado</h4>
            <p>Tente ajustar seus filtros ou buscar por outros termos.</p>
          </div>
        ) : (
          filteredLogs.map(log => (
            <div
              key={log.id}
              className={`${styles.logItem} ${styles[`level_${log.level}`]}`}
              onClick={() => toggleLogExpansion(log.id)}
            >
              <div className={styles.logHeader}>
                <div className={styles.logLevel}>
                  {getLevelIcon(log.level)}
                  <span className={`${styles.levelBadge} ${styles[`level_${log.level}`]}`}>
                    {getLevelText(log.level)}
                  </span>
                </div>
                <div className={styles.logService}>
                  <FaServer />
                  {log.service}
                </div>
                <div className={styles.logTimestamp}>
                  <MdSchedule />
                  {formatTimestamp(log.timestamp)}
                </div>
                <div className={styles.logExpand}>
                  {expandedLogs.has(log.id) ? <MdExpandLess /> : <MdExpandMore />}
                </div>
              </div>

              <div className={styles.logMessage}>
                {log.message}
              </div>

              {expandedLogs.has(log.id) && (
                <div className={styles.logDetails}>
                  {log.details && (
                    <div className={styles.detailSection}>
                      <strong>Detalhes:</strong>
                      <pre>{log.details}</pre>
                    </div>
                  )}

                  <div className={styles.detailGrid}>
                    {log.userId && (
                      <div className={styles.detailItem}>
                        <MdPerson />
                        <span>User ID: {log.userId}</span>
                      </div>
                    )}
                    {log.ip && (
                      <div className={styles.detailItem}>
                        <MdComputer />
                        <span>IP: {log.ip}</span>
                      </div>
                    )}
                  </div>

                  {log.userAgent && (
                    <div className={styles.detailSection}>
                      <strong>User Agent:</strong>
                      <span>{log.userAgent}</span>
                    </div>
                  )}

                  {log.metadata && (
                    <div className={styles.detailSection}>
                      <strong>Metadados:</strong>
                      <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer com contagem */}
      <div className={styles.footer}>
        <span>Mostrando {filteredLogs.length} de {logs.length} logs</span>
      </div>
    </div>
  );
};