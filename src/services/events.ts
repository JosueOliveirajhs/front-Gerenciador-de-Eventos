// src/services/events.ts

import { Event, CreateEventData } from '../types/Event';
import { api } from './api';

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
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar meus eventos:', error);
      throw error;
    }
  },

  /**
   * Busca evento por ID
   */
  getEventById: async (id: number): Promise<Event> => {
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
   * ✅ NOVO: Busca eventos por ID do cliente
   * Usa getAllEvents e filtra no frontend (SOLUÇÃO 1)
   */
  getEventsByClientId: async (clientId: number): Promise<Event[]> => {
    try {
      console.log(`📅 Buscando eventos do cliente ${clientId}...`);
      
      // Primeiro busca todos os eventos
      const allEvents = await eventService.getAllEvents();
      console.log(`📊 Total de eventos no sistema: ${allEvents.length}`);
      
      // Depois filtra pelo clientId
      const clientEvents = allEvents.filter(event => {
        // Verifica se o evento pertence ao cliente
        // Pode ser tanto event.clientId quanto event.client?.id
        return event.clientId === clientId || event.client?.id === clientId;
      });
      
      console.log(`✅ Eventos do cliente ${clientId} encontrados:`, clientEvents.length);
      
      // Log para debug dos eventos encontrados
      if (clientEvents.length > 0) {
        console.log('📋 Eventos encontrados:', clientEvents.map(e => ({
          id: e.id,
          title: e.title,
          status: e.status
        })));
      } else {
        console.log('⚠️ Nenhum evento encontrado para este cliente');
        
        // Log de todos os clientId presentes nos eventos para debug
        const allClientIds = [...new Set(allEvents.map(e => e.clientId))];
        console.log('🔍 Clientes com eventos:', allClientIds);
      }
      
      return clientEvents;
    } catch (error) {
      console.error(`❌ Erro ao buscar eventos do cliente ${clientId}:`, error);
      // Retorna array vazio em caso de erro para não quebrar a UI
      return [];
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
      
      const requestBody = { status };
      console.log('📦 Request Body:', requestBody);
      
      const response = await api.patch(`/events/${id}/status`, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Status atualizado com sucesso');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar status:', error);
      
      if (error.response) {
        console.error('📋 Detalhes do erro:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      throw error;
    }
  },

  /**
   * Método alternativo de teste para atualizar status
   */
  updateEventStatusTest: async (id: number, status: Event['status']): Promise<Event> => {
    try {
      console.log('🧪 TESTE - Atualizando status via POST');
      const response = await api.post(`/events/${id}/status-test`, status, {
        headers: {
          'Content-Type': 'text/plain'
        }
      });
      console.log('🧪 TESTE - Status atualizado com sucesso');
      return response.data;
    } catch (error: any) {
      console.error('🧪 TESTE - Erro:', error);
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
  },

  /**
   * ✅ NOVO: Busca eventos por período
   */
  getEventsByDateRange: async (startDate: string, endDate: string): Promise<Event[]> => {
    try {
      console.log(`📅 Buscando eventos entre ${startDate} e ${endDate}...`);
      const allEvents = await eventService.getAllEvents();
      
      const filteredEvents = allEvents.filter(event => {
        return event.eventDate >= startDate && event.eventDate <= endDate;
      });
      
      return filteredEvents;
    } catch (error) {
      console.error('❌ Erro ao buscar eventos por período:', error);
      return [];
    }
  },

  /**
   * ✅ NOVO: Busca eventos por status
   */
  getEventsByStatus: async (status: Event['status']): Promise<Event[]> => {
    try {
      console.log(`📅 Buscando eventos com status ${status}...`);
      const allEvents = await eventService.getAllEvents();
      
      const filteredEvents = allEvents.filter(event => event.status === status);
      
      return filteredEvents;
    } catch (error) {
      console.error('❌ Erro ao buscar eventos por status:', error);
      return [];
    }
  },

  /**
   * ✅ NOVO: Busca eventos futuros
   */
  getUpcomingEvents: async (): Promise<Event[]> => {
    try {
      console.log('📅 Buscando eventos futuros...');
      const allEvents = await eventService.getAllEvents();
      const today = new Date().toISOString().split('T')[0];
      
      const upcomingEvents = allEvents.filter(event => 
        event.eventDate >= today && 
        event.status !== 'CANCELLED' && 
        event.status !== 'COMPLETED'
      ).sort((a, b) => a.eventDate.localeCompare(b.eventDate));
      
      return upcomingEvents;
    } catch (error) {
      console.error('❌ Erro ao buscar eventos futuros:', error);
      return [];
    }
  },

  /**
   * ✅ NOVO: Conta eventos por cliente
   */
  countEventsByClient: async (clientId: number): Promise<number> => {
    try {
      const clientEvents = await eventService.getEventsByClientId(clientId);
      return clientEvents.length;
    } catch (error) {
      console.error(`❌ Erro ao contar eventos do cliente ${clientId}:`, error);
      return 0;
    }
  }
};