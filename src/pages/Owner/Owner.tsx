// src/pages/Owner/Owner.tsx
import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Header } from "../../components/common/Header/Header";
import { Sidebar } from "../../components/common/Sidebar/Sidebar";

import ChecklistManagement from "../../components/OwnerCompoents/checklist/ChecklistManagement";
import { SettingsPage } from "../../components/OwnerCompoents/settings/SettingsPage";
import { ProfilePage } from "../../components/OwnerCompoents/settings/ProfilePage";
import { NotificationsPage } from "../../components/OwnerCompoents/settings/NotificationsPage";
import styles from "./Owner.module.css";
import { OwnerDashboard } from "../../components/OwnerCompoents/OwnerManagement/OwnerDashboard/OwnerDashboard";
import { EventManagement } from "../../components/OwnerCompoents/events/EventManagement/EventManagement";
import FinancialReports from "../../components/OwnerCompoents/OwnerManagement/FinalcialReports/FinancialReports";
import { ClientManagement } from "../../components/OwnerCompoents/OwnerManagement/ClientManagement/ClientManagement";
import ItemsManagement from "../../components/OwnerCompoents/OwnerManagement/ItemsManagement/ItemsManagement";
import { TeamManagement } from "../../components/OwnerCompoents/OwnerManagement/TeamManagement/TeamManagement";

// ✅ Componente de conteúdo memoizado - SÓ renderiza quando activeView muda
const PageContent = memo(({ activeView }: { activeView: string }) => {
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
    case "configuracoes":
      return <SettingsPage />;
    case "perfil":
      return <ProfilePage />;
    case "notificacoes":
      return <NotificationsPage />;
    case "reports":
      return (
        <div className={styles.placeholderPage}>
          <div className={styles.placeholderContent}>
            <div className={styles.placeholderIcon}>📊</div>
            <h2 className={styles.placeholderTitle}>Relatórios Detalhados</h2>
            <p className={styles.placeholderDescription}>
              Esta funcionalidade está em desenvolvimento e estará disponível em breve.
            </p>
          </div>
        </div>
      );
    default:
      return <OwnerDashboard />;
  }
}, (prevProps, nextProps) => {
  // ✅ SÓ re-renderiza se activeView realmente mudou
  return prevProps.activeView === nextProps.activeView;
});

PageContent.displayName = 'PageContent';

// ✅ Componente de header da página memoizado
const PageHeader = memo(({ title, actions }: { title: string; actions: React.ReactNode }) => {
  return (
    <div className={styles.pageHeader}>
      <h1 className={styles.pageTitle}>{title}</h1>
      <div className={styles.pageActions}>{actions}</div>
    </div>
  );
});

PageHeader.displayName = 'PageHeader';

export const Owner: React.FC = () => {
  const [activeView, setActiveView] = useState(() => {
    // ✅ Recupera a view salva ou usa dashboard como padrão
    return localStorage.getItem('lastActiveView') || "dashboard";
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  // ✅ Salvar view ativa no localStorage
  useEffect(() => {
    localStorage.setItem('lastActiveView', activeView);
  }, [activeView]);

  // ✅ Handler para colapso da sidebar
  const handleSidebarCollapse = useCallback((collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  }, []);

  // ✅ Handler para toggle do menu mobile
  const handleMenuToggle = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  // ✅ Handler para mudança de view - SÓ atualiza se diferente
  const handleViewChange = useCallback((view: string) => {
    setActiveView(prevView => {
      if (prevView !== view) {
        console.log('📱 Mudando view para:', view);
        return view;
      }
      return prevView;
    });
  }, []);

  // ✅ Título da página memoizado
  const pageTitle = useMemo(() => {
    const titles: Record<string, string> = {
      dashboard: "Dashboard",
      events: "Gestão de Eventos",
      clients: "Gestão de Clientes",
      itens: "Gestão de Itens",
      financial: "Relatórios Financeiros",
      reports: "Relatórios Detalhados",
      checklist: "Checklists de Eventos",
      team: "Gerenciar Equipe",
      configuracoes: "Configurações do Sistema",
      perfil: "Meu Perfil",
      notificacoes: "Notificações",
    };
    return titles[activeView] || "Dashboard";
  }, [activeView]);

  // ✅ Classe CSS memoizada
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
        />

        <main className={styles.contentArea}>
          <PageHeader title={pageTitle} actions={null} />

          <div className={styles.pageContent}>
            <PageContent activeView={activeView} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Owner;