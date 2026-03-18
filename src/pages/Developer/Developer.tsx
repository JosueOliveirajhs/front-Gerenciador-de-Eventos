// src/pages/Developer.tsx
import React, { useState } from 'react';
import { 
  MdDashboard,
  MdBusiness,
  MdStore,
  MdStorage,
  MdTerminal,
  MdSettings,
  MdLogout,
  MdMenu,
  MdClose,
  MdNotifications,
  MdCode,
  MdAttachMoney,
  MdPeople,
  MdEvent,
  MdReceipt
} from 'react-icons/md';
import {
  FaShieldAlt,
  FaHeadset,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { DeveloperDashboard } from '../../components/DeveloperCompents/DeveloperDashboard/DeveloperDashboard';
import { Organizations } from '../../components/DeveloperCompents/Organizations/Organizations';
import { OrganizationDetails } from '../../components/DeveloperCompents/OrganizationsDetails/OrganizationsDetails';
import { OrganizationForm } from '../../components/DeveloperCompents/OrganizationsForm/OrganizationsForm';
import { Catalogo } from '../../components/DeveloperCompents/Catalogo/Catalogo';
import { CatalogoForm } from '../../components/DeveloperCompents/CatalogoForm/CatalogoForm';
import { CatalogoDetails } from '../../components/DeveloperCompents/CatalogoDetails/CatalogoDetails';
import { CRM } from '../../components/DeveloperCompents/CRM/CRM';
import { GlobalSupport } from '../../components/DeveloperCompents/GlobalSupport/GlobalSupport';
import { LogViewer } from '../../components/DeveloperCompents/LogViewer/LogViewer';
import { Settings } from '../../components/DeveloperCompents/Settings/Settings';
import styles from './Developer.module.css';

type TabType = 
  | 'dashboard' 
  | 'organizations'      // Assinantes do SaaS
  | 'catalogo'           // Catálogo de fornecedores
  | 'crm' 
  | 'support' 
  | 'logs' 
  | 'settings';

type SubViewType = 'list' | 'details' | 'form';

export const Developer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [subView, setSubView] = useState<SubViewType>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();

  const handleNavigate = (tab: TabType, view: SubViewType = 'list', id?: number) => {
    setActiveTab(tab);
    setSubView(view);
    if (id) setSelectedId(id);
  };

  const handleBack = () => {
    setSubView('list');
    setSelectedId(null);
  };

  const renderContent = () => {
    // Organizations (Assinantes)
    if (activeTab === 'organizations') {
      if (subView === 'form') {
        return (
          <OrganizationForm 
            organizationId={selectedId} 
            onSuccess={handleBack}
            onCancel={handleBack}
          />
        );
      }
      if (subView === 'details' && selectedId) {
        return (
          <OrganizationDetails 
            organizationId={selectedId}
            onBack={handleBack}
            onEdit={() => setSubView('form')}
          />
        );
      }
      return (
        <Organizations 
          onNavigate={handleNavigate}
        />
      );
    }

    // Catálogo de Fornecedores
    if (activeTab === 'catalogo') {
      if (subView === 'form') {
        return (
          <CatalogoForm 
            empresaId={selectedId} 
            onSuccess={handleBack}
            onCancel={handleBack}
          />
        );
      }
      if (subView === 'details' && selectedId) {
        return (
          <CatalogoDetails 
            empresaId={selectedId}
            onBack={handleBack}
            onEdit={() => setSubView('form')}
          />
        );
      }
      return (
        <Catalogo 
          onNavigate={handleNavigate}
        />
      );
    }

    // Outras abas
    switch (activeTab) {
      case 'dashboard':
        return <DeveloperDashboard />;
      case 'crm':
        return <CRM />;
      case 'support':
        return <GlobalSupport />;
      case 'logs':
        return <LogViewer />;
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
            onClick={() => handleNavigate('dashboard')}
            title={!sidebarOpen ? 'Dashboard' : ''}
          >
            <MdDashboard />
            {sidebarOpen && <span>Dashboard</span>}
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'organizations' ? styles.active : ''}`}
            onClick={() => handleNavigate('organizations')}
            title={!sidebarOpen ? 'Organizações' : ''}
          >
            <MdBusiness />
            {sidebarOpen && <span>Organizações</span>}
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'catalogo' ? styles.active : ''}`}
            onClick={() => handleNavigate('catalogo')}
            title={!sidebarOpen ? 'Catálogo' : ''}
          >
            <MdStore />
            {sidebarOpen && <span>Catálogo</span>}
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'crm' ? styles.active : ''}`}
            onClick={() => handleNavigate('crm')}
            title={!sidebarOpen ? 'CRM' : ''}
          >
            <MdAttachMoney />
            {sidebarOpen && <span>CRM</span>}
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'support' ? styles.active : ''}`}
            onClick={() => handleNavigate('support')}
            title={!sidebarOpen ? 'Suporte' : ''}
          >
            <FaHeadset />
            {sidebarOpen && <span>Suporte</span>}
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'logs' ? styles.active : ''}`}
            onClick={() => handleNavigate('logs')}
            title={!sidebarOpen ? 'Logs' : ''}
          >
            <MdTerminal />
            {sidebarOpen && <span>Logs</span>}
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => handleNavigate('settings')}
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
              {activeTab === 'organizations' && 'Organizações - Empresas Assinantes'}
              {activeTab === 'catalogo' && 'Catálogo de Fornecedores'}
              {activeTab === 'crm' && 'CRM Comercial'}
              {activeTab === 'support' && 'Suporte Global'}
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

export default Developer;