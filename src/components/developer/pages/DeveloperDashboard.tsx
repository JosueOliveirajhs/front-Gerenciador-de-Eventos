// src/pages/developer/DeveloperDashboard.tsx

import React, { useState, useEffect } from 'react';
import {
  MdBusiness,
  MdCheckCircle,
  MdWarning,
  MdError,
  MdAttachMoney,
  MdCancel,
  MdRefresh,
  MdSchedule,
  MdTrendingUp,
  MdTrendingDown,
  MdPeople,
  MdEvent,
  MdStorage,
  MdNotifications,
  MdInfo
} from 'react-icons/md';
import {
  FaChartLine,
  FaChartBar,
  FaServer,
  FaDatabase,
  FaExclamationTriangle
} from 'react-icons/fa';
import styles from './DeveloperDashboard.module.css';

interface PlatformMetrics {
  totalCompanies: number;
  activeCompanies: number;
  trialCompanies: number;
  monthlyRecurringRevenue: number;
  cancellationsThisMonth: number;
  newUsersThisMonth: number;
  newCompaniesThisMonth: number;
  revenueGrowth: number;
  companiesGrowth: number;
  usersGrowth: number;
}

interface ChartData {
  labels: string[];
  companies: number[];
  revenue: number[];
  users: number[];
}

interface SystemAlert {
  id: number;
  type: 'payment' | 'error' | 'warning';
  title: string;
  message: string;
  company?: string;
  value?: number;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
}

export const DeveloperDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 60000); // Atualizar a cada 1 minuto
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadDashboardData = () => {
    try {
      // Dados simulados - substituir por chamadas reais à API
      setMetrics({
        totalCompanies: 156,
        activeCompanies: 124,
        trialCompanies: 18,
        monthlyRecurringRevenue: 45670.50,
        cancellationsThisMonth: 5,
        newUsersThisMonth: 342,
        newCompaniesThisMonth: 12,
        revenueGrowth: 15.8,
        companiesGrowth: 8.3,
        usersGrowth: 23.5
      });

      setChartData({
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        companies: [142, 145, 148, 152, 156, 158, 162, 165, 168, 172, 175, 180],
        revenue: [32500, 34200, 35800, 37100, 38900, 40200, 41800, 43500, 45100, 46800, 48200, 49800],
        users: [1250, 1320, 1410, 1520, 1640, 1780, 1920, 2080, 2250, 2430, 2620, 2830]
      });

      setAlerts([
        {
          id: 1,
          type: 'payment',
          title: 'Pagamento Atrasado',
          message: 'Tech Solutions Ltda - Fatura de R$ 299,90 venceu há 3 dias',
          company: 'Tech Solutions Ltda',
          value: 299.90,
          timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
          severity: 'high'
        },
        {
          id: 2,
          type: 'payment',
          title: 'Pagamento Atrasado',
          message: 'Construtora Alpha - Fatura de R$ 599,90 venceu há 1 dia',
          company: 'Construtora Alpha',
          value: 599.90,
          timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
          severity: 'medium'
        },
        {
          id: 3,
          type: 'error',
          title: 'Erro no Sistema',
          message: 'Falha na API de pagamentos - 5 tentativas com timeout',
          timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
          severity: 'high'
        },
        {
          id: 4,
          type: 'warning',
          title: 'Alto Uso de CPU',
          message: 'Servidor principal com 85% de uso - Escalar recomendado',
          timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
          severity: 'medium'
        },
        {
          id: 5,
          type: 'warning',
          title: 'Queries Lentas',
          message: '15 queries lentas detectadas no banco de dados',
          timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
          severity: 'low'
        }
      ]);

      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setError('Falha ao carregar dados do dashboard');
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} dia${days > 1 ? 's' : ''} atrás`;
    if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    if (minutes > 0) return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
    return 'agora mesmo';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'payment': return <MdAttachMoney className={styles.alertIconPayment} />;
      case 'error': return <MdError className={styles.alertIconError} />;
      case 'warning': return <MdWarning className={styles.alertIconWarning} />;
      default: return <MdInfo />;
    }
  };

  const getAlertSeverityClass = (severity: string) => {
    switch (severity) {
      case 'high': return styles.alertHigh;
      case 'medium': return styles.alertMedium;
      case 'low': return styles.alertLow;
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando dashboard da plataforma...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <MdError size={48} />
        <h3>Erro ao carregar</h3>
        <p>{error}</p>
        <button onClick={loadDashboardData} className={styles.retryButton}>
          <MdRefresh size={18} />
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <FaChartLine />
            Dashboard da Plataforma
          </h1>
          <div className={styles.lastUpdate}>
            <MdSchedule />
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        <div className={styles.headerActions}>
          <label className={styles.autoRefresh}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresh (60s)</span>
          </label>
          <button onClick={loadDashboardData} className={styles.refreshButton}>
            <MdRefresh />
            Atualizar
          </button>
        </div>
      </div>

      {/* Indicadores Principais */}
      <div className={styles.mainIndicators}>
        <div className={styles.indicatorCard}>
          <div className={styles.indicatorIcon} style={{ background: '#dbeafe', color: '#2563eb' }}>
            <MdBusiness />
          </div>
          <div className={styles.indicatorContent}>
            <span className={styles.indicatorLabel}>Total de Empresas</span>
            <span className={styles.indicatorValue}>{formatNumber(metrics?.totalCompanies || 0)}</span>
            <span className={`${styles.indicatorTrend} ${(metrics?.companiesGrowth || 0) >= 0 ? styles.trendUp : styles.trendDown}`}>
              {(metrics?.companiesGrowth || 0) >= 0 ? <MdTrendingUp /> : <MdTrendingDown />}
              {Math.abs(metrics?.companiesGrowth || 0)}% vs mês anterior
            </span>
          </div>
        </div>

        <div className={styles.indicatorCard}>
          <div className={styles.indicatorIcon} style={{ background: '#d1fae5', color: '#059669' }}>
            <MdCheckCircle />
          </div>
          <div className={styles.indicatorContent}>
            <span className={styles.indicatorLabel}>Empresas Ativas</span>
            <span className={styles.indicatorValue}>{formatNumber(metrics?.activeCompanies || 0)}</span>
            <span className={styles.indicatorDetail}>
              {Math.round((metrics?.activeCompanies || 0) / (metrics?.totalCompanies || 1) * 100)}% do total
            </span>
          </div>
        </div>

        <div className={styles.indicatorCard}>
          <div className={styles.indicatorIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
            <MdWarning />
          </div>
          <div className={styles.indicatorContent}>
            <span className={styles.indicatorLabel}>Empresas em Trial</span>
            <span className={styles.indicatorValue}>{formatNumber(metrics?.trialCompanies || 0)}</span>
            <span className={styles.indicatorDetail}>
              {metrics?.newCompaniesThisMonth} novas este mês
            </span>
          </div>
        </div>

        <div className={styles.indicatorCard}>
          <div className={styles.indicatorIcon} style={{ background: '#dcfce7', color: '#059669' }}>
            <MdAttachMoney />
          </div>
          <div className={styles.indicatorContent}>
            <span className={styles.indicatorLabel}>MRR</span>
            <span className={styles.indicatorValue}>{formatCurrency(metrics?.monthlyRecurringRevenue || 0)}</span>
            <span className={`${styles.indicatorTrend} ${(metrics?.revenueGrowth || 0) >= 0 ? styles.trendUp : styles.trendDown}`}>
              {(metrics?.revenueGrowth || 0) >= 0 ? <MdTrendingUp /> : <MdTrendingDown />}
              {Math.abs(metrics?.revenueGrowth || 0)}% vs mês anterior
            </span>
          </div>
        </div>

        <div className={styles.indicatorCard}>
          <div className={styles.indicatorIcon} style={{ background: '#fee2e2', color: '#dc2626' }}>
            <MdCancel />
          </div>
          <div className={styles.indicatorContent}>
            <span className={styles.indicatorLabel}>Cancelamentos</span>
            <span className={styles.indicatorValue}>{formatNumber(metrics?.cancellationsThisMonth || 0)}</span>
            <span className={styles.indicatorDetail}>este mês</span>
          </div>
        </div>

        <div className={styles.indicatorCard}>
          <div className={styles.indicatorIcon} style={{ background: '#f3e8ff', color: '#7c3aed' }}>
            <MdPeople />
          </div>
          <div className={styles.indicatorContent}>
            <span className={styles.indicatorLabel}>Novos Usuários</span>
            <span className={styles.indicatorValue}>{formatNumber(metrics?.newUsersThisMonth || 0)}</span>
            <span className={`${styles.indicatorTrend} ${(metrics?.usersGrowth || 0) >= 0 ? styles.trendUp : styles.trendDown}`}>
              {(metrics?.usersGrowth || 0) >= 0 ? <MdTrendingUp /> : <MdTrendingDown />}
              {Math.abs(metrics?.usersGrowth || 0)}% vs mês anterior
            </span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className={styles.chartsSection}>
        <h2 className={styles.sectionTitle}>
          <FaChartBar />
          Crescimento e Faturamento
        </h2>

        <div className={styles.chartsGrid}>
          {/* Gráfico de Crescimento de Clientes */}
          <div className={styles.chartCard}>
            <h3>Crescimento de Empresas</h3>
            <div className={styles.chartContainer}>
              <div className={styles.chartBars}>
                {chartData?.companies.map((value, index) => {
                  const max = Math.max(...(chartData?.companies || [0]));
                  const height = (value / max) * 100;
                  return (
                    <div key={index} className={styles.chartBarWrapper}>
                      <div 
                        className={styles.chartBar}
                        style={{ height: `${height}%` }}
                      >
                        <span className={styles.chartBarValue}>{value}</span>
                      </div>
                      <span className={styles.chartBarLabel}>{chartData.labels[index]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={styles.chartFooter}>
              <span className={styles.chartTotal}>Total: {formatNumber(metrics?.totalCompanies || 0)}</span>
              <span className={styles.chartGrowth}>
                <MdTrendingUp /> +{metrics?.newCompaniesThisMonth} este mês
              </span>
            </div>
          </div>

          {/* Gráfico de Faturamento Mensal */}
          <div className={styles.chartCard}>
            <h3>Faturamento Mensal</h3>
            <div className={styles.chartContainer}>
              <div className={styles.chartBars}>
                {chartData?.revenue.map((value, index) => {
                  const max = Math.max(...(chartData?.revenue || [0]));
                  const height = (value / max) * 100;
                  return (
                    <div key={index} className={styles.chartBarWrapper}>
                      <div 
                        className={`${styles.chartBar} ${styles.revenueBar}`}
                        style={{ height: `${height}%` }}
                      >
                        <span className={styles.chartBarValue}>{formatCurrency(value)}</span>
                      </div>
                      <span className={styles.chartBarLabel}>{chartData.labels[index]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={styles.chartFooter}>
              <span className={styles.chartTotal}>MRR: {formatCurrency(metrics?.monthlyRecurringRevenue || 0)}</span>
              <span className={`${styles.chartGrowth} ${(metrics?.revenueGrowth || 0) >= 0 ? styles.trendUp : styles.trendDown}`}>
                {(metrics?.revenueGrowth || 0) >= 0 ? <MdTrendingUp /> : <MdTrendingDown />}
                {Math.abs(metrics?.revenueGrowth || 0)}% vs mês anterior
              </span>
            </div>
          </div>

          {/* Gráfico de Novos Usuários */}
          <div className={styles.chartCard}>
            <h3>Novos Usuários</h3>
            <div className={styles.chartContainer}>
              <div className={styles.chartBars}>
                {chartData?.users.map((value, index) => {
                  const max = Math.max(...(chartData?.users || [0]));
                  const height = (value / max) * 100;
                  return (
                    <div key={index} className={styles.chartBarWrapper}>
                      <div 
                        className={`${styles.chartBar} ${styles.usersBar}`}
                        style={{ height: `${height}%` }}
                      >
                        <span className={styles.chartBarValue}>{value}</span>
                      </div>
                      <span className={styles.chartBarLabel}>{chartData.labels[index]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={styles.chartFooter}>
              <span className={styles.chartTotal}>Total: {formatNumber(chartData?.users[chartData.users.length - 1] || 0)}</span>
              <span className={`${styles.chartGrowth} ${(metrics?.usersGrowth || 0) >= 0 ? styles.trendUp : styles.trendDown}`}>
                {(metrics?.usersGrowth || 0) >= 0 ? <MdTrendingUp /> : <MdTrendingDown />}
                {Math.abs(metrics?.usersGrowth || 0)}% vs mês anterior
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas */}
      <div className={styles.alertsSection}>
        <h2 className={styles.sectionTitle}>
          <MdNotifications />
          Alertas do Sistema
        </h2>

        <div className={styles.alertsGrid}>
          {/* Pagamentos Atrasados */}
          <div className={styles.alertCategory}>
            <h3 className={styles.alertCategoryTitle}>
              <MdAttachMoney className={styles.paymentIcon} />
              Pagamentos Atrasados
            </h3>
            {alerts.filter(a => a.type === 'payment').map(alert => (
              <div key={alert.id} className={`${styles.alertItem} ${getAlertSeverityClass(alert.severity)}`}>
                <div className={styles.alertIcon}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className={styles.alertContent}>
                  <strong>{alert.title}</strong>
                  <p>{alert.message}</p>
                  <div className={styles.alertMeta}>
                    <span className={styles.alertCompany}>{alert.company}</span>
                    <span className={styles.alertValue}>{formatCurrency(alert.value || 0)}</span>
                    <span className={styles.alertTime}>{formatTimeAgo(alert.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
            {alerts.filter(a => a.type === 'payment').length === 0 && (
              <div className={styles.noAlerts}>
                <MdCheckCircle className={styles.successIcon} />
                <span>Nenhum pagamento atrasado</span>
              </div>
            )}
          </div>

          {/* Falhas ou Erros do Sistema */}
          <div className={styles.alertCategory}>
            <h3 className={styles.alertCategoryTitle}>
              <MdError className={styles.errorIcon} />
              Falhas do Sistema
            </h3>
            {alerts.filter(a => a.type === 'error').map(alert => (
              <div key={alert.id} className={`${styles.alertItem} ${getAlertSeverityClass(alert.severity)}`}>
                <div className={styles.alertIcon}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className={styles.alertContent}>
                  <strong>{alert.title}</strong>
                  <p>{alert.message}</p>
                  <div className={styles.alertMeta}>
                    <span className={styles.alertTime}>{formatTimeAgo(alert.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
            {alerts.filter(a => a.type === 'error').length === 0 && (
              <div className={styles.noAlerts}>
                <MdCheckCircle className={styles.successIcon} />
                <span>Nenhuma falha detectada</span>
              </div>
            )}
          </div>

          {/* Avisos do Sistema */}
          <div className={styles.alertCategory}>
            <h3 className={styles.alertCategoryTitle}>
              <MdWarning className={styles.warningIcon} />
              Avisos do Sistema
            </h3>
            {alerts.filter(a => a.type === 'warning').map(alert => (
              <div key={alert.id} className={`${styles.alertItem} ${getAlertSeverityClass(alert.severity)}`}>
                <div className={styles.alertIcon}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className={styles.alertContent}>
                  <strong>{alert.title}</strong>
                  <p>{alert.message}</p>
                  <div className={styles.alertMeta}>
                    <span className={styles.alertTime}>{formatTimeAgo(alert.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
            {alerts.filter(a => a.type === 'warning').length === 0 && (
              <div className={styles.noAlerts}>
                <MdCheckCircle className={styles.successIcon} />
                <span>Nenhum aviso no momento</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};