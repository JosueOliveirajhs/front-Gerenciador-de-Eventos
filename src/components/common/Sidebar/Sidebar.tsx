// src/components/common/Sidebar/Sidebar.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { settingsService } from "../../../services/settings";
import { userService } from "../../../services/users";
import { 
  FiX, 
  FiCheckSquare,
  FiUsers,
  FiSearch,
  FiFile,
  FiChevronLeft,
  FiEdit2,
  FiSave,
  FiXCircle
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
  const { user, updateUser } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [systemName, setSystemName] = useState("EEMS");
  const [systemSubtitle, setSystemSubtitle] = useState("Gestão");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  // ✅ DEBUG - Verificar tipo de usuário
  useEffect(() => {
    console.log('🎯 SIDEBAR - Usuário atual:', {
      name: user?.name,
      userType: user?.userType,
      role: user?.role,
      cargo: getUserRoleText()
    });
  }, [user]);

  useEffect(() => {
    const loadSystemName = async () => {
      try {
        const settings = await settingsService.getSettings();
        if (settings.company?.name) {
          const words = settings.company.name.split(' ');
          if (words.length >= 2) {
            const acronym = words.map(w => w.charAt(0)).join('').toUpperCase();
            setSystemName(acronym.slice(0, 4));
            setSystemSubtitle(settings.company.name.length > 10 
              ? settings.company.name.substring(0, 10) + '...' 
              : settings.company.name);
          } else {
            setSystemName(settings.company.name.slice(0, 4).toUpperCase());
            setSystemSubtitle(settings.company.name);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar nome da empresa:', error);
      }
    };
    
    loadSystemName();
  }, []);

  useEffect(() => {
    if (user?.name) {
      setEditNameValue(user.name);
    }
  }, [user?.name]);

  // ✅ FUNÇÃO CORRIGIDA - Baseada no userType
  const getUserRoleText = (): string => {
    console.log('📌 Sidebar - getUserRoleText - userType:', user?.userType, 'role:', user?.role);
    
    if (user?.userType === 'DEVELOPER') {
      return 'Desenvolvedor';
    }
    
    if (user?.userType === 'CLIENT') {
      return 'Cliente';
    }
    
    if (user?.userType === 'OWNER') {
      const roleMap: Record<string, string> = {
        'ADMIN': 'Administrador',
        'DIRECTOR': 'Diretor',
        'MANAGER': 'Gerente',
        'ANALYST': 'Analista'
      };
      return roleMap[user?.role || ''] || 'Funcionário';
    }
    
    return 'Usuário';
  };

  const handleSaveName = async () => {
    if (!editNameValue.trim()) {
      alert("O nome não pode estar vazio");
      return;
    }

    if (!user?.id) {
      alert("Usuário não encontrado");
      return;
    }

    setIsSaving(true);
    try {
      await userService.updateProfile(user.id, {
        name: editNameValue.trim()
      });
      
      if (updateUser) {
        updateUser({ ...user, name: editNameValue.trim() });
      }
      
      setIsEditingName(false);
      console.log("✅ Nome atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar nome:", error);
      alert("Erro ao atualizar nome. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditNameValue(user?.name || "");
    setIsEditingName(false);
  };

  const handleStartEdit = () => {
    setEditNameValue(user?.name || "");
    setIsEditingName(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // ✅ Menu para OWNER/DEVELOPER
  const ownerMenu = [
    { id: "dashboard", label: "Dashboard", icon: <MdDashboard size={20} /> },
    { id: "events", label: "Todos os Eventos", icon: <MdEvent size={20} /> },
    { id: "clients", label: "Clientes", icon: <MdPeople size={20} /> },
    { id: "team", label: "Equipe", icon: <MdGroup size={20} /> },
    { id: "itens", label: "Itens", icon: <FaBox size={20} /> },
    { id: "checklist", label: "Checklists", icon: <FiCheckSquare size={20} /> },
    { id: "financial", label: "Financeiro", icon: <MdAttachMoney size={20} /> },
  ];

  // ✅ Menu para CLIENT
  const clientMenu = [
    { id: "dashboard", label: "Dashboard", icon: <MdDashboard size={20} /> },
    { id: "events", label: "Meus Eventos", icon: <MdEvent size={20} /> },
    { id: "payments", label: "Pagamentos", icon: <MdAttachMoney size={20} /> },
    { id: "documents", label: "Documentos", icon: <FiFile size={20} /> },
    { id: "messages", label: "Mensagens", icon: <FiUsers size={20} /> },
    { id: "community", label: "Comunidade", icon: <FiUsers size={20} /> },
    { id: "company-search", label: "Pesquisar Empresas", icon: <FiSearch size={20} /> },
  ];

  // ✅ Seleção do menu baseada no userType
  let menuItems = clientMenu;
  if (user?.userType === 'DEVELOPER' || user?.userType === 'OWNER') {
    menuItems = ownerMenu;
  }

  console.log('📋 Sidebar - Menu selecionado:', menuItems.map(m => m.id));

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    if (externalCollapsed === undefined) {
      setInternalCollapsed(newState);
    }
    onCollapseChange?.(newState);
  };

  // ✅ Texto da seção baseado no userType
  const getSectionLabel = (): string => {
    if (user?.userType === 'CLIENT') {
      return "MEU ESPAÇO";
    }
    return "MENU PRINCIPAL";
  };

  return (
    <>
      {isMobileOpen && (
        <div className={styles.sidebarOverlay} onClick={onMobileToggle} />
      )}

      <aside
        className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ""} ${isMobileOpen ? styles.sidebarMobileOpen : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <div className={styles.logoIcon}>
              <img 
                src={logoSmall} 
                alt={systemSubtitle} 
                className={styles.logoImage}
              />
            </div>
            {!isCollapsed && (
              <div className={styles.logoText}>
                <span className={styles.logoTitle}>{systemName}</span>
                <span className={styles.logoSubtitle}>{systemSubtitle}</span>
              </div>
            )}
          </div>

          <button 
            className={styles.sidebarToggleBtn}
            onClick={toggleCollapse}
            title={isCollapsed ? "Expandir menu" : "Colapsar menu"}
          >
            {isCollapsed ? <FiChevronLeft size={18} /> : <FiX size={18} />}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.navSection}>
            {!isCollapsed && (
              <span className={styles.sectionLabel}>
                {getSectionLabel()}
              </span>
            )}
            <div className={styles.navItems}>
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className={`${styles.navItem} ${activeView === item.id ? styles.navItemActive : ""}`}
                  onClick={() => {
                    console.log('🔀 Sidebar - Navegando para:', item.id);
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

        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            {!isCollapsed && (
              <div className={styles.userInfo}>
                {isEditingName ? (
                  <div className={styles.userNameEditContainer}>
                    <input
                      type="text"
                      className={styles.userNameInput}
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      autoFocus
                      disabled={isSaving}
                      placeholder="Digite seu nome"
                    />
                    <div className={styles.userNameActions}>
                      <button
                        className={styles.userNameSaveBtn}
                        onClick={handleSaveName}
                        disabled={isSaving}
                        title="Salvar"
                      >
                        <FiSave size={14} />
                      </button>
                      <button
                        className={styles.userNameCancelBtn}
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        title="Cancelar"
                      >
                        <FiXCircle size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.userNameDisplay}>
                    <span className={styles.userName}>{user?.name || "Usuário"}</span>
                    <button
                      className={styles.userEditBtn}
                      onClick={handleStartEdit}
                      title="Editar nome"
                    >
                      <FiEdit2 size={12} />
                    </button>
                  </div>
                )}
                <span className={styles.userRole}>{getUserRoleText()}</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};