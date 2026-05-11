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
   * ✅ NOVO: Busca disponibilidade de datas e horarios (publico)
   */
  getAvailability: async (): Promise<{date: string, startTime: string, endTime: string}[]> => {
    try {
      console.log('📅 Buscando disponibilidade...');
      const response = await api.get('/events/availability');
      console.log('✅ Disponibilidade carregada:', response.data.length, 'registros');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar disponibilidade:', error);
      return [];
    }
  },

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
      return [];
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
   * Busca eventos por ID da organização
   */
  getEventsByOrganizationId: async (organizationId: string | number): Promise<Event[]> => {
    try {
      console.log(`📅 Buscando eventos da organização ${organizationId}...`);
      const response = await api.get(`/events/organization/${organizationId}`);
      console.log('✅ Eventos da organização:', response.data.length);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao buscar eventos da organização ${organizationId}:`, error);
      return [];
    }
  },

  /**
   * ✅ Busca checklist do evento
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
   * ✅ Atualiza item do checklist
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
   * ✅ Cria um item de checklist para o evento
   */
  createChecklistItem: async (eventId: string | number, item: {
    title: string;
    description: string;
    category: 'PRE_EVENT' | 'EVENT_DAY' | 'POST_EVENT';
    order: number;
    dueDate?: string;
    responsiblePerson?: string;
  }): Promise<ChecklistItem> => {
    try {
      console.log(`📋 Criando item de checklist para evento ${eventId}...`);
      const response = await api.post(`/events/${eventId}/checklist`, item);
      console.log('✅ Item criado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar item do checklist:', error);
      throw error;
    }
  },

  /**
   * ✅ Cria checklist padrão para o evento
   */
  createDefaultChecklist: async (eventId: string | number): Promise<void> => {
    try {
      console.log(`📋 Criando checklist padrão para evento ${eventId}...`);
      
      const defaultItems = [
        {
          title: 'Definir lista de convidados',
          description: 'Criar lista completa com nomes para confirmação de presença',
          category: 'PRE_EVENT' as const,
          order: 1,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          title: 'Escolher decoração',
          description: 'Definir tema, cores e arranjos florais',
          category: 'PRE_EVENT' as const,
          order: 2,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          title: 'Fechar cardápio',
          description: 'Definir entradas, prato principal e sobremesas',
          category: 'PRE_EVENT' as const,
          order: 3,
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          title: 'Enviar convites',
          description: 'Enviar convites aos convidados',
          category: 'PRE_EVENT' as const,
          order: 4,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          title: 'Confirmar presenças',
          description: 'Coletar confirmações dos convidados',
          category: 'PRE_EVENT' as const,
          order: 5,
          dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          title: 'Check-in no dia do evento',
          description: 'Chegar com antecedência para verificar preparativos',
          category: 'EVENT_DAY' as const,
          order: 6
        },
        {
          title: 'Agradecimento pós-evento',
          description: 'Enviar mensagens de agradecimento aos convidados',
          category: 'POST_EVENT' as const,
          order: 7
        }
      ];
      
      for (const item of defaultItems) {
        await eventService.createChecklistItem(eventId, item);
      }
      
      console.log('✅ Checklist padrão criado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar checklist padrão:', error);
      throw error;
    }
  },

  /**
   * ✅ Deleta um item do checklist
   */
  deleteChecklistItem: async (eventId: string | number, itemId: string): Promise<void> => {
    try {
      console.log(`🗑️ Deletando item ${itemId} do checklist...`);
      await api.delete(`/events/${eventId}/checklist/${itemId}`);
      console.log('✅ Item deletado');
    } catch (error) {
      console.error('❌ Erro ao deletar item:', error);
      throw error;
    }
  },

  /**
   * ✅ Busca serviços do evento
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
   * ✅ Adiciona serviço ao evento
   */
  addEventService: async (eventId: string | number, service: Partial<ContractedService>): Promise<ContractedService> => {
    try {
      console.log(`📦 Adicionando serviço ao evento ${eventId}...`);
      const response = await api.post(`/events/${eventId}/services`, service);
      console.log('✅ Serviço adicionado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao adicionar serviço:', error);
      throw error;
    }
  },

  /**
   * ✅ Atualiza serviço do evento
   */
  updateEventService: async (eventId: string | number, serviceId: string, service: Partial<ContractedService>): Promise<ContractedService> => {
    try {
      console.log(`✏️ Atualizando serviço ${serviceId}...`);
      const response = await api.put(`/events/${eventId}/services/${serviceId}`, service);
      console.log('✅ Serviço atualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar serviço:', error);
      throw error;
    }
  },

  /**
   * ✅ Remove serviço do evento
   */
  deleteEventService: async (eventId: string | number, serviceId: string): Promise<void> => {
    try {
      console.log(`🗑️ Removendo serviço ${serviceId}...`);
      await api.delete(`/events/${eventId}/services/${serviceId}`);
      console.log('✅ Serviço removido');
    } catch (error) {
      console.error('❌ Erro ao remover serviço:', error);
      throw error;
    }
  },

  /**
   * ✅ Busca progresso do evento (dados consolidados)
   */
  getEventProgress: async (eventId: string | number): Promise<any> => {
    try {
      console.log(`📊 Buscando progresso do evento ${eventId}...`);
      const response = await api.get(`/events/${eventId}/progress`);
      return response.data;
    } catch (error) {
      console.log(`ℹ️ Progresso não disponível para evento ${eventId}`);
      
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
      
      const now = new Date().toISOString();
      
      const payload = {
        ...eventData,
        paymentDate: now,
        payment: {
          amount: eventData.payment?.amount || parseFloat(eventData.totalValue) - parseFloat(eventData.depositValue || '0'),
          dueDate: eventData.payment?.dueDate || eventData.eventDate,
          description: eventData.payment?.description || `Pagamento do evento: ${eventData.title}`,
          status: eventData.payment?.status || 'PENDING',
          paymentDate: now,
          paymentMethod: 'PIX',
          billingType: 'BOLETO',
          invoiceUrl: '',
          paymentUrl: '',
          receiptUrl: '',
          rejectionReason: '',
          asaasPaymentId: '',
          uploadedAt: now
        }
      };
      
      const response = await api.post('/events', payload);
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
   * ✅ Busca eventos por período
   */
  getEventsByDateRange: async (startDate: string, endDate: string): Promise<Event[]> => {
    try {
      console.log(`📅 Buscando eventos entre ${startDate} e ${endDate}...`);
      const allEvents = await eventService.getAllEvents();
      
      const filteredEvents = allEvents.filter((event: Event) => {
        return event.eventDate >= startDate && event.eventDate <= endDate;
      });
      
      console.log(`✅ Eventos encontrados no período: ${filteredEvents.length}`);
      return filteredEvents;
    } catch (error) {
      console.error('❌ Erro ao buscar eventos por período:', error);
      return [];
    }
  },

  /**
   * ✅ Busca eventos futuros
   */
  getUpcomingEvents: async (): Promise<Event[]> => {
    try {
      console.log('📅 Buscando eventos futuros...');
      const today = new Date().toISOString().split('T')[0];
      
      const allEvents = await eventService.getAllEvents();
      
      const upcomingEvents = allEvents
        .filter((event: Event) => 
          event.eventDate >= today && 
          event.status !== 'CANCELLED' && 
          event.status !== 'COMPLETED'
        )
        .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
      
      console.log(`✅ Eventos futuros: ${upcomingEvents.length}`);
      return upcomingEvents;
    } catch (error) {
      console.error('❌ Erro ao buscar eventos futuros:', error);
      return [];
    }
  },

  /**
   * ✅ Busca estatísticas do evento
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
        cancelled: 0,
        totalValue: '0'
      };
    }
  },

  /**
   * ✅ Método de debug para inspecionar um evento
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
   * ✅ Debug do usuário atual
   */
  debugCurrentUser: async (): Promise<any> => {
    try {
      console.log('🔍 Debug do usuário atual...');
      const response = await api.get('/events/debug/me');
      return response.data;
    } catch (error) {
      console.error('❌ Erro no debug do usuário:', error);
      throw error;
    }
  }
};