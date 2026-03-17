// src/pages/Developer.tsx

import React, { useState } from 'react';
import { 
  MdDashboard,
  MdBusiness,
  MdStorage,
  MdTerminal,
  MdSettings,
  MdLogout,
  MdMenu,
  MdClose,
  MdNotifications,
  MdCode,
  MdAttachMoney
} from 'react-icons/md';
import {
  FaShieldAlt,
  FaHeadset,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { DeveloperDashboard } from '../../components/DeveloperCompents/DeveloperDashboard/DeveloperDashboard';
import { Companies } from '../../components/DeveloperCompents/Companies/Companies';
import { CRM } from '../../components/DeveloperCompents/CRM/CRM';
import { GlobalSupport } from '../../components/DeveloperCompents/GlobalSupport/GlobalSupport';
import { LogViewer } from '../../components/DeveloperCompents/LogViewer/LogViewer';
import { Settings } from '../../components/DeveloperCompents/Settings/Settings';

import styles from './Developer.module.css';

type TabType = 
  | 'dashboard' 
  | 'companies' 
  | 'crm' 
  | 'support' 
  | 'sandbox' 
  | 'system' 
  | 'database' 
  | 'logs' 
  | 'settings';

export const Developer: React.FC = () => {  // ✅ Exportação correta aqui
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DeveloperDashboard />;
      case 'companies':
        return <Companies />;
      case 'crm':
        return <CRM />;
      case 'support':
        return <GlobalSupport />;
      case 'logs':
        return <Logs />;
      case 'settings':
        return <Settings />;
      default:
        return <DeveloperDashboard />;
    }
  };

  return (
    <div className={styles.developerContainer}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarClosed : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            {sidebarOpen ? (
              <>
                <MdCode size={24} />
                <h2>DevOps</h2>
              </>
            ) : (
              <MdCode size={24} />
            )}
          </div>
          <button 
            className={styles.menuToggle}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <MdClose /> : <MdMenu />}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.active : ''}`}
            onClick={() => setActiveTab('dashboard')}
            title={!sidebarOpen ? 'Dashboard' : ''}
          >
            <MdDashboard />
            {sidebarOpen && <span>Dashboard</span>}
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'companies' ? styles.active : ''}`}
            onClick={() => setActiveTab('companies')}
            title={!sidebarOpen ? 'Empresas' : ''}
          >
            <MdBusiness />
            {sidebarOpen && <span>Empresas</span>}
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'crm' ? styles.active : ''}`}
            onClick={() => setActiveTab('crm')}
            title={!sidebarOpen ? 'CRM' : ''}
          >
            <MdAttachMoney />
            {sidebarOpen && <span>CRM</span>}
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'support' ? styles.active : ''}`}
            onClick={() => setActiveTab('support')}
            title={!sidebarOpen ? 'Suporte' : ''}
          >
            <FaHeadset />
            {sidebarOpen && <span>Suporte</span>}
          </button>


          <button
            className={`${styles.navItem} ${activeTab === 'logs' ? styles.active : ''}`}
            onClick={() => setActiveTab('logs')}
            title={!sidebarOpen ? 'Logs' : ''}
          >
            <MdTerminal />
            {sidebarOpen && <span>Logs</span>}
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveTab('settings')}
            title={!sidebarOpen ? 'Config' : ''}
          >
            <MdSettings />
            {sidebarOpen && <span>Config</span>}
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.systemInfo}>
            {sidebarOpen && (
              <>
                <div className={styles.systemVersion}>
                  <FaShieldAlt />
                  <span>v2.1.4</span>
                </div>
                <div className={styles.systemEnv}>
                  <span>Production</span>
                </div>
              </>
            )}
          </div>

          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              <MdCode />
            </div>
            {sidebarOpen && (
              <div className={styles.userDetails}>
                <span className={styles.userName}>{user?.name || 'DevOps'}</span>
                <span className={styles.userRole}>Desenvolvedor</span>
              </div>
            )}
          </div>

          <button onClick={logout} className={styles.logoutButton} title="Sair">
            <MdLogout />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <header className={styles.mainHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>
              {activeTab === 'dashboard' && 'Dashboard do Desenvolvedor'}
              {activeTab === 'companies' && 'Gerenciar Empresas'}
              {activeTab === 'crm' && 'CRM Comercial'}
              {activeTab === 'support' && 'Suporte Global'}
              {activeTab === 'sandbox' && 'Ambiente de Testes'}
              {activeTab === 'system' && 'Saúde do Sistema'}
              {activeTab === 'database' && 'Banco de Dados'}
              {activeTab === 'logs' && 'Logs do Sistema'}
              {activeTab === 'settings' && 'Configurações Técnicas'}
            </h1>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.notificationButton}>
              <MdNotifications size={20} />
              <span className={styles.notificationBadge}>5</span>
            </button>
            <div className={styles.environmentBadge}>
              <span className={styles.environmentDot}></span>
              <span>Produção</span>
            </div>
          </div>
        </header>

        <div className={styles.contentArea}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

// ✅ Exportação padrão também para garantir
export default Developer;