// src/services/auth.ts
import { api } from './api';
import { LoginCredentials, RegisterData, AuthResponse } from '../types/User';

export interface RequestPasswordResetData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export const authService = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        try {
            console.log('🔐 Enviando requisição de login para /auth/login');
            
            const response = await api.post('/auth/login', credentials);
            console.log('✅ Resposta do login:', response.data);

            const data = response.data;
            
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            }
            
            return data;
        } catch (error: any) {
            console.error('❌ Erro no login:', error);
            
            if (error.response?.status === 401) {
                throw new Error('CPF ou senha inválidos');
            }
            
            throw error;
        }
    },

    register: async (userData: RegisterData): Promise<AuthResponse> => {
        try {
            console.log('📝 Registrando novo usuário via /auth/register');
            
            const response = await api.post('/auth/register', userData);
            const data = response.data;
            
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            }
            
            console.log('✅ Usuário registrado com sucesso');
            return data;
        } catch (error: any) {
            console.error('❌ Erro ao registrar usuário:', error);
            throw error;
        }
    },

    // ✅ ENDPOINT CORRETO: /auth/forgot-password
    requestPasswordReset: async (email: string): Promise<{ message: string }> => {
        try {
            console.log('📧 Solicitando redefinição de senha para email:', email);
            console.log('📍 URL: /auth/forgot-password (POST)');
            
            const response = await api.post('/auth/forgot-password', { email });
            
            console.log('✅ Resposta:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erro ao solicitar redefinição:', error);
            
            if (error.response?.status === 404) {
                throw new Error('Email não encontrado');
            }
            
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            
            throw error;
        }
    },

    // ✅ ENDPOINT CORRETO: /auth/reset-password?token=...
    resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
        try {
            console.log('🔄 Redefinindo senha com token:', token);
            console.log('📍 URL:', `/auth/reset-password?token=${token} (POST)`);
            
            const response = await api.post(`/auth/reset-password?token=${token}`, {
                password: newPassword
            });
            
            console.log('✅ Resposta:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erro ao redefinir senha:', error);
            
            if (error.response?.status === 400) {
                throw new Error(error.response.data?.message || 'Token inválido ou expirado');
            }
            
            throw error;
        }
    },

    logout: (): void => {
        console.log('🔒 Realizando logout...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/login';
    },

    getCurrentUserFromStorage: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('token');
    },

    getToken: (): string | null => {
        return localStorage.getItem('token');
    }
};