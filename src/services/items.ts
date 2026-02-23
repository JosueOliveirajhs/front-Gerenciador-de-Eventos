import { api } from './api';
import { Item } from '../types/Item';

const mapCategoryToBackend = (frontCategory: string): string => {
  switch (frontCategory) {
    case 'DECORATION': return 'Decoracao';
    case 'FURNITURE': return 'Mobiliario';
    case 'UTENSIL': return 'Utensilios';
    case 'OTHER': return 'Outros';
    default: return 'Outros';
  }
};

const mapCategoryToFrontend = (backCategory: string): "DECORATION" | "FURNITURE" | "UTENSIL" | "OTHER" => {
  if (!backCategory) return 'OTHER';
  const upperCategory = backCategory.toUpperCase();
  if (upperCategory === 'DECORACAO') return 'DECORATION';
  if (upperCategory === 'MOBILIARIO') return 'FURNITURE';
  if (upperCategory === 'UTENSILIOS') return 'UTENSIL';
  return 'OTHER';
};

// CORREÇÃO: Lendo 'total', 'disponivel' e 'preco' do Java
const mapItemToFrontend = (data: any): Item => ({
  id: data.id,
  name: data.nome,
  category: mapCategoryToFrontend(data.categoria),
  quantityTotal: data.total || 0, // Ajustado para ler 'total'
  quantityAvailable: data.disponivel !== undefined ? data.disponivel : data.total, // Ajustado para ler 'disponivel'
  description: data.descricao,
  minStock: data.estoqueMinimo || 0,
  unitPrice: data.preco || 0 // Ajustado para ler 'preco'
});

// CORREÇÃO: Enviando 'total', 'disponivel' e 'preco' para o Java
const mapItemToBackend = (itemData: Partial<Item>): any => ({
  nome: itemData.name,
  categoria: itemData.category ? mapCategoryToBackend(itemData.category) : undefined,
  total: itemData.quantityTotal, // Ajustado para enviar 'total'
  disponivel: itemData.quantityTotal, // Garante que um item novo começa totalmente disponível
  descricao: itemData.description,
  estoqueMinimo: itemData.minStock,
  preco: itemData.unitPrice // Ajustado para enviar 'preco'
});

export const itemService = {
  getAllItems: async (): Promise<Item[]> => {
    try {
      const response = await api.get('/api/itens');
      return response.data.map(mapItemToFrontend);
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      throw error;
    }
  },

  getItemById: async (id: number): Promise<Item> => {
    try {
      const response = await api.get(`/api/itens/${id}`);
      return mapItemToFrontend(response.data);
    } catch (error) {
      console.error(`Erro ao buscar item ${id}:`, error);
      throw error;
    }
  },

  createItem: async (itemData: Omit<Item, 'id'>): Promise<Item> => {
    try {
      const payload = mapItemToBackend(itemData);
      const response = await api.post('/api/itens', payload);
      return mapItemToFrontend(response.data);
    } catch (error) {
      console.error('Erro ao criar item:', error);
      throw error;
    }
  },

  updateItem: async (id: number, itemData: Partial<Item>): Promise<Item> => {
    try {
      const payload = mapItemToBackend(itemData);
      const response = await api.put(`/api/itens/${id}`, payload);
      return mapItemToFrontend(response.data);
    } catch (error) {
      console.error(`Erro ao atualizar item ${id}:`, error);
      throw error;
    }
  },

  deleteItem: async (id: number): Promise<void> => {
    try {
      await api.delete(`/api/itens/${id}`);
    } catch (error) {
      console.error(`Erro ao deletar item ${id}:`, error);
      throw error;
    }
  }
};

export type { Item };