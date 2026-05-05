// src/components/DeveloperCompents/DeveloperDashboard/DeveloperDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdBusiness,
  MdCheckCircle,
  MdWarning,
  MdAttachMoney,
  MdCancel,
  MdRefresh,
  MdSchedule,
  MdTrendingUp,
  MdTrendingDown,
  MdPeople,
  MdEvent,
  MdInfo
} from 'react-icons/md';
import { FaChartLine, FaChartBar } from 'react-icons/fa';
import { organizationService } from '../../../services/organization';
import { OrganizationStats } from '../../../types/developer';
import styles from './DeveloperDashboard.module.css';

interface DashboardMetrics {
  totalOrganizations: number;
  activeOrganizations: number;
  trialOrganizations: number;
  suspendedOrganizations: number;
  cancelledOrganizations: number;
  totalEvents: number;
}

export const DeveloperDashboard: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const navigate = useNavigate();
  
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    trialOrganizations: 0,
    suspendedOrganizations: 0,
    cancelledOrganizations: 0,
    totalEvents: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 60000); // Atualizar a cada 1 minuto
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ✅ Buscar estatísticas reais da API
      const stats: OrganizationStats = await organizationService.getOrganizationStats();
      
      setMetrics({
        totalOrganizations: stats.totalOrganizations || 0,
        activeOrganizations: stats.activeOrganizations || 0,
        trialOrganizations: stats.trialOrganizations || 0,
        suspendedOrganizations: stats.suspendedOrganizations || 0,
        cancelledOrganizations: stats.cancelledOrganizations || 0,
        totalEvents: 0 // Será preenchido quando a API de eventos estiver disponível
      });
      
      setLastUpdate(new Date());
    } catch (err) {
      console.error('❌ Erro ao carregar dashboard:', err);
      setError('Falha ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  if (loading && metrics.totalOrganizations === 0) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando dashboard da plataforma...</p>
      </div>
    );
  }

  if (error && metrics.totalOrganizations === 0) {
    return (
      <div className={styles.error}>
        <MdWarning size={48} />
        <h3>Erro ao carregar</h3>
        <p>{error}</p>
        <button onClick={loadDashboardData} className={styles.retryButton}>
          <MdRefresh size={18} /> Tentar Novamente
        </button>
      </div>
    );
  }

  const totalActive = metrics.activeOrganizations + metrics.trialOrganizations;
  const activePercentage = metrics.totalOrganizations > 0 
    ? Math.round((totalActive / metrics.totalOrganizations) * 100) 
    : 0;

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <FaChartLine /> Dashboard da Plataforma
          </h1>
          <div className={styles.lastUpdate}>
            <MdSchedule /> Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </div>
        </div>

        <div className={styles.headerActions}>
          <label className={styles.autoRefresh}>
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            <span>Auto-refresh (60s)</span>
          </label>
          <button onClick={loadDashboardData} className={styles.refreshButton}>
            <MdRefresh /> Atualizar
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className={styles.metricsGrid}>
        {/* Total de Organizações */}
        <div className={styles.metricCard} onClick={() => handleNavigate('/developer/organizations')}>
          <div className={styles.metricIcon} style={{ background: '#dbeafe', color: '#2563eb' }}>
            <MdBusiness size={28} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>Total de Organizações</span>
            <span className={styles.metricValue}>{formatNumber(metrics.totalOrganizations)}</span>
            <span className={styles.metricSubtext}>Clique para ver todas</span>
          </div>
        </div>

        {/* Ativas */}
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: '#d1fae5', color: '#059669' }}>
            <MdCheckCircle size={28} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>Ativas</span>
            <span className={styles.metricValue}>{formatNumber(metrics.activeOrganizations)}</span>
            <span className={styles.metricSubtext}>{activePercentage}% do total</span>
          </div>
        </div>

        {/* Trial */}
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
            <MdInfo size={28} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>Em Trial</span>
            <span className={styles.metricValue}>{formatNumber(metrics.trialOrganizations)}</span>
            <span className={styles.metricSubtext}>Período de teste</span>
          </div>
        </div>

        {/* Suspensas */}
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: '#fee2e2', color: '#dc2626' }}>
            <MdCancel size={28} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>Suspensas</span>
            <span className={styles.metricValue}>{formatNumber(metrics.suspendedOrganizations)}</span>
            <span className={styles.metricSubtext}>Ação necessária</span>
          </div>
        </div>

        {/* Canceladas */}
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: '#f3f4f6', color: '#6b7280' }}>
            <MdCancel size={28} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>Canceladas</span>
            <span className={styles.metricValue}>{formatNumber(metrics.cancelledOrganizations)}</span>
            <span className={styles.metricSubtext}>Histórico</span>
          </div>
        </div>

        {/* Eventos Totais */}
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: '#f3e8ff', color: '#7c3aed' }}>
            <MdEvent size={28} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>Total de Eventos</span>
            <span className={styles.metricValue}>{formatNumber(metrics.totalEvents)}</span>
            <span className={styles.metricSubtext}>Na plataforma</span>
          </div>
        </div>
      </div>

      {/* Resumo Visual */}
      <div className={styles.summarySection}>
        <h2 className={styles.sectionTitle}>
          <FaChartBar /> Resumo da Plataforma
        </h2>
        
        <div className={styles.summaryGrid}>
          {/* Distribuição de Status */}
          <div className={styles.summaryCard}>
            <h3>Distribuição por Status</h3>
            <div className={styles.statusBars}>
              <div className={styles.statusBar}>
                <div className={styles.statusBarHeader}>
                  <span>Ativas</span>
                  <span>{metrics.activeOrganizations}</span>
                </div>
                <div className={styles.statusBarTrack}>
                  <div 
                    className={styles.statusBarFill} 
                    style={{ 
                      width: `${metrics.totalOrganizations > 0 ? (metrics.activeOrganizations / metrics.totalOrganizations) * 100 : 0}%`,
                      background: '#10b981'
                    }} 
                  />
                </div>
              </div>
              
              <div className={styles.statusBar}>
                <div className={styles.statusBarHeader}>
                  <span>Trial</span>
                  <span>{metrics.trialOrganizations}</span>
                </div>
                <div className={styles.statusBarTrack}>
                  <div 
                    className={styles.statusBarFill} 
                    style={{ 
                      width: `${metrics.totalOrganizations > 0 ? (metrics.trialOrganizations / metrics.totalOrganizations) * 100 : 0}%`,
                      background: '#f59e0b'
                    }} 
                  />
                </div>
              </div>
              
              <div className={styles.statusBar}>
                <div className={styles.statusBarHeader}>
                  <span>Suspensas</span>
                  <span>{metrics.suspendedOrganizations}</span>
                </div>
                <div className={styles.statusBarTrack}>
                  <div 
                    className={styles.statusBarFill} 
                    style={{ 
                      width: `${metrics.totalOrganizations > 0 ? (metrics.suspendedOrganizations / metrics.totalOrganizations) * 100 : 0}%`,
                      background: '#ef4444'
                    }} 
                  />
                </div>
              </div>
              
              <div className={styles.statusBar}>
                <div className={styles.statusBarHeader}>
                  <span>Canceladas</span>
                  <span>{metrics.cancelledOrganizations}</span>
                </div>
                <div className={styles.statusBarTrack}>
                  <div 
                    className={styles.statusBarFill} 
                    style={{ 
                      width: `${metrics.totalOrganizations > 0 ? (metrics.cancelledOrganizations / metrics.totalOrganizations) * 100 : 0}%`,
                      background: '#6b7280'
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Links Rápidos */}
          <div className={styles.summaryCard}>
            <h3>Acesso Rápido</h3>
            <div className={styles.quickLinks}>
              <button className={styles.quickLink} onClick={() => handleNavigate('/developer/organizations')}>
                <MdBusiness size={20} /> Gerenciar Organizações
              </button>
              <button className={styles.quickLink} onClick={() => handleNavigate('/developer/catalogo')}>
                <MdBusiness size={20} /> Catálogo de Fornecedores
              </button>
              <button className={styles.quickLink} onClick={() => handleNavigate('/developer/settings')}>
                <MdInfo size={20} /> Configurações
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};