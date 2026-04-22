// src/pages/Client/Client.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { Header } from '../../components/common/Header/Header';
import { Sidebar } from '../../components/common/Sidebar/Sidebar';
import { ClientPayments } from '../../components/ClientComponents/ClientPayments';
import { ClientDocuments } from '../../components/ClientComponents/ClientDocuments';
import { MyEvents } from '../../components/ClientComponents/MyEvents';
import { NewBooking } from '../../components/ClientComponents/NewBooking';
import { EventTracking } from '../../components/ClientComponents/EventTracking/EventTracking';
import { ProposalView } from '../../components/ClientComponents/ProposalView/ProposalView';
import { ContractViewer } from '../../components/ClientComponents/ContractViewer/ContractViewer';
import { Messages } from '../../components/ClientComponents/Messages/Messages';
import { Notifications } from '../../components/ClientComponents/Notifications/Notifications';
import { CommunityView } from '../../components/ClientComponents/CommunityView/CommunityView';
import { CompanySearch } from '../../components/ClientComponents/CompanySearch/CompanySearch';
import { 
  FiPlus, 
  FiUpload, 
  FiMessageCircle
} from 'react-icons/fi';
import { 
  MdDashboard, 
  MdEvent,
  MdOutlinePayments,
  MdOutlineFolder,
  MdOutlineEventNote,
  MdOutlineGavel,
  MdOutlineNotifications,
  MdOutlineMessage,
  MdOutlineCalculate,
  MdOutlineChecklist
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import styles from './Client.module.css';

// Componente Dashboard simples enquanto o ClientDashboard não existe
const ClientDashboard: React.FC<{ onViewChange: (view: string, params?: any) => void }> = ({ onViewChange }) => {
  const { user } = useAuth();
  
  return (
    <div className={styles.dashboard}>
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeContent}>
          <h1 className={styles.welcomeTitle}>
            Bem-vindo(a), {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className={styles.welcomeSubtitle}>
            Gerencie seus eventos e acompanhe tudo em um só lugar.
          </p>
        </div>
        <button 
          className={styles.primaryAction}
          onClick={() => onViewChange('new-booking')}
        >
          <MdOutlineEventNote size={20} />
          Solicitar Reserva
        </button>
      </div>

      <div className={styles.quickActions}>
        <h3>Ações Rápidas</h3>
        <div className={styles.actionsGrid}>
          <button className={styles.actionCard} onClick={() => onViewChange('events')}>
            <MdEvent size={24} />
            <span>Meus Eventos</span>
          </button>
          <button className={styles.actionCard} onClick={() => onViewChange('payments')}>
            <MdOutlinePayments size={24} />
            <span>Pagamentos</span>
          </button>
          <button className={styles.actionCard} onClick={() => onViewChange('documents')}>
            <MdOutlineFolder size={24} />
            <span>Documentos</span>
          </button>
          <button className={styles.actionCard} onClick={() => onViewChange('messages')}>
            <MdOutlineMessage size={24} />
            <span>Mensagens</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const Client: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [viewParams, setViewParams] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleMenuToggle = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const handleViewChange = useCallback((view: string, params?: any) => {
    console.log('🔄 Client - Mudando para view:', view, params);
    setActiveView(view);
    setViewParams(params || null);
    setIsMobileMenuOpen(false);
  }, []);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <ClientDashboard onViewChange={handleViewChange} />;
      case 'events':
        return <MyEvents onViewChange={handleViewChange} />;
      case 'new-booking':
        return <NewBooking />;
      case 'tracking':
        return <EventTracking eventId={viewParams?.eventId} onBack={() => handleViewChange('events')} />;
      case 'proposal':
        return <ProposalView proposalId={viewParams?.proposalId} onBack={() => handleViewChange('dashboard')} />;
      case 'contract':
        return <ContractViewer contractId={viewParams?.contractId} onBack={() => handleViewChange('dashboard')} />;
      case 'payments':
        return <ClientPayments />;
      case 'documents':
        return <ClientDocuments />;
      case 'messages':
        return <Messages conversationId={viewParams?.conversationId} onBack={() => handleViewChange('dashboard')} />;
      case 'notifications':
        return <Notifications onViewChange={handleViewChange} />;
      case 'community':
        return <CommunityView />;
      case 'company-search':
        return <CompanySearch onViewChange={handleViewChange} />;
      default:
        return <ClientDashboard onViewChange={handleViewChange} />;
    }
  };

  const getPageTitle = (view: string): string => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      events: 'Meus Eventos',
      'new-booking': 'Solicitar Reserva',
      tracking: 'Acompanhamento do Evento',
      proposal: 'Proposta Comercial',
      contract: 'Contrato',
      payments: 'Financeiro',
      documents: 'Documentos',
      messages: 'Mensagens',
      notifications: 'Notificações',
      community: 'Comunidade',
      'company-search': 'Pesquisar Empresas'
    };
    return titles[view] || 'Dashboard';
  };

  const getPageIcon = (view: string) => {
    const icons: Record<string, React.ReactNode> = {
      dashboard: <MdDashboard size={24} />,
      events: <MdEvent size={24} />,
      'new-booking': <MdOutlineEventNote size={24} />,
      tracking: <MdOutlineChecklist size={24} />,
      proposal: <MdOutlineCalculate size={24} />,
      contract: <MdOutlineGavel size={24} />,
      payments: <MdOutlinePayments size={24} />,
      documents: <MdOutlineFolder size={24} />,
      messages: <MdOutlineMessage size={24} />,
      notifications: <MdOutlineNotifications size={24} />,
      community: <MdOutlineMessage size={24} />,
      'company-search': <MdOutlineFolder size={24} />
    };
    return icons[view] || <MdDashboard size={24} />;
  };

  const renderPageActions = (view: string) => {
    switch (view) {
      case 'events':
        return (
          <button className={styles.primaryButton} onClick={() => handleViewChange('new-booking')}>
            <FiPlus size={18} />
            Solicitar Reserva
          </button>
        );
      case 'documents':
        return (
          <button className={styles.primaryButton}>
            <FiUpload size={18} />
            Anexar Documento
          </button>
        );
      case 'messages':
        return (
          <button className={styles.primaryButton}>
            <FiMessageCircle size={18} />
            Nova Mensagem
          </button>
        );
      default:
        return null;
    }
  };

  const mainWrapperClass = useMemo(() => {
    return `${styles.mainWrapper} ${sidebarCollapsed ? styles.mainWrapperExpanded : ''}`;
  }, [sidebarCollapsed]);

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
      
      <div className={mainWrapperClass}>
        <Header 
          onMenuToggle={handleMenuToggle} 
          onViewChange={handleViewChange}
          activeView={activeView}
        />
        
        <div className={styles.contentArea}>
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
          
          <div className={styles.pageContent}>
            {renderActiveView()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Client;