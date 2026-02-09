import React, { useState } from 'react';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { ClientDashboard } from '../components/client/ClientDashboard';
import { NewBooking } from '../components/client/NewBooking';
import styles from './Client.module.css';

export const Client: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <ClientDashboard />;
      case 'new-booking':
        return <NewBooking />;
      case 'profile':
        return (
          <div className={styles.placeholderPage}>
            <div className={styles.placeholderContent}>
              <div className={styles.placeholderIcon}>👤</div>
              <h2 className={styles.placeholderTitle}>Meus Dados</h2>
              <p className={styles.placeholderDescription}>
                Esta funcionalidade está em desenvolvimento e estará disponível em breve.
              </p>
            </div>
          </div>
        );
      default:
        return <ClientDashboard />;
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

// Helper functions
const getPageTitle = (view: string): string => {
  const titles: { [key: string]: string } = {
    dashboard: 'Meus Eventos',
    'new-booking': 'Nova Reserva',
    profile: 'Meus Dados'
  };
  return titles[view] || 'Meus Eventos';
};

const renderPageActions = (view: string) => {
  switch (view) {
    case 'dashboard':
      return (
        <button className={styles.primaryButton}>
          + Nova Reserva
        </button>
      );
    default:
      return null;
  }
};