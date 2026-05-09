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
  status?: 'ACTIVE' | 'BLOCKED' | 'TERMINATED';
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
  // ✅ Buscar membros da equipe (OWNER)
  getTeamMembers: async (): Promise<User[]> => {
    try {
      console.log('👥 Buscando membros da equipe...');
      const response = await api.get('/api/users/team');
      
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
      console.error('❌ Erro ao buscar membros:', error);
      throw error;
    }
  },

  // ✅ Buscar membro por ID
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

  // ✅ CORRIGIDO: Criar membro da equipe (usa /api/users/clients)
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
        password: data.password || '123456',
        role: data.role || 'MANAGER',
        userType: 'OWNER',
        status: 'ACTIVE',
        organization: { id: organizationId }
      };
      
      console.log('📤 Enviando:', { ...userData, password: '***' });
      
      // ✅ Usa o mesmo endpoint de criação de clientes
      const response = await api.post('/api/users/clients', userData);
      console.log('✅ Membro criado:', response.data);
      
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

  // ✅ Atualizar membro
  updateTeamMember: async (id: number, data: UpdateMemberDTO): Promise<User> => {
    try {
      const userData: any = {};
      if (data.name) userData.name = data.name;
      if (data.email) userData.email = data.email;
      if (data.phone) userData.phone = data.phone.replace(/\D/g, '');
      if (data.role) userData.role = data.role;
      if (data.status) {
        // Mapear status do frontend para o backend
        userData.status = data.status === 'INACTIVE' ? 'BLOCKED' : data.status;
      }
      
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

  // ✅ Atualizar apenas status do membro
  updateMemberStatus: async (id: number, status: string): Promise<User> => {
    try {
      // Mapear INACTIVE para BLOCKED (status do backend)
      const backendStatus = status === 'INACTIVE' ? 'BLOCKED' : status;
      
      const response = await api.put(`/api/users/${id}`, { status: backendStatus });
      
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

  // ✅ Deletar membro
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

  // ============================================================
  // UTILITÁRIOS
  // ============================================================

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
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  getRoleLabel: (role: string): string => {
    const labels: Record<string, string> = {
      'ADMIN': 'Administrador',
      'DIRECTOR': 'Diretor',
      'MANAGER': 'Gerente',
      'ANALYST': 'Analista',
      'DEVELOPER': 'Desenvolvedor',
      'OWNER': 'Proprietário'
    };
    return labels[role] || role;
  },

  getRoleColor: (role: string): string => {
    const colors: Record<string, string> = {
      'ADMIN': '#ef4444',
      'DIRECTOR': '#f97316',
      'MANAGER': '#3b82f6',
      'ANALYST': '#10b981',
      'DEVELOPER': '#8b5cf6',
      'OWNER': '#06b6d4'
    };
    return colors[role] || '#6b7280';
  },

  getStatusLabel: (status: string): string => {
    const labels: Record<string, string> = {
      'ACTIVE': 'Ativo',
      'BLOCKED': 'Bloqueado',
      'TERMINATED': 'Desligado',
      'INACTIVE': 'Inativo'
    };
    return labels[status] || status;
  },

  getStatusColor: (status: string): string => {
    const colors: Record<string, string> = {
      'ACTIVE': '#10b981',
      'BLOCKED': '#f59e0b',
      'TERMINATED': '#ef4444',
      'INACTIVE': '#f59e0b'
    };
    return colors[status] || '#6b7280';
  }
};