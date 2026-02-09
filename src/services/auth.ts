import { api } from './api';
import { LoginCredentials, RegisterData, AuthResponse } from '../types/User';

export const authService = {
    /**
     * Realiza login do usuário
     */
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        try {
            console.log('🔐 Enviando requisição de login:', credentials);
            
            const response = await api.post('/auth/login', credentials);
            console.log('✅ Resposta do login:', response.data);

            const data = response.data;
            
            // Salvar token e usuário no localStorage
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Configurar o token no header padrão do axios
                api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            }
            
            return data;
        } catch (error: any) {
            console.error('❌ Erro no serviço de auth:', error);
            console.error('📋 Detalhes do erro:', {
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url
            });
            
            if (error.response?.status === 401) {
                throw new Error('CPF ou senha inválidos');
            }
            
            throw error;
        }
    },

    /**
     * Registra um novo usuário
     */
    register: async (userData: RegisterData): Promise<AuthResponse> => {
        try {
            console.log('📝 Registrando novo usuário:', userData);
            
            const response = await api.post('/auth/register', userData);
            const data = response.data;
            
            // Salvar token e usuário no localStorage
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Configurar o token no header padrão do axios
                api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            }
            
            console.log('✅ Usuário registrado com sucesso');
            return data;
        } catch (error: any) {
            console.error('❌ Erro ao registrar usuário:', error);
            throw error;
        }
    },

    /**
     * Realiza logout
     */
    logout: (): void => {
        console.log('🔒 Realizando logout...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/login';
    },

    /**
     * Obtém usuário atual do localStorage
     */
    getCurrentUserFromStorage: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    /**
     * Verifica se o usuário está autenticado
     */
    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('token');
    },

    /**
     * Obtém o token do localStorage
     */
    getToken: (): string | null => {
        return localStorage.getItem('token');
    }
};