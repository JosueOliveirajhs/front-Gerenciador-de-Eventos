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
  };
  notifications: {
    emailEnabled: boolean;
    systemNotifications: boolean;
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
    sessionTimeout: number;
    passwordExpiryDays: number;
    maxLoginAttempts: number;
    twoFactorAuth: boolean;
  };
  integrations: {
    googleCalendar: boolean;
    outlookCalendar: boolean;
    whatsApp: boolean;
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
            
            // Garantir que todos os campos existam (mesclar com defaults)
            return mergeWithDefaults(response.data);
        } catch (error: any) {
            console.error('❌ Erro ao buscar configurações:', error);
            
            if (error.response?.status === 404) {
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
            return mergeWithDefaults(response.data);
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
            return mergeWithDefaults(response.data);
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
 * Mescla as configurações recebidas com os valores padrão
 * para garantir que nenhum campo obrigatório esteja faltando
 */
function mergeWithDefaults(settings: Partial<SystemSettings>): SystemSettings {
    const defaults = getDefaultSettings();
    
    return {
        company: {
            ...defaults.company,
            ...(settings.company || {})
        },
        theme: {
            ...defaults.theme,
            ...(settings.theme || {})
        },
        notifications: {
            ...defaults.notifications,
            ...(settings.notifications || {})
        },
        financial: {
            ...defaults.financial,
            ...(settings.financial || {})
        },
        security: {
            ...defaults.security,
            ...(settings.security || {})
        },
        integrations: {
            ...defaults.integrations,
            ...(settings.integrations || {})
        }
    };
}

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
            zipCode: "",
            logo: ""
        },
        theme: {
            mode: 'system'
        },
        notifications: {
            emailEnabled: true,
            systemNotifications: true,
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
            sessionTimeout: 60,
            passwordExpiryDays: 90,
            maxLoginAttempts: 5,
            twoFactorAuth: false
        },
        integrations: {
            googleCalendar: false,
            outlookCalendar: false,
            whatsApp: false
        }
    };
}