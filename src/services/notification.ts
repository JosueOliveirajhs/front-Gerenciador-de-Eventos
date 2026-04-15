// src/services/notification.ts
import { api } from './api';

export interface Notification {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: string;
  prioridade: string;
  dataCriacao: string;
  lida: boolean;
  urlAcao: string | null;
  remetenteId: number | null;
  remetenteNome: string | null;
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
  getAllNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await api.get('/api/notifications');
      const data = response.data || [];
      
      return data.map((n: any) => ({
        id: n.id,
        titulo: n.titulo || n.title || 'Sem titulo',
        mensagem: n.mensagem || n.message || '',
        tipo: (n.tipo || n.type || 'SYSTEM').toLowerCase(),
        prioridade: (n.prioridade || n.priority || 'MEDIUM').toLowerCase(),
        dataCriacao: n.dataCriacao || n.createdAt || new Date().toISOString(),
        lida: n.lida !== undefined ? n.lida : (n.read !== undefined ? n.read : n.isRead !== undefined ? n.isRead : false),
        urlAcao: n.urlAcao || n.actionUrl || n.link || null,
        remetenteId: n.remetenteId || n.senderId || null,
        remetenteNome: n.remetenteNome || n.senderName || null
      }));
    } catch (error) {
      console.error('Erro ao buscar notificacoes:', error);
      return [];
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await api.get('/api/notifications/unread-count');
      return response.data || 0;
    } catch (error) {
      console.error('Erro ao buscar contagem de nao lidas:', error);
      return 0;
    }
  },

  markAsRead: async (id: number): Promise<void> => {
    try {
      await api.put(`/api/notifications/${id}/read`);
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      throw error;
    }
  },

  markAllAsRead: async (): Promise<void> => {
    try {
      await api.put('/api/notifications/read-all');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      throw error;
    }
  },

  deleteNotification: async (id: number): Promise<void> => {
    try {
      await api.delete(`/api/notifications/${id}`);
    } catch (error) {
      console.error('Erro ao deletar notificacao:', error);
      throw error;
    }
  },

  createNotification: async (data: any): Promise<Notification> => {
    const payload = {
      titulo: data.titulo || data.title || '',
      mensagem: data.mensagem || data.message || '',
      tipo: (data.tipo || data.type || 'SYSTEM').toUpperCase(),
      prioridade: (data.prioridade || data.priority || 'MEDIUM').toUpperCase(),
      destinatarios: data.destinatarios || data.recipientIds || [],
      urlAcao: data.urlAcao || data.actionUrl || null
    };

    if (!payload.titulo) throw new Error('Titulo e obrigatorio');
    if (!payload.mensagem) throw new Error('Mensagem e obrigatoria');
    if (!payload.destinatarios.length) throw new Error('Selecione pelo menos um destinatario');

    const response = await api.post('/api/notifications', payload);
    const result = Array.isArray(response.data) ? response.data[0] : response.data;
    
    return {
      id: result.id,
      titulo: result.titulo || result.title || '',
      mensagem: result.mensagem || result.message || '',
      tipo: (result.tipo || result.type || 'SYSTEM').toLowerCase(),
      prioridade: (result.prioridade || result.priority || 'MEDIUM').toLowerCase(),
      dataCriacao: result.dataCriacao || result.createdAt || new Date().toISOString(),
      lida: result.lida !== undefined ? result.lida : false,
      urlAcao: result.urlAcao || result.actionUrl || result.link || null,
      remetenteId: result.remetenteId || result.senderId || null,
      remetenteNome: result.remetenteNome || result.senderName || null
    };
  },

  getPreferences: async (): Promise<NotificationPreferences> => {
    try {
      const response = await api.get('/api/notifications/preferences');
      return {
        email: { ...DEFAULT_PREFERENCES.email, ...(response.data?.email || {}) },
        inApp: { ...DEFAULT_PREFERENCES.inApp, ...(response.data?.inApp || {}) },
        reminderDays: response.data?.reminderDays ?? DEFAULT_PREFERENCES.reminderDays,
        quietHours: { ...DEFAULT_PREFERENCES.quietHours, ...(response.data?.quietHours || {}) }
      };
    } catch (error) {
      console.error('Erro ao carregar preferencias:', error);
      return DEFAULT_PREFERENCES;
    }
  },

  updatePreferences: async (preferences: NotificationPreferences): Promise<NotificationPreferences> => {
    try {
      const response = await api.put('/api/notifications/preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Erro ao salvar preferencias:', error);
      throw error;
    }
  }
};

export default notificationService;