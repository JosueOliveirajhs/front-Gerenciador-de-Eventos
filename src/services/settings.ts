// src/services/settings.ts
import { api } from './api';

export interface SystemSettings {
  company: {
    name: string;
    document: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    logo?: string;
  };
  theme: {
    mode: 'light' | 'dark' | 'system';
    primaryColor: string;
    accentColor: string;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    newEventAlert: boolean;
    eventReminder: boolean;
    paymentReceived: boolean;
    lowStockAlert: boolean;
    reminderDays: number;
  };
  financial: {
    currency: 'BRL' | 'USD' | 'EUR';
    defaultPaymentTerms: number;
    requireDeposit: boolean;
    depositPercentage: number;
    autoGenerateInvoices: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordExpiryDays: number;
    maxLoginAttempts: number;
  };
  integrations: {
    googleCalendar: boolean;
    outlookCalendar: boolean;
    whatsApp: boolean;
    emailMarketing: boolean;
  };
}

export const settingsService = {
    /**
     * Busca as configurações do sistema
     */
    getSettings: async (): Promise<SystemSettings> => {
        console.log('⚙️ Buscando configurações do sistema...');
        
        try {
            const response = await api.get('/api/settings');
            console.log('✅ Configurações carregadas:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erro ao buscar configurações:', error);
            
            if (error.response?.status === 404) {
                // Se não existir, retorna configurações padrão
                console.log('ℹ️ Configurações não encontradas, usando padrão');
                return getDefaultSettings();
            }
            
            throw new Error(error.response?.data?.message || 'Erro ao carregar configurações');
        }
    },

    /**
     * Atualiza as configurações do sistema
     */
    updateSettings: async (settings: SystemSettings): Promise<SystemSettings> => {
        console.log('💾 Salvando configurações do sistema...');
        
        try {
            const response = await api.put('/api/settings', settings);
            console.log('✅ Configurações salvas:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erro ao salvar configurações:', error);
            throw new Error(error.response?.data?.message || 'Erro ao salvar configurações');
        }
    },

    /**
     * Restaura as configurações padrão
     */
    resetToDefault: async (): Promise<SystemSettings> => {
        console.log('🔄 Restaurando configurações padrão...');
        
        try {
            const response = await api.post('/api/settings/reset');
            console.log('✅ Configurações restauradas:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erro ao restaurar configurações:', error);
            
            // Se o endpoint não existir, retorna as configurações padrão localmente
            const defaultSettings = getDefaultSettings();
            console.log('ℹ️ Usando configurações padrão locais');
            return defaultSettings;
        }
    }
};

/**
 * Configurações padrão do sistema
 */
function getDefaultSettings(): SystemSettings {
    return {
        company: {
            name: "Eventos Fáceis",
            document: "",
            phone: "",
            email: "",
            address: "",
            city: "",
            state: "",
            zipCode: ""
        },
        theme: {
            mode: 'light',
            primaryColor: '#3b82f6',
            accentColor: '#10b981'
        },
        notifications: {
            emailEnabled: true,
            smsEnabled: false,
            newEventAlert: true,
            eventReminder: true,
            paymentReceived: true,
            lowStockAlert: true,
            reminderDays: 3
        },
        financial: {
            currency: 'BRL',
            defaultPaymentTerms: 30,
            requireDeposit: true,
            depositPercentage: 30,
            autoGenerateInvoices: true
        },
        security: {
            twoFactorAuth: false,
            sessionTimeout: 60,
            passwordExpiryDays: 90,
            maxLoginAttempts: 5
        },
        integrations: {
            googleCalendar: false,
            outlookCalendar: false,
            whatsApp: false,
            emailMarketing: false
        }
    };
}