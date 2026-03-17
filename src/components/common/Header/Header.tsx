// src/components/common/Header.tsx
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
  FiCheck
} from 'react-icons/fi';
import { MdEvent } from 'react-icons/md';
import { notificationService, Notification } from '../../../services/notification';
import styles from './Header.module.css';

interface HeaderProps {
  onMenuToggle?: () => void;
  onViewChange?: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, onViewChange }) => {
  const { user, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // ===== FUNÇÃO CORRIGIDA DE FORMATAÇÃO DE TEMPO =====
  const formatTimeAgo = (timestamp: string): string => {
    if (!timestamp) return 'Data desconhecida';
    
    try {
      // Tenta converter o timestamp para Date
      let date: Date;
      
      // Se for número (timestamp Unix em milissegundos)
      if (!isNaN(Number(timestamp))) {
        date = new Date(Number(timestamp));
      } 
      // Se for string ISO ou formato comum
      else {
        // Tenta diferentes formatos
        const possibleDate = new Date(timestamp);
        if (!isNaN(possibleDate.getTime())) {
          date = possibleDate;
        } else {
          // Tenta substituir espaço por T (formato ISO)
          const normalizedDate = timestamp.replace(' ', 'T');
          date = new Date(normalizedDate);
        }
      }
      
      // Verifica se a data é válida
      if (!date || isNaN(date.getTime())) {
        console.log('Data inválida:', timestamp);
        return timestamp; // Retorna o original se não conseguir converter
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHr / 24);
      
      // Menos de 1 minuto
      if (diffSec < 60) {
        return 'Agora mesmo';
      }
      
      // Menos de 1 hora
      if (diffMin < 60) {
        return `Há ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
      }
      
      // Menos de 24 horas
      if (diffHr < 24) {
        return `Há ${diffHr} ${diffHr === 1 ? 'hora' : 'horas'}`;
      }
      
      // 1 dia
      if (diffDay === 1) {
        return 'Ontem';
      }
      
      // Menos de 7 dias
      if (diffDay < 7) {
        return `Há ${diffDay} dias`;
      }
      
      // Mais de uma semana - mostra data completa
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return timestamp; // Retorna o original em caso de erro
    }
  };

  const getUserTypeText = () => {
    return user?.userType === 'OWNER' ? 'Proprietário' : 'Cliente';
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
      
      // Log para debug dos timestamps
      console.log('📅 Timestamps recebidos:', data.map(n => ({
        id: n.id,
        timestamp: n.timestamp,
        type: typeof n.timestamp,
        parsed: new Date(n.timestamp).toString()
      })));
      
      setNotifications(data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Atualizar a cada 30 segundos
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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleLogout = () => {
    console.log('🚪 Fazendo logout');
    logout();
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
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'event': return <MdEvent size={16} />;
      case 'payment': return <FiBell size={16} />;
      case 'stock': return <FiBell size={16} />;
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
        <div className={styles.headerCenter}>
          <div className={styles.searchContainer}>
            <FiSearch className={styles.searchIcon} size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar eventos, clientes..."
              className={styles.searchInput}
            />
          </div>
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
                <span className={styles.userRoleSm}>{getUserTypeText()}</span>
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