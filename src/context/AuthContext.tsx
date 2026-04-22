// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/User';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('✅ Usuário carregado do localStorage:', {
          id: parsedUser.id,
          name: parsedUser.name,
          userType: parsedUser.userType,
          role: parsedUser.role
        });
        setUser(parsedUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('❌ Erro ao recuperar usuário:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: User, token: string) => {
    console.log('🔐 AuthContext - Login:', {
      id: userData.id,
      name: userData.name,
      userType: userData.userType,
      role: userData.role
    });
    
    const userWithOrg = {
      ...userData,
      organizationId: userData.organizationId || null
    };
    
    setUser(userWithOrg);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userWithOrg));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    console.log('🚪 Logout realizado');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  };

  const updateUser = (updatedUser: User) => {
    console.log('🔄 Atualizando usuário no contexto:', updatedUser);
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
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