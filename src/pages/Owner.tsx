// src/pages/Owner.tsx

import React, { useState } from "react";
import { Header } from "../components/common/Header";
import { Sidebar } from "../components/common/Sidebar";
import { OwnerDashboard } from "../components/owner/OwnerDashboard";
import { EventManagement } from "../components/owner/EventManagement";
import { FinancialReports } from "../components/owner/FinancialReports";
import { ClientManagement } from "../components/owner/ClientManagement";
import { ItemsManagement } from "../components/owner/ItemsManagement";
import ChecklistManagement from "../components/owner/checklist/ChecklistManagement"; // ✅ Import correto
import styles from "./Owner.module.css";

export const Owner: React.FC = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard":
        return <OwnerDashboard />;
      case "checklist":
        return <ChecklistManagement />; // ✅ CORRIGIDO: nome correto do componente
      case "events":
        return <EventManagement />;
      case "financial":
        return <FinancialReports />;
      case "clients":
        return <ClientManagement />;
      case "itens":
        return <ItemsManagement />;
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
        <Header onMenuToggle={handleMenuToggle} />

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
  };
  return titles[view] || "Dashboard";
};

const renderPageActions = (view: string) => {
  switch (view) {
    case "events":
      return <button className={styles.primaryButton}>+ Novo Evento</button>;
    case "clients":
      return <button className={styles.primaryButton}>+ Novo Cliente</button>;
    case "itens":
      return <button className={styles.primaryButton}>+ Novo Item</button>;
    case "checklist": // ✅ Botão para criar novo checklist
      return <button className={styles.primaryButton}>+ Novo Checklist</button>;
    default:
      return null;
  }
};