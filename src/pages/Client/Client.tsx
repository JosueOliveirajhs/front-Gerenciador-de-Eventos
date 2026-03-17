import React, { useState } from 'react';
import { Header } from '../../components/common/Header/Header';
import { Sidebar } from '../../components/common/Sidebar/Sidebar';
import { ClientPayments } from '../../components/ClientComponents/ClientPayments';
import { ClientCommunity } from '../../components/ClientComponents/ClientCommunity';
import { CompanySearch } from '../../components/ClientComponents/CompanySearch';
import { ClientDocuments } from '../../components/ClientComponents/ClientDocuments';
import { MyEvents } from '../../components/ClientComponents/MyEvents';
import styles from './Client.module.css';

export const Client: React.FC = () => {
  const [activeView, setActiveView] = useState('events'); // events como padrão
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const renderActiveView = () => {
    switch (activeView) {
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
        return <MyEvents />;
    }
  };

  return (
    <div className={styles.appLayout}>
      <Sidebar 
        activeView={activeView}
        onViewChange={setActiveView}
        isMobileOpen={isMobileMenuOpen}
        onMobileToggle={handleMenuToggle}
        userType="client"
      />
      
      <div className={styles.mainContent}>
        <Header onMenuToggle={handleMenuToggle} onViewChange={setActiveView} />
        
        <main className={styles.contentArea}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>
              {getPageTitle(activeView)}
            </h1>
            <div className={styles.pageActions}>
              {renderPageActions(activeView)}
            </div>
          </div>
          
          <div className={styles.pageContent}>
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
};

// Helper functions apenas para os requisitos
const getPageTitle = (view: string): string => {
  const titles: { [key: string]: string } = {
    events: 'Visualizar Eventos',
    payments: 'Pagamentos e Financeiro',
    community: 'Comunidade',
    'company-search': 'Pesquisar Empresas e Notas',
    documents: 'Espaço de Anexar Documento'
  };
  return titles[view] || 'Visualizar Eventos';
};

const renderPageActions = (view: string) => {
  switch (view) {
    case 'documents':
      return (
        <button className={styles.primaryButton}>
          + Anexar Documento
        </button>
      );
    default:
      return null;
  }
};