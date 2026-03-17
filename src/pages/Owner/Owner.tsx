import React, { useState } from "react";
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

export const Owner: React.FC = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleViewChange = (view: string) => {
    console.log('📱 Mudando view para:', view);
    setActiveView(view);
  };

  const renderActiveView = () => {
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
                Esta funcionalidade está em desenvolvimento e estará disponível
                em breve.
              </p>
            </div>
          </div>
        );
      default:
        return <OwnerDashboard />;
    }
  };

  return (
    <div className={styles.appLayout}>
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        isMobileOpen={isMobileMenuOpen}
        onMobileToggle={handleMenuToggle}
      />

      <div className={styles.mainContent}>
        <Header 
          onMenuToggle={handleMenuToggle} 
          onViewChange={handleViewChange} // Passando a função para o Header
        />

        <main className={styles.contentArea}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>{getPageTitle(activeView)}</h1>
            <div className={styles.pageActions}>
              {renderPageActions(activeView)}
            </div>
          </div>

          <div className={styles.pageContent}>{renderActiveView()}</div>
        </main>
      </div>
    </div>
  );
};

// Helper functions
const getPageTitle = (view: string): string => {
  const titles: { [key: string]: string } = {
    dashboard: "Dashboard",
    events: "Gestão de Eventos",
    clients: "Gestão de Clientes",
    itens: "Gestão de Itens",
    financial: "Relatórios Financeiros",
    reports: "Relatórios Detalhados",
    checklist: "Checklists de Eventos",
    configuracoes: "Configurações do Sistema",
    perfil: "Meu Perfil",
    notificacoes: "Notificações",
  };
  return titles[view] || "Dashboard";
};

const renderPageActions = (view: string) => {
  switch (view) {
    case "events":
      return "";
    case "clients":
      return "";
    case "itens":
      return "";
    case "checklist":
      return "";
    default:
      return null;
  }
};