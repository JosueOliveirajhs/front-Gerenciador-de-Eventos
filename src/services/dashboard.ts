import { api } from './api';
import { Event } from '../types/Event';

export interface DashboardStats {
  totalEvents: number;
  confirmedEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  quoteEvents: number;
  monthlyRevenue: number;
  totalRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  upcomingEvents: Event[];
  eventsByStatus: { [key: string]: number };
  eventsByMonth: { [key: string]: number };
  revenueByMonth: { [key: string]: number };
}

export const dashboardService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      console.log('📊 Buscando estatísticas do dashboard...');
      const response = await api.get('/dashboard/stats/owner');
      console.log('✅ Estatísticas recebidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      throw error;
    }
  },
};