import { Event, CreateEventData } from '../types/Event';
import { api } from './api';

export const eventService = {
  getAllEvents: async (): Promise<Event[]> => {
    const response = await api.get('/events');
    return response.data;
  },

  getMyEvents: async (): Promise<Event[]> => {
    const response = await api.get('/events/my-events');
    return response.data;
  },

  getEventById: async (id: number): Promise<Event> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  createEvent: async (eventData: CreateEventData): Promise<Event> => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  updateEvent: async (id: number, eventData: Partial<Event>): Promise<Event> => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },

  updateEventStatus: async (id: number, status: Event['status']): Promise<Event> => {
    try {
      console.log('🔄 Enviando atualização de status:', { id, status });
      console.log('📦 Tipo do status:', typeof status);
      
      // ✅ CORREÇÃO: Garantir que estamos enviando o objeto correto
      const requestBody = { status: status };
      console.log('📦 Request Body sendo enviado:', requestBody);
      
      const response = await api.patch(`/events/${id}/status`, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Status atualizado com sucesso');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar status:', error);
      
      // Log detalhado para debug
      if (error.response) {
        console.error('📋 Detalhes do erro:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
          config: error.config
        });
      }
      
      throw error;
    }
  },

  // Método alternativo de teste
  updateEventStatusTest: async (id: number, status: Event['status']): Promise<Event> => {
    try {
      console.log('🧪 TESTE - Enviando status como string pura');
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

  deleteEvent: async (id: number): Promise<void> => {
    await api.delete(`/events/${id}`);
  },

  debugEvent: async (id: number): Promise<any> => {
    const response = await api.get(`/events/${id}/debug`);
    return response.data;
  }
};