// src/services/budget.ts
import { api } from './api';

export interface BudgetRequest {
  eventType: string;
  guestCount: number;
  hours: number;
  hasDecoration: boolean;
  hasCatering: boolean;
  hasPhotography: boolean;
  hasMusic: boolean;
  clientId?: number;
}

export interface BudgetResult {
  basePrice: number;
  servicesTotal: number;
  discount: number;
  finalPrice: number;
  suggestedPackage: string;
  collabSavings: number;
}

export const budgetService = {
  /**
   * Calcula orçamento baseado nas configurações
   */
  calculate: async (request: BudgetRequest): Promise<BudgetResult> => {
    try {
      const response = await api.post('/budget/calculate', request);
      return response.data;
    } catch (error) {
      console.error('Erro ao calcular orçamento:', error);
      
      // Fallback: Cálculo local caso API falhe
      return budgetService.calculateLocal(request);
    }
  },

  /**
   * Cálculo local (fallback)
   */
  calculateLocal: (request: BudgetRequest): BudgetResult => {
    // Lógica de cálculo baseada no tipo de evento
    const basePrices: Record<string, number> = {
      'ANIVERSARIO': 1500,
      'CASAMENTO': 3000,
      'CORPORATIVO': 2000,
      'FORMATURA': 2500,
      'CONFRATERNIZACAO': 1800
    };
    
    const basePrice = basePrices[request.eventType] || 2000;
    
    // Cálculo por convidado
    const guestMultiplier = 1 + (request.guestCount / 100);
    
    // Cálculo por hora
    const hourMultiplier = 1 + ((request.hours - 4) * 0.1);
    
    let finalBase = basePrice * guestMultiplier * hourMultiplier;
    
    // Serviços adicionais
    let servicesTotal = 0;
    if (request.hasDecoration) servicesTotal += request.guestCount * 30;
    if (request.hasCatering) servicesTotal += request.guestCount * 50;
    if (request.hasPhotography) servicesTotal += 1500;
    if (request.hasMusic) servicesTotal += 1200;
    
    // Desconto por collab (simulado)
    const collabSavings = (finalBase + servicesTotal) * 0.15;
    const discount = collabSavings;
    
    const finalPrice = finalBase + servicesTotal - discount;
    
    // Sugestão de pacote
    let suggestedPackage = 'Pacote Básico';
    if (request.hasCatering && request.hasDecoration) {
      suggestedPackage = 'Pacote Premium';
    } else if (request.guestCount > 100) {
      suggestedPackage = 'Pacote Corporativo';
    }
    
    return {
      basePrice: finalBase,
      servicesTotal,
      discount,
      finalPrice,
      suggestedPackage,
      collabSavings
    };
  },

  /**
   * Salva orçamento para o cliente
   */
  saveBudget: async (budgetData: any): Promise<void> => {
    const response = await api.post('/budget/save', budgetData);
    return response.data;
  },

  /**
   * Busca orçamentos salvos do cliente
   */
  getSavedBudgets: async (): Promise<any[]> => {
    const response = await api.get('/budget/saved');
    return response.data;
  }
};