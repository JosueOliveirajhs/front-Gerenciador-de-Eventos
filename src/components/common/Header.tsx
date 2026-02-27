import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  FiLogOut, 
  FiUser, 
  FiBell, 
  FiMenu,
  FiSearch,
  FiSettings,
  FiChevronDown
} from 'react-icons/fi';
import { MdEvent } from 'react-icons/md';
import styles from './Header.module.css';

interface HeaderProps {
  onMenuToggle?: () => void;
  onViewChange?: (view: string) => void; // Nova prop para mudar a view
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, onViewChange }) => {
  const { user, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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

  // Dados mocados de notificações não lidas
  const unreadNotificationsCount = 3;

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
          <div className={styles.notificationDropdown}>
            <button 
              className={`${styles.headerBtn} ${styles.notificationBtn}`}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <FiBell size={20} />
              {unreadNotificationsCount > 0 && (
                <span className={styles.notificationBadge}>{unreadNotificationsCount}</span>
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
                  <div className={styles.notificationItem} onClick={() => handleNavigation('notificacoes')}>
                    <div className={styles.notificationDot}></div>
                    <div className={styles.notificationContent}>
                      <p className={styles.notificationText}>
                        <strong>Novo evento</strong> - Casamento João e Maria
                      </p>
                      <span className={styles.notificationTime}>há 5 minutos</span>
                    </div>
                  </div>

                  <div className={styles.notificationItem} onClick={() => handleNavigation('notificacoes')}>
                    <div className={styles.notificationDot}></div>
                    <div className={styles.notificationContent}>
                      <p className={styles.notificationText}>
                        <strong>Pagamento recebido</strong> - R$ 5.000,00
                      </p>
                      <span className={styles.notificationTime}>há 2 horas</span>
                    </div>
                  </div>

                  <div className={styles.notificationItem} onClick={() => handleNavigation('notificacoes')}>
                    <div className={styles.notificationDot}></div>
                    <div className={styles.notificationContent}>
                      <p className={styles.notificationText}>
                        <strong>Estoque baixo</strong> - Cadeiras (15 un.)
                      </p>
                      <span className={styles.notificationTime}>há 1 dia</span>
                    </div>
                  </div>
                </div>

                <div className={styles.notificationFooter}>
                  <button 
                    className={styles.markAllReadBtn}
                    onClick={() => console.log('Marcar todas como lidas')}
                  >
                    Marcar todas como lidas
                  </button>
                </div>
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
          <div className={styles.userDropdown}>
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