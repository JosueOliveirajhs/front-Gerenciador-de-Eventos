// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor de Request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Erro no interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Interceptor de Response
api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const url = error.config?.url || '';
    const status = error.response?.status;

    // ✅ Silenciar 403 para rotas que o frontend já trata com try/catch
    const silent403Patterns = ['/proposals/', '/contracts/'];
    const isSilent403 = status === 403 && silent403Patterns.some(p => url.includes(p));

    if (!isSilent403) {
      console.error('❌ Erro na resposta:', {
        url: url,
        status: status,
        message: error.message,
        code: error.code
      });

      if (status === 403) {
        console.log('🔒 Acesso proibido - verifique permissões');
      }
    }

    if (status === 401) {
      console.log('🔑 Token inválido ou expirado, redirecionando para login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    if (error.code === 'ERR_NETWORK') {
      console.error('🌐 Problema de conexão com o servidor.');
    }

    return Promise.reject(error);
  }
);

// ============================================
// 🎯 SERVIÇOS DE INTEGRAÇÃO
// ============================================

export type IntegrationProvider = 'google' | 'outlook' | 'whatsapp';

export interface IntegrationStatus {
  connected: boolean;
  email?: string;
  phoneNumber?: string;
  displayName?: string;
  lastSync?: string;
  expiresAt?: string;
}

export interface OAuthCallbackResponse {
  success: boolean;
  provider: IntegrationProvider;
  message: string;
  email?: string;
  phoneNumber?: string;
}

export interface WhatsAppConfig {
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  webhookVerifyToken?: string;
}

export const integrationsService = {
  google: {
    getAuthUrl: async (redirectUri?: string): Promise<string> => {
      const response = await api.get('/api/integrations/google/auth-url', {
        params: { redirectUri: redirectUri || window.location.origin + '/configuracoes' }
      });
      return response.data.authUrl;
    },

    handleCallback: async (code: string, state?: string): Promise<OAuthCallbackResponse> => {
      const response = await api.post('/api/integrations/google/callback', { code, state });
      return response.data;
    },

    getStatus: async (): Promise<IntegrationStatus> => {
      const response = await api.get('/api/integrations/google/status');
      return response.data;
    },

    syncEvents: async (eventId?: string): Promise<any> => {
      const response = await api.post('/api/integrations/google/sync', { eventId });
      return response.data;
    },

    exportEvent: async (eventData: any): Promise<any> => {
      const response = await api.post('/api/integrations/google/events', eventData);
      return response.data;
    },

    disconnect: async (): Promise<void> => {
      await api.delete('/api/integrations/google/disconnect');
    }
  },

  outlook: {
    getAuthUrl: async (redirectUri?: string): Promise<string> => {
      const response = await api.get('/api/integrations/outlook/auth-url', {
        params: { redirectUri: redirectUri || window.location.origin + '/configuracoes' }
      });
      return response.data.authUrl;
    },

    handleCallback: async (code: string, state?: string): Promise<OAuthCallbackResponse> => {
      const response = await api.post('/api/integrations/outlook/callback', { code, state });
      return response.data;
    },

    getStatus: async (): Promise<IntegrationStatus> => {
      const response = await api.get('/api/integrations/outlook/status');
      return response.data;
    },

    syncEvents: async (eventId?: string): Promise<any> => {
      const response = await api.post('/api/integrations/outlook/sync', { eventId });
      return response.data;
    },

    exportEvent: async (eventData: any): Promise<any> => {
      const response = await api.post('/api/integrations/outlook/events', eventData);
      return response.data;
    },

    disconnect: async (): Promise<void> => {
      await api.delete('/api/integrations/outlook/disconnect');
    }
  },

  whatsapp: {
    configure: async (config: WhatsAppConfig): Promise<any> => {
      const response = await api.post('/api/integrations/whatsapp/configure', config);
      return response.data;
    },

    getStatus: async (): Promise<IntegrationStatus> => {
      const response = await api.get('/api/integrations/whatsapp/status');
      return response.data;
    },

    sendTestMessage: async (phoneNumber: string, message?: string): Promise<any> => {
      const response = await api.post('/api/integrations/whatsapp/send-test', {
        phoneNumber,
        message: message || '🧪 Mensagem de teste do Sistema de Eventos'
      });
      return response.data;
    },

    sendEventReminder: async (eventId: string, phoneNumber: string): Promise<any> => {
      const response = await api.post('/api/integrations/whatsapp/send-reminder', {
        eventId,
        phoneNumber
      });
      return response.data;
    },

    verifyWebhook: async (mode: string, token: string, challenge: string): Promise<any> => {
      const response = await api.get('/api/integrations/whatsapp/webhook', {
        params: { 
          'hub.mode': mode, 
          'hub.verify_token': token, 
          'hub.challenge': challenge 
        }
      });
      return response.data;
    },

    handleWebhook: async (payload: any): Promise<any> => {
      const response = await api.post('/api/integrations/whatsapp/webhook', payload);
      return response.data;
    },

    disconnect: async (): Promise<void> => {
      await api.delete('/api/integrations/whatsapp/disconnect');
    }
  },

  getStatus: async (): Promise<Record<IntegrationProvider, IntegrationStatus>> => {
    const response = await api.get('/api/integrations/status');
    return response.data;
  },

  syncAll: async (): Promise<any> => {
    const response = await api.post('/api/integrations/sync-all');
    return response.data;
  },

  disconnectAll: async (): Promise<void> => {
    await api.delete('/api/integrations/disconnect-all');
  }
};

// ============================================
// 🎯 SERVIÇOS DE EVENTOS (com integração)
// ============================================

export const eventsService = {
  createEvent: async (eventData: any, syncToCalendar?: boolean): Promise<any> => {
    const response = await api.post('/api/events', {
      ...eventData,
      syncToCalendar: syncToCalendar || false
    });
    return response.data;
  },

  updateEvent: async (eventId: string, eventData: any, syncToCalendar?: boolean): Promise<any> => {
    const response = await api.put(`/api/events/${eventId}`, {
      ...eventData,
      syncToCalendar: syncToCalendar || false
    });
    return response.data;
  },

  sendReminders: async (eventId: string, channels?: ('whatsapp' | 'email' | 'sms')[]): Promise<any> => {
    const response = await api.post(`/api/events/${eventId}/reminders`, { channels });
    return response.data;
  }
};

// ============================================
// 🎯 CONSTANTES DE CONFIGURAÇÃO
// ============================================

export const INTEGRATION_CONFIG = {
  GOOGLE: {
    name: 'Google Calendar',
    icon: 'https://www.google.com/calendar/images/calendar_48.png',
    color: '#4285F4',
    scopes: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly'
    ]
  },
  OUTLOOK: {
    name: 'Outlook Calendar',
    icon: 'https://outlook.live.com/favicon.ico',
    color: '#0078D4',
    scopes: [
      'Calendars.ReadWrite',
      'offline_access'
    ]
  },
  WHATSAPP: {
    name: 'WhatsApp Business',
    icon: 'https://static.whatsapp.net/rsrc.php/v3/yP/r/rYZqPCBaG70.png',
    color: '#25D366',
    apiVersion: 'v17.0'
  }
};

export default api;