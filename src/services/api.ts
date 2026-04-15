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
    console.error('❌ Erro na resposta:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      code: error.code
    });
    
    if (error.response?.status === 403) {
      console.log('🔒 Acesso proibido - verifique permissões');
    }
    
    if (error.response?.status === 401) {
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
  /**
   * 🔗 GOOGLE CALENDAR
   */
  google: {
    /**
     * Obtém a URL de autorização OAuth do Google
     */
    getAuthUrl: async (redirectUri?: string): Promise<string> => {
      const response = await api.get('/api/integrations/google/auth-url', {
        params: { redirectUri: redirectUri || window.location.origin + '/configuracoes' }
      });
      return response.data.authUrl;
    },

    /**
     * Processa o callback do OAuth do Google
     */
    handleCallback: async (code: string, state?: string): Promise<OAuthCallbackResponse> => {
      const response = await api.post('/api/integrations/google/callback', { code, state });
      return response.data;
    },

    /**
     * Verifica o status da conexão com o Google
     */
    getStatus: async (): Promise<IntegrationStatus> => {
      const response = await api.get('/api/integrations/google/status');
      return response.data;
    },

    /**
     * Sincroniza eventos com o Google Calendar
     */
    syncEvents: async (eventId?: string): Promise<any> => {
      const response = await api.post('/api/integrations/google/sync', { eventId });
      return response.data;
    },

    /**
     * Exporta um evento para o Google Calendar
     */
    exportEvent: async (eventData: any): Promise<any> => {
      const response = await api.post('/api/integrations/google/events', eventData);
      return response.data;
    },

    /**
     * Desconecta a integração com o Google
     */
    disconnect: async (): Promise<void> => {
      await api.delete('/api/integrations/google/disconnect');
    }
  },

  /**
   * 🔵 OUTLOOK CALENDAR
   */
  outlook: {
    /**
     * Obtém a URL de autorização OAuth do Outlook/Microsoft
     */
    getAuthUrl: async (redirectUri?: string): Promise<string> => {
      const response = await api.get('/api/integrations/outlook/auth-url', {
        params: { redirectUri: redirectUri || window.location.origin + '/configuracoes' }
      });
      return response.data.authUrl;
    },

    /**
     * Processa o callback do OAuth do Outlook
     */
    handleCallback: async (code: string, state?: string): Promise<OAuthCallbackResponse> => {
      const response = await api.post('/api/integrations/outlook/callback', { code, state });
      return response.data;
    },

    /**
     * Verifica o status da conexão com o Outlook
     */
    getStatus: async (): Promise<IntegrationStatus> => {
      const response = await api.get('/api/integrations/outlook/status');
      return response.data;
    },

    /**
     * Sincroniza eventos com o Outlook Calendar
     */
    syncEvents: async (eventId?: string): Promise<any> => {
      const response = await api.post('/api/integrations/outlook/sync', { eventId });
      return response.data;
    },

    /**
     * Exporta um evento para o Outlook Calendar
     */
    exportEvent: async (eventData: any): Promise<any> => {
      const response = await api.post('/api/integrations/outlook/events', eventData);
      return response.data;
    },

    /**
     * Desconecta a integração com o Outlook
     */
    disconnect: async (): Promise<void> => {
      await api.delete('/api/integrations/outlook/disconnect');
    }
  },

  /**
   * 💚 WHATSAPP BUSINESS
   */
  whatsapp: {
    /**
     * Configura a integração com WhatsApp Business API
     */
    configure: async (config: WhatsAppConfig): Promise<any> => {
      const response = await api.post('/api/integrations/whatsapp/configure', config);
      return response.data;
    },

    /**
     * Verifica o status da conexão com WhatsApp
     */
    getStatus: async (): Promise<IntegrationStatus> => {
      const response = await api.get('/api/integrations/whatsapp/status');
      return response.data;
    },

    /**
     * Envia uma mensagem de teste
     */
    sendTestMessage: async (phoneNumber: string, message?: string): Promise<any> => {
      const response = await api.post('/api/integrations/whatsapp/send-test', {
        phoneNumber,
        message: message || '🧪 Mensagem de teste do Sistema de Eventos'
      });
      return response.data;
    },

    /**
     * Envia lembrete de evento via WhatsApp
     */
    sendEventReminder: async (eventId: string, phoneNumber: string): Promise<any> => {
      const response = await api.post('/api/integrations/whatsapp/send-reminder', {
        eventId,
        phoneNumber
      });
      return response.data;
    },

    /**
     * Verifica o webhook de callback do WhatsApp
     */
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

    /**
     * Recebe mensagens do webhook do WhatsApp
     */
    handleWebhook: async (payload: any): Promise<any> => {
      const response = await api.post('/api/integrations/whatsapp/webhook', payload);
      return response.data;
    },

    /**
     * Desconecta a integração com WhatsApp
     */
    disconnect: async (): Promise<void> => {
      await api.delete('/api/integrations/whatsapp/disconnect');
    }
  },

  /**
   * 📊 STATUS GERAL DAS INTEGRAÇÕES
   */
  getStatus: async (): Promise<Record<IntegrationProvider, IntegrationStatus>> => {
    const response = await api.get('/api/integrations/status');
    return response.data;
  },

  /**
   * 🔄 SINCRONIZA TODAS AS INTEGRAÇÕES
   */
  syncAll: async (): Promise<any> => {
    const response = await api.post('/api/integrations/sync-all');
    return response.data;
  },

  /**
   * 🔌 DESCONECTA TODAS AS INTEGRAÇÕES
   */
  disconnectAll: async (): Promise<void> => {
    await api.delete('/api/integrations/disconnect-all');
  }
};

// ============================================
// 🎯 SERVIÇOS DE EVENTOS (com integração)
// ============================================

export const eventsService = {
  /**
   * Cria um evento e opcionalmente sincroniza com calendários
   */
  createEvent: async (eventData: any, syncToCalendar?: boolean): Promise<any> => {
    const response = await api.post('/api/events', {
      ...eventData,
      syncToCalendar: syncToCalendar || false
    });
    return response.data;
  },

  /**
   * Atualiza um evento e opcionalmente sincroniza
   */
  updateEvent: async (eventId: string, eventData: any, syncToCalendar?: boolean): Promise<any> => {
    const response = await api.put(`/api/events/${eventId}`, {
      ...eventData,
      syncToCalendar: syncToCalendar || false
    });
    return response.data;
  },

  /**
   * Envia lembretes do evento via WhatsApp e Email
   */
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

// Exporta a instância da API como padrão também
export default api;