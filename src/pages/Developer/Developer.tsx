// src/pages/Developer/Developer.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../../components/common/Header/Header';
import { Sidebar } from '../../components/common/Sidebar/Sidebar';
import { 
  MdDashboard,
  MdBusiness,
  MdStore,
  MdCode,
} from 'react-icons/md';
import {
  FaShieldAlt,
} from 'react-icons/fa';
import { FiSettings, FiUser, FiBell } from 'react-icons/fi';
import { DeveloperDashboard } from '../../components/DeveloperCompents/DeveloperDashboard/DeveloperDashboard';
import { Organizations } from '../../components/DeveloperCompents/Organizations/Organizations';
import { OrganizationDetails } from '../../components/DeveloperCompents/OrganizationsDetails/OrganizationsDetails';
import { OrganizationForm } from '../../components/DeveloperCompents/OrganizationsForm/OrganizationsForm';
import { Catalogo } from '../../components/DeveloperCompents/Catalogo/Catalogo';
import { CatalogoForm } from '../../components/DeveloperCompents/CatalogoForm/CatalogoForm';
import { CatalogoDetails } from '../../components/DeveloperCompents/CatalogoDetails/CatalogoDetails';
import { SettingsPage } from '../../components/OwnerCompoents/settings/SettingsPage';
import { ProfilePage } from '../../components/OwnerCompoents/settings/ProfilePage';
import { NotificationsPage } from '../../components/OwnerCompoents/settings/NotificationsPage';
import { Settings } from '../../components/DeveloperCompents/Settings/Settings';
import styles from './Developer.module.css';

const parsePath = (pathname: string) => {
  const parts = pathname.split('/').filter(Boolean);
  const view = parts[1] || 'dashboard';
  const subView = parts[2] || 'list';
  const id = parts[3] ? parseInt(parts[3]) : null;
  
  return { view, subView, id };
};

export const Developer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { view: initialView, subView: initialSubView, id: initialId } = parsePath(location.pathname);
  
  const [activeView, setActiveView] = useState<string>(initialView);
  const [subView, setSubView] = useState<string>(initialSubView);
  const [selectedId, setSelectedId] = useState<number | null>(initialId);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('developerSidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    const { view, subView: newSubView, id } = parsePath(location.pathname);
    if (view !== activeView) setActiveView(view);
    if (newSubView !== subView) setSubView(newSubView);
    if (id !== selectedId) setSelectedId(id);
  }, [location.pathname]);

  const handleMenuToggle = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const handleSidebarCollapse = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem('developerSidebarCollapsed', String(collapsed));
  }, []);

  const handleViewChange = useCallback((view: string, params?: any) => {
    const routeMapping: Record<string, string> = {
      'dashboard': '/developer/dashboard',
      'organizations': '/developer/organizations',
      'catalogo': '/developer/catalogo',
      'settings': '/developer/settings',
      'configuracoes': '/developer/settings',
      'profile': '/developer/profile',
      'perfil': '/developer/profile',
      'notifications': '/developer/notifications',
      'notificacoes': '/developer/notifications',
    };
    
    const route = routeMapping[view] || `/developer/${view}`;
    navigate(route, { state: params });
    setIsMobileMenuOpen(false);
  }, [navigate]);

  const renderContent = () => {
    const stateParams = location.state as any;
    
    switch (activeView) {
      case 'dashboard':
        return <DeveloperDashboard onNavigate={(path: string) => navigate(path)} />;
        
      case 'organizations':
        if (subView === 'new' || subView === 'edit') {
          return (
            <OrganizationForm 
              organizationId={selectedId || stateParams?.organizationId} 
              onSuccess={() => navigate('/developer/organizations')}
              onCancel={() => navigate('/developer/organizations')}
            />
          );
        }
        if (subView && !isNaN(parseInt(subView))) {
          return (
            <OrganizationDetails 
              organizationId={parseInt(subView)}
              onBack={() => navigate('/developer/organizations')}
              onEdit={(id) => navigate(`/developer/organizations/edit/${id}`)}
            />
          );
        }
        return <Organizations onNavigate={(view, id) => {
          if (view === 'details') navigate(`/developer/organizations/${id}`);
          if (view === 'form') navigate(`/developer/organizations/${id ? `edit/${id}` : 'new'}`);
        }} />;
        
      case 'catalogo':
        if (subView === 'new' || subView === 'edit') {
          return (
            <CatalogoForm 
              empresaId={selectedId || stateParams?.empresaId} 
              onSuccess={() => navigate('/developer/catalogo')}
              onCancel={() => navigate('/developer/catalogo')}
            />
          );
        }
        if (subView && !isNaN(parseInt(subView))) {
          return (
            <CatalogoDetails 
              empresaId={parseInt(subView)}
              onBack={() => navigate('/developer/catalogo')}
              onEdit={(id) => navigate(`/developer/catalogo/edit/${id}`)}
            />
          );
        }
        return <Catalogo onNavigate={(view, id) => {
          if (view === 'details') navigate(`/developer/catalogo/${id}`);
          if (view === 'form') navigate(`/developer/catalogo/${id ? `edit/${id}` : 'new'}`);
        }} />;
        
      case 'settings':
      case 'configuracoes':
        return <SettingsPage />;
        
      case 'profile':
      case 'perfil':
        return <ProfilePage />;
        
      case 'notifications':
      case 'notificacoes':
        return <NotificationsPage />;
        
      default:
        return <DeveloperDashboard onNavigate={(path: string) => navigate(path)} />;
    }
  };

  const getPageTitle = (): string => {
    const titles: Record<string, string> = {
      'dashboard': 'Dashboard do Desenvolvedor',
      'organizations': 'Organizacoes - Empresas Assinantes',
      'catalogo': 'Catalogo de Fornecedores',
      'settings': 'Configuracoes',
      'profile': 'Meu Perfil',
      'notifications': 'Notificacoes',
    };
    return titles[activeView] || 'Dashboard';
  };

  const getPageIcon = () => {
    const icons: Record<string, React.ReactNode> = {
      'dashboard': <MdDashboard size={24} />,
      'organizations': <MdBusiness size={24} />,
      'catalogo': <MdStore size={24} />,
      'settings': <FiSettings size={24} />,
      'profile': <FiUser size={24} />,
      'notifications': <FiBell size={24} />,
    };
    return icons[activeView] || <MdDashboard size={24} />;
  };

  const mainWrapperClass = useMemo(() => {
    return `${styles.mainWrapper} ${sidebarCollapsed ? styles.mainWrapperExpanded : ''}`;
  }, [sidebarCollapsed]);

  return (
    <div className={styles.developerLayout}>
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
                {getPageIcon()}
              </div>
              <h1 className={styles.pageTitle}>
                {getPageTitle()}
              </h1>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.environmentBadge}>
                <span className={styles.environmentDot}></span>
                <span>Producao</span>
              </div>
              <div className={styles.versionBadge}>
                <FaShieldAlt size={12} />
                <span>v2.1.4</span>
              </div>
            </div>
          </div>
          
          <div className={styles.pageContent}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Developer;