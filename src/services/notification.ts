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
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      throw error;
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await api.get('/api/notifications/unread-count');
      return response.data || 0;
    } catch (error) {
      return 0;
    }
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.put(`/api/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put('/api/notifications/read-all');
  },

  deleteNotification: async (id: number): Promise<void> => {
    await api.delete(`/api/notifications/${id}`);
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

    if (!payload.titulo) throw new Error('Título é obrigatório');
    if (!payload.mensagem) throw new Error('Mensagem é obrigatória');
    if (!payload.destinatarios.length) throw new Error('Selecione pelo menos um destinatário');

    const response = await api.post('/api/notifications', payload);
    return Array.isArray(response.data) ? response.data[0] : response.data;
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
      return DEFAULT_PREFERENCES;
    }
  },

  updatePreferences: async (preferences: NotificationPreferences): Promise<NotificationPreferences> => {
    const response = await api.put('/api/notifications/preferences', preferences);
    return response.data;
  }
};