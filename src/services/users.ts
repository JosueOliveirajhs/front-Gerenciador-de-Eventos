// src/services/users.ts
import { User } from '../types/User';
import { api } from './api';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  role: string;
  department?: string;
  position?: string;
  startDate?: string;
  avatar?: string;
  twoFactorEnabled: boolean;
  lastLogin: string;
  loginHistory: {
    date: string;
    ip: string;
    device: string;
  }[];
}

export const userService = {
    /**
     * Busca todos os clientes
     */
    getAllClients: async (): Promise<User[]> => {
        console.log('🔍 Buscando clientes...');
        console.log('Token no localStorage:', localStorage.getItem('token'));
        
        try {
            const response = await api.get('/api/users/clients');
            console.log('✅ Clientes carregados:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erro ao buscar clientes:', error);
            console.error('Detalhes:', {
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url,
                fullUrl: error.config?.baseURL + error.config?.url
            });
            throw error;
        }
    },

    /**
     * Cria um novo cliente
     */
    createClient: async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
        console.log('📝 Criando cliente:', userData);
        
        try {
            const response = await api.post('/api/users/clients', userData);
            console.log('✅ Cliente criado:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erro ao criar cliente:', error);
            
            if (error.response?.status === 400) {
                const errorMessage = error.response.data;
                if (errorMessage.includes('CPF já cadastrado')) {
                    throw new Error('CPF já está cadastrado no sistema');
                } else if (errorMessage.includes('E-mail já cadastrado')) {
                    throw new Error('E-mail já está cadastrado no sistema');
                }
            }
            
            throw new Error(error.response?.data?.message || 'Erro ao criar cliente');
        }
    },

    /**
     * Atualiza um cliente existente
     */
    updateClient: async (id: number, userData: Partial<User>): Promise<User> => {
        console.log('✏️ Atualizando cliente ID:', id, 'Dados:', userData);
        
        try {
            const response = await api.put(`/api/users/${id}`, userData);
            console.log('✅ Cliente atualizado:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erro ao atualizar cliente:', error);
            
            if (error.response?.status === 404) {
                throw new Error('Cliente não encontrado');
            }
            
            throw new Error(error.response?.data?.message || 'Erro ao atualizar cliente');
        }
    },

    /**
     * Exclui um cliente
     */
    deleteClient: async (id: number): Promise<void> => {
        console.log('🗑️ Excluindo cliente ID:', id);
        
        try {
            await api.delete(`/api/users/${id}`);
            console.log('✅ Cliente excluído com sucesso');
        } catch (error: any) {
            console.error('❌ Erro ao excluir cliente:', error);
            
            if (error.response?.status === 404) {
                throw new Error('Cliente não encontrado');
            }
            
            throw new Error(error.response?.data?.message || 'Erro ao excluir cliente');
        }
    },

    /**
     * Busca um cliente pelo ID
     */
    getClientById: async (id: number): Promise<User> => {
        console.log('🔍 Buscando cliente por ID:', id);
        
        try {
            const response = await api.get(`/api/users/${id}`);
            console.log('✅ Cliente encontrado:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erro ao buscar cliente:', error);
            
            if (error.response?.status === 404) {
                throw new Error('Cliente não encontrado');
            }
            
            throw new Error(error.response?.data?.message || 'Erro ao buscar cliente');
        }
    },

    /**
     * Busca cliente por CPF
     */
    getClientByCpf: async (cpf: string): Promise<User | null> => {
        console.log('🔍 Buscando cliente por CPF:', cpf);
        
        try {
            const clients = await userService.getAllClients();
            const client = clients.find(user => user.cpf === cpf.replace(/\D/g, ''));
            
            if (client) {
                console.log('✅ Cliente encontrado por CPF:', client.name);
                return client;
            } else {
                console.log('ℹ️ Cliente não encontrado com CPF:', cpf);
                return null;
            }
        } catch (error: any) {
            console.error('❌ Erro ao buscar cliente por CPF:', error);
            throw error;
        }
    },

    /**
     * Busca o perfil do usuário
     */
    getProfile: async (userId: number): Promise<UserProfile> => {
        console.log('👤 Buscando perfil do usuário ID:', userId);
        
        try {
            const response = await api.get(`/api/users/${userId}/profile`);
            console.log('✅ Perfil carregado:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erro ao buscar perfil:', error);
            
            if (error.response?.status === 404) {
                throw new Error('Perfil não encontrado');
            }
            
            throw new Error(error.response?.data?.message || 'Erro ao buscar perfil');
        }
    },

    /**
     * Atualiza o perfil do usuário
     */
    updateProfile: async (userId: number, data: any): Promise<UserProfile> => {
        console.log('✏️ Atualizando perfil do usuário ID:', userId, data);
        
        try {
            const response = await api.put(`/api/users/${userId}/profile`, data);
            console.log('✅ Perfil atualizado:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erro ao atualizar perfil:', error);
            
            if (error.response?.status === 404) {
                throw new Error('Perfil não encontrado');
            }
            
            throw new Error(error.response?.data?.message || 'Erro ao atualizar perfil');
        }
    },

    /**
     * Ativa/Desativa autenticação de dois fatores
     */
    toggleTwoFactor: async (userId: number, enabled: boolean): Promise<{ twoFactorEnabled: boolean }> => {
        console.log('🔐 Alterando 2FA para usuário:', userId, 'enabled:', enabled);
        
        try {
            const response = await api.patch(`/api/users/${userId}/two-factor`, { enabled });
            console.log('✅ 2FA atualizado:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erro ao alterar 2FA:', error);
            throw new Error(error.response?.data?.message || 'Erro ao alterar autenticação de dois fatores');
        }
    }
};