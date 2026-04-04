import { api } from './api';
import { 
  EmpresaResponse, 
  CreateEmpresaDTO, 
  CatalogoStats,
  CatalogoFilters,
  CategoriaEmpresa
} from '../types/developer';

export const catalogoService = {
  /**
   * Lista todas as empresas do catálogo
   */
  getAllEmpresas: async (filters?: CatalogoFilters): Promise<EmpresaResponse[]> => {
    try {
      console.log('🏢 Buscando empresas do catálogo...');
      
      const params = new URLSearchParams();
      if (filters?.busca) params.append('busca', filters.busca);
      if (filters?.categoria) params.append('categoria', filters.categoria);
      if (filters?.verificado !== undefined) params.append('verificado', filters.verificado.toString());
      if (filters?.avaliacaoMin) params.append('avaliacaoMin', filters.avaliacaoMin.toString());
      
      const response = await api.get('/api/empresas', { params });
      return Array.isArray(response.data) ? response.data : [];
      
    } catch (error) {
      console.error('❌ Erro ao buscar empresas do catálogo:', error);
      throw error;
    }
  },

  /**
   * Busca empresa por ID
   */
  getEmpresaById: async (id: number): Promise<EmpresaResponse> => {
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
   * Cria nova empresa no catálogo
   */
  createEmpresa: async (data: CreateEmpresaDTO): Promise<EmpresaResponse> => {
    try {
      console.log('📝 Criando empresa no catálogo:', data);
      
      if (!data.nome) throw new Error('Nome é obrigatório');
      if (!data.categoria) throw new Error('Categoria é obrigatória');
      
      const response = await api.post('/api/empresas', data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao criar empresa:', error);
      throw error;
    }
  },

  /**
   * Atualiza empresa no catálogo
   */
  updateEmpresa: async (id: number, data: Partial<CreateEmpresaDTO>): Promise<EmpresaResponse> => {
    try {
      console.log(`✏️ Atualizando empresa ${id}:`, data);
      const response = await api.put(`/api/empresas/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao atualizar empresa ${id}:`, error);
      throw error;
    }
  },

  /**
   * Deleta empresa do catálogo
   */
  deleteEmpresa: async (id: number): Promise<void> => {
    try {
      console.log(`🗑️ Deletando empresa ${id}...`);
      await api.delete(`/api/empresas/${id}`);
    } catch (error) {
      console.error(`❌ Erro ao deletar empresa ${id}:`, error);
      throw error;
    }
  },

  /**
   * Salva anotação
   */
  saveAnnotation: async (id: number, texto: string): Promise<EmpresaResponse> => {
    try {
      console.log(`📝 Salvando anotação para empresa ${id}...`);
      const response = await api.patch(`/api/empresas/${id}/anotacao`, texto, {
        headers: { 'Content-Type': 'text/plain' }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao salvar anotação:', error);
      throw error;
    }
  },

  /**
   * Busca estatísticas do catálogo
   */
  getCatalogoStats: async (): Promise<CatalogoStats> => {
    try {
      const empresas = await catalogoService.getAllEmpresas();
      
      const porCategoria = empresas.reduce((acc, empresa) => {
        acc[empresa.categoria] = (acc[empresa.categoria] || 0) + 1;
        return acc;
      }, {} as Record<CategoriaEmpresa, number>);
      
      const avaliacoes = empresas
        .filter(e => e.avaliacao !== undefined)
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
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Valida telefone
   */
  validatePhone: (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
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
   * Calcula array de estrelas
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
  }
};