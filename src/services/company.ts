// src/services/companyService.ts
import { api } from './api';
import { 
  Company, 
  CreateCompanyDTO, 
  CompanyFilters,
  CompanyStats,
  EmpresaResponse,
  CategoriaEmpresa
} from '../types/developer';

export const companyService = {
  /**
   * ==================== LISTAGEM DE EMPRESAS ====================
   */

  /**
   * Lista todas as empresas (GET /api/empresas)
   */
  getAllCompanies: async (filters?: CompanyFilters): Promise<EmpresaResponse[]> => {
    try {
      console.log('🏢 Buscando empresas...');
      
      const params = new URLSearchParams();
      if (filters?.busca) params.append('busca', filters.busca);
      if (filters?.categoria) params.append('categoria', filters.categoria);
      
      const response = await api.get('/api/empresas', { params });
      
      console.log('📦 Resposta do backend:', response.data);
      
      // O backend retorna um array diretamente
      if (Array.isArray(response.data)) {
        console.log('✅ Empresas carregadas:', response.data.length);
        return response.data;
      }
      
      // Se não for array, tenta extrair de content (Spring Pageable)
      if (response.data.content && Array.isArray(response.data.content)) {
        console.log('✅ Empresas carregadas (paginadas):', response.data.content.length);
        return response.data.content;
      }
      
      console.warn('⚠️ Formato de resposta não reconhecido:', response.data);
      return [];
      
    } catch (error: any) {
      console.error('❌ Erro ao buscar empresas:', error);
      
      // REMOVIDO O FALLBACK PARA MOCK
      // Agora sempre lança o erro para ser tratado pelo componente
      throw error;
    }
  },

  /**
   * Busca empresa por ID (GET /api/empresas/{id})
   */
  getCompanyById: async (id: number): Promise<EmpresaResponse> => {
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
   * ==================== CRUD DE EMPRESAS ====================
   */

  /**
   * Cria nova empresa (POST /api/empresas)
   */
  createCompany: async (data: CreateCompanyDTO): Promise<EmpresaResponse> => {
    try {
      console.log('📝 Criando empresa:', data);
      
      // Validações básicas
      if (!data.nome?.trim()) throw new Error('Nome é obrigatório');
      if (!data.categoria) throw new Error('Categoria é obrigatória');
      
      // Valida email se fornecido
      if (data.email && !isValidEmail(data.email)) {
        throw new Error('Email inválido');
      }
      
      // Valida telefone se fornecido
      if (data.telefone && !isValidPhone(data.telefone)) {
        throw new Error('Telefone inválido');
      }
      
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
   * Atualiza empresa (PUT /api/empresas/{id})
   */
  updateCompany: async (id: number, data: Partial<CreateCompanyDTO>): Promise<EmpresaResponse> => {
    try {
      console.log(`✏️ Atualizando empresa ${id}:`, data);
      
      // Validações se fornecidos
      if (data.email && !isValidEmail(data.email)) {
        throw new Error('Email inválido');
      }
      
      if (data.telefone && !isValidPhone(data.telefone)) {
        throw new Error('Telefone inválido');
      }
      
      const response = await api.put(`/api/empresas/${id}`, data);
      console.log('✅ Empresa atualizada:', response.data);
      return response.data;
      
    } catch (error: any) {
      console.error(`❌ Erro ao atualizar empresa ${id}:`, error);
      throw error;
    }
  },

  /**
   * Deleta empresa (DELETE /api/empresas/{id})
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
   * Salva anotação/observação (PATCH /api/empresas/{id}/anotacao)
   */
  saveAnnotation: async (id: number, texto: string): Promise<EmpresaResponse> => {
    try {
      console.log(`📝 Salvando anotação para empresa ${id}...`);
      const response = await api.patch(`/api/empresas/${id}/anotacao`, texto, {
        headers: { 'Content-Type': 'text/plain' }
      });
      console.log('✅ Anotação salva com sucesso');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao salvar anotação:', error);
      throw error;
    }
  },

  /**
   * ==================== ESTATÍSTICAS ====================
   */

  /**
   * Calcula estatísticas das empresas
   */
  getCompanyStats: async (): Promise<CompanyStats> => {
    try {
      const empresas = await companyService.getAllCompanies();
      
      // Contagem por categoria
      const porCategoria = empresas.reduce((acc, empresa) => {
        acc[empresa.categoria] = (acc[empresa.categoria] || 0) + 1;
        return acc;
      }, {} as Record<CategoriaEmpresa, number>);
      
      // Inicializa categorias vazias com 0
      ['Buffet', 'Decoracao', 'Fotografia', 'Outros'].forEach(cat => {
        if (!porCategoria[cat as CategoriaEmpresa]) {
          porCategoria[cat as CategoriaEmpresa] = 0;
        }
      });
      
      // Média das avaliações
      const avaliacoes = empresas
        .filter(e => e.avaliacao !== undefined && e.avaliacao !== null)
        .map(e => e.avaliacao as number);
      
      const mediaAvaliacoes = avaliacoes.length > 0
        ? Number((avaliacoes.reduce((a, b) => a + b, 0) / avaliacoes.length).toFixed(1))
        : 0;
      
      return {
        total: empresas.length,
        porCategoria,
        verificadas: empresas.filter(e => e.verificado).length,
        naoVerificadas: empresas.filter(e => !e.verificado).length,
        mediaAvaliacoes
      };
      
    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      
      // Retorna stats vazios em caso de erro
      return {
        total: 0,
        porCategoria: { Buffet: 0, Decoracao: 0, Fotografia: 0, Outros: 0 },
        verificadas: 0,
        naoVerificadas: 0,
        mediaAvaliacoes: 0
      };
    }
  },

  /**
   * ==================== FILTROS E BUSCAS ====================
   */

  /**
   * Busca empresas por categoria
   */
  getCompaniesByCategory: async (categoria: CategoriaEmpresa): Promise<EmpresaResponse[]> => {
    try {
      return await companyService.getAllCompanies({ categoria });
    } catch (error) {
      console.error('❌ Erro ao buscar por categoria:', error);
      return [];
    }
  },

  /**
   * Busca empresas por nome
   */
  searchCompanies: async (termo: string): Promise<EmpresaResponse[]> => {
    try {
      return await companyService.getAllCompanies({ busca: termo });
    } catch (error) {
      console.error('❌ Erro ao buscar por nome:', error);
      return [];
    }
  },

  /**
   * Busca empresas verificadas
   */
  getVerifiedCompanies: async (): Promise<EmpresaResponse[]> => {
    try {
      const empresas = await companyService.getAllCompanies();
      return empresas.filter(e => e.verificado);
    } catch (error) {
      console.error('❌ Erro ao buscar empresas verificadas:', error);
      return [];
    }
  },

  /**
   * Busca empresas com avaliação acima de X
   */
  getCompaniesWithRatingAbove: async (minRating: number): Promise<EmpresaResponse[]> => {
    try {
      const empresas = await companyService.getAllCompanies();
      return empresas.filter(e => e.avaliacao !== undefined && e.avaliacao >= minRating);
    } catch (error) {
      console.error('❌ Erro ao buscar empresas por avaliação:', error);
      return [];
    }
  },

  /**
   * Busca empresas com anotações
   */
  getCompaniesWithNotes: async (): Promise<EmpresaResponse[]> => {
    try {
      const empresas = await companyService.getAllCompanies();
      return empresas.filter(e => e.observacao && e.observacao.trim().length > 0);
    } catch (error) {
      console.error('❌ Erro ao buscar empresas com anotações:', error);
      return [];
    }
  },

  /**
   * ==================== UTILITÁRIOS ====================
   */

  /**
   * Categorias disponíveis
   */
  getCategorias: (): Array<{ value: CategoriaEmpresa; label: string }> => {
    return [
      { value: 'Buffet', label: 'Buffet' },
      { value: 'Decoracao', label: 'Decoração' },
      { value: 'Fotografia', label: 'Fotografia' },
      { value: 'Outros', label: 'Outros' }
    ];
  },

  /**
   * Valida email
   */
  validateEmail: (email: string): boolean => {
    return isValidEmail(email);
  },

  /**
   * Valida telefone
   */
  validatePhone: (phone: string): boolean => {
    return isValidPhone(phone);
  },

  /**
   * Formata telefone
   */
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

  /**
   * Formata data
   */
  formatDate: (date: string | Date): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR');
  },

  /**
   * Calcula array de estrelas (1 = cheia, 0.5 = meia, 0 = vazia)
   */
  getStarRating: (avaliacao?: number): number[] => {
    if (!avaliacao || avaliacao < 0) return [0, 0, 0, 0, 0];
    
    const filled = Math.floor(avaliacao);
    const half = avaliacao % 1 >= 0.5 ? 1 : 0;
    
    return [
      ...Array(filled).fill(1),
      ...Array(half).fill(0.5),
      ...Array(5 - filled - half).fill(0)
    ];
  },

  /**
   * Retorna cor da categoria
   */
  getCategoriaColor: (categoria: CategoriaEmpresa): string => {
    const colors: Record<CategoriaEmpresa, string> = {
      Buffet: '#10b981',
      Decoracao: '#8b5cf6',
      Fotografia: '#3b82f6',
      Outros: '#6b7280'
    };
    return colors[categoria] || '#6b7280';
  },

  /**
   * Retorna ícone da categoria
   */
  getCategoriaIcon: (categoria: CategoriaEmpresa): string => {
    const icons: Record<CategoriaEmpresa, string> = {
      Buffet: '🍽️',
      Decoracao: '🎨',
      Fotografia: '📸',
      Outros: '📦'
    };
    return icons[categoria] || '🏢';
  },

  /**
   * Conta empresas por categoria
   */
  countByCategory: async (): Promise<Record<CategoriaEmpresa, number>> => {
    try {
      const stats = await companyService.getCompanyStats();
      return stats.porCategoria;
    } catch (error) {
      console.error('❌ Erro ao contar por categoria:', error);
      return { Buffet: 0, Decoracao: 0, Fotografia: 0, Outros: 0 };
    }
  }
};

/**
 * ==================== FUNÇÕES AUXILIARES ====================
 */

// Valida email
function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Valida telefone brasileiro
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
}

// TODOS OS DADOS MOCKADOS FORAM REMOVIDOS
// Agora o serviço sempre usa a API real