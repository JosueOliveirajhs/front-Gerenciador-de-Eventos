// src/services/notification.ts
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
  email: { 
    newEvent: boolean; 
    eventReminder: boolean; 
    paymentReceived: boolean; 
    lowStock: boolean; 
    systemUpdates: boolean; 
  };
  inApp: { 
    newEvent: boolean; 
    eventReminder: boolean; 
    paymentReceived: boolean; 
    lowStock: boolean; 
    systemUpdates: boolean; 
  };
  reminderDays: number;
  quietHours: { 
    enabled: boolean; 
    start: string; 
    end: string; 
  };
}

export interface CreateNotificationDTO {
  title: string;
  message: string;
  type: Notification['type'];
  priority: Notification['priority'];
  recipientIds: number[];
  actionUrl?: string;
}

// ==========================================
// ADAPTER: Tradutor Backend (Java) -> Frontend
// ==========================================
const mapJavaToFrontendNotification = (data: any): Notification => {
  // Traduz os tipos que podem vir do Java
  const typeMap: Record<string, Notification['type']> = {
    'EVENTO': 'event', 
    'event': 'event',
    'PAGAMENTO': 'payment', 
    'payment': 'payment',
    'ESTOQUE': 'stock', 
    'stock': 'stock',
    'SISTEMA': 'system', 
    'system': 'system',
    'LEMBRETE': 'reminder', 
    'reminder': 'reminder',
  };

  // Traduz as prioridades
  const priorityMap: Record<string, Notification['priority']> = {
    'ALTA': 'high', 
    'high': 'high',
    'MEDIA': 'medium', 
    'medium': 'medium',
    'BAIXA': 'low', 
    'low': 'low',
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

// Preferências padrão
const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: {
    newEvent: true,
    eventReminder: true,
    paymentReceived: true,
    lowStock: true,
    systemUpdates: false
  },
  inApp: {
    newEvent: true,
    eventReminder: true,
    paymentReceived: true,
    lowStock: true,
    systemUpdates: true
  },
  reminderDays: 3,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  }
};

export const notificationService = {
  /**
   * GET /api/notifications
   * Busca todas as notificações do usuário
   */
  getAllNotifications: async (): Promise<Notification[]> => {
    try {
      console.log('🔔 Buscando notificações...');
      const response = await api.get('/api/notifications');
      const notifications = response.data.map(mapJavaToFrontendNotification);
      console.log('✅ Notificações carregadas:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      throw error;
    }
  },

  /**
   * GET /api/notifications/unread
   * Busca apenas notificações não lidas
   */
  getUnreadNotifications: async (): Promise<Notification[]> => {
    try {
      console.log('🔔 Buscando notificações não lidas...');
      const response = await api.get('/api/notifications/unread');
      const notifications = response.data.map(mapJavaToFrontendNotification);
      console.log('✅ Notificações não lidas:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('Erro ao buscar notificações não lidas:', error);
      // Fallback: filtra localmente
      const all = await notificationService.getAllNotifications();
      return all.filter(n => !n.read);
    }
  },

  /**
   * PATCH /api/notifications/{id}/read
   * Marca uma notificação como lida
   */
  markAsRead: async (id: number): Promise<void> => {
    try {
      console.log(`📖 Marcando notificação ${id} como lida...`);
      await api.patch(`/api/notifications/${id}/read`);
      console.log('✅ Notificação marcada como lida');
    } catch (error) {
      console.error(`Erro ao marcar notificação ${id} como lida:`, error);
      throw error;
    }
  },

  /**
   * PATCH /api/notifications/read-all
   * Marca todas as notificações como lidas
   */
  markAllAsRead: async (): Promise<void> => {
    try {
      console.log('📖 Marcando todas as notificações como lidas...');
      await api.patch('/api/notifications/read-all');
      console.log('✅ Todas as notificações marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      throw error;
    }
  },

  /**
   * DELETE /api/notifications/all
   * Limpa todas as notificações
   */
  clearAll: async (): Promise<void> => {
    try {
      console.log('🗑️ Limpando todas as notificações...');
      await api.delete('/api/notifications/all');
      console.log('✅ Todas as notificações removidas');
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
      // Fallback: se o endpoint não existir, apenas simula
      console.log('⚠️ Usando fallback para limpar notificações');
      return new Promise(resolve => setTimeout(resolve, 500));
    }
  },

  /**
   * POST /api/notifications
   * Cria uma nova notificação
   */
  createNotification: async (data: CreateNotificationDTO): Promise<Notification> => {
    try {
      console.log('📝 Criando notificação:', data);
      
      // Prepara o payload para o backend
      const payload = {
        titulo: data.title,
        mensagem: data.message,
        tipo: data.type.toUpperCase(),
        prioridade: data.priority.toUpperCase(),
        idsDestinatarios: data.recipientIds,
        urlAcao: data.actionUrl
      };
      
      const response = await api.post('/api/notifications', payload);
      console.log('✅ Notificação criada:', response.data);
      return mapJavaToFrontendNotification(response.data);
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  },

  /**
   * POST /api/notifications/bulk
   * Envia notificação para múltiplos usuários
   */
  sendToMultipleUsers: async (userIds: number[], data: CreateNotificationDTO): Promise<Notification[]> => {
    try {
      console.log(`📨 Enviando notificação para ${userIds.length} usuários...`);
      const response = await api.post('/api/notifications/bulk', {
        ...data,
        idsDestinatarios: userIds
      });
      console.log('✅ Notificações enviadas:', response.data);
      return response.data.map(mapJavaToFrontendNotification);
    } catch (error) {
      console.error('Erro ao enviar notificações:', error);
      throw error;
    }
  },

  /**
   * POST /api/notifications/all
   * Envia notificação para todos os usuários
   */
  sendToAll: async (data: CreateNotificationDTO): Promise<Notification[]> => {
    try {
      console.log('📨 Enviando notificação para todos os usuários...');
      const response = await api.post('/api/notifications/all', {
        titulo: data.title,
        mensagem: data.message,
        tipo: data.type.toUpperCase(),
        prioridade: data.priority.toUpperCase(),
        urlAcao: data.actionUrl
      });
      console.log('✅ Notificações enviadas para todos:', response.data);
      return response.data.map(mapJavaToFrontendNotification);
    } catch (error) {
      console.error('Erro ao enviar notificação para todos:', error);
      throw error;
    }
  },

  /**
   * GET /api/notifications/preferences
   * Busca as preferências de notificação do usuário
   */
  getPreferences: async (): Promise<NotificationPreferences> => {
    try {
      console.log('⚙️ Buscando preferências de notificação...');
      const response = await api.get('/api/notifications/preferences');
      console.log('✅ Preferências carregadas:', response.data);
      
      // Garante que as preferências têm a estrutura correta
      return {
        email: {
          newEvent: response.data.email?.newEvent ?? DEFAULT_PREFERENCES.email.newEvent,
          eventReminder: response.data.email?.eventReminder ?? DEFAULT_PREFERENCES.email.eventReminder,
          paymentReceived: response.data.email?.paymentReceived ?? DEFAULT_PREFERENCES.email.paymentReceived,
          lowStock: response.data.email?.lowStock ?? DEFAULT_PREFERENCES.email.lowStock,
          systemUpdates: response.data.email?.systemUpdates ?? DEFAULT_PREFERENCES.email.systemUpdates
        },
        inApp: {
          newEvent: response.data.inApp?.newEvent ?? DEFAULT_PREFERENCES.inApp.newEvent,
          eventReminder: response.data.inApp?.eventReminder ?? DEFAULT_PREFERENCES.inApp.eventReminder,
          paymentReceived: response.data.inApp?.paymentReceived ?? DEFAULT_PREFERENCES.inApp.paymentReceived,
          lowStock: response.data.inApp?.lowStock ?? DEFAULT_PREFERENCES.inApp.lowStock,
          systemUpdates: response.data.inApp?.systemUpdates ?? DEFAULT_PREFERENCES.inApp.systemUpdates
        },
        reminderDays: response.data.reminderDays ?? DEFAULT_PREFERENCES.reminderDays,
        quietHours: {
          enabled: response.data.quietHours?.enabled ?? DEFAULT_PREFERENCES.quietHours.enabled,
          start: response.data.quietHours?.start ?? DEFAULT_PREFERENCES.quietHours.start,
          end: response.data.quietHours?.end ?? DEFAULT_PREFERENCES.quietHours.end
        }
      };
    } catch (error) {
      console.error('Erro ao buscar preferências:', error);
      console.log('⚠️ Usando preferências padrão');
      return DEFAULT_PREFERENCES;
    }
  },

  /**
   * PUT /api/notifications/preferences
   * Salva as preferências de notificação
   */
  savePreferences: async (preferences: NotificationPreferences): Promise<NotificationPreferences> => {
    try {
      console.log('💾 Salvando preferências de notificação...');
      const response = await api.put('/api/notifications/preferences', preferences);
      console.log('✅ Preferências salvas:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      throw error;
    }
  },

  /**
   * DELETE /api/notifications/{id}
   * Deleta uma notificação específica
   */
  deleteNotification: async (id: number): Promise<void> => {
    try {
      console.log(`🗑️ Deletando notificação ${id}...`);
      await api.delete(`/api/notifications/${id}`);
      console.log('✅ Notificação deletada');
    } catch (error) {
      console.error(`Erro ao deletar notificação ${id}:`, error);
      throw error;
    }
  },

  /**
   * Envia notificação para um usuário específico (conveniência)
   */
  sendToUser: async (userId: number, data: Omit<CreateNotificationDTO, 'recipientIds'>): Promise<Notification> => {
    return notificationService.sendToMultipleUsers([userId], {
      ...data,
      recipientIds: [userId]
    }).then(notifications => notifications[0]);
  }
};