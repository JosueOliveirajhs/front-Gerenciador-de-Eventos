import { api } from './api';
import { 
  Organization, 
  CreateOrganizationDTO, 
  OrganizationSummary,
  OrganizationStats,
  User,
  Event,
  PlanType,
  OrgStatus
} from '../types/developer';

export const organizationService = {
  /**
   * ==================== ORGANIZATIONS ====================
   */

  /**
   * Lista todas as organizações
   */
  getAllOrganizations: async (
    filters?: { busca?: string; status?: OrgStatus; plan?: PlanType },
    page: number = 1,
    limit: number = 20
  ): Promise<{ organizations: Organization[]; total: number; pages: number }> => {
    try {
      console.log('🏢 Buscando organizações...');
      
      const params = new URLSearchParams();
      if (filters?.busca) params.append('busca', filters.busca);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.plan) params.append('plan', filters.plan);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      // CORRIGIDO: Adicionado /DEVELOPER/ no caminho
      const response = await api.get('/api/DEVELOPER/organizations', { params });
      
      if (response.data.content) {
        // Spring Pageable response
        return {
          organizations: response.data.content,
          total: response.data.totalElements,
          pages: response.data.totalPages
        };
      }
      
      // Array direto
      return {
        organizations: Array.isArray(response.data) ? response.data : [],
        total: Array.isArray(response.data) ? response.data.length : 0,
        pages: 1
      };
      
    } catch (error) {
      console.error('❌ Erro ao buscar organizações:', error);
      throw error;
    }
  },

  /**
   * Busca organização por ID
   */
  getOrganizationById: async (id: number): Promise<Organization> => {
    try {
      console.log(`🏢 Buscando organização ${id}...`);
      // CORRIGIDO: Adicionado /DEVELOPER/ no caminho
      const response = await api.get(`/api/DEVELOPER/organizations/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao buscar organização ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cria nova organização
   */
  createOrganization: async (data: CreateOrganizationDTO): Promise<Organization> => {
    try {
      console.log('📝 Criando organização:', data);
      
      // Validações
      if (!data.name) throw new Error('Nome é obrigatório');
      if (!data.planType) throw new Error('Plano é obrigatório');
      if (!data.status) throw new Error('Status é obrigatório');
      
      // CORRIGIDO: Adicionado /DEVELOPER/ no caminho
      const response = await api.post('/api/DEVELOPER/organizations', data);
      console.log('✅ Organização criada:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao criar organização:', error);
      throw error;
    }
  },

  /**
   * Atualiza organização
   */
  updateOrganization: async (id: number, data: Partial<CreateOrganizationDTO>): Promise<Organization> => {
    try {
      console.log(`✏️ Atualizando organização ${id}:`, data);
      // CORRIGIDO: Adicionado /DEVELOPER/ no caminho
      const response = await api.put(`/api/DEVELOPER/organizations/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao atualizar organização ${id}:`, error);
      throw error;
    }
  },

  /**
   * Altera status da organização
   */
  updateOrganizationStatus: async (id: number, status: OrgStatus, motivo?: string): Promise<Organization> => {
    try {
      console.log(`🔄 Alterando status da organização ${id} para ${status}...`);
      // CORRIGIDO: Adicionado /DEVELOPER/ no caminho
      const response = await api.patch(`/api/DEVELOPER/organizations/${id}/status`, { status, motivo });
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao alterar status da organização ${id}:`, error);
      throw error;
    }
  },

  /**
   * Altera plano da organização
   */
  updateOrganizationPlan: async (id: number, planType: PlanType): Promise<Organization> => {
    try {
      console.log(`🔄 Alterando plano da organização ${id} para ${planType}...`);
      // CORRIGIDO: Adicionado /DEVELOPER/ no caminho
      const response = await api.patch(`/api/DEVELOPER/organizations/${id}/plan`, { planType });
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao alterar plano da organização ${id}:`, error);
      throw error;
    }
  },

  /**
   * Deleta organização
   */
  deleteOrganization: async (id: number): Promise<void> => {
    try {
      console.log(`🗑️ Deletando organização ${id}...`);
      // CORRIGIDO: Adicionado /DEVELOPER/ no caminho
      await api.delete(`/api/DEVELOPER/organizations/${id}`);
      console.log(`✅ Organização ${id} deletada com sucesso`);
    } catch (error) {
      console.error(`❌ Erro ao deletar organização ${id}:`, error);
      throw error;
    }
  },

  /**
   * ==================== RESUMO ====================
   */

  /**
   * Busca resumo da organização
   */
  getOrganizationSummary: async (id: number): Promise<OrganizationSummary> => {
    try {
      // CORRIGIDO: Adicionado /DEVELOPER/ no caminho
      const response = await api.get(`/api/DEVELOPER/organizations/${id}/summary`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao buscar resumo da organização ${id}:`, error);
      throw error;
    }
  },

  /**
   * Busca estatísticas gerais
   */
  getOrganizationStats: async (): Promise<OrganizationStats> => {
    try {
      // CORRIGIDO: Adicionado /DEVELOPER/ no caminho
      const response = await api.get('/api/DEVELOPER/organizations/stats');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      throw error;
    }
  },

  /**
   * ==================== USUÁRIOS ====================
   */

  /**
   * Lista usuários da organização
   */
  getOrganizationUsers: async (id: number): Promise<User[]> => {
    try {
      // CORRIGIDO: Adicionado /DEVELOPER/ no caminho
      const response = await api.get(`/api/DEVELOPER/organizations/${id}/users`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao buscar usuários da organização ${id}:`, error);
      throw error;
    }
  },

  /**
   * ==================== EVENTOS ====================
   */

  /**
   * Lista eventos da organização
   */
  getOrganizationEvents: async (id: number): Promise<Event[]> => {
    try {
      // CORRIGIDO: Adicionado /DEVELOPER/ no caminho
      const response = await api.get(`/api/DEVELOPER/organizations/${id}/events`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao buscar eventos da organização ${id}:`, error);
      throw error;
    }
  },

  /**
   * ==================== UTILITÁRIOS ====================
   */

  /**
   * Formata CNPJ
   */
  formatCNPJ: (cnpj: string): string => {
    const cleaned = cnpj.replace(/\D/g, '');
    return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  },

  /**
   * Formata data
   */
  formatDate: (date: string): string => {
    return new Date(date).toLocaleDateString('pt-BR');
  },

  /**
   * Formata data e hora
   */
  formatDateTime: (date: string): string => {
    return new Date(date).toLocaleString('pt-BR');
  },

  /**
   * Formata valor monetário
   */
  formatCurrency: (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  /**
   * Calcula dias restantes
   */
  getDaysRemaining: (date: string): number => {
    const hoje = new Date();
    const target = new Date(date);
    const diff = target.getTime() - hoje.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  }
};