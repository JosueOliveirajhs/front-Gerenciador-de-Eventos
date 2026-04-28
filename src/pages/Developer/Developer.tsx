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

/**
 * Interpreta a URL e extrai a view, subView e ID
 * 
 * Exemplos:
 * /developer/organizations          -> { view: 'organizations', subView: 'list', id: null }
 * /developer/organizations/1        -> { view: 'organizations', subView: '1', id: 1 }
 * /developer/organizations/new      -> { view: 'organizations', subView: 'new', id: null }
 * /developer/organizations/edit/1   -> { view: 'organizations', subView: 'edit', id: 1 }
 */
const parsePath = (pathname: string) => {
  const parts = pathname.split('/').filter(Boolean);
  // parts[0] = 'developer'
  // parts[1] = view (dashboard, organizations, catalogo, etc.)
  // parts[2] = subView (id numérico, 'new', 'edit')
  // parts[3] = id numérico (quando subView é 'edit')
  
  const view = parts[1] || 'dashboard';
  let subView = 'list';
  let id: number | null = null;
  
  if (parts.length > 2) {
    const thirdPart = parts[2];
    
    if (thirdPart === 'new') {
      subView = 'new';
    } else if (thirdPart === 'edit') {
      subView = 'edit';
      // O ID está na 4ª posição: /developer/organizations/edit/1
      if (parts.length > 3 && !isNaN(Number(parts[3]))) {
        id = parseInt(parts[3]);
      }
    } else if (!isNaN(Number(thirdPart))) {
      // É um número = ID de detalhes: /developer/organizations/1
      subView = thirdPart;
      id = parseInt(thirdPart);
    } else {
      subView = thirdPart;
    }
  }
  
  console.log('📍 parsePath:', { pathname, view, subView, id });
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

  // Atualiza o estado quando a URL muda
  useEffect(() => {
    const { view: newView, subView: newSubView, id: newId } = parsePath(location.pathname);
    console.log('🔄 Atualizando estado:', { newView, newSubView, newId });
    
    if (newView !== activeView) setActiveView(newView);
    if (newSubView !== subView) setSubView(newSubView);
    if (newId !== selectedId) setSelectedId(newId);
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
    console.log('🚀 Navegando para:', route);
    navigate(route, { state: params });
    setIsMobileMenuOpen(false);
  }, [navigate]);

  /**
   * Renderiza o conteúdo baseado na view e subView atuais
   */
  const renderContent = () => {
    const stateParams = location.state as any;
    console.log('🎨 Renderizando:', { activeView, subView, selectedId });
    
    switch (activeView) {
      case 'dashboard':
        return <DeveloperDashboard onNavigate={(path: string) => navigate(path)} />;
        
      case 'organizations':
        // SubView = 'new' ou 'edit' -> Formulário
        if (subView === 'new' || subView === 'edit') {
          console.log('📝 Mostrando formulário. ID:', selectedId);
          return (
            <OrganizationForm 
              organizationId={selectedId || stateParams?.organizationId} 
              onSuccess={() => {
                console.log('✅ Formulário salvo, voltando para lista');
                navigate('/developer/organizations');
              }}
              onCancel={() => {
                console.log('❌ Formulário cancelado, voltando para lista');
                navigate('/developer/organizations');
              }}
            />
          );
        }
        
        // SubView é um número -> Detalhes
        if (subView && !isNaN(parseInt(subView))) {
          const orgId = parseInt(subView);
          console.log('👁️ Mostrando detalhes da organização:', orgId);
          return (
            <OrganizationDetails 
              organizationId={orgId}
              onBack={() => {
                console.log('⬅️ Voltando para lista');
                navigate('/developer/organizations');
              }}
              onEdit={(id) => {
                console.log('✏️ Editando organização:', id);
                navigate(`/developer/organizations/edit/${id}`);
              }}
            />
          );
        }
        
        // SubView = 'list' -> Lista de organizações
        console.log('📋 Mostrando lista de organizações');
        return (
          <Organizations 
            onNavigate={(view, id) => {
              console.log('🧭 onNavigate chamado:', { view, id });
              if (view === 'details' && id) {
                navigate(`/developer/organizations/${id}`);
              } else if (view === 'form' && id) {
                navigate(`/developer/organizations/edit/${id}`);
              } else if (view === 'form') {
                navigate('/developer/organizations/new');
              }
            }} 
          />
        );
        
      case 'catalogo':
        // SubView = 'new' ou 'edit' -> Formulário
        if (subView === 'new' || subView === 'edit') {
          return (
            <CatalogoForm 
              empresaId={selectedId || stateParams?.empresaId} 
              onSuccess={() => navigate('/developer/catalogo')}
              onCancel={() => navigate('/developer/catalogo')}
            />
          );
        }
        
        // SubView é um número -> Detalhes
        if (subView && !isNaN(parseInt(subView))) {
          return (
            <CatalogoDetails 
              empresaId={parseInt(subView)}
              onBack={() => navigate('/developer/catalogo')}
              onEdit={(id) => navigate(`/developer/catalogo/edit/${id}`)}
            />
          );
        }
        
        // Lista
        return (
          <Catalogo 
            onNavigate={(view, id) => {
              if (view === 'details' && id) navigate(`/developer/catalogo/${id}`);
              if (view === 'form' && id) navigate(`/developer/catalogo/edit/${id}`);
              if (view === 'form') navigate('/developer/catalogo/new');
            }} 
          />
        );
        
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
      'organizations': 'Organizações - Empresas Assinantes',
      'catalogo': 'Catálogo de Fornecedores',
      'settings': 'Configurações',
      'profile': 'Meu Perfil',
      'notifications': 'Notificações',
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
                <span>Produção</span>
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