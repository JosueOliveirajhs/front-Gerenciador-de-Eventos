// src/pages/Client/Client.tsx
import React, { useState } from 'react';
import { Header } from '../../components/common/Header/Header';
import { Sidebar } from '../../components/common/Sidebar/Sidebar';
import { ClientPayments } from '../../components/ClientComponents/ClientPayments';
import { ClientCommunity } from '../../components/ClientComponents/ClientCommunity';
import { CompanySearch } from '../../components/ClientComponents/CompanySearch';
import { ClientDocuments } from '../../components/ClientComponents/ClientDocuments';
import { MyEvents } from '../../components/ClientComponents/MyEvents';
import { 
  FiPlus, 
  FiUpload, 
  FiFilter,
  FiDownload,
  FiCalendar,
  FiDollarSign,
  FiUsers,
  FiImage,
  FiTrendingUp
} from 'react-icons/fi';
import { MdDashboard, MdCalculate, MdPhotoLibrary, MdPeople } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import styles from './Client.module.css';

// Componente Dashboard simples integrado
const ClientDashboard: React.FC<{ onViewChange: (view: string) => void }> = ({ onViewChange }) => {
  const { user } = useAuth();
  const [stats] = useState({
    totalEvents: 3,
    confirmedEvents: 2,
    totalSpent: 8500,
    pendingPayments: 1,
    collabOpportunities: 5,
    nextEventDays: 15
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className={styles.dashboard}>
      {/* Welcome Section */}
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeContent}>
          <h1 className={styles.welcomeTitle}>
            Bem-vindo(a), {user?.name?.split(' ')[0]}!
          </h1>
          <p className={styles.welcomeSubtitle}>
            {stats.nextEventDays ? (
              <>🎉 Faltam <strong>{stats.nextEventDays} dias</strong> para seu próximo evento</>
            ) : (
              <>✨ Planeje seu próximo evento conosco</>
            )}
          </p>
        </div>
        <button 
          className={styles.primaryAction}
          onClick={() => onViewChange('events')}
        >
          <FiPlus size={20} />
          Novo Evento
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} onClick={() => onViewChange('events')}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <FiCalendar size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Meus Eventos</span>
            <span className={styles.statValue}>{stats.totalEvents}</span>
            <span className={styles.statSubtext}>{stats.confirmedEvents} confirmados</span>
          </div>
        </div>

        <div className={styles.statCard} onClick={() => onViewChange('payments')}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <FiDollarSign size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Total Investido</span>
            <span className={styles.statValue}>{formatCurrency(stats.totalSpent)}</span>
            {stats.pendingPayments > 0 && (
              <span className={styles.statSubtext} style={{ color: '#f59e0b' }}>
                {stats.pendingPayments} pendente
              </span>
            )}
          </div>
        </div>

        <div className={styles.statCard} onClick={() => onViewChange('community')}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <FiUsers size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Comunidade</span>
            <span className={styles.statValue}>24</span>
            <span className={styles.statSubtext}>posts esta semana</span>
          </div>
        </div>

        <div className={styles.statCard} onClick={() => onViewChange('company-search')}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' }}>
            <MdPeople size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Fornecedores</span>
            <span className={styles.statValue}>15</span>
            <span className={styles.statSubtext}>disponíveis</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h3>Ações Rápidas</h3>
        <div className={styles.actionsGrid}>
          <button className={styles.actionCard} onClick={() => onViewChange('events')}>
            <FiCalendar size={32} />
            <span>Meus Eventos</span>
          </button>
          <button className={styles.actionCard} onClick={() => onViewChange('payments')}>
            <FiDollarSign size={32} />
            <span>Pagamentos</span>
          </button>
          <button className={styles.actionCard} onClick={() => onViewChange('documents')}>
            <FiUpload size={32} />
            <span>Documentos</span>
          </button>
          <button className={styles.actionCard} onClick={() => onViewChange('community')}>
            <FiUsers size={32} />
            <span>Comunidade</span>
          </button>
        </div>
      </div>

      {/* Insights */}
      <div className={styles.insightsSection}>
        <h3>
          <FiTrendingUp size={20} />
          Insights para Você
        </h3>
        <div className={styles.insightsGrid}>
          <div className={styles.insightCard}>
            <span className={styles.insightEmoji}>💡</span>
            <p>Eventos com buffet incluso têm 40% mais chances de confirmação</p>
          </div>
          <div className={styles.insightCard}>
            <span className={styles.insightEmoji}>📸</span>
            <p>Adicione fotografia ao seu pacote e ganhe 15% de desconto</p>
          </div>
          <div className={styles.insightCard}>
            <span className={styles.insightEmoji}>🤝</span>
            <p>Collabs podem reduzir seu custo total em até 30%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Client: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <ClientDashboard onViewChange={handleViewChange} />;
      case 'events':
        return <MyEvents />;
      case 'payments':
        return <ClientPayments />;
      case 'community':
        return <ClientCommunity />;
      case 'company-search':
        return <CompanySearch />;
      case 'documents':
        return <ClientDocuments />;
      default:
        return <ClientDashboard onViewChange={handleViewChange} />;
    }
  };

  const getPageTitle = (view: string): string => {
    const titles: { [key: string]: string } = {
      dashboard: 'Dashboard',
      events: 'Meus Eventos',
      payments: 'Pagamentos e Financeiro',
      community: 'Comunidade',
      'company-search': 'Pesquisar Empresas',
      documents: 'Documentos'
    };
    return titles[view] || 'Dashboard';
  };

  const getPageIcon = (view: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      dashboard: <MdDashboard size={24} />,
      events: <FiCalendar size={24} />,
      payments: <FiDollarSign size={24} />,
      community: <FiUsers size={24} />,
      'company-search': <MdPeople size={24} />,
      documents: <FiUpload size={24} />
    };
    return icons[view] || <MdDashboard size={24} />;
  };

  const renderPageActions = (view: string) => {
    switch (view) {
      case 'events':
        return (
          <button className={styles.primaryButton}>
            <FiPlus size={18} />
            Novo Evento
          </button>
        );
      case 'documents':
        return (
          <button className={styles.primaryButton}>
            <FiUpload size={18} />
            Anexar Documento
          </button>
        );
      case 'company-search':
        return (
          <button className={styles.secondaryButton}>
            <FiFilter size={18} />
            Filtrar
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.clientLayout}>
      <Sidebar 
        activeView={activeView}
        onViewChange={handleViewChange}
        isMobileOpen={isMobileMenuOpen}
        onMobileToggle={handleMenuToggle}
        isCollapsed={sidebarCollapsed}
        onCollapseChange={setSidebarCollapsed}
      />
      
      <div className={`${styles.mainWrapper} ${sidebarCollapsed ? styles.mainWrapperExpanded : ''}`}>
        <Header 
          onMenuToggle={handleMenuToggle} 
          onViewChange={handleViewChange}
        />
        
        <main className={styles.mainContent}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div className={styles.pageTitleSection}>
              <div className={styles.pageIcon}>
                {getPageIcon(activeView)}
              </div>
              <h1 className={styles.pageTitle}>
                {getPageTitle(activeView)}
              </h1>
            </div>
            <div className={styles.pageActions}>
              {renderPageActions(activeView)}
            </div>
          </div>
          
          {/* Page Content */}
          <div className={styles.pageContent}>
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
};