// src/services/items.ts
import { api } from './api';

export interface Item {
  id: number;
  name: string;
  description?: string;
  category: CategoriaFrontend;
  quantityTotal: number;
  quantityAvailable: number;
  minStock: number;
  unitPrice: number;
  reservations?: number;
  status?: string;
}

export type CategoriaFrontend = 
  | 'FURNITURE'
  | 'DECORATION'
  | 'UTENSIL'
  | 'EQUIPMENT'
  | 'LIGHTING'
  | 'AUDIO_VIDEO'
  | 'CLIMATE'
  | 'SECURITY'
  | 'RECREATION'
  | 'GASTRONOMY'
  | 'FLORAL'
  | 'FABRICS'
  | 'SIGNAGE'
  | 'TOYS'
  | 'STRUCTURES'
  | 'TRANSPORT'
  | 'OTHER';

export interface CreateItemDTO {
  name: string;
  description?: string;
  category: CategoriaFrontend;
  quantityTotal: number;
  minStock: number;
  unitPrice: number;
}

const categoryToBackend: Record<CategoriaFrontend, string> = {
  'FURNITURE': 'Mobiliario',
  'DECORATION': 'Decoracao',
  'UTENSIL': 'Utensilios',
  'EQUIPMENT': 'Equipamentos',
  'LIGHTING': 'Iluminacao',
  'AUDIO_VIDEO': 'AudioVideo',
  'CLIMATE': 'Climatizacao',
  'SECURITY': 'Seguranca',
  'RECREATION': 'Recreacao',
  'GASTRONOMY': 'Gastronomia',
  'FLORAL': 'Floral',
  'FABRICS': 'Tecidos',
  'SIGNAGE': 'Sinalizacao',
  'TOYS': 'Brinquedos',
  'STRUCTURES': 'Estruturas',
  'TRANSPORT': 'Transporte',
  'OTHER': 'Outros'
};

const categoryToFrontend: Record<string, CategoriaFrontend> = {
  'Mobiliario': 'FURNITURE',
  'Decoracao': 'DECORATION',
  'Utensilios': 'UTENSIL',
  'Equipamentos': 'EQUIPMENT',
  'Iluminacao': 'LIGHTING',
  'AudioVideo': 'AUDIO_VIDEO',
  'Climatizacao': 'CLIMATE',
  'Seguranca': 'SECURITY',
  'Recreacao': 'RECREATION',
  'Gastronomia': 'GASTRONOMY',
  'Floral': 'FLORAL',
  'Tecidos': 'FABRICS',
  'Sinalizacao': 'SIGNAGE',
  'Brinquedos': 'TOYS',
  'Estruturas': 'STRUCTURES',
  'Transporte': 'TRANSPORT',
  'Outros': 'OTHER'
};

export const itemService = {
  getAllItems: async (): Promise<Item[]> => {
    try {
      console.log('Buscando todos os itens...');
      const response = await api.get('/api/itens');
      console.log('Itens carregados:', response.data.length);
      
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
      console.error('Erro ao buscar itens:', error);
      throw error;
    }
  },

  getItemById: async (id: number): Promise<Item> => {
    try {
      console.log(`Buscando item ${id}...`);
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
      console.error(`Erro ao buscar item ${id}:`, error);
      throw error;
    }
  },

  createItem: async (itemData: CreateItemDTO): Promise<Item> => {
    try {
      console.log('Dados recebidos no createItem:', JSON.stringify(itemData, null, 2));

      if (!itemData.name?.trim()) {
        throw new Error('Nome do item e obrigatorio');
      }

      if (!itemData.category) {
        throw new Error('Categoria e obrigatoria');
      }

      const total = Number(itemData.quantityTotal);
      const estoqueMinimo = Number(itemData.minStock);
      const preco = Number(itemData.unitPrice);

      if (isNaN(total)) {
        throw new Error('Quantidade total deve ser um numero valido');
      }
      if (isNaN(estoqueMinimo)) {
        throw new Error('Estoque minimo deve ser um numero valido');
      }
      if (isNaN(preco)) {
        throw new Error('Preco deve ser um numero valido');
      }

      const categoriaBackend = categoryToBackend[itemData.category];
      
      if (!categoriaBackend) {
        throw new Error(`Categoria invalida: ${itemData.category}`);
      }

      const payload = {
        nome: itemData.name.trim(),
        descricao: itemData.description?.trim() || null,
        categoria: categoriaBackend,
        total: total,
        estoqueMinimo: estoqueMinimo,
        preco: preco
      };

      console.log('Enviando payload para o backend:', JSON.stringify(payload, null, 2));
      
      const response = await api.post('/api/itens', payload);
      
      console.log('Resposta do backend:', response.data);
      
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
      console.error('Erro detalhado ao criar item:');
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Dados da resposta de erro:', error.response.data);

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
        throw new Error('Servidor nao respondeu. Verifique sua conexao.');
      } else {
        console.error('Erro na configuracao:', error.message);
        throw error;
      }
    }
  },

  updateItem: async (id: number, itemData: Partial<CreateItemDTO>): Promise<Item> => {
    try {
      const currentResponse = await api.get(`/api/itens/${id}`);
      const currentItem = currentResponse.data;
      
      const payload: any = {
        nome: itemData.name?.trim() || currentItem.nome,
        descricao: itemData.description?.trim() || currentItem.descricao,
        categoria: itemData.category ? categoryToBackend[itemData.category] : currentItem.categoria,
        total: itemData.quantityTotal !== undefined ? Number(itemData.quantityTotal) : currentItem.total,
        estoqueMinimo: itemData.minStock !== undefined ? Number(itemData.minStock) : currentItem.estoqueMinimo,
        preco: itemData.unitPrice !== undefined ? Number(itemData.unitPrice) : currentItem.preco
      };

      console.log(`Atualizando item ${id}:`, payload);
      
      const response = await api.put(`/api/itens/${id}`, payload);
      
      console.log(`Item ${id} atualizado com sucesso`);
      
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
      console.error(`Erro ao atualizar item ${id}:`, error);
      
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

  deleteItem: async (id: number): Promise<void> => {
    try {
      console.log(`Deletando item ${id}...`);
      await api.delete(`/api/itens/${id}`);
      console.log(`Item ${id} deletado com sucesso`);
    } catch (error: any) {
      console.error(`Erro ao deletar item ${id}:`, error);
      
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

export namespace Item {
  export type categorias = 'Mobiliario' | 'Decoracao' | 'Utensilios' | 'Equipamentos' | 'Iluminacao' | 'AudioVideo' | 'Climatizacao' | 'Seguranca' | 'Recreacao' | 'Gastronomia' | 'Floral' | 'Tecidos' | 'Sinalizacao' | 'Brinquedos' | 'Estruturas' | 'Transporte' | 'Outros';
}

export type { Item };