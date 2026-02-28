// src/services/expense.ts
import { api } from './api';

export interface Expense {
  id: number;
  eventId: number;
  eventTitle?: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  supplier?: string;
  paymentMethod?: string;
  status: 'PENDING' | 'PAID';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExpenseDTO {
  eventId: number;
  category: string;
  description: string;
  amount: number;
  date: string;
  supplier?: string;
  paymentMethod?: string;
  status: 'PENDING' | 'PAID';
}

export const expenseService = {
  /**
   * Busca todas as despesas
   */
  getAllExpenses: async (): Promise<Expense[]> => {
    try {
      console.log('💰 Buscando todas as despesas...');
      const response = await api.get('/api/expenses');
      console.log('✅ Despesas carregadas:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar despesas:', error);
      
      // Se o endpoint não existir, retorna array vazio
      if (error.response?.status === 404) {
        console.log('⚠️ Endpoint de despesas não encontrado');
        return [];
      }
      throw error;
    }
  },

  /**
   * Busca despesas por evento
   */
  getExpensesByEvent: async (eventId: number): Promise<Expense[]> => {
    try {
      console.log(`💰 Buscando despesas do evento ${eventId}...`);
      const response = await api.get(`/api/expenses/event/${eventId}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Erro ao buscar despesas do evento ${eventId}:`, error);
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  /**
   * Busca despesas por período
   */
  getExpensesByPeriod: async (startDate: string, endDate: string): Promise<Expense[]> => {
    try {
      console.log(`💰 Buscando despesas de ${startDate} até ${endDate}...`);
      const response = await api.get(`/api/expenses/period`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar despesas por período:', error);
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  /**
   * Cria uma nova despesa
   */
  createExpense: async (expenseData: CreateExpenseDTO): Promise<Expense> => {
    try {
      console.log('📝 Criando despesa:', expenseData);
      
      const payload = {
        eventId: expenseData.eventId,
        categoria: expenseData.category,
        descricao: expenseData.description,
        valor: expenseData.amount,
        data: expenseData.date,
        fornecedor: expenseData.supplier || null,
        metodoPagamento: expenseData.paymentMethod || null,
        status: expenseData.status
      };
      
      const response = await api.post('/api/expenses', payload);
      console.log('✅ Despesa criada:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar despesa:', error);
      throw error;
    }
  },

  /**
   * Atualiza uma despesa existente
   */
  updateExpense: async (id: number, expenseData: Partial<CreateExpenseDTO>): Promise<Expense> => {
    try {
      console.log(`✏️ Atualizando despesa ${id}:`, expenseData);
      
      const payload: any = {};
      if (expenseData.eventId) payload.eventId = expenseData.eventId;
      if (expenseData.category) payload.categoria = expenseData.category;
      if (expenseData.description) payload.descricao = expenseData.description;
      if (expenseData.amount !== undefined) payload.valor = expenseData.amount;
      if (expenseData.date) payload.data = expenseData.date;
      if (expenseData.supplier !== undefined) payload.fornecedor = expenseData.supplier;
      if (expenseData.paymentMethod !== undefined) payload.metodoPagamento = expenseData.paymentMethod;
      if (expenseData.status) payload.status = expenseData.status;
      
      const response = await api.put(`/api/expenses/${id}`, payload);
      console.log('✅ Despesa atualizada:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Erro ao atualizar despesa ${id}:`, error);
      throw error;
    }
  },

  /**
   * Deleta uma despesa
   */
  deleteExpense: async (id: number): Promise<void> => {
    try {
      console.log(`🗑️ Deletando despesa ${id}...`);
      await api.delete(`/api/expenses/${id}`);
      console.log(`✅ Despesa ${id} deletada com sucesso`);
    } catch (error: any) {
      console.error(`❌ Erro ao deletar despesa ${id}:`, error);
      throw error;
    }
  },

  /**
   * Marca despesa como paga
   */
  markAsPaid: async (id: number): Promise<Expense> => {
    try {
      console.log(`💰 Marcando despesa ${id} como paga...`);
      const response = await api.patch(`/api/expenses/${id}/pay`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Erro ao marcar despesa ${id} como paga:`, error);
      throw error;
    }
  },

  /**
   * Busca resumo financeiro por período
   */
  getFinancialSummary: async (startDate: string, endDate: string): Promise<any> => {
    try {
      console.log(`📊 Buscando resumo financeiro de ${startDate} até ${endDate}...`);
      const response = await api.get(`/api/expenses/summary`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar resumo financeiro:', error);
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
};