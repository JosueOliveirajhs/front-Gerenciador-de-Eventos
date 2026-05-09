// src/pages/Client/Client.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../../components/common/Header/Header';
import { Sidebar } from '../../components/common/Sidebar/Sidebar';
import { ClientPayments } from '../../components/ClientComponents/ClientPayments';
import { ClientDocuments } from '../../components/ClientComponents/ClientDocuments';
import { MyEvents } from '../../components/ClientComponents/MyEvents';
import { NewBooking } from '../../components/ClientComponents/NewBooking';
import { EventTracking } from '../../components/ClientComponents/EventTracking/EventTracking';
import { ProposalView } from '../../components/ClientComponents/ProposalView/ProposalView';
import { ContractViewer } from '../../components/ClientComponents/ContractViewer/ContractViewer';
import { OwnerChat } from '../../components/OwnerCompoents/OwnerChat/OwnerChat'; // ✅ CHAT UNIFICADO
import { NotificationsPage } from '../../components/OwnerCompoents/settings/NotificationsPage';
import { CommunityView } from '../../components/ClientComponents/CommunityView/CommunityView';
import { CompanySearch } from '../../components/ClientComponents/CompanySearch/CompanySearch';
import { ProfilePage } from '../../components/OwnerCompoents/settings/ProfilePage';
import { SettingsPage } from '../../components/OwnerCompoents/settings/SettingsPage';
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

// Componente Dashboard
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

// Extrair view da URL
const getViewFromPath = (pathname: string): string => {
  const match = pathname.match(/\/client\/([^/]+)/);
  return match ? match[1] : 'dashboard';
};

export const Client: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeView, setActiveView] = useState(() => getViewFromPath(location.pathname));
  const [viewParams, setViewParams] = useState<any>(() => location.state || null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('clientSidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    const view = getViewFromPath(location.pathname);
    if (view !== activeView) {
      setActiveView(view);
    }
    if (location.state) {
      setViewParams(location.state);
    }
  }, [location.pathname]);

  const handleMenuToggle = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const handleSidebarCollapse = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem('clientSidebarCollapsed', String(collapsed));
  }, []);

  const handleViewChange = useCallback((view: string, params?: any) => {
    console.log('🔄 Client - Mudando para view:', view, params);
    
    const routeMapping: Record<string, string> = {
      'dashboard': '/client/dashboard',
      'events': '/client/events',
      'new-booking': '/client/new-booking',
      'tracking': '/client/tracking',
      'proposal': '/client/proposal',
      'contract': '/client/contract',
      'payments': '/client/payments',
      'documents': '/client/documents',
      'messages': '/client/messages',
      'notifications': '/client/notifications',
      'notificacoes': '/client/notifications',
      'community': '/client/community',
      'company-search': '/client/company-search',
      'profile': '/client/profile',
      'perfil': '/client/profile',
      'settings': '/client/settings',
      'configuracoes': '/client/settings',
    };
    
    const route = routeMapping[view] || `/client/${view}`;
    
    if (params) {
      navigate(route, { state: params });
    } else {
      navigate(route);
    }
    
    setIsMobileMenuOpen(false);
  }, [navigate]);

  const renderActiveView = () => {
    const params = location.state as any || viewParams;
    
    switch (activeView) {
      case 'dashboard':
        return <ClientDashboard onViewChange={handleViewChange} />;
      case 'events':
        return <MyEvents onViewChange={handleViewChange} />;
      case 'new-booking':
        return <NewBooking onSuccess={() => handleViewChange('events')} />;
      case 'tracking':
        return <EventTracking eventId={params?.eventId} onBack={() => handleViewChange('events')} onViewChange={handleViewChange} />;
      case 'proposal':
        return <ProposalView proposalId={params?.proposalId} onBack={() => handleViewChange('dashboard')} />;
      case 'contract':
        return <ContractViewer contractId={params?.contractId} onBack={() => handleViewChange('dashboard')} />;
      case 'payments':
        return <ClientPayments />;
      case 'documents':
        return <ClientDocuments />;
      case 'messages':
        // ✅ CHAT UNIFICADO - OwnerChat funciona tanto para Owner quanto Client
        return <OwnerChat />;
      case 'notifications':
      case 'notificacoes':
        return <NotificationsPage />;
      case 'community':
        return <CommunityView />;
      case 'company-search':
        return <CompanySearch onViewChange={handleViewChange} />;
      case 'profile':
      case 'perfil':
        return <ProfilePage />;
      case 'settings':
      case 'configuracoes':
        return <SettingsPage />;
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
      'company-search': 'Pesquisar Empresas',
      profile: 'Meu Perfil',
      settings: 'Configurações',
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
      // ✅ Removido botão "Nova Mensagem" pois o OwnerChat já tem o botão integrado
      return null;
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
        onCollapseChange={handleSidebarCollapse}
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