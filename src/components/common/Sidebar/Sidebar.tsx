// src/components/common/Sidebar/Sidebar.tsx
import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { 
  FiX, 
  FiCheckSquare,
  FiUsers,
  FiSearch,
  FiFile,
  FiChevronLeft,
  FiMenu // Adicionado FiMenu para o ícone de expandir
} from "react-icons/fi";
import {
  MdEvent,
  MdDashboard,
  MdPeople,
  MdAttachMoney,
  MdGroup,
} from "react-icons/md";
import styles from "./Sidebar.module.css";
import { FaBox } from "react-icons/fa";
import logoSmall from "../../../assets/logo-small.png";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
  isCollapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  isMobileOpen = false,
  onMobileToggle,
  onCollapseChange,
  isCollapsed: externalCollapsed,
}) => {
  const { user } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  const getUserRoleText = () => {
    const roleMap: Record<string, string> = {
      'ADMIN': 'Administrador',
      'OWNER': 'Proprietário',
      'MANAGER': 'Gerente',
      'DIRECTOR': 'Diretor',
      'ANALYST': 'Analista',
      'CLIENT': 'Cliente',
      'DEVELOPER': 'Desenvolvedor'
    };
    return roleMap[user?.role || ''] || user?.userType === 'OWNER' ? 'Proprietário' : 'Cliente';
  };

  const ownerMenu = [
    { id: "dashboard", label: "Dashboard", icon: <MdDashboard size={20} /> },
    { id: "events", label: "Todos os Eventos", icon: <MdEvent size={20} /> },
    { id: "clients", label: "Clientes", icon: <MdPeople size={20} /> },
    { id: "team", label: "Equipe", icon: <MdGroup size={20} /> },
    { id: "itens", label: "Itens", icon: <FaBox size={20} /> },
    { id: "checklist", label: "Checklists", icon: <FiCheckSquare size={20} /> },
    { id: "financial", label: "Financeiro", icon: <MdAttachMoney size={20} /> },
  ];

  const clientMenu = [
    { id: "events", label: "Visualizar Eventos", icon: <MdEvent size={20} /> },
    { id: "payments", label: "Pagamentos", icon: <MdAttachMoney size={20} /> },
    { id: "community", label: "Comunidade", icon: <FiUsers size={20} /> },
    { id: "company-search", label: "Pesquisar Empresas", icon: <FiSearch size={20} /> },
    { id: "documents", label: "Documentos", icon: <FiFile size={20} /> },
  ];

  const menuItems = user?.userType === "OWNER" ? ownerMenu : clientMenu;

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    if (externalCollapsed === undefined) {
      setInternalCollapsed(newState);
    }
    if (onCollapseChange) {
      onCollapseChange(newState);
    }
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isMobileOpen && (
        <div className={styles.sidebarOverlay} onClick={onMobileToggle} />
      )}

      <aside
        className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ""} ${isMobileOpen ? styles.sidebarMobileOpen : ""}`}
      >
        {/* Header do Sidebar */}
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <div className={styles.logoIcon}>
              <img 
                src={logoSmall} 
                alt="EventosFáceis" 
                className={styles.logoImage}
              />
            </div>
            {!isCollapsed && (
              <div className={styles.logoText}>
                <span className={styles.logoTitle}>EEMS</span>
                <span className={styles.logoSubtitle}>Gestão</span>
              </div>
            )}
          </div>

          {/* Botão - ícone diferente para expandir/colapsar */}
          <button 
            className={styles.sidebarToggleBtn}
            onClick={toggleCollapse}
            title={isCollapsed ? "Expandir menu" : "Colapsar menu"}
          >
            {isCollapsed ? <FiMenu size={18} /> : <FiX size={18} />}
          </button>
        </div>

        {/* Menu Navigation */}
        <nav className={styles.sidebarNav}>
          <div className={styles.navSection}>
            {!isCollapsed && (
              <span className={styles.sectionLabel}>
                {user?.userType === "OWNER" ? "MENU PRINCIPAL" : "MEU ESPAÇO"}
              </span>
            )}
            <div className={styles.navItems}>
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className={`${styles.navItem} ${activeView === item.id ? styles.navItemActive : ""}`}
                  onClick={() => {
                    console.log('🔀 Navegando para:', item.id);
                    onViewChange(item.id);
                    onMobileToggle?.();
                  }}
                  title={isCollapsed ? item.label : ""}
                >
                  <div className={styles.navItemIcon}>{item.icon}</div>
                  {!isCollapsed && (
                    <span className={styles.navItemLabel}>{item.label}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Footer do Sidebar */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            {!isCollapsed && (
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.name}</span>
                <span className={styles.userRole}>{getUserRoleText()}</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};