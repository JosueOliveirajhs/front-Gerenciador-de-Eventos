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
  FiX,
  FiCalendar,
  FiDollarSign,
  FiPackage,
  FiAlertCircle
} from 'react-icons/fi';
import { MdEvent, MdGroup } from 'react-icons/md';
import { FaBox } from 'react-icons/fa';
import { notificationService, Notification } from '../../../services/notification';
import styles from './Header.module.css';

interface HeaderProps {
  onMenuToggle?: () => void;
  onViewChange?: (view: string, params?: any) => void;
  onSearch?: (query: string) => void;
  activeView?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  onMenuToggle, 
  onViewChange, 
  onSearch,
  activeView 
}) => {
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

  useEffect(() => {
    console.log('🎯 HEADER - Usuário atual:', {
      name: user?.name,
      userType: user?.userType,
      role: user?.role,
    });
  }, [user]);

  const formatTimeAgo = (timestamp: string): string => {
    if (!timestamp) return 'Agora mesmo';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Agora mesmo';
      
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
    } catch {
      return 'Agora mesmo';
    }
  };

  const getUserRoleText = (): string => {
    if (user?.userType === 'DEVELOPER') return 'Desenvolvedor';
    if (user?.userType === 'CLIENT') return 'Cliente';
    
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

  const getUserInitials = (): string => {
    return user?.name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim().length >= 2) {
      setShowSearchResults(true);
      onSearch?.(query);
    } else {
      setShowSearchResults(false);
      onSearch?.('');
    }
  };

  const handleSearchResultClick = (view: string, params?: any) => {
    handleNavigation(view, params);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
    onSearch?.('');
  };

  const unreadNotifications = notifications.filter(n => !n.lida);
  const unreadCount = unreadNotifications.length;

  // ✅ NAVEGAÇÃO - Passa a view para o componente pai
  const handleNavigation = (view: string, params?: any) => {
    console.log('🔀 HEADER - Navegando para:', view);
    onViewChange?.(view, params);
    setShowUserDropdown(false);
    setShowNotifications(false);
  };

  const handleLogout = async () => {
    console.log('🚪 HEADER - Fazendo logout');
    await logout();
  };

  const handleMarkAsRead = async (id: number, event?: React.MouseEvent) => {
    event?.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, lida: true } : n)
      );
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const handleMarkAllAsRead = async (event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.lida) {
      handleMarkAsRead(notification.id);
    }
    
    if (notification.urlAcao) {
      window.location.href = notification.urlAcao;
    } else {
      handleNavigation('notifications');
    }
    setShowNotifications(false);
  };

  const getTypeIcon = (type: string) => {
    const normalizedType = type?.toLowerCase() || 'system';
    switch(normalizedType) {
      case 'evento':
      case 'event': return <FiCalendar size={16} />;
      case 'pagamento':
      case 'payment': return <FiDollarSign size={16} />;
      case 'estoque':
      case 'stock': return <FiPackage size={16} />;
      case 'alerta':
      case 'alert': return <FiAlertCircle size={16} />;
      default: return <FiBell size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    const normalizedType = type?.toLowerCase() || 'system';
    switch(normalizedType) {
      case 'evento':
      case 'event': return '#3b82f6';
      case 'pagamento':
      case 'payment': return '#10b981';
      case 'estoque':
      case 'stock': return '#f59e0b';
      case 'alerta':
      case 'alert': return '#ef4444';
      default: return '#64748b';
    }
  };

  // Menu de busca por tipo de usuário
  const getSearchResults = () => {
    if (user?.userType === 'CLIENT') {
      return (
        <>
          <div className={styles.searchResultItem} onClick={() => handleSearchResultClick('events')}>
            <MdEvent size={16} />
            <div><strong>Meus Eventos</strong><p>Visualizar eventos agendados</p></div>
          </div>
          <div className={styles.searchResultItem} onClick={() => handleSearchResultClick('payments')}>
            <FiDollarSign size={16} />
            <div><strong>Pagamentos</strong><p>Ver histórico de pagamentos</p></div>
          </div>
          <div className={styles.searchResultItem} onClick={() => handleSearchResultClick('documents')}>
            <FiPackage size={16} />
            <div><strong>Documentos</strong><p>Acessar contratos</p></div>
          </div>
          <div className={styles.searchResultItem} onClick={() => handleSearchResultClick('messages')}>
            <MdGroup size={16} />
            <div><strong>Mensagens</strong><p>Conversar com a equipe</p></div>
          </div>
        </>
      );
    }
    
    if (user?.userType === 'DEVELOPER') {
      return (
        <>
          <div className={styles.searchResultItem} onClick={() => handleSearchResultClick('organizations')}>
            <MdGroup size={16} />
            <div><strong>Organizações</strong><p>Gerenciar empresas</p></div>
          </div>
          <div className={styles.searchResultItem} onClick={() => handleSearchResultClick('catalogo')}>
            <MdGroup size={16} />
            <div><strong>Catálogo</strong><p>Fornecedores</p></div>
          </div>
          <div className={styles.searchResultItem} onClick={() => handleSearchResultClick('crm')}>
            <FiDollarSign size={16} />
            <div><strong>CRM</strong><p>Gestão comercial</p></div>
          </div>
          <div className={styles.searchResultItem} onClick={() => handleSearchResultClick('logs')}>
            <MdGroup size={16} />
            <div><strong>Logs</strong><p>Monitoramento</p></div>
          </div>
        </>
      );
    }
    
    // OWNER (padrão)
    return (
      <>
        <div className={styles.searchResultItem} onClick={() => handleSearchResultClick('events')}>
          <MdEvent size={16} />
          <div><strong>Eventos</strong><p>Gerenciar todos os eventos</p></div>
        </div>
        <div className={styles.searchResultItem} onClick={() => handleSearchResultClick('clients')}>
          <FiUser size={16} />
          <div><strong>Clientes</strong><p>Visualizar e gerenciar clientes</p></div>
        </div>
        <div className={styles.searchResultItem} onClick={() => handleSearchResultClick('team')}>
          <MdGroup size={16} />
          <div><strong>Equipe</strong><p>Gerenciar membros</p></div>
        </div>
        <div className={styles.searchResultItem} onClick={() => handleSearchResultClick('itens')}>
          <FaBox size={16} />
          <div><strong>Itens</strong><p>Gerenciar estoque</p></div>
        </div>
        <div className={styles.searchResultItem} onClick={() => handleSearchResultClick('financial')}>
          <FiDollarSign size={16} />
          <div><strong>Financeiro</strong><p>Relatórios</p></div>
        </div>
      </>
    );
  };

  const getSearchPlaceholder = (): string => {
    if (user?.userType === 'CLIENT') return 'Pesquisar eventos, pagamentos...';
    if (user?.userType === 'DEVELOPER') return 'Pesquisar organizações, logs...';
    return 'Pesquisar eventos, clientes, equipe...';
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.headerLeft}>
          <button className={styles.menuToggleBtn} onClick={onMenuToggle}>
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

        <div className={styles.headerCenter} ref={searchRef}>
          <div className={styles.searchContainer}>
            <FiSearch className={styles.searchIcon} size={18} />
            <input 
              type="text" 
              placeholder={getSearchPlaceholder()}
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
          
          {showSearchResults && searchQuery.trim().length >= 2 && (
            <div className={styles.searchResults}>
              <div className={styles.searchResultsHeader}>
                <span>Resultados para: "{searchQuery}"</span>
                <button onClick={() => setShowSearchResults(false)}>
                  <FiX size={14} />
                </button>
              </div>
              <div className={styles.searchResultsList}>
                {getSearchResults()}
              </div>
            </div>
          )}
        </div>

        <div className={styles.headerRight}>
          <div className={styles.notificationDropdown} ref={notificationRef}>
            <button 
              className={`${styles.headerBtn} ${styles.notificationBtn}`}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <FiBell size={20} />
              {unreadCount > 0 && <span className={styles.notificationBadge}>{unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className={styles.notificationMenu}>
                <div className={styles.notificationHeader}>
                  <h3>Notificações</h3>
                  <button className={styles.viewAllBtn} onClick={() => handleNavigation('notifications')}>
                    Ver todas
                  </button>
                </div>

                <div className={styles.notificationList}>
                  {loading ? (
                    <div className={styles.notificationLoading}>
                      <span className={styles.spinner}></span>Carregando...
                    </div>
                  ) : unreadNotifications.length > 0 ? (
                    unreadNotifications.slice(0, 5).map(notification => (
                      <div key={notification.id} className={styles.notificationItem}
                           onClick={() => handleNotificationClick(notification)}>
                        <div className={styles.notificationIcon} 
                             style={{ backgroundColor: `${getTypeColor(notification.tipo)}15` }}>
                          <div style={{ color: getTypeColor(notification.tipo) }}>
                            {getTypeIcon(notification.tipo)}
                          </div>
                        </div>
                        <div className={styles.notificationContent}>
                          <p className={styles.notificationText}><strong>{notification.titulo}</strong></p>
                          <p className={styles.notificationMessage}>{notification.mensagem}</p>
                          <span className={styles.notificationTime}>{formatTimeAgo(notification.dataCriacao)}</span>
                        </div>
                        {!notification.lida && (
                          <button className={styles.notificationMarkRead}
                                  onClick={(e) => handleMarkAsRead(notification.id, e)}>
                            <FiCheck size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className={styles.notificationEmpty}>
                      <FiBell size={32} />
                      <p>Nenhuma notificação nova</p>
                    </div>
                  )}
                </div>

                {unreadCount > 0 && (
                  <div className={styles.notificationFooter}>
                    <button className={styles.markAllReadBtn} onClick={handleMarkAllAsRead}>
                      <FiCheck size={14} /> Marcar todas como lidas
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button className={styles.headerBtn} onClick={() => handleNavigation('settings')} title="Configurações">
            <FiSettings size={20} />
          </button>

          <div className={styles.userDropdown} ref={userDropdownRef}>
            <button className={styles.userTrigger} onClick={() => setShowUserDropdown(!showUserDropdown)}>
              <div className={styles.userAvatarSm}>{getUserInitials()}</div>
              <div className={styles.userInfoSm}>
                <span className={styles.userNameSm}>{user?.name}</span>
                <span className={styles.userRoleSm}>{getUserRoleText()}</span>
              </div>
              <FiChevronDown size={16} className={`${styles.dropdownArrow} ${showUserDropdown ? styles.dropdownArrowRotated : ''}`} />
            </button>

            {showUserDropdown && (
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownHeader}>
                  <div className={styles.userAvatarMd}>{getUserInitials()}</div>
                  <div className={styles.userInfoMd}>
                    <span className={styles.userNameMd}>{user?.name}</span>
                    <span className={styles.userEmailMd}>{user?.email || 'Sem email'}</span>
                    <span className={styles.userRoleMd}>{getUserRoleText()}</span>
                  </div>
                </div>
                
                <div className={styles.dropdownDivider} />
                
                <button className={styles.dropdownItem} onClick={() => handleNavigation('profile')}>
                  <FiUser size={16} /> <span>Meu Perfil</span>
                </button>
                
                <button className={styles.dropdownItem} onClick={() => handleNavigation('settings')}>
                  <FiSettings size={16} /> <span>Configurações</span>
                </button>
                
                <button className={styles.dropdownItem} onClick={() => handleNavigation('notifications')}>
                  <FiBell size={16} /> <span>Notificações</span>
                  {unreadCount > 0 && <span className={styles.dropdownBadge}>{unreadCount}</span>}
                </button>
                
                <div className={styles.dropdownDivider} />
                
                <button className={`${styles.dropdownItem} ${styles.logoutItem}`} onClick={handleLogout}>
                  <FiLogOut size={16} /> <span>Sair</span>
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