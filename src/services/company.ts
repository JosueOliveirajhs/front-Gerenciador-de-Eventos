import { api } from './api';

export interface Company {
  id: number;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  plano: 'BASIC' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  dataCadastro: string;
  dataVencimento: string;
  logo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCompanyDTO {
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  plano: 'BASIC' | 'PRO' | 'ENTERPRISE';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  dataVencimento: string;
  logo?: string;
}

export interface CompanyStats {
  totalUsers: number;
  totalEvents: number;
  totalRevenue: number;
  activeEvents: number;
  completedEvents: number;
  monthlyGrowth: number;
  lastMonthRevenue: number;
}

export const companyService = {
  /**
   * Lista todas as empresas
   */
  getAllCompanies: async (): Promise<Company[]> => {
    try {
      console.log('🏢 Buscando todas as empresas...');
      const response = await api.get('/api/companies');
      console.log('✅ Empresas carregadas:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar empresas:', error);
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  /**
   * Busca empresa por ID
   */
  getCompanyById: async (id: number): Promise<Company> => {
    try {
      console.log(`🏢 Buscando empresa ${id}...`);
      const response = await api.get(`/api/companies/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao buscar empresa ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cria nova empresa
   */
  createCompany: async (data: CreateCompanyDTO): Promise<Company> => {
    try {
      console.log('📝 Criando empresa:', data);
      
      // Validações básicas
      if (!data.nome) throw new Error('Nome é obrigatório');
      if (!data.cnpj) throw new Error('CNPJ é obrigatório');
      if (!data.email) throw new Error('Email é obrigatório');
      
      const response = await api.post('/api/companies', data);
      console.log('✅ Empresa criada:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar empresa:', error);
      if (error.response) {
        console.error('📋 Detalhes do erro:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },

  /**
   * Atualiza empresa
   */
  updateCompany: async (id: number, data: Partial<CreateCompanyDTO>): Promise<Company> => {
    try {
      console.log(`✏️ Atualizando empresa ${id}:`, data);
      const response = await api.put(`/api/companies/${id}`, data);
      console.log('✅ Empresa atualizada:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Erro ao atualizar empresa ${id}:`, error);
      throw error;
    }
  },

  /**
   * Deleta empresa
   */
  deleteCompany: async (id: number): Promise<void> => {
    try {
      console.log(`🗑️ Deletando empresa ${id}...`);
      await api.delete(`/api/companies/${id}`);
      console.log(`✅ Empresa ${id} deletada com sucesso`);
    } catch (error: any) {
      console.error(`❌ Erro ao deletar empresa ${id}:`, error);
      throw error;
    }
  },

  /**
   * Altera status da empresa
   */
  toggleCompanyStatus: async (id: number, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'): Promise<Company> => {
    try {
      console.log(`🔄 Alterando status da empresa ${id} para:`, status);
      const response = await api.patch(`/api/companies/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      console.error(`❌ Erro ao alterar status da empresa ${id}:`, error);
      throw error;
    }
  },

  /**
   * Busca estatísticas da empresa
   */
  getCompanyStats: async (id: number): Promise<CompanyStats> => {
    try {
      console.log(`📊 Buscando estatísticas da empresa ${id}...`);
      const response = await api.get(`/api/companies/${id}/stats`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Erro ao buscar estatísticas da empresa ${id}:`, error);
      if (error.response?.status === 404) {
        return {
          totalUsers: 0,
          totalEvents: 0,
          totalRevenue: 0,
          activeEvents: 0,
          completedEvents: 0,
          monthlyGrowth: 0,
          lastMonthRevenue: 0
        };
      }
      throw error;
    }
  },

  /**
   * Busca empresas ativas
   */
  getActiveCompanies: async (): Promise<Company[]> => {
    try {
      const allCompanies = await companyService.getAllCompanies();
      return allCompanies.filter(company => company.status === 'ACTIVE');
    } catch (error) {
      console.error('❌ Erro ao buscar empresas ativas:', error);
      return [];
    }
  },

  /**
   * Busca empresas por plano
   */
  getCompaniesByPlan: async (plan: 'BASIC' | 'PRO' | 'ENTERPRISE'): Promise<Company[]> => {
    try {
      const allCompanies = await companyService.getAllCompanies();
      return allCompanies.filter(company => company.plano === plan);
    } catch (error) {
      console.error(`❌ Erro ao buscar empresas do plano ${plan}:`, error);
      return [];
    }
  },

  /**
   * Busca empresas com vencimento próximo
   */
  getCompaniesNearExpiration: async (days: number = 30): Promise<Company[]> => {
    try {
      const allCompanies = await companyService.getAllCompanies();
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);
      
      return allCompanies.filter(company => {
        const expDate = new Date(company.dataVencimento);
        return expDate >= today && expDate <= futureDate;
      });
    } catch (error) {
      console.error('❌ Erro ao buscar empresas próximas do vencimento:', error);
      return [];
    }
  },

  /**
   * Busca empresas por CNPJ
   */
  getCompanyByCNPJ: async (cnpj: string): Promise<Company | null> => {
    try {
      const allCompanies = await companyService.getAllCompanies();
      const company = allCompanies.find(c => c.cnpj === cnpj.replace(/\D/g, ''));
      return company || null;
    } catch (error) {
      console.error('❌ Erro ao buscar empresa por CNPJ:', error);
      return null;
    }
  },

  /**
   * Busca empresas por email
   */
  getCompanyByEmail: async (email: string): Promise<Company | null> => {
    try {
      const allCompanies = await companyService.getAllCompanies();
      const company = allCompanies.find(c => c.email.toLowerCase() === email.toLowerCase());
      return company || null;
    } catch (error) {
      console.error('❌ Erro ao buscar empresa por email:', error);
      return null;
    }
  },

  /**
   * Valida CNPJ
   */
  validateCNPJ: (cnpj: string): boolean => {
    const cnpjClean = cnpj.replace(/\D/g, '');
    
    if (cnpjClean.length !== 14) return false;
    
    // Elimina CNPJs inválidos conhecidos
    if (/^(\d)\1+$/.test(cnpjClean)) return false;
    
    // Validação do primeiro dígito verificador
    let size = cnpjClean.length - 2;
    let numbers = cnpjClean.substring(0, size);
    const digits = cnpjClean.substring(size);
    let sum = 0;
    let pos = size - 7;
    
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;
    
    // Validação do segundo dígito verificador
    size = size + 1;
    numbers = cnpjClean.substring(0, size);
    sum = 0;
    pos = size - 7;
    
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === parseInt(digits.charAt(1));
  },

  /**
   * Formata CNPJ
   */
  formatCNPJ: (cnpj: string): string => {
    const cleaned = cnpj.replace(/\D/g, '');
    return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  },

  /**
   * Conta empresas por status
   */
  countByStatus: async (): Promise<Record<string, number>> => {
    try {
      const companies = await companyService.getAllCompanies();
      return companies.reduce((acc, company) => {
        acc[company.status] = (acc[company.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      console.error('❌ Erro ao contar empresas por status:', error);
      return {};
    }
  },

  /**
   * Conta empresas por plano
   */
  countByPlan: async (): Promise<Record<string, number>> => {
    try {
      const companies = await companyService.getAllCompanies();
      return companies.reduce((acc, company) => {
        acc[company.plano] = (acc[company.plano] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      console.error('❌ Erro ao contar empresas por plano:', error);
      return {};
    }
  },

  /**
   * Busca empresas criadas em um período
   */
  getCompaniesByDateRange: async (startDate: string, endDate: string): Promise<Company[]> => {
    try {
      const allCompanies = await companyService.getAllCompanies();
      return allCompanies.filter(company => 
        company.dataCadastro >= startDate && company.dataCadastro <= endDate
      );
    } catch (error) {
      console.error('❌ Erro ao buscar empresas por período:', error);
      return [];
    }
  },

  /**
   * Busca estatísticas gerais das empresas
   */
  getGeneralStats: async (): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    byPlan: Record<string, number>;
    newThisMonth: number;
  }> => {
    try {
      const companies = await companyService.getAllCompanies();
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      return {
        total: companies.length,
        active: companies.filter(c => c.status === 'ACTIVE').length,
        inactive: companies.filter(c => c.status === 'INACTIVE').length,
        suspended: companies.filter(c => c.status === 'SUSPENDED').length,
        byPlan: companies.reduce((acc, c) => {
          acc[c.plano] = (acc[c.plano] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        newThisMonth: companies.filter(c => c.dataCadastro >= firstDayOfMonth).length
      };
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas gerais:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        suspended: 0,
        byPlan: {},
        newThisMonth: 0
      };
    }
  }
};