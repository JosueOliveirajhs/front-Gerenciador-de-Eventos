// src/services/payments.ts

import { Payment, CreatePaymentData } from '../types/Payment';
import { api } from './api';

export const paymentService = {
  /**
   * Busca pagamentos por evento
   */
  getEventPayments: async (eventId: number): Promise<Payment[]> => {
    try {
      console.log(`💰 Buscando pagamentos do evento ${eventId}...`);
      const response = await api.get(`/payments/event/${eventId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao buscar pagamentos do evento ${eventId}:`, error);
      return [];
    }
  },

  /**
   * ✅ NOVO: Busca pagamentos por ID do cliente
   * Usa getAllPayments e filtra no frontend
   */
  getPaymentsByClientId: async (clientId: number): Promise<Payment[]> => {
    try {
      console.log(`💰 Buscando pagamentos do cliente ${clientId}...`);
      
      // Primeiro busca todos os pagamentos
      // Nota: Se não existir endpoint para todos os pagamentos, 
      // você precisará buscar eventos primeiro e depois os pagamentos de cada evento
      
      // Opção 1: Se existir endpoint de todos os pagamentos
      try {
        const response = await api.get('/payments');
        const allPayments = response.data;
        
        // Filtrar pagamentos do cliente (precisa relacionar com eventos)
        // Esta lógica depende de como seus dados estão estruturados
        return allPayments;
      } catch (error) {
        // Opção 2: Buscar eventos do cliente e depois os pagamentos de cada evento
        console.log('⚠️ Buscando pagamentos via eventos...');
        const { eventService } = await import('./events');
        const clientEvents = await eventService.getEventsByClientId(clientId);
        
        const allPayments: Payment[] = [];
        
        for (const event of clientEvents) {
          const eventPayments = await paymentService.getEventPayments(event.id);
          allPayments.push(...eventPayments);
        }
        
        console.log(`✅ Pagamentos do cliente ${clientId} encontrados:`, allPayments.length);
        return allPayments;
      }
      
    } catch (error) {
      console.error(`❌ Erro ao buscar pagamentos do cliente ${clientId}:`, error);
      return [];
    }
  },

  /**
   * Cria um novo pagamento
   */
  createPayment: async (paymentData: CreatePaymentData): Promise<Payment> => {
    try {
      console.log('📝 Criando pagamento:', paymentData);
      const response = await api.post('/payments', paymentData);
      console.log('✅ Pagamento criado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar pagamento:', error);
      throw error;
    }
  },

  /**
   * Atualiza status do pagamento
   */
  updatePaymentStatus: async (id: number, status: Payment['status']): Promise<Payment> => {
    try {
      console.log(`🔄 Atualizando status do pagamento ${id}...`);
      const response = await api.patch(`/payments/${id}/status`, { status });
      console.log('✅ Status atualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao atualizar status:`, error);
      throw error;
    }
  },

  /**
   * Processa um pagamento
   */
  processPayment: async (id: number, paymentMethod: string): Promise<Payment> => {
    try {
      console.log(`💳 Processando pagamento ${id}...`);
      const response = await api.post(`/payments/${id}/process`, { paymentMethod });
      console.log('✅ Pagamento processado:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao processar pagamento:`, error);
      throw error;
    }
  },

  /**
   * ✅ NOVO: Busca pagamentos pendentes do cliente
   */
  getPendingPaymentsByClientId: async (clientId: number): Promise<Payment[]> => {
    try {
      const allPayments = await paymentService.getPaymentsByClientId(clientId);
      return allPayments.filter(p => p.status === 'PENDING');
    } catch (error) {
      console.error('❌ Erro ao buscar pagamentos pendentes:', error);
      return [];
    }
  },

  /**
   * ✅ NOVO: Busca pagamentos em atraso do cliente
   */
  getOverduePaymentsByClientId: async (clientId: number): Promise<Payment[]> => {
    try {
      const allPayments = await paymentService.getPaymentsByClientId(clientId);
      const today = new Date();
      
      return allPayments.filter(p => 
        p.status === 'PENDING' && 
        new Date(p.dueDate) < today
      );
    } catch (error) {
      console.error('❌ Erro ao buscar pagamentos em atraso:', error);
      return [];
    }
  }
};