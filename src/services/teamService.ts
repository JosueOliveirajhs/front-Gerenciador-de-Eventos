// src/services/teamService.ts
import { api } from './api';
import { User } from '../types/developer';

export interface CreateMemberDTO {
  name: string;
  email: string;
  cpf: string;
  phone?: string;
  role: string;
  password?: string;
}

export interface UpdateMemberDTO {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    throw new Error('Usuário não autenticado');
  }
  const user = JSON.parse(userStr);
  
  if (!user.organizationId) {
    console.warn('⚠️ Usuário sem organizationId, definindo organizationId = 1');
    user.organizationId = 1;
    localStorage.setItem('user', JSON.stringify(user));
  }
  
  console.log('👤 Usuário atual:', {
    id: user.id,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId
  });
  
  return user;
};

export const teamService = {
  getTeamMembers: async (): Promise<User[]> => {
    try {
      console.log('👥 Buscando membros da equipe...');
      const response = await api.get('/api/users/clients');
      
      const members = (response.data || []).map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        phone: user.phone || '',
        role: user.role,
        status: user.status,
        userType: user.userType,
        organizationId: user.organizationId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastAccess: user.lastAccess
      }));
      
      console.log(`✅ ${members.length} membros encontrados`);
      return members;
    } catch (error) {
      console.error('❌ Erro ao buscar membros da equipe:', error);
      throw error;
    }
  },

  getTeamMemberById: async (id: number): Promise<User> => {
    try {
      const response = await api.get(`/api/users/${id}`);
      return {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        cpf: response.data.cpf,
        phone: response.data.phone || '',
        role: response.data.role,
        status: response.data.status,
        userType: response.data.userType,
        organizationId: response.data.organizationId,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
        lastAccess: response.data.lastAccess
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Membro não encontrado');
      }
      throw error;
    }
  },

  createTeamMember: async (data: CreateMemberDTO): Promise<User> => {
    try {
      const currentUser = getCurrentUser();
      const organizationId = currentUser.organizationId;
      
      if (!organizationId) {
        throw new Error('Usuário não está associado a uma organização');
      }
      
      console.log('🏢 Criando membro para organização ID:', organizationId);
      
      const userData = {
        name: data.name,
        email: data.email,
        cpf: data.cpf.replace(/\D/g, ''),
        phone: data.phone ? data.phone.replace(/\D/g, '') : '',
        password: data.password,
        role: data.role || 'MANAGER',
        userType: 'CLIENT',
        status: 'ACTIVE',
        organizationId: organizationId
      };
      
      console.log('📤 Enviando dados:', { ...userData, password: '***' });
      
      const response = await api.post('/api/users/clients', userData);
      console.log('✅ Resposta do servidor:', response.data);
      
      return {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        cpf: response.data.cpf,
        phone: response.data.phone || '',
        role: response.data.role,
        status: response.data.status,
        userType: response.data.userType,
        organizationId: response.data.organizationId,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
        lastAccess: response.data.lastAccess
      };
    } catch (error: any) {
      console.error('❌ Erro ao criar membro:', error);
      
      if (error.response?.status === 400) {
        const message = error.response?.data;
        if (typeof message === 'string') {
          if (message.includes('CPF')) throw new Error('CPF já cadastrado');
          if (message.includes('E-mail')) throw new Error('E-mail já cadastrado');
          throw new Error(message);
        }
      }
      
      throw error;
    }
  },

  updateTeamMember: async (id: number, data: UpdateMemberDTO): Promise<User> => {
    try {
      const userData: any = {};
      if (data.name) userData.name = data.name;
      if (data.email) userData.email = data.email;
      if (data.phone) userData.phone = data.phone.replace(/\D/g, '');
      if (data.role) userData.role = data.role;
      if (data.status) userData.status = data.status;
      
      const response = await api.put(`/api/users/${id}`, userData);
      
      return {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        cpf: response.data.cpf,
        phone: response.data.phone || '',
        role: response.data.role,
        status: response.data.status,
        userType: response.data.userType,
        organizationId: response.data.organizationId,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
        lastAccess: response.data.lastAccess
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Membro não encontrado');
      }
      throw error;
    }
  },

  updateMemberStatus: async (id: number, status: string): Promise<User> => {
    try {
      const response = await api.put(`/api/users/${id}`, { status });
      return {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        cpf: response.data.cpf,
        phone: response.data.phone || '',
        role: response.data.role,
        status: response.data.status,
        userType: response.data.userType,
        organizationId: response.data.organizationId,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
        lastAccess: response.data.lastAccess
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Membro não encontrado');
      }
      throw error;
    }
  },

  deleteTeamMember: async (id: number): Promise<void> => {
    try {
      await api.delete(`/api/users/${id}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Membro não encontrado');
      }
      throw error;
    }
  },

  formatCPF: (cpf: string): string => {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }
    return cpf;
  },

  formatPhone: (phone: string): string => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }
    if (cleaned.length === 10) {
      return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }
    return phone;
  },

  validateCPF: (cpf: string): boolean => {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleaned)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cleaned.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cleaned.charAt(10))) return false;
    
    return true;
  },

  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  getRoleLabel: (role: string): string => {
    const labels: { [key: string]: string } = {
      'ADMIN': 'Administrador',
      'DIRECTOR': 'Diretor',
      'MANAGER': 'Gerente',
      'ANALYST': 'Analista',
      'DEVELOPER': 'Desenvolvedor'
    };
    return labels[role] || role;
  },

  getRoleColor: (role: string): string => {
    const colors: { [key: string]: string } = {
      'ADMIN': '#dc2626',
      'DIRECTOR': '#ea580c',
      'MANAGER': '#0284c7',
      'ANALYST': '#16a34a',
      'DEVELOPER': '#3b82f6'
    };
    return colors[role] || '#6b7280';
  }
};