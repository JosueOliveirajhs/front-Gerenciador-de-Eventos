import { api } from './api';

export interface Notification {
  id: number;
  type: 'event' | 'payment' | 'stock' | 'system' | 'reminder';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
}

export interface NotificationPreferences {
  email: { newEvent: boolean; eventReminder: boolean; paymentReceived: boolean; lowStock: boolean; systemUpdates: boolean; };
  inApp: { newEvent: boolean; eventReminder: boolean; paymentReceived: boolean; lowStock: boolean; systemUpdates: boolean; };
  reminderDays: number;
  quietHours: { enabled: boolean; start: string; end: string; };
}

// ==========================================
// ADAPTER: Tradutor Backend (Java) -> Frontend
// Garante que independente de como o Java mandar, o Front vai entender
// ==========================================
const mapJavaToFrontendNotification = (data: any): Notification => {
  // Traduz os tipos que podem vir do Java
  const typeMap: Record<string, Notification['type']> = {
    'EVENTO': 'event', 'event': 'event',
    'PAGAMENTO': 'payment', 'payment': 'payment',
    'ESTOQUE': 'stock', 'stock': 'stock',
    'SISTEMA': 'system', 'system': 'system',
    'LEMBRETE': 'reminder', 'reminder': 'reminder',
  };

  // Traduz as prioridades
  const priorityMap: Record<string, Notification['priority']> = {
    'ALTA': 'high', 'high': 'high',
    'MEDIA': 'medium', 'medium': 'medium',
    'BAIXA': 'low', 'low': 'low',
  };

  return {
    id: data.id,
    type: typeMap[String(data.tipo || data.type).toUpperCase()] || 'system',
    title: data.titulo || data.title || 'Sem título',
    message: data.mensagem || data.message || '',
    timestamp: data.dataCriacao || data.timestamp || data.dataHora || new Date().toISOString(),
    read: data.lida !== undefined ? data.lida : (data.read || false),
    priority: priorityMap[String(data.prioridade || data.priority).toUpperCase()] || 'medium',
    actionUrl: data.urlAcao || data.actionUrl
  };
};

export const notificationService = {
  // GET /api/notifications
  getAllNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await api.get('/api/notifications');
      // Mapeia todos os itens retornados pelo backend usando o tradutor
      return response.data.map(mapJavaToFrontendNotification);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      throw error;
    }
  },

  // PATCH /api/notifications/{id}/read
  markAsRead: async (id: number): Promise<void> => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
    } catch (error) {
      console.error(`Erro ao marcar notificação ${id} como lida:`, error);
      throw error;
    }
  },

  // PATCH /api/notifications/read-all
  markAllAsRead: async (): Promise<void> => {
    try {
      await api.patch('/api/notifications/read-all');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      throw error;
    }
  },

  // Mock: Backend não tem endpoint para limpar tudo ainda
  clearAll: async (): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, 500));
  },

  // Mock: Backend não tem endpoint de preferências ainda
  savePreferences: async (preferences: NotificationPreferences): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, 800));
  }
};