// src/pages/Owner/Owner.tsx
import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from "../../components/common/Header/Header";
import { Sidebar } from "../../components/common/Sidebar/Sidebar";

import ChecklistManagement from "../../components/OwnerCompoents/checklist/ChecklistManagement";
import { SettingsPage } from "../../components/OwnerCompoents/settings/SettingsPage";
import { ProfilePage } from "../../components/OwnerCompoents/settings/ProfilePage";
import { NotificationsPage } from "../../components/OwnerCompoents/settings/NotificationsPage";
import styles from "./Owner.module.css";
import { OwnerChat } from '../../components/OwnerCompoents/OwnerChat/OwnerChat';
import { OwnerDashboard } from "../../components/OwnerCompoents/OwnerManagement/OwnerDashboard/OwnerDashboard";
import { EventManagement } from "../../components/OwnerCompoents/events/EventManagement/EventManagement";
import FinancialReports from "../../components/OwnerCompoents/OwnerManagement/FinalcialReports/FinancialReports";
import { ClientManagement } from "../../components/OwnerCompoents/OwnerManagement/ClientManagement/ClientManagement";
import ItemsManagement from "../../components/OwnerCompoents/OwnerManagement/ItemsManagement/ItemsManagement";
import { TeamManagement } from "../../components/OwnerCompoents/OwnerManagement/TeamManagement/TeamManagement";

// Componente de conteúdo memoizado
const PageContent = memo(({ activeView }: { activeView: string }) => {
  console.log('📄 Owner - Renderizando view:', activeView);
  
  switch (activeView) {
    case "dashboard":
      return <OwnerDashboard />;
    case "checklist":
      return <ChecklistManagement />;
    case "events":
      return <EventManagement />;
    case "financial":
      return <FinancialReports />;
    case "clients":
      return <ClientManagement />;
    case "itens":
      return <ItemsManagement />;
    case "team":
      return <TeamManagement />;
      case "chat":
case "messages":
  return <OwnerChat />;
    case "settings":
    case "configuracoes":
      return <SettingsPage />;
    case "profile":
    case "perfil":
      return <ProfilePage />;
    case "notifications":
    case "notificacoes":
      return <NotificationsPage />;
    default:
      console.warn('⚠️ Owner - View não encontrada:', activeView);
      return <OwnerDashboard />;
  }
}, (prevProps, nextProps) => {
  return prevProps.activeView === nextProps.activeView;
});

PageContent.displayName = 'PageContent';

const PageHeader = memo(({ title }: { title: string; actions?: React.ReactNode }) => {
  return (
    <div className={styles.pageHeader}>
      <h1 className={styles.pageTitle}>{title}</h1>
      <div className={styles.pageActions}>{null}</div>
    </div>
  );
});

PageHeader.displayName = 'PageHeader';

export const Owner: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extrair a view atual da URL
  const getViewFromPath = (pathname: string): string => {
    const match = pathname.match(/\/owner\/([^/]+)/);
    return match ? match[1] : 'dashboard';
  };
  
  const [activeView, setActiveView] = useState(() => getViewFromPath(location.pathname));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('ownerSidebarCollapsed');
    return saved === 'true';
  });

  // Sincronizar com mudanças de URL
  useEffect(() => {
    const view = getViewFromPath(location.pathname);
    if (view !== activeView) {
      setActiveView(view);
    }
  }, [location.pathname]);

  const handleSidebarCollapse = useCallback((collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    localStorage.setItem('ownerSidebarCollapsed', String(collapsed));
  }, []);

  const handleMenuToggle = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  // ✅ HANDLER CORRIGIDO - Navega usando React Router
  const handleViewChange = useCallback((view: string, params?: any) => {
    console.log('🔀 Owner - Mudando view para:', view);
    
    // Mapeamento de views para rotas
    const routeMapping: Record<string, string> = {
      'dashboard': '/owner/dashboard',
      'events': '/owner/events',
      'clients': '/owner/clients',
      'itens': '/owner/itens',
      'financial': '/owner/financial',
      'checklist': '/owner/checklist',
      'team': '/owner/team',
      'chat': '/owner/chat',
'messages': '/owner/chat',
      'settings': '/owner/settings',
      'configuracoes': '/owner/settings',
      'profile': '/owner/profile',
      'perfil': '/owner/profile',
      'notifications': '/owner/notifications',
      'notificacoes': '/owner/notifications',
    };
    
    const route = routeMapping[view] || `/owner/${view}`;
    
    // Se tiver params, adicionar à navegação
    if (params) {
      navigate(route, { state: params });
    } else {
      navigate(route);
    }
    
    setIsMobileMenuOpen(false);
  }, [navigate]);

  const pageTitle = useMemo(() => {
    const titles: Record<string, string> = {
      dashboard: "Dashboard",
      events: "Gestão de Eventos",
      clients: "Gestão de Clientes",
      itens: "Gestão de Itens",
      financial: "Relatórios Financeiros",
      checklist: "Checklists de Eventos",
      chat: "Mensagens",
messages: "Mensagens",
      team: "Gerenciar Equipe",
      settings: "Configurações do Sistema",
      profile: "Meu Perfil",
      notifications: "Notificações",
    };
    return titles[activeView] || "Dashboard";
  }, [activeView]);

  const mainContentClass = useMemo(() => {
    return `${styles.mainContent} ${isSidebarCollapsed ? styles.mainContentCollapsed : ''}`;
  }, [isSidebarCollapsed]);

  return (
    <div className={styles.appLayout}>
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        isMobileOpen={isMobileMenuOpen}
        onMobileToggle={handleMenuToggle}
        onCollapseChange={handleSidebarCollapse}
        isCollapsed={isSidebarCollapsed}
      />

      <div className={mainContentClass}>
        <Header 
          onMenuToggle={handleMenuToggle} 
          onViewChange={handleViewChange}
          activeView={activeView}
        />

        <main className={styles.contentArea}>
          <PageHeader title={pageTitle} />

          <div className={styles.pageContent}>
            <PageContent activeView={activeView} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Owner;