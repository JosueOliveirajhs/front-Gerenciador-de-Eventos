// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types/User';
import { api } from '../services/api';
import { notificationService } from '../services/notification';

interface AuthContextType {
  user: User | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
  loading: boolean;
  unreadNotifications: number;
  refreshUnreadCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadNotifications(count);
    } catch (error) {
      // Silencioso
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('Usuario carregado:', {
          id: parsedUser.id,
          name: parsedUser.name,
          userType: parsedUser.userType,
          role: parsedUser.role
        });
        setUser(parsedUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        refreshUnreadCount();
      } catch (error) {
        console.error('Erro ao recuperar usuario:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (!user) return;
    // O polling HTTP (setInterval) foi removido pois os WebSockets 
    // agora cuidam das atualizações em tempo real no Header.tsx
  }, [user]);

  const login = (userData: User, token: string) => {
    console.log('AuthContext - Login:', {
      id: userData.id,
      name: userData.name,
      userType: userData.userType,
      role: userData.role
    });
    
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    refreshUnreadCount();
  };

  const logout = () => {
    console.log('Logout realizado');
    setUser(null);
    setUnreadNotifications(0);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  };

  const updateUser = (updatedUser: Partial<User>) => {
    console.log('Atualizando usuario:', updatedUser);
    setUser(prev => {
      if (!prev) return prev;
      // Mesclar dados antigos com novos (preserva id, userType, role)
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(merged));
      console.log('Usuario salvo no localStorage:', merged);
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, login, logout, updateUser, loading, 
      unreadNotifications, refreshUnreadCount 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};