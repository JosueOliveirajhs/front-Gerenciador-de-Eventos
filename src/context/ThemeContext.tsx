// src/context/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Inicializar com o tema salvo ou 'system'
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme') as ThemeMode;
    return saved && ['light', 'dark', 'system'].includes(saved) ? saved : 'system';
  });
  
  const [isDark, setIsDark] = useState(false);

  const getSystemTheme = (): boolean => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    const body = document.body;
    
    let shouldBeDark: boolean;
    
    if (mode === 'system') {
      shouldBeDark = getSystemTheme();
    } else {
      shouldBeDark = mode === 'dark';
    }
    
    setIsDark(shouldBeDark);
    
    // Aplicar tema ao HTML e BODY
    if (shouldBeDark) {
      root.setAttribute('data-theme', 'dark');
      body.classList.add('dark-mode');
      root.style.colorScheme = 'dark';
    } else {
      root.setAttribute('data-theme', 'light');
      body.classList.remove('dark-mode');
      root.style.colorScheme = 'light';
    }
    
    console.log('🎨 Tema aplicado:', { mode, shouldBeDark, dataTheme: root.getAttribute('data-theme') });
  };

  // Aplicar tema assim que o componente montar
  useEffect(() => {
    const saved = localStorage.getItem('theme') as ThemeMode;
    const themeToApply = saved || 'system';
    setTheme(themeToApply);
    applyTheme(themeToApply);
  }, []);

  const handleSetTheme = (newTheme: ThemeMode) => {
    console.log('🔄 Mudando tema para:', newTheme);
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // Escutar mudanças no sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};