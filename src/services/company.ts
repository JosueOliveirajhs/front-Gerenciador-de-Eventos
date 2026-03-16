import { api } from './api';

// Modelo baseado no backend (Empresa.java)
export interface Company {
  id: number;
  nome: string;
  descricao?: string;
  categoria: 'Buffet' | 'Decoracao' | 'Fotografia' | 'Outros';
  avaliacao?: number;
  observacao?: string;
  localizacao?: string;
  telefone?: string;
  email?: string;
  verificado: boolean;
}

// DTO para criação/atualização (baseado em EmpresaDTO.Request)
export interface CreateCompanyDTO {
  nome: string;
  descricao?: string;
  categoria: 'Buffet' | 'Decoracao' | 'Fotografia' | 'Outros';
  localizacao?: string;
  telefone?: string;
  email?: string;
}

// DTO de resposta (baseado em EmpresaDTO.Response)
export interface CompanyResponse {
  id: number;
  nome: string;
  descricao?: string;
  categoria: string;
  avaliacao?: number;
  observacao?: string;
  localizacao?: string;
  telefone?: string;
  email?: string;
  verificado: boolean;
}

// Estatísticas adaptadas para o modelo de eventos
export interface CompanyStats {
  totalEmpresas: number;
  porCategoria: Record<string, number>;
  verificado: number;
  naoVerificado: number;
  mediaAvaliacoes: number;
}

export const companyService = {
  /**
   * Lista todas as empresas com filtros opcionais
   */
  getAllCompanies: async (busca?: string, categoria?: string): Promise<CompanyResponse[]> => {
    try {
      console.log('🏢 Buscando todas as empresas...');
      const params = new URLSearchParams();
      if (busca) params.append('busca', busca);
      if (categoria) params.append('categoria', categoria);
      
      const response = await api.get('/api/empresas', { params });
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
  getCompanyById: async (id: number): Promise<CompanyResponse> => {
    try {
      console.log(`🏢 Buscando empresa ${id}...`);
      const response = await api.get(`/api/empresas/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao buscar empresa ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cria nova empresa
   */
  createCompany: async (data: CreateCompanyDTO): Promise<CompanyResponse> => {
    try {
      console.log('📝 Criando empresa:', data);
      
      // Validações básicas
      if (!data.nome) throw new Error('Nome é obrigatório');
      if (!data.categoria) throw new Error('Categoria é obrigatória');
      
      const response = await api.post('/api/empresas', data);
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
  updateCompany: async (id: number, data: Partial<CreateCompanyDTO>): Promise<CompanyResponse> => {
    try {
      console.log(`✏️ Atualizando empresa ${id}:`, data);
      const response = await api.put(`/api/empresas/${id}`, data);
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
      await api.delete(`/api/empresas/${id}`);
      console.log(`✅ Empresa ${id} deletada com sucesso`);
    } catch (error: any) {
      console.error(`❌ Erro ao deletar empresa ${id}:`, error);
      throw error;
    }
  },

  /**
   * Salva anotação/observação da empresa
   */
  saveAnnotation: async (id: number, texto: string): Promise<CompanyResponse> => {
    try {
      console.log(`📝 Salvando anotação para empresa ${id}...`);
      const response = await api.patch(`/api/empresas/${id}/anotacao`, texto, {
        headers: {
          'Content-Type': 'text/plain'
        }
      });
      console.log('✅ Anotação salva com sucesso');
      return response.data;
    } catch (error: any) {
      console.error(`❌ Erro ao salvar anotação:`, error);
      throw error;
    }
  },

  /**
   * Busca empresas por categoria
   */
  getCompaniesByCategory: async (categoria: string): Promise<CompanyResponse[]> => {
    try {
      return await companyService.getAllCompanies(undefined, categoria);
    } catch (error) {
      console.error('❌ Erro ao buscar empresas por categoria:', error);
      return [];
    }
  },

  /**
   * Busca empresas por nome (search)
   */
  searchCompanies: async (termo: string): Promise<CompanyResponse[]> => {
    try {
      return await companyService.getAllCompanies(termo);
    } catch (error) {
      console.error('❌ Erro ao buscar empresas por nome:', error);
      return [];
    }
  },

  /**
   * Busca empresas verificadas
   */
  getVerifiedCompanies: async (): Promise<CompanyResponse[]> => {
    try {
      const companies = await companyService.getAllCompanies();
      return companies.filter(company => company.verificado);
    } catch (error) {
      console.error('❌ Erro ao buscar empresas verificadas:', error);
      return [];
    }
  },

  /**
   * Busca estatísticas das empresas
   */
  getCompanyStats: async (): Promise<CompanyStats> => {
    try {
      const companies = await companyService.getAllCompanies();
      
      // Contagem por categoria
      const porCategoria = companies.reduce((acc, company) => {
        acc[company.categoria] = (acc[company.categoria] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Média das avaliações
      const avaliacoes = companies
        .filter(c => c.avaliacao !== undefined && c.avaliacao !== null)
        .map(c => c.avaliacao as number);
      
      const mediaAvaliacoes = avaliacoes.length > 0
        ? avaliacoes.reduce((a, b) => a + b, 0) / avaliacoes.length
        : 0;

      return {
        totalEmpresas: companies.length,
        porCategoria,
        verificado: companies.filter(c => c.verificado).length,
        naoVerificado: companies.filter(c => !c.verificado).length,
        mediaAvaliacoes: Number(mediaAvaliacoes.toFixed(1))
      };
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      return {
        totalEmpresas: 0,
        porCategoria: {},
        verificado: 0,
        naoVerificado: 0,
        mediaAvaliacoes: 0
      };
    }
  },

  /**
   * Valida email
   */
  validateEmail: (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Valida telefone (formato brasileiro)
   */
  validatePhone: (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  },

  /**
   * Formata telefone
   */
  formatPhone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }
    return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  },

  /**
   * Categorias disponíveis
   */
  getCategorias: (): Array<{ value: string; label: string }> => {
    return [
      { value: 'Buffet', label: 'Buffet' },
      { value: 'Decoracao', label: 'Decoração' },
      { value: 'Fotografia', label: 'Fotografia' },
      { value: 'Outros', label: 'Outros' }
    ];
  },

  /**
   * Conta empresas por categoria
   */
  countByCategory: async (): Promise<Record<string, number>> => {
    try {
      const companies = await companyService.getAllCompanies();
      return companies.reduce((acc, company) => {
        acc[company.categoria] = (acc[company.categoria] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      console.error('❌ Erro ao contar empresas por categoria:', error);
      return {};
    }
  },

  /**
   * Busca empresas com avaliação acima de X
   */
  getCompaniesWithRatingAbove: async (minRating: number): Promise<CompanyResponse[]> => {
    try {
      const companies = await companyService.getAllCompanies();
      return companies.filter(company => 
        company.avaliacao !== undefined && company.avaliacao >= minRating
      );
    } catch (error) {
      console.error('❌ Erro ao buscar empresas por avaliação:', error);
      return [];
    }
  },

  /**
   * Busca empresas com anotações
   */
  getCompaniesWithNotes: async (): Promise<CompanyResponse[]> => {
    try {
      const companies = await companyService.getAllCompanies();
      return companies.filter(company => 
        company.observacao && company.observacao.trim().length > 0
      );
    } catch (error) {
      console.error('❌ Erro ao buscar empresas com anotações:', error);
      return [];
    }
  }
};