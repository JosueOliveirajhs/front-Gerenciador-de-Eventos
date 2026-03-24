// src/services/teamService.ts
import { api } from './api';
import { TeamMember, TeamMemberRequest, TeamStats, InviteMemberRequest, UserRole, UserStatus } from '../types/team';

// Função para obter o usuário atual do localStorage
const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    throw new Error('Usuário não autenticado');
  }
  const user = JSON.parse(userStr);
  console.log('👤 Usuário atual:', user.name, 'ID:', user.id, 'Org ID:', user.organizationId);
  
  // Se não tiver organizationId, usar 1 (organização padrão)
  if (!user.organizationId) {
    console.warn('⚠️ Usuário sem organizationId, corrigindo para 1...');
    user.organizationId = 1;
    localStorage.setItem('user', JSON.stringify(user));
  }
  
  return user;
};

export const teamService = {
  /**
   * Lista todos os membros da equipe
   */
  getTeamMembers: async (): Promise<TeamMember[]> => {
    try {
      console.log('👥 Buscando membros da equipe...');
      const currentUser = getCurrentUser();
      
      const response = await api.get('/api/users/clients');
      console.log('📦 Resposta da API /users/clients:', response.data);
      
      const members = response.data.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        phone: user.phone || '',
        role: user.role as UserRole,
        status: user.status as UserStatus,
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

  /**
   * Busca um membro da equipe por ID
   */
  getTeamMemberById: async (id: number): Promise<TeamMember> => {
    try {
      console.log(`🔍 Buscando membro da equipe ID: ${id}`);
      const response = await api.get(`/api/users/${id}`);
      return {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        cpf: response.data.cpf,
        phone: response.data.phone || '',
        role: response.data.role as UserRole,
        status: response.data.status as UserStatus,
        userType: response.data.userType,
        organizationId: response.data.organizationId,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
        lastAccess: response.data.lastAccess
      };
    } catch (error) {
      console.error(`❌ Erro ao buscar membro ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cria um novo membro na equipe
   */
  createTeamMember: async (data: TeamMemberRequest): Promise<TeamMember> => {
    try {
      console.log('📝 Criando novo membro na equipe:', data);
      
      const currentUser = getCurrentUser();
      const organizationId = currentUser.organizationId || 1;
      
      console.log('👤 Usuário logado:', currentUser.name);
      console.log('🏢 Organization ID:', organizationId);
      console.log('📋 Role sendo enviada:', data.role);
      
      // Validar role
      if (!data.role) {
        throw new Error('Função (role) é obrigatória');
      }
      
      // Preparar os dados
      const userData = {
        name: data.name,
        email: data.email,
        cpf: data.cpf.replace(/\D/g, ''),
        phone: data.phone || '',
        password: data.password,
        role: data.role, // Garantir que role está presente
        userType: 'CLIENT',
        status: 'ACTIVE',
        organizationId: organizationId
      };
      
      console.log('📤 Enviando dados:', userData);
      
      const response = await api.post('/api/users/clients', userData);
      console.log('✅ Resposta do servidor:', response.data);
      
      return {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        cpf: response.data.cpf,
        phone: response.data.phone || '',
        role: response.data.role as UserRole,
        status: response.data.status as UserStatus,
        userType: response.data.userType,
        organizationId: response.data.organizationId,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
        lastAccess: response.data.lastAccess
      };
    } catch (error: any) {
      console.error('❌ Erro ao criar membro:', error);
      if (error.response?.data) {
        throw new Error(error.response.data);
      }
      throw error;
    }
  },

  /**
   * Atualiza um membro da equipe
   */
  updateTeamMember: async (id: number, data: Partial<TeamMemberRequest>): Promise<TeamMember> => {
    try {
      console.log(`✏️ Atualizando membro ${id}:`, data);
      
      const userData: any = {};
      if (data.name) userData.name = data.name;
      if (data.email) userData.email = data.email;
      if (data.phone) userData.phone = data.phone;
      if (data.role) userData.role = data.role;
      
      const response = await api.put(`/api/users/${id}`, userData);
      console.log('✅ Membro atualizado:', response.data);
      
      return {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        cpf: response.data.cpf,
        phone: response.data.phone || '',
        role: response.data.role as UserRole,
        status: response.data.status as UserStatus,
        userType: response.data.userType,
        organizationId: response.data.organizationId,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
        lastAccess: response.data.lastAccess
      };
    } catch (error) {
      console.error(`❌ Erro ao atualizar membro ${id}:`, error);
      throw error;
    }
  },

  /**
   * Altera status do membro
   */
  updateMemberStatus: async (id: number, status: string): Promise<TeamMember> => {
    try {
      console.log(`🔄 Alterando status do membro ${id} para ${status}`);
      
      const response = await api.put(`/api/users/${id}`, { status });
      console.log('✅ Status alterado com sucesso');
      
      return {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        cpf: response.data.cpf,
        phone: response.data.phone || '',
        role: response.data.role as UserRole,
        status: response.data.status as UserStatus,
        userType: response.data.userType,
        organizationId: response.data.organizationId,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
        lastAccess: response.data.lastAccess
      };
    } catch (error) {
      console.error(`❌ Erro ao alterar status do membro ${id}:`, error);
      throw error;
    }
  },

  /**
   * Remove um membro da equipe
   */
  deleteTeamMember: async (id: number): Promise<void> => {
    try {
      console.log(`🗑️ Removendo membro ${id}`);
      await api.delete(`/api/users/${id}`);
      console.log(`✅ Membro ${id} removido`);
    } catch (error) {
      console.error(`❌ Erro ao remover membro ${id}:`, error);
      throw error;
    }
  },

  /**
   * Busca estatísticas da equipe
   */
  getTeamStats: async (): Promise<TeamStats> => {
    try {
      console.log('📊 Buscando estatísticas da equipe...');
      const members = await teamService.getTeamMembers();
      
      const totalMembers = members.length;
      const activeMembers = members.filter(m => m.status === 'ACTIVE').length;
      const inactiveMembers = members.filter(m => m.status !== 'ACTIVE').length;
      
      const byRole: any = {};
      members.forEach(member => {
        byRole[member.role] = (byRole[member.role] || 0) + 1;
      });
      
      const stats = {
        totalMembers,
        activeMembers,
        inactiveMembers,
        byRole
      };
      
      console.log('✅ Estatísticas calculadas:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      throw error;
    }
  },

  /**
   * Convida um novo membro por email
   */
  inviteTeamMember: async (data: InviteMemberRequest): Promise<void> => {
    try {
      console.log('📧 Enviando convite para:', data.email);
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Convite enviado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao enviar convite:', error);
      throw error;
    }
  },

  formatCPF: (cpf: string): string => {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
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

  getRoleLabel: (role: string): string => {
    const labels: { [key: string]: string } = {
      'ADMIN': 'Administrador',
      'DIRECTOR': 'Diretor',
      'MANAGER': 'Gerente',
      'ANALYST': 'Analista',
      'CLIENT': 'Cliente'
    };
    return labels[role] || role;
  },

  getRoleColor: (role: string): string => {
    const colors: { [key: string]: string } = {
      'ADMIN': '#dc2626',
      'DIRECTOR': '#ea580c',
      'MANAGER': '#0284c7',
      'ANALYST': '#16a34a',
      'CLIENT': '#6b7280'
    };
    return colors[role] || '#6b7280';
  }
};