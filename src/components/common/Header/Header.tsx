// src/components/common/Header/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  FiLogOut, 
  FiUser, 
  FiBell, 
  FiMenu,
  FiSearch,
  FiSettings,
  FiChevronDown,
  FiCheck,
  FiX
} from 'react-icons/fi';
import { MdEvent, MdGroup } from 'react-icons/md';
import { FaBox } from 'react-icons/fa';
import { notificationService, Notification } from '../../../services/notification';
import styles from './Header.module.css';

interface HeaderProps {
  onMenuToggle?: () => void;
  onViewChange?: (view: string) => void;
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, onViewChange, onSearch }) => {
  const { user, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Formatação de tempo
  const formatTimeAgo = (timestamp: string): string => {
    if (!timestamp) return 'Data desconhecida';
    
    try {
      let date: Date;
      
      if (!isNaN(Number(timestamp))) {
        date = new Date(Number(timestamp));
      } else {
        const possibleDate = new Date(timestamp);
        if (!isNaN(possibleDate.getTime())) {
          date = possibleDate;
        } else {
          const normalizedDate = timestamp.replace(' ', 'T');
          date = new Date(normalizedDate);
        }
      }
      
      if (!date || isNaN(date.getTime())) {
        return timestamp;
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHr / 24);
      
      if (diffSec < 60) return 'Agora mesmo';
      if (diffMin < 60) return `Há ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
      if (diffHr < 24) return `Há ${diffHr} ${diffHr === 1 ? 'hora' : 'horas'}`;
      if (diffDay === 1) return 'Ontem';
      if (diffDay < 7) return `Há ${diffDay} dias`;
      
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return timestamp;
    }
  };

  // ✅ FUNÇÃO CORRIGIDA - Exibe o cargo baseado em userType e role
  const getUserRoleText = () => {
    // DESENVOLVEDOR
    if (user?.userType === 'DEVELOPER') {
      return 'Desenvolvedor';
    }
    
    // CLIENTE
    if (user?.userType === 'CLIENT') {
      return 'Cliente';
    }
    
    // OWNER (Funcionário/Diretor) - baseado na role
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

  const getUserInitials = () => {
    return user?.name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  // Carregar notificações
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getAllNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Função de busca - executa imediatamente ao digitar
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim().length >= 2) {
      setShowSearchResults(true);
      if (onSearch) {
        onSearch(query);
      }
    } else {
      setShowSearchResults(false);
      if (onSearch) {
        onSearch('');
      }
    }
  };

  const handleSearchResultClick = (view: string) => {
    handleNavigation(view);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
    if (onSearch) {
      onSearch('');
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const unreadCount = unreadNotifications.length;

  const handleNavigation = (view: string) => {
    console.log('🚀 Mudando para view:', view);
    if (onViewChange) {
      onViewChange(view);
    }
    setShowUserDropdown(false);
    setShowNotifications(false);
  };

  const handleLogout = async () => {
    console.log('🚪 Fazendo logout');
    await logout();
  };

  const handleMarkAsRead = async (id: number, event?: React.MouseEvent) => {
    event?.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const handleMarkAllAsRead = async (event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.actionUrl) {
      const view = notification.actionUrl.split('/')[1];
      if (view) {
        handleNavigation(view);
      }
    } else {
      handleNavigation('notificacoes');
    }
    setShowNotifications(false);
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'event': return <MdEvent size={16} />;
      default: return <FiBell size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'event': return '#3b82f6';
      case 'payment': return '#10b981';
      case 'stock': return '#f59e0b';
      case 'reminder': return '#8b5cf6';
      case 'system': return '#64748b';
      default: return '#64748b';
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {/* Left Section */}
        <div className={styles.headerLeft}>
          <button 
            className={styles.menuToggleBtn}
            onClick={onMenuToggle}
            aria-label="Toggle menu"
          >
            <FiMenu size={20} />
          </button>
          
          <div className={styles.headerLogo} onClick={() => handleNavigation('dashboard')}>
            <div className={styles.headerLogoIcon}>
              <MdEvent size={24} />
            </div>
            <h1 className={styles.logoText}>
              <span className={styles.logoAccent}>Easy Event Management System</span>
            </h1>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className={styles.headerCenter} ref={searchRef}>
          <div className={styles.searchContainer}>
            <FiSearch className={styles.searchIcon} size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar eventos, clientes..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button className={styles.searchClearBtn} onClick={clearSearch}>
                <FiX size={16} />
              </button>
            )}
          </div>
          
          {/* Resultados da pesquisa */}
          {showSearchResults && (
            <div className={styles.searchResults}>
              <div className={styles.searchResultsHeader}>
                <span>Resultados para: "{searchQuery}"</span>
                <button onClick={() => setShowSearchResults(false)}>
                  <FiX size={14} />
                </button>
              </div>
              <div className={styles.searchResultsList}>
                <div className={styles.searchResultItem} onClick={() => handleSearchResultClick('events')}>
                  <MdEvent size={16} />
                  <div>
                    <strong>Eventos</strong>
                    <p>Gerenciar todos os eventos</p>
                  </div>
                </div>
                <div className={styles.searchResultItem} onClick={() => handleSearchResultClick('clients')}>
                  <FiUser size={16} />
                  <div>
                    <strong>Clientes</strong>
                    <p>Visualizar e gerenciar clientes</p>
                  </div>
                </div>
                <div className={styles.searchResultItem} onClick={() => handleSearchResultClick('team')}>
                  <MdGroup size={16} />
                  <div>
                    <strong>Equipe</strong>
                    <p>Gerenciar membros da equipe</p>
                  </div>
                </div>
                <div className={styles.searchResultItem} onClick={() => handleSearchResultClick('itens')}>
                  <FaBox size={16} />
                  <div>
                    <strong>Itens</strong>
                    <p>Gerenciar itens e estoque</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className={styles.headerRight}>
          {/* Notifications */}
          <div className={styles.notificationDropdown} ref={notificationRef}>
            <button 
              className={`${styles.headerBtn} ${styles.notificationBtn}`}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <FiBell size={20} />
              {unreadCount > 0 && (
                <span className={styles.notificationBadge}>{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className={styles.notificationMenu}>
                <div className={styles.notificationHeader}>
                  <h3>Notificações</h3>
                  <button 
                    className={styles.viewAllBtn}
                    onClick={() => handleNavigation('notificacoes')}
                  >
                    Ver todas
                  </button>
                </div>

                <div className={styles.notificationList}>
                  {loading ? (
                    <div className={styles.notificationLoading}>
                      <span className={styles.spinner}></span>
                      Carregando...
                    </div>
                  ) : unreadNotifications.length > 0 ? (
                    unreadNotifications.slice(0, 5).map(notification => (
                      <div 
                        key={notification.id} 
                        className={styles.notificationItem}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div 
                          className={styles.notificationIcon}
                          style={{ backgroundColor: `${getTypeColor(notification.type)}15` }}
                        >
                          <div style={{ color: getTypeColor(notification.type) }}>
                            {getTypeIcon(notification.type)}
                          </div>
                        </div>
                        <div className={styles.notificationContent}>
                          <p className={styles.notificationText}>
                            <strong>{notification.title}</strong>
                          </p>
                          <p className={styles.notificationMessage}>
                            {notification.message}
                          </p>
                          <span className={styles.notificationTime}>
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                        <button 
                          className={styles.notificationMarkRead}
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          title="Marcar como lida"
                        >
                          <FiCheck size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className={styles.notificationEmpty}>
                      <FiBell size={32} />
                      <p>Nenhuma notificação nova</p>
                    </div>
                  )}

                  {unreadNotifications.length > 5 && (
                    <div className={styles.notificationMore}>
                      <button onClick={() => handleNavigation('notificacoes')}>
                        Ver mais {unreadNotifications.length - 5} notificações
                      </button>
                    </div>
                  )}
                </div>

                {unreadCount > 0 && (
                  <div className={styles.notificationFooter}>
                    <button 
                      className={styles.markAllReadBtn}
                      onClick={handleMarkAllAsRead}
                    >
                      <FiCheck size={14} />
                      Marcar todas como lidas
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Settings */}
          <button 
            className={styles.headerBtn}
            onClick={() => handleNavigation('configuracoes')}
            title="Configurações"
          >
            <FiSettings size={20} />
          </button>

          {/* User Dropdown */}
          <div className={styles.userDropdown} ref={userDropdownRef}>
            <button 
              className={styles.userTrigger}
              onClick={() => setShowUserDropdown(!showUserDropdown)}
            >
              <div className={styles.userAvatarSm}>
                {getUserInitials()}
              </div>
              <div className={styles.userInfoSm}>
                <span className={styles.userNameSm}>{user?.name}</span>
                <span className={styles.userRoleSm}>{getUserRoleText()}</span>
              </div>
              <FiChevronDown 
                size={16} 
                className={`${styles.dropdownArrow} ${showUserDropdown ? styles.dropdownArrowRotated : ''}`}
              />
            </button>

            {showUserDropdown && (
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownHeader}>
                  <div className={styles.userAvatarMd}>
                    {getUserInitials()}
                  </div>
                  <div className={styles.userInfoMd}>
                    <span className={styles.userNameMd}>{user?.name}</span>
                    <span className={styles.userEmailMd}>{user?.email || 'Sem email'}</span>
                    <span className={styles.userRoleMd}>{getUserRoleText()}</span>
                  </div>
                </div>
                
                <div className={styles.dropdownDivider} />
                
                <button 
                  className={styles.dropdownItem}
                  onClick={() => handleNavigation('perfil')}
                >
                  <FiUser size={16} />
                  <span>Meu Perfil</span>
                </button>
                
                <button 
                  className={styles.dropdownItem}
                  onClick={() => handleNavigation('configuracoes')}
                >
                  <FiSettings size={16} />
                  <span>Configurações</span>
                </button>
                
                <div className={styles.dropdownDivider} />
                
                <button 
                  className={`${styles.dropdownItem} ${styles.logoutItem}`}
                  onClick={handleLogout}
                >
                  <FiLogOut size={16} />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;