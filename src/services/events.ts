// src/services/events.ts

import { Event, CreateEventData } from '../types/Event';
import { api } from './api';

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate?: string;
  category: 'PRE_EVENT' | 'EVENT_DAY' | 'POST_EVENT';
  order: number;
  responsiblePerson?: string;
  notes?: string;
}

export interface ContractedService {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  provider?: string;
  providerContact?: string;
}

export const eventService = {
  /**
   * Busca todos os eventos
   */
  getAllEvents: async (): Promise<Event[]> => {
    try {
      console.log('📅 Buscando todos os eventos...');
      const response = await api.get('/events');
      console.log('✅ Eventos carregados:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar eventos:', error);
      throw error;
    }
  },

  /**
   * Busca eventos do usuário atual (cliente)
   */
  getMyEvents: async (): Promise<Event[]> => {
    try {
      console.log('📅 Buscando meus eventos...');
      const response = await api.get('/events/my-events');
      console.log('✅ Meus eventos:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar meus eventos:', error);
      return []; // Retorna array vazio para não quebrar a UI
    }
  },

  /**
   * Busca evento por ID
   */
  getEventById: async (id: string | number): Promise<Event> => {
    try {
      console.log(`📅 Buscando evento ${id}...`);
      const response = await api.get(`/events/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao buscar evento ${id}:`, error);
      throw error;
    }
  },

  /**
   * Busca eventos por ID do cliente
   */
  getEventsByClientId: async (clientId: string | number): Promise<Event[]> => {
    try {
      console.log(`📅 Buscando eventos do cliente ${clientId}...`);
      const response = await api.get(`/events/client/${clientId}`);
      console.log('✅ Eventos do cliente:', response.data.length);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao buscar eventos do cliente ${clientId}:`, error);
      return [];
    }
  },

  /**
   * ✅ NOVO: Busca checklist do evento
   */
  getEventChecklist: async (eventId: string | number): Promise<ChecklistItem[]> => {
    try {
      console.log(`📋 Buscando checklist do evento ${eventId}...`);
      const response = await api.get(`/events/${eventId}/checklist`);
      return response.data;
    } catch (error) {
      console.log(`ℹ️ Checklist não encontrado para evento ${eventId}`);
      return [];
    }
  },

  /**
   * ✅ NOVO: Atualiza item do checklist
   */
  updateChecklistItem: async (eventId: string | number, itemId: string, completed: boolean): Promise<void> => {
    try {
      console.log(`📋 Atualizando item ${itemId} do checklist...`);
      await api.patch(`/events/${eventId}/checklist/${itemId}`, { completed });
      console.log('✅ Item atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar item:', error);
      throw error;
    }
  },

  /**
   * ✅ NOVO: Busca serviços do evento
   */
  getEventServices: async (eventId: string | number): Promise<ContractedService[]> => {
    try {
      console.log(`📦 Buscando serviços do evento ${eventId}...`);
      const response = await api.get(`/events/${eventId}/services`);
      return response.data;
    } catch (error) {
      console.log(`ℹ️ Serviços não encontrados para evento ${eventId}`);
      return [];
    }
  },

  /**
   * ✅ NOVO: Busca progresso do evento (dados consolidados)
   */
  getEventProgress: async (eventId: string | number): Promise<any> => {
    try {
      console.log(`📊 Buscando progresso do evento ${eventId}...`);
      const response = await api.get(`/events/${eventId}/progress`);
      return response.data;
    } catch (error) {
      console.log(`ℹ️ Progresso não disponível para evento ${eventId}`);
      
      // Fallback: buscar dados separadamente
      const [event, checklist, services] = await Promise.all([
        eventService.getEventById(eventId),
        eventService.getEventChecklist(eventId),
        eventService.getEventServices(eventId)
      ]);
      
      return {
        event,
        checklist,
        services,
        completedSteps: checklist.filter((i: ChecklistItem) => i.completed).length,
        totalSteps: checklist.length
      };
    }
  },

  /**
   * Cria um novo evento
   */
  createEvent: async (eventData: CreateEventData): Promise<Event> => {
    try {
      console.log('📝 Criando evento:', eventData);
      const response = await api.post('/events', eventData);
      console.log('✅ Evento criado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar evento:', error);
      throw error;
    }
  },

  /**
   * Atualiza um evento existente
   */
  updateEvent: async (id: number, eventData: Partial<Event>): Promise<Event> => {
    try {
      console.log(`✏️ Atualizando evento ${id}:`, eventData);
      const response = await api.put(`/events/${id}`, eventData);
      console.log('✅ Evento atualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao atualizar evento ${id}:`, error);
      throw error;
    }
  },

  /**
   * Atualiza o status de um evento
   */
  updateEventStatus: async (id: number, status: Event['status']): Promise<Event> => {
    try {
      console.log('🔄 Atualizando status do evento:', { id, status });
      const response = await api.patch(`/events/${id}/status`, { status });
      console.log('✅ Status atualizado com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      throw error;
    }
  },

  /**
   * Deleta um evento
   */
  deleteEvent: async (id: number): Promise<void> => {
    try {
      console.log(`🗑️ Deletando evento ${id}...`);
      await api.delete(`/events/${id}`);
      console.log(`✅ Evento ${id} deletado com sucesso`);
    } catch (error) {
      console.error(`❌ Erro ao deletar evento ${id}:`, error);
      throw error;
    }
  },

  /**
   * ✅ NOVO: Busca eventos por período
   */
  getEventsByDateRange: async (startDate: string, endDate: string): Promise<Event[]> => {
    try {
      console.log(`📅 Buscando eventos entre ${startDate} e ${endDate}...`);
      const response = await api.get('/events/upcoming');
      
      const filteredEvents = response.data.filter((event: Event) => {
        return event.eventDate >= startDate && event.eventDate <= endDate;
      });
      
      return filteredEvents;
    } catch (error) {
      console.error('❌ Erro ao buscar eventos por período:', error);
      return [];
    }
  },

  /**
   * ✅ NOVO: Busca eventos futuros
   */
  getUpcomingEvents: async (): Promise<Event[]> => {
    try {
      console.log('📅 Buscando eventos futuros...');
      const response = await api.get('/events/upcoming');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar eventos futuros:', error);
      return [];
    }
  },

  /**
   * ✅ NOVO: Busca estatísticas do evento
   */
  getEventStats: async (): Promise<any> => {
    try {
      console.log('📊 Buscando estatísticas...');
      const response = await api.get('/events/stats');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      return {
        total: 0,
        confirmed: 0,
        completed: 0,
        quote: 0,
        cancelled: 0
      };
    }
  },

  /**
   * Método de debug para inspecionar um evento
   */
  debugEvent: async (id: number): Promise<any> => {
    try {
      console.log(`🔍 Debug do evento ${id}...`);
      const response = await api.get(`/events/${id}/debug`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro no debug do evento ${id}:`, error);
      throw error;
    }
  }
};