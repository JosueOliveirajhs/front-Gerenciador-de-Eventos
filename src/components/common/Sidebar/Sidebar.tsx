import React from "react";
import { useAuth } from "../../../context/AuthContext";
import { 
  FiX, 
  FiCheckSquare,
  FiUsers,
  FiSearch,
  FiFile
} from "react-icons/fi";
import {
  MdEvent,
  MdDashboard,
  MdPeople,
  MdAttachMoney,
  MdGroup, // Adicionar ícone para equipe
} from "react-icons/md";
import styles from "./Sidebar.module.css";
import { FaBox } from "react-icons/fa";

// ✅ Importando a imagem diretamente
import logoSmall from "../../../assets/logo-small.png";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  isMobileOpen = false,
  onMobileToggle,
}) => {
  const { user } = useAuth();

  const ownerMenu = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <MdDashboard size={20} />,
      description: "Visão geral do negócio",
    },
    {
      id: "events",
      label: "Todos os Eventos",
      icon: <MdEvent size={20} />,
      description: "Gerencie todos os eventos",
    },
    {
      id: "clients",
      label: "Clientes",
      icon: <MdPeople size={20} />,
      description: "Gerencie seus clientes",
    },
    {
      id: "team", // Nova opção para equipe
      label: "Equipe",
      icon: <MdGroup size={20} />,
      description: "Gerencie sua equipe de funcionários",
    },
    {
      id: "itens",
      label: "Itens",
      icon: <FaBox size={20} />,
      description: "Gerencie seus itens",
    },
    {
      id: "checklist",
      label: "Checklists",
      icon: <FiCheckSquare size={20} />,
      description: "Gerencie checklists de eventos",
    },
    {
      id: "financial",
      label: "Financeiro",
      icon: <MdAttachMoney size={20} />,
      description: "Controle financeiro",
    },
  ];

  const clientMenu = [
    {
      id: "events",
      label: "Visualizar Eventos",
      icon: <MdEvent size={20} />,
      description: "Veja seus eventos",
    },
    {
      id: "payments",
      label: "Pagamentos",
      icon: <MdAttachMoney size={20} />,
      description: "Financeiro e comprovantes",
    },
    {
      id: "community",
      label: "Comunidade",
      icon: <FiUsers size={20} />,
      description: "Compartilhe experiências",
    },
    {
      id: "company-search",
      label: "Pesquisar Empresas",
      icon: <FiSearch size={20} />,
      description: "Encontre fornecedores",
    },
    {
      id: "documents",
      label: "Documentos",
      icon: <FiFile size={20} />,
      description: "Anexe documentos",
    },
  ];

  const menuItems = user?.userType === "OWNER" ? ownerMenu : clientMenu;

  return (
    <>
      {/* Overlay para mobile */}
      {isMobileOpen && (
        <div className={styles.sidebarOverlay} onClick={onMobileToggle} />
      )}

      <aside
        className={`${styles.sidebar} ${isMobileOpen ? styles.sidebarMobileOpen : ""}`}
      >
        {/* Header do Sidebar */}
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <div className={styles.logoIcon}>
              {/* ✅ Usando a imagem importada */}
              <img 
                src={logoSmall} 
                alt="EventosFáceis" 
                className={styles.logoImage}
              />
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>EEMS</span>
              <span className={styles.logoSubtitle}>Gestão</span>
            </div>
          </div>

          {/* Botão fechar para mobile */}
          {onMobileToggle && (
            <button className={styles.sidebarCloseBtn} onClick={onMobileToggle}>
              <FiX size={20} />
            </button>
          )}
        </div>

        {/* Menu Navigation */}
        <nav className={styles.sidebarNav}>
          <div className={styles.navSection}>
            <span className={styles.sectionLabel}>
              {user?.userType === "OWNER" ? "MENU PRINCIPAL" : "MEU ESPAÇO"}
            </span>
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
                  title={item.description}
                >
                  <div className={styles.navItemIcon}>{item.icon}</div>
                  <div className={styles.navItemContent}>
                    <span className={styles.navItemLabel}>{item.label}</span>
                    <span className={styles.navItemDescription}>
                      {item.description}
                    </span>
                  </div>
                  <div className={styles.navItemIndicator}>
                    <div className={styles.indicatorDot} />
                  </div>
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
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={styles.userRole}>
                {user?.userType === "OWNER" ? "Proprietário" : "Cliente"}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};