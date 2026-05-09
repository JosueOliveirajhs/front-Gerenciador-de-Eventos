// src/services/expense.ts
import { api } from './api';

export interface Expense {
  id: number;
  eventId: number;
  eventTitle?: string;
  descricao: string;
  valor: number;
  data: string;
  categoria?: string;
  fornecedor?: string;
  formaPagamento?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExpenseDTO {
  eventId: number;
  descricao: string;
  valor: number;
  data: string;
  categoria?: string;
  fornecedor?: string;
  formaPagamento?: string;
  status: string;
}

export const EXPENSE_CATEGORIES = [
  { id: 'Alimentação', name: 'Alimentação' },
  { id: 'Bebidas', name: 'Bebidas' },
  { id: 'Decoração', name: 'Decoração' },
  { id: 'Música/DJ', name: 'Música/DJ' },
  { id: 'Fotografia', name: 'Fotografia' },
  { id: 'Móveis', name: 'Móveis' },
  { id: 'Bolo/Doces', name: 'Bolo/Doces' },
  { id: 'Equipe', name: 'Equipe' },
  { id: 'Transporte', name: 'Transporte' },
  { id: 'Brindes', name: 'Brindes' },
  { id: 'Espaço', name: 'Espaço' },
  { id: 'Marketing', name: 'Marketing' },
  { id: 'Outros', name: 'Outros' }
];

const STATUS_MAP_TO_BACKEND: Record<string, string> = {
  'PENDING': 'Pendente',
  'PAID': 'Pago'
};

const STATUS_MAP_TO_FRONTEND: Record<string, string> = {
  'Pendente': 'PENDING',
  'Pago': 'PAID'
};

export const CATEGORY_MAP_TO_BACKEND: Record<string, string> = {
  'Alimentação': 'Alimentação',
  'Bebidas': 'Bebidas',
  'Decoração': 'Decoração',
  'Música/DJ': 'Música/DJ',
  'Fotografia': 'Fotografia',
  'Móveis': 'Móveis',
  'Bolo/Doces': 'Bolo/Doces',
  'Equipe': 'Equipe',
  'Transporte': 'Transporte',
  'Brindes': 'Brindes',
  'Espaço': 'Espaço',
  'Marketing': 'Marketing',
  'Outros': 'Outros'
};

export const CATEGORY_MAP_TO_FRONTEND: Record<string, string> = {
  'Alimentação': 'Alimentação',
  'Bebidas': 'Bebidas',
  'Decoração': 'Decoração',
  'Música/DJ': 'Música/DJ',
  'Fotografia': 'Fotografia',
  'Móveis': 'Móveis',
  'Bolo/Doces': 'Bolo/Doces',
  'Equipe': 'Equipe',
  'Transporte': 'Transporte',
  'Brindes': 'Brindes',
  'Espaço': 'Espaço',
  'Marketing': 'Marketing',
  'Outros': 'Outros'
};

export const expenseService = {
  getAllExpenses: async (): Promise<Expense[]> => {
    try {
      console.log('💰 Buscando todas as despesas...');
      const response = await api.get('/api/despesas');
      console.log('✅ Despesas carregadas:', response.data);
      
      const expenses = response.data.map((expense: any) => ({
        id: expense.id,
        eventId: expense.idEvento,
        eventTitle: expense.nomeEvento,
        descricao: expense.descricao,
        valor: expense.valor,
        data: expense.data,
        categoria: expense.categoria,
        fornecedor: expense.fornecedor,
        formaPagamento: expense.formaPagamento,
        status: STATUS_MAP_TO_FRONTEND[expense.status] || expense.status
      }));
      
      return expenses;
    } catch (error: any) {
      console.error('❌ Erro ao buscar despesas:', error);
      return [];
    }
  },

  getExpensesByEvent: async (eventId: number): Promise<Expense[]> => {
    try {
      const allExpenses = await expenseService.getAllExpenses();
      return allExpenses.filter(expense => expense.eventId === eventId);
    } catch (error) {
      console.error('❌ Erro ao buscar despesas do evento:', error);
      return [];
    }
  },

  createExpense: async (expenseData: CreateExpenseDTO): Promise<Expense> => {
    try {
      console.log('📝 Criando despesa:', expenseData);
      
      if (!expenseData.eventId) throw new Error('eventId é obrigatório');
      if (!expenseData.descricao) throw new Error('descrição é obrigatória');
      if (!expenseData.valor || expenseData.valor <= 0) throw new Error('valor deve ser maior que zero');
      if (!expenseData.data) throw new Error('data é obrigatória');
      
      const payload = {
        descricao: expenseData.descricao,
        valor: expenseData.valor,
        data: expenseData.data,
        categoria: expenseData.categoria || null,
        fornecedor: expenseData.fornecedor || null,
        formaPagamento: expenseData.formaPagamento || null,
        status: STATUS_MAP_TO_BACKEND[expenseData.status] || expenseData.status,
        idEvento: expenseData.eventId
      };
      
      console.log('📦 Payload enviado:', payload);
      
      const response = await api.post('/api/despesas', payload);
      console.log('✅ Resposta:', response.data);
      
      return {
        id: response.data.id,
        eventId: response.data.idEvento,
        eventTitle: response.data.nomeEvento,
        descricao: response.data.descricao,
        valor: response.data.valor,
        data: response.data.data,
        categoria: response.data.categoria,
        fornecedor: response.data.fornecedor,
        formaPagamento: response.data.formaPagamento,
        status: STATUS_MAP_TO_FRONTEND[response.data.status] || response.data.status
      };
      
    } catch (error: any) {
      console.error('❌ Erro ao criar despesa:', error);
      if (error.response) {
        console.error('📋 Detalhes do erro:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },

  updateExpense: async (id: number, expenseData: Partial<CreateExpenseDTO>): Promise<Expense> => {
    try {
      console.log(`✏️ Atualizando despesa ${id}:`, expenseData);
      
      const currentExpenses = await expenseService.getAllExpenses();
      const currentExpense = currentExpenses.find(e => e.id === id);
      
      if (!currentExpense) {
        throw new Error('Despesa não encontrada');
      }
      
      const payload: any = {
        descricao: expenseData.descricao !== undefined ? expenseData.descricao : currentExpense.descricao,
        valor: expenseData.valor !== undefined ? expenseData.valor : currentExpense.valor,
        data: expenseData.data !== undefined ? expenseData.data : currentExpense.data,
        categoria: expenseData.categoria !== undefined ? expenseData.categoria : currentExpense.categoria,
        fornecedor: expenseData.fornecedor !== undefined ? expenseData.fornecedor : currentExpense.fornecedor,
        formaPagamento: expenseData.formaPagamento !== undefined ? expenseData.formaPagamento : currentExpense.formaPagamento,
        status: expenseData.status ? STATUS_MAP_TO_BACKEND[expenseData.status] : STATUS_MAP_TO_BACKEND[currentExpense.status],
        idEvento: expenseData.eventId !== undefined ? expenseData.eventId : currentExpense.eventId
      };
      
      console.log('📦 Payload atualização:', payload);
      
      const response = await api.put(`/api/despesas/${id}`, payload);
      
      return {
        id: response.data.id,
        eventId: response.data.idEvento,
        eventTitle: response.data.nomeEvento,
        descricao: response.data.descricao,
        valor: response.data.valor,
        data: response.data.data,
        categoria: response.data.categoria,
        fornecedor: response.data.fornecedor,
        formaPagamento: response.data.formaPagamento,
        status: STATUS_MAP_TO_FRONTEND[response.data.status] || response.data.status
      };
    } catch (error: any) {
      console.error(`❌ Erro ao atualizar despesa ${id}:`, error);
      throw error;
    }
  },

  updateExpenseStatus: async (id: number, status: 'PENDING' | 'PAID'): Promise<Expense> => {
    try {
      console.log(`🔄 Atualizando status da despesa ${id} para:`, status);
      return await expenseService.updateExpense(id, { status });
    } catch (error: any) {
      console.error(`❌ Erro ao atualizar status da despesa ${id}:`, error);
      throw error;
    }
  },

  deleteExpense: async (id: number): Promise<void> => {
    try {
      console.log(`🗑️ Deletando despesa ${id}...`);
      await api.delete(`/api/despesas/${id}`);
      console.log(`✅ Despesa ${id} deletada`);
    } catch (error: any) {
      console.error(`❌ Erro ao deletar despesa ${id}:`, error);
      throw error;
    }
  }
};