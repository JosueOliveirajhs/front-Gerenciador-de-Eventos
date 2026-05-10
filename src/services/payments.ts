// src/services/payments.ts

import { Payment, CreatePaymentData } from '../types/Payment';
import { api } from './api';

export const paymentService = {
  /**
   * Busca todos os pagamentos
   */
  getAllPayments: async (): Promise<Payment[]> => {
    try {
      console.log('💰 Buscando todos os pagamentos...');
      const response = await api.get('/payments');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar pagamentos:', error);
      return [];
    }
  },

  /**
   * Busca pagamentos por evento
   */
  getPaymentsByEventId: async (eventId: string | number): Promise<Payment[]> => {
    try {
      console.log(`💰 Buscando pagamentos do evento ${eventId}...`);
      const response = await api.get(`/payments/event/${eventId}`);
      return response.data;
    } catch (error) {
      console.log(`ℹ️ Pagamentos não encontrados para evento ${eventId}`);
      return [];
    }
  },

  /**
   * Alias para compatibilidade
   */
  getEventPayments: async (eventId: number): Promise<Payment[]> => {
    return paymentService.getPaymentsByEventId(eventId);
  },

  /**
   * Busca pagamentos por ID do cliente
   */
  getPaymentsByClientId: async (clientId: string | number): Promise<Payment[]> => {
    try {
      console.log(`💰 Buscando pagamentos do cliente ${clientId}...`);
      const response = await api.get(`/payments/client/${clientId}`);
      return response.data;
    } catch (error) {
      console.log(`ℹ️ Pagamentos não encontrados para cliente ${clientId}`);
      return [];
    }
  },

  /**
   * Busca pagamentos do cliente atual
   */
  getMyPayments: async (): Promise<Payment[]> => {
    try {
      console.log('💰 Buscando meus pagamentos...');
      const response = await api.get('/payments/my-payments');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar meus pagamentos:', error);
      return [];
    }
  },

  /**
   * Busca pagamento por ID
   */
  getPaymentById: async (id: number): Promise<Payment> => {
    try {
      console.log(`💰 Buscando pagamento ${id}...`);
      const response = await api.get(`/payments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao buscar pagamento ${id}:`, error);
      throw error;
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
   * Faz upload de comprovante pelo cliente
   */
  uploadReceipt: async (id: number, file: File): Promise<Payment> => {
    try {
      console.log(`📎 Upload de comprovante para pagamento ${id}...`);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(`/payments/${id}/upload-receipt`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('✅ Comprovante enviado');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao enviar comprovante:', error);
      throw error;
    }
  },

  /**
   * Faz upload do boleto pela organização
   */
  uploadInvoice: async (id: number, file: File): Promise<Payment> => {
    try {
      console.log(`📎 Upload de boleto para pagamento ${id}...`);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(`/payments/${id}/upload-invoice`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('✅ Boleto enviado');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao enviar boleto:', error);
      throw error;
    }
  },

  /**
   * Aprova um pagamento
   */
  approvePayment: async (id: number): Promise<Payment> => {
    try {
      console.log(`✅ Aprovando pagamento ${id}...`);
      const response = await api.put(`/payments/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao aprovar pagamento ${id}:`, error);
      throw error;
    }
  },

  /**
   * Rejeita um pagamento
   */
  rejectPayment: async (id: number, reason: string): Promise<Payment> => {
    try {
      console.log(`❌ Rejeitando pagamento ${id}...`);
      const response = await api.put(`/payments/${id}/reject`, null, { params: { reason } });
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao rejeitar pagamento ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cria uma assinatura para a organização
   */
  createSubscription: async (orgId: number, subscriptionData: { planType: string, billingCycle: string, billingType: string }): Promise<any> => {
    try {
      console.log(`📝 Criando assinatura para organização ${orgId}...`, subscriptionData);
      const response = await api.post(`/payments/${orgId}/create-subscription`, subscriptionData);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao criar assinatura para organização ${orgId}:`, error);
      throw error;
    }
  },

  /**
   * Faz upgrade da assinatura para a organização
   */
  upgradeSubscription: async (orgId: number, subscriptionData: { planType: string, billingCycle: string, billingType: string }): Promise<any> => {
    try {
      console.log(`🚀 Fazendo upgrade de assinatura para organização ${orgId}...`, subscriptionData);
      const response = await api.post(`/payments/${orgId}/upgrade-subscription`, subscriptionData);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao fazer upgrade de assinatura para organização ${orgId}:`, error);
      throw error;
    }
  },

  /**
   * Busca pagamentos pendentes do cliente
   */
  getPendingPayments: async (): Promise<Payment[]> => {
    try {
      console.log('💰 Buscando pagamentos pendentes...');
      const response = await api.get('/payments/pending');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar pagamentos pendentes:', error);
      return [];
    }
  },

  /**
   * Busca pagamentos em atraso do cliente
   */
  getOverduePayments: async (): Promise<Payment[]> => {
    try {
      console.log('⚠️ Buscando pagamentos em atraso...');
      const response = await api.get('/payments/overdue');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar pagamentos em atraso:', error);
      return [];
    }
  },

  /**
   * Busca resumo financeiro
   */
  getFinancialSummary: async (): Promise<any> => {
    try {
      console.log('📊 Buscando resumo financeiro...');
      const response = await api.get('/payments/summary');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar resumo financeiro:', error);
      return {
        totalPaid: 0,
        totalPending: 0,
        totalOverdue: 0
      };
    }
  }
};