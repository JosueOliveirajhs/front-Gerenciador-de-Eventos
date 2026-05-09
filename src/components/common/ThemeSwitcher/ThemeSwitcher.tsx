// src/components/common/ThemeSwitcher/ThemeSwitcher.tsx
import React, { useState, useRef, useEffect } from 'react';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';
import { useTheme } from '../../../context/ThemeContext';
import styles from './ThemeSwitcher.module.css';

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <FiSun size={20} />;
      case 'dark': return <FiMoon size={20} />;
      case 'system': return <FiMonitor size={20} />;
      default: return <FiSun size={20} />;
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className={styles.themeSwitcher} ref={dropdownRef}>
      <button
        className={styles.themeButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Alternar tema"
      >
        {getThemeIcon()}
      </button>

      {isOpen && (
        <div className={styles.themeDropdown}>
          <button
            className={`${styles.themeOption} ${theme === 'light' ? styles.active : ''}`}
            onClick={() => handleThemeChange('light')}
          >
            <FiSun size={18} />
            <span>Claro</span>
          </button>
          
          <button
            className={`${styles.themeOption} ${theme === 'dark' ? styles.active : ''}`}
            onClick={() => handleThemeChange('dark')}
          >
            <FiMoon size={18} />
            <span>Escuro</span>
          </button>
          
          <button
            className={`${styles.themeOption} ${theme === 'system' ? styles.active : ''}`}
            onClick={() => handleThemeChange('system')}
          >
            <FiMonitor size={18} />
            <span>Sistema</span>
          </button>
        </div>
      )}
    </div>
  );
};