// src/services/items.ts
import { api } from './api';

export interface Item {
  id: number;
  name: string;
  description?: string;
  category: 'DECORATION' | 'FURNITURE' | 'UTENSIL' | 'OTHER';
  quantityTotal: number;
  quantityAvailable: number;
  minStock: number;
  unitPrice: number;
  reservations?: number;
  status?: string;
}

export interface CreateItemDTO {
  name: string;
  description?: string;
  category: 'DECORATION' | 'FURNITURE' | 'UTENSIL' | 'OTHER';
  quantityTotal: number;
  minStock: number;
  unitPrice: number;
}

// Mapeamento de categorias do frontend para backend (valores exatos do enum Java)
const categoryToBackend: Record<string, Item.categorias> = {
  'DECORATION': 'Decoracao',
  'FURNITURE': 'Mobiliario',
  'UTENSIL': 'Utensilios',
  'OTHER': 'Outros'
};

// Mapeamento de categorias do backend para frontend
const categoryToFrontend: Record<string, "DECORATION" | "FURNITURE" | "UTENSIL" | "OTHER"> = {
  'Decoracao': 'DECORATION',
  'Mobiliario': 'FURNITURE',
  'Utensilios': 'UTENSIL',
  'Outros': 'OTHER'
};

export const itemService = {
  /**
   * Busca todos os itens
   */
  getAllItems: async (): Promise<Item[]> => {
    try {
      console.log('📦 Buscando todos os itens...');
      const response = await api.get('/api/itens');
      console.log('✅ Itens carregados:', response.data.length);
      
      return response.data.map((item: any) => ({
        id: item.id,
        name: item.nome || '',
        description: item.descricao,
        category: categoryToFrontend[item.categoria] || 'OTHER',
        quantityTotal: item.total || 0,
        quantityAvailable: item.disponivel || 0,
        minStock: item.estoqueMinimo || 0,
        unitPrice: item.preco || 0,
        reservations: item.quantidadeReservas || 0,
        status: item.status
      }));
    } catch (error: any) {
      console.error('❌ Erro ao buscar itens:', error);
      throw error;
    }
  },

  /**
   * Busca item por ID
   */
  getItemById: async (id: number): Promise<Item> => {
    try {
      console.log(`📦 Buscando item ${id}...`);
      const response = await api.get(`/api/itens/${id}`);
      
      return {
        id: response.data.id,
        name: response.data.nome || '',
        description: response.data.descricao,
        category: categoryToFrontend[response.data.categoria] || 'OTHER',
        quantityTotal: response.data.total || 0,
        quantityAvailable: response.data.disponivel || 0,
        minStock: response.data.estoqueMinimo || 0,
        unitPrice: response.data.preco || 0,
        reservations: response.data.quantidadeReservas || 0,
        status: response.data.status
      };
    } catch (error: any) {
      console.error(`❌ Erro ao buscar item ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cria um novo item
   */
  createItem: async (itemData: CreateItemDTO): Promise<Item> => {
    try {
      // Log detalhado do que está chegando
      console.log('📥 Dados recebidos no createItem:', JSON.stringify(itemData, null, 2));

      // Validar dados obrigatórios
      if (!itemData.name?.trim()) {
        throw new Error('Nome do item é obrigatório');
      }

      if (!itemData.category) {
        throw new Error('Categoria é obrigatória');
      }

      // Converter valores para número e garantir que são números (não strings)
      const total = Number(itemData.quantityTotal);
      const estoqueMinimo = Number(itemData.minStock);
      const preco = Number(itemData.unitPrice);

      // Validar se as conversões foram bem-sucedidas
      if (isNaN(total)) {
        throw new Error('Quantidade total deve ser um número válido');
      }
      if (isNaN(estoqueMinimo)) {
        throw new Error('Estoque mínimo deve ser um número válido');
      }
      if (isNaN(preco)) {
        throw new Error('Preço deve ser um número válido');
      }

      // Obter o valor da categoria no formato que o backend espera (enum)
      const categoriaBackend = categoryToBackend[itemData.category];
      
      if (!categoriaBackend) {
        throw new Error(`Categoria inválida: ${itemData.category}`);
      }

      // Payload EXATO que o backend espera baseado no DTO
      const payload = {
        nome: itemData.name.trim(),
        descricao: itemData.description?.trim() || null,
        categoria: categoriaBackend, // Enviar como string, o Spring converte para enum automaticamente
        total: total, // number, não string
        estoqueMinimo: estoqueMinimo, // number, não string
        preco: preco // number, não string
      };

      console.log('📤 Enviando payload para o backend:', JSON.stringify(payload, null, 2));
      console.log('📤 Tipos dos dados:', {
        nome: typeof payload.nome,
        descricao: typeof payload.descricao,
        categoria: typeof payload.categoria,
        total: typeof payload.total,
        estoqueMinimo: typeof payload.estoqueMinimo,
        preco: typeof payload.preco
      });
      
      const response = await api.post('/api/itens', payload);
      
      console.log('✅ Resposta do backend:', response.data);
      
      // Mapear resposta para o formato do frontend
      return {
        id: response.data.id,
        name: response.data.nome,
        description: response.data.descricao,
        category: categoryToFrontend[response.data.categoria] || 'OTHER',
        quantityTotal: response.data.total,
        quantityAvailable: response.data.disponivel,
        minStock: response.data.estoqueMinimo,
        unitPrice: response.data.preco,
        reservations: response.data.quantidadeReservas,
        status: response.data.status
      };
      
    } catch (error: any) {
      console.error('❌ Erro detalhado ao criar item:');
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Dados da resposta de erro:', error.response.data);
        console.error('Headers:', error.response.headers);

        let errorMessage = 'Erro ao criar item';
        let errorDetails = '';
        
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
            errorDetails = error.response.data.details || '';
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          }
        }

        throw new Error(`${errorMessage}${errorDetails ? ' - ' + errorDetails : ''} (Status: ${error.response.status})`);
      } else if (error.request) {
        console.error('Sem resposta do servidor:', error.request);
        throw new Error('Servidor não respondeu. Verifique sua conexão.');
      } else {
        console.error('Erro na configuração:', error.message);
        throw error;
      }
    }
  },

  /**
   * Atualiza um item existente
   */
  updateItem: async (id: number, itemData: Partial<CreateItemDTO>): Promise<Item> => {
    try {
      // Buscar item atual para obter valores não alterados
      const currentResponse = await api.get(`/api/itens/${id}`);
      const currentItem = currentResponse.data;
      
      // Preparar payload com dados atualizados
      const payload: any = {
        nome: itemData.name?.trim() || currentItem.nome,
        descricao: itemData.description?.trim() || currentItem.descricao,
        categoria: itemData.category ? categoryToBackend[itemData.category] : currentItem.categoria,
        total: itemData.quantityTotal !== undefined ? Number(itemData.quantityTotal) : currentItem.total,
        estoqueMinimo: itemData.minStock !== undefined ? Number(itemData.minStock) : currentItem.estoqueMinimo,
        preco: itemData.unitPrice !== undefined ? Number(itemData.unitPrice) : currentItem.preco
      };

      console.log(`📤 Atualizando item ${id}:`, payload);
      
      const response = await api.put(`/api/itens/${id}`, payload);
      
      console.log(`✅ Item ${id} atualizado com sucesso`);
      
      return {
        id: response.data.id,
        name: response.data.nome,
        description: response.data.descricao,
        category: categoryToFrontend[response.data.categoria] || 'OTHER',
        quantityTotal: response.data.total,
        quantityAvailable: response.data.disponivel,
        minStock: response.data.estoqueMinimo,
        unitPrice: response.data.preco,
        reservations: response.data.quantidadeReservas,
        status: response.data.status
      };
      
    } catch (error: any) {
      console.error(`❌ Erro ao atualizar item ${id}:`, error);
      
      if (error.response) {
        let errorMessage = 'Erro ao atualizar item';
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
        throw new Error(`${errorMessage} (Status: ${error.response.status})`);
      }
      
      throw error;
    }
  },

  /**
   * Deleta um item
   */
  deleteItem: async (id: number): Promise<void> => {
    try {
      console.log(`🗑️ Deletando item ${id}...`);
      await api.delete(`/api/itens/${id}`);
      console.log(`✅ Item ${id} deletado com sucesso`);
    } catch (error: any) {
      console.error(`❌ Erro ao deletar item ${id}:`, error);
      
      if (error.response) {
        let errorMessage = 'Erro ao deletar item';
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
        throw new Error(`${errorMessage} (Status: ${error.response.status})`);
      }
      
      throw error;
    }
  }
};

// Para usar o enum do backend no TypeScript
export namespace Item {
  export type categorias = 'Mobiliario' | 'Decoracao' | 'Utensilios' | 'Outros';
}

export type { Item };