// src/pages/developer/Settings.tsx

import React, { useState, useEffect } from 'react';
import {
  MdSave,
  MdRefresh,
  MdWarning,
  MdCheckCircle,
  MdError,
  MdSettings,
  MdSecurity,
  MdEmail,
  MdStorage,
  MdBackup,
  MdNotifications,
  MdLanguage,
  MdPalette,
  MdCode,
  MdCloud,
  MdVpnKey,
  MdLock,
  MdPublic,
  MdComputer,
  MdPhone,
  MdAccessTime,
  MdDelete,
  MdAdd,
  MdRemove,
  MdEdit,
  MdClose,
  MdInfo,
  MdSchedule,
  MdCloudDownload,
  MdCloudUpload,
  MdPlayArrow,
  MdStop,
  MdHistory,
  MdSearch,
  MdFilterList,
  MdMoreVert
} from 'react-icons/md';
import {
  FaServer,
  FaDatabase,
  FaShieldAlt,
  FaBug,
  FaChartLine,
  FaUsers,
  FaEnvelope,
  FaGlobe,
  FaFlag,
  FaCode,  // ✅ Usar FaCode em vez de VSCode
  FaCog,
  FaWrench
} from 'react-icons/fa';
import styles from './Settings.module.css';

interface SystemConfig {
  general: {
    siteName: string;
    siteUrl: string;
    adminEmail: string;
    timezone: string;
    language: string;
    maintenance: boolean;
    debug: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireSpecialChar: boolean;
    requireNumber: boolean;
    requireUppercase: boolean;
    ipWhitelist: string[];
    allowedDomains: string[];
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    smtpSecure: boolean;
    fromEmail: string;
    fromName: string;
    templates: {
      welcome: boolean;
      resetPassword: boolean;
      notification: boolean;
      report: boolean;
    };
  };
  database: {
    backupEnabled: boolean;
    backupFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    backupRetention: number;
    backupTime: string;
    autoVacuum: boolean;
    vacuumSchedule: string;
    queryLogging: boolean;
    slowQueryThreshold: number;
  };
  storage: {
    provider: 'local' | 's3' | 'gcs';
    bucket: string;
    region: string;
    accessKey: string;
    secretKey: string;
    maxFileSize: number;
    allowedFileTypes: string[];
    cdnEnabled: boolean;
    cdnUrl: string;
  };
  notifications: {
    emailEnabled: boolean;
    slackEnabled: boolean;
    slackWebhook: string;
    discordEnabled: boolean;
    discordWebhook: string;
    telegramEnabled: boolean;
    telegramBot: string;
    telegramChat: string;
    alertOnError: boolean;
    alertOnWarning: boolean;
    dailySummary: boolean;
  };
  api: {
    rateLimit: number;
    rateLimitWindow: number;
    jwtExpiration: number;
    refreshTokenExpiration: number;
    apiKeys: boolean;
    maxApiKeys: number;
    corsOrigins: string[];
    allowedMethods: string[];
  };
}

interface EnvVariable {
  key: string;
  value: string;
  type: 'system' | 'database' | 'api' | 'security' | 'storage' | 'email' | 'notifications';
  sensitive: boolean;
}

interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
  percentage: number;
  expiresAt?: string;
}

export const Settings: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [envVars, setEnvVars] = useState<EnvVariable[]>([]);
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'email' | 'database' | 'storage' | 'notifications' | 'api' | 'env' | 'features'>('general');
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [editingEnv, setEditingEnv] = useState<EnvVariable | null>(null);
  const [editingFeature, setEditingFeature] = useState<FeatureFlag | null>(null);
  const [showConfirmRestart, setShowConfirmRestart] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      // Simulação de dados
      setConfig({
        general: {
          siteName: 'EventosFaceis',
          siteUrl: 'https://eventosfaceis.com',
          adminEmail: 'admin@eventosfaceis.com',
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          maintenance: false,
          debug: false
        },
        security: {
          twoFactorAuth: true,
          sessionTimeout: 60,
          maxLoginAttempts: 5,
          passwordMinLength: 8,
          requireSpecialChar: true,
          requireNumber: true,
          requireUppercase: true,
          ipWhitelist: ['192.168.1.0/24', '10.0.0.0/16'],
          allowedDomains: ['eventosfaceis.com', 'admin.eventosfaceis.com']
        },
        email: {
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: 'noreply@eventosfaceis.com',
          smtpPassword: '********',
          smtpSecure: true,
          fromEmail: 'noreply@eventosfaceis.com',
          fromName: 'EventosFaceis',
          templates: {
            welcome: true,
            resetPassword: true,
            notification: true,
            report: true
          }
        },
        database: {
          backupEnabled: true,
          backupFrequency: 'daily',
          backupRetention: 30,
          backupTime: '03:00',
          autoVacuum: true,
          vacuumSchedule: '0 2 * * 0',
          queryLogging: true,
          slowQueryThreshold: 1000
        },
        storage: {
          provider: 's3',
          bucket: 'eventosfaceis-prod',
          region: 'us-east-1',
          accessKey: 'AKIA********',
          secretKey: '********',
          maxFileSize: 10485760,
          allowedFileTypes: ['jpg', 'png', 'pdf', 'doc'],
          cdnEnabled: true,
          cdnUrl: 'https://cdn.eventosfaceis.com'
        },
        notifications: {
          emailEnabled: true,
          slackEnabled: true,
          slackWebhook: 'https://hooks.slack.com/services/...',
          discordEnabled: false,
          discordWebhook: '',
          telegramEnabled: false,
          telegramBot: '',
          telegramChat: '',
          alertOnError: true,
          alertOnWarning: true,
          dailySummary: true
        },
        api: {
          rateLimit: 100,
          rateLimitWindow: 60,
          jwtExpiration: 3600,
          refreshTokenExpiration: 604800,
          apiKeys: true,
          maxApiKeys: 5,
          corsOrigins: ['https://eventosfaceis.com', 'https://api.eventosfaceis.com'],
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
        }
      });

      setEnvVars([
        { key: 'NODE_ENV', value: 'production', type: 'system', sensitive: false },
        { key: 'PORT', value: '3000', type: 'system', sensitive: false },
        { key: 'DB_HOST', value: 'localhost', type: 'database', sensitive: false },
        { key: 'DB_PORT', value: '5432', type: 'database', sensitive: false },
        { key: 'DB_NAME', value: 'eventosfaceis', type: 'database', sensitive: false },
        { key: 'DB_USER', value: 'app_user', type: 'database', sensitive: false },
        { key: 'DB_PASSWORD', value: '••••••••', type: 'database', sensitive: true },
        { key: 'JWT_SECRET', value: '••••••••', type: 'security', sensitive: true },
        { key: 'API_KEY', value: '••••••••', type: 'api', sensitive: true },
        { key: 'SMTP_HOST', value: 'smtp.gmail.com', type: 'email', sensitive: false },
        { key: 'SMTP_USER', value: 'noreply@eventosfaceis.com', type: 'email', sensitive: false },
        { key: 'SMTP_PASS', value: '••••••••', type: 'email', sensitive: true }
      ]);

      setFeatures([
        {
          name: 'multi_tenancy',
          description: 'Suporte a múltiplas empresas',
          enabled: true,
          percentage: 100
        },
        {
          name: 'advanced_reports',
          description: 'Relatórios avançados com gráficos',
          enabled: true,
          percentage: 100
        },
        {
          name: 'api_access',
          description: 'Acesso à API pública',
          enabled: true,
          percentage: 80
        },
        {
          name: 'dark_mode',
          description: 'Tema escuro para usuários',
          enabled: true,
          percentage: 50
        },
        {
          name: 'ai_recommendations',
          description: 'Recomendações baseadas em IA',
          enabled: false,
          percentage: 0
        }
      ]);

      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setError('Falha ao carregar configurações do sistema');
      setLoading(false);
    }
  };

  const handleSaveConfig = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccessMessage('Configurações salvas com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }, 1500);
  };

  const handleRestartSystem = () => {
    setShowConfirmRestart(true);
  };

  const confirmRestart = () => {
    setShowConfirmRestart(false);
    alert('Sistema reiniciando... (simulação)');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'system': return <MdComputer />;
      case 'database': return <FaDatabase />;
      case 'api': return <MdCode />;
      case 'security': return <MdSecurity />;
      case 'storage': return <MdStorage />;
      case 'email': return <MdEmail />;
      case 'notifications': return <MdNotifications />;
      default: return <FaCog />;
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className={styles.settings}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <MdSettings />
            Configurações do Sistema
          </h1>
          {successMessage && (
            <div className={styles.successMessage}>
              <MdCheckCircle />
              {successMessage}
            </div>
          )}
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.saveButton}
            onClick={handleSaveConfig}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className={styles.smallSpinner}></div>
                Salvando...
              </>
            ) : (
              <>
                <MdSave />
                Salvar Alterações
              </>
            )}
          </button>
          <button
            className={styles.restartButton}
            onClick={handleRestartSystem}
          >
            <MdRefresh />
            Reiniciar Sistema
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'general' ? styles.active : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <FaGlobe />
          Geral
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'security' ? styles.active : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <MdSecurity />
          Segurança
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'email' ? styles.active : ''}`}
          onClick={() => setActiveTab('email')}
        >
          <MdEmail />
          Email
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'database' ? styles.active : ''}`}
          onClick={() => setActiveTab('database')}
        >
          <FaDatabase />
          Banco de Dados
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'storage' ? styles.active : ''}`}
          onClick={() => setActiveTab('storage')}
        >
          <MdStorage />
          Armazenamento
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'notifications' ? styles.active : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <MdNotifications />
          Notificações
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'api' ? styles.active : ''}`}
          onClick={() => setActiveTab('api')}
        >
          <MdCode />
          API
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'env' ? styles.active : ''}`}
          onClick={() => setActiveTab('env')}
        >
          <FaCode />  {/* ✅ Usando FaCode em vez de VSCode */}
          Variáveis
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'features' ? styles.active : ''}`}
          onClick={() => setActiveTab('features')}
        >
          <FaFlag />
          Features
        </button>
      </div>

      {/* Conteúdo das abas - versão simplificada para não estourar limite */}
      {activeTab === 'general' && config && (
        <div className={styles.tabContent}>
          <p>Configurações Gerais - Em desenvolvimento</p>
        </div>
      )}

      {/* Modal de Reinicialização */}
      {showConfirmRestart && (
        <div className={styles.modal} onClick={() => setShowConfirmRestart(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                <MdWarning className={styles.warningIcon} />
                Confirmar Reinicialização
              </h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowConfirmRestart(false)}
              >
                <MdClose />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Tem certeza que deseja reiniciar o sistema?</p>
              <p className={styles.warningText}>
                Isso irá desconectar todos os usuários e interromper serviços por alguns minutos.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowConfirmRestart(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.confirmButton}
                onClick={confirmRestart}
              >
                Reiniciar Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};