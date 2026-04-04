// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/User';
import { authService } from '../services/auth';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (user: User, token: string) => void;
  logout: () => void;
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
        setUser(parsedUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: any, token: string) => {
    // 1. Identifica a role. Se vier nulo ou undefined, assume 'CLIENT'
    const backendRole = userData.role || userData.userType || 'CLIENT';

    // 2. Tradução de Roles para compatibilidade com as rotas
    let translatedType = backendRole;
    
    if (['ADMIN', 'DIRECTOR', 'MANAGER', 'ANALYST'].includes(backendRole)) {
        translatedType = 'OWNER'; 
    } else {
        // Se cair aqui (inclusive se for o valor padrão 'CLIENT'), 
        // garantimos que o tipo é CLIENT
        translatedType = 'CLIENT';
    }

    // 3. Montagem do objeto de usuário garantindo que 'role' exista para o App.tsx
    const userToSave = {
        ...userData,
        role: backendRole, // Agora será 'CLIENT' em vez de null
        userType: translatedType,
        organizationId: userData.organizationId || (userData.organization ? userData.organization.id : null)
    };

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userToSave));
    
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userToSave);

    console.log("🚀 Usuário logado. Role final para o Front:", userToSave.role);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    // Recomendo não usar window.location aqui para evitar loops de render
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children} 
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