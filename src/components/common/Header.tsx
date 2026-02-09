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
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

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
          
          <div className={styles.headerLogo}>
            <div className={styles.headerLogoIcon}>
              <MdEvent size={24} />
            </div>
            <h1 className={styles.logoText}>
              Eventos<span className={styles.logoAccent}>Fáceis</span>
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
          <button className={`${styles.headerBtn} ${styles.notificationBtn}`}>
            <FiBell size={20} />
            <span className={styles.notificationBadge}>3</span>
          </button>

          {/* Settings */}
          <button className={styles.headerBtn}>
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
                
                <button className={styles.dropdownItem}>
                  <FiUser size={16} />
                  <span>Meu Perfil</span>
                </button>
                
                <button className={styles.dropdownItem}>
                  <FiSettings size={16} />
                  <span>Configurações</span>
                </button>
                
                <div className={styles.dropdownDivider} />
                
                <button 
                  className={`${styles.dropdownItem} ${styles.logoutItem}`}
                  onClick={logout}
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