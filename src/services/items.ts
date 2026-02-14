import {api} from './api';
import { Item } from '../types/Item';

export const itemService = {
  // Buscar todos os itens
  getAllItems: async (): Promise<Item[]> => {
    try {
      const response = await api.get('/items');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      // Fallback para dados mockados em caso de erro
      return getMockItems();
    }
  },

  // Buscar item por ID
  getItemById: async (id: number): Promise<Item> => {
    try {
      const response = await api.get(`/items/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar item ${id}:`, error);
      throw error;
    }
  },

  // Criar novo item
  createItem: async (itemData: Omit<Item, 'id'>): Promise<Item> => {
    try {
      const response = await api.post('/items', itemData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar item:', error);
      throw error;
    }
  },

  // Atualizar item
  updateItem: async (id: number, itemData: Partial<Item>): Promise<Item> => {
    try {
      const response = await api.put(`/items/${id}`, itemData);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar item ${id}:`, error);
      throw error;
    }
  },

  // Deletar item
  deleteItem: async (id: number): Promise<void> => {
    try {
      await api.delete(`/items/${id}`);
    } catch (error) {
      console.error(`Erro ao deletar item ${id}:`, error);
      throw error;
    }
  },

  // Buscar itens por categoria
  getItemsByCategory: async (category: string): Promise<Item[]> => {
    try {
      const response = await api.get(`/items/category/${category}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar itens da categoria ${category}:`, error);
      throw error;
    }
  },

  // Verificar disponibilidade de item para uma data
  checkAvailability: async (itemId: number, date: string, quantity: number): Promise<boolean> => {
    try {
      const response = await api.get(`/items/${itemId}/availability`, {
        params: { date, quantity }
      });
      return response.data.available;
    } catch (error) {
      console.error(`Erro ao verificar disponibilidade do item ${itemId}:`, error);
      // Fallback: verificar localmente
      const item = await itemService.getItemById(itemId).catch(() => null);
      if (!item) return false;
      
      // Simular verificação de disponibilidade
      const reserved = await itemService.getReservedQuantity(itemId, date);
      return (item.quantityTotal - reserved) >= quantity;
    }
  },

  // Buscar quantidade reservada de um item para uma data
  getReservedQuantity: async (itemId: number, date: string): Promise<number> => {
    try {
      const response = await api.get(`/items/${itemId}/reservations`, {
        params: { date }
      });
      return response.data.totalReserved;
    } catch (error) {
      console.error(`Erro ao buscar reservas do item ${itemId}:`, error);
      // Fallback: retornar 0
      return 0;
    }
  },

  // Reservar item para um evento
  reserveItem: async (itemId: number, eventId: number, quantity: number): Promise<void> => {
    try {
      await api.post('/reservations', {
        itemId,
        eventId,
        quantity,
        status: 'RESERVED'
      });
    } catch (error) {
      console.error('Erro ao reservar item:', error);
      throw error;
    }
  },

  // Atualizar status de reserva
  updateReservationStatus: async (reservationId: number, status: 'RESERVED' | 'CONFIRMED' | 'RETURNED'): Promise<void> => {
    try {
      await api.patch(`/reservations/${reservationId}`, { status });
    } catch (error) {
      console.error(`Erro ao atualizar reserva ${reservationId}:`, error);
      throw error;
    }
  },

  // Buscar itens mais utilizados
  getTopItems: async (period?: { startDate: string; endDate: string }): Promise<any[]> => {
    try {
      const response = await api.get('/items/top-usage', { params: period });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar itens mais utilizados:', error);
      // Fallback: dados mockados
      return [
        { id: 1, name: 'Cadeira Tiffany', usageCount: 45, revenue: 4500 },
        { id: 2, name: 'Mesa de Madeira', usageCount: 32, revenue: 6400 },
        { id: 3, name: 'Toalha de Mesa', usageCount: 28, revenue: 1400 },
      ];
    }
  },

  // Buscar relatório de estoque
  getStockReport: async (): Promise<any> => {
    try {
      const response = await api.get('/reports/stock');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar relatório de estoque:', error);
      throw error;
    }
  }
};

// Dados mockados para fallback/desenvolvimento
const getMockItems = (): Item[] => {
  return [
    {
      id: 1,
      name: "Cadeira Tiffany Dourada",
      category: "FURNITURE",
      quantityTotal: 100,
      quantityAvailable: 85,
      description: "Cadeira de ferro com pintura eletrostática dourada",
      minStock: 10,
      unitPrice: 45.00
    },
    {
      id: 2,
      name: "Toalha de Mesa Branca",
      category: "DECORATION",
      quantityTotal: 50,
      quantityAvailable: 32,
      description: "Tecido Oxford 2x1.5m",
      minStock: 5,
      unitPrice: 25.00
    },
    {
      id: 3,
      name: "Prato Raso Porcelana",
      category: "UTENSIL",
      quantityTotal: 200,
      quantityAvailable: 200,
      description: "Branco 25cm",
      minStock: 20,
      unitPrice: 8.00
    },
    {
      id: 4,
      name: "Mesa Redonda",
      category: "FURNITURE",
      quantityTotal: 30,
      quantityAvailable: 30,
      description: "1.80m diâmetro com tampo de MDF",
      minStock: 3,
      unitPrice: 120.00
    },
    {
      id: 5,
      name: "Sofá 3 Lugares",
      category: "FURNITURE",
      quantityTotal: 15,
      quantityAvailable: 15,
      description: "Couro sintético preto",
      minStock: 2,
      unitPrice: 280.00
    },
    {
      id: 6,
      name: "Taça de Vidro",
      category: "UTENSIL",
      quantityTotal: 300,
      quantityAvailable: 250,
      description: "300ml cristal",
      minStock: 30,
      unitPrice: 3.50
    },
    {
      id: 7,
      name: "Arranjo de Flores",
      category: "DECORATION",
      quantityTotal: 25,
      quantityAvailable: 25,
      description: "Arranjo artificial 40cm",
      minStock: 3,
      unitPrice: 65.00
    },
    {
      id: 8,
      name: "Tapete Vermelho",
      category: "DECORATION",
      quantityTotal: 10,
      quantityAvailable: 8,
      description: "3x5m",
      minStock: 1,
      unitPrice: 150.00
    }
  ];
};

// Serviço para gerenciar reservas localmente (fallback)
class LocalReservationService {
  private storageKey = 'local_item_reservations';

  getReservations(): any[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  saveReservation(reservation: any): void {
    const reservations = this.getReservations();
    reservations.push({
      ...reservation,
      id: Date.now(),
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(this.storageKey, JSON.stringify(reservations));
  }

  getReservedQuantity(itemId: number, date: string): number {
    const reservations = this.getReservations();
    return reservations
      .filter(r => r.itemId === itemId && r.eventDate === date && r.status !== 'RETURNED')
      .reduce((sum, r) => sum + r.quantity, 0);
  }

  updateStatus(reservationId: number, status: string): void {
    const reservations = this.getReservations();
    const updated = reservations.map(r => 
      r.id === reservationId ? { ...r, status } : r
    );
    localStorage.setItem(this.storageKey, JSON.stringify(updated));
  }
}

export const localReservationService = new LocalReservationService();

// Tipo Item (se não existir, criar em src/types/Item.ts)
export type { Item };