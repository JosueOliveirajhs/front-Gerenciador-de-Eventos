// src/pages/Settings/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  FiSave, 
  FiBell, 
  FiLock, 
  FiMail,
  FiSun,
  FiMoon,
  FiMonitor,
  FiDollarSign,
  FiCalendar,
  FiClock,
  FiPackage,
  FiAlertCircle,
  FiPhone,
  FiInfo,
  FiSettings,
  FiGlobe,
  FiExternalLink,
  FiCheck,
  FiX,
  FiRefreshCw
} from 'react-icons/fi';
import { 
  MdBusiness, 
  MdPalette, 
  MdNotifications,
  MdSecurity,
  MdPayment,
  MdEvent,
  MdWarning
} from 'react-icons/md';
import { ConfirmationModal } from '../../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../../common/Alerts/ErrorModal';
import { settingsService, SystemSettings } from '../../../services/settings';
import { integrationsService, IntegrationProvider, IntegrationStatus } from '../../../services/api';
import { useTheme } from '../../../context/ThemeContext';
import styles from './SettingsPage.module.css';

type TabType = 'empresa' | 'aparencia' | 'notificacoes' | 'financeiro' | 'seguranca' | 'integracoes';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('empresa');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Estados para integrações
  const [integrationStatus, setIntegrationStatus] = useState<Record<IntegrationProvider, IntegrationStatus>>({
    google: { connected: false },
    outlook: { connected: false },
    whatsapp: { connected: false }
  });
  const [connecting, setConnecting] = useState<IntegrationProvider | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppConfig, setWhatsAppConfig] = useState({
    phoneNumberId: '',
    businessAccountId: '',
    accessToken: ''
  });

  useEffect(() => {
    loadSettings();
    loadIntegrationStatus();
    
    // Verificar se há callback de OAuth na URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const provider = urlParams.get('provider');
    
    if (code && provider) {
      handleOAuthCallback(provider as IntegrationProvider, code, state || undefined);
    }
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setErrorMessage('Erro ao carregar configurações. Tente novamente.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const loadIntegrationStatus = async () => {
    try {
      const status = await integrationsService.getStatus();
      setIntegrationStatus(status);
    } catch (error) {
      console.error('Erro ao carregar status das integrações:', error);
    }
  };

  const handleOAuthCallback = async (provider: IntegrationProvider, code: string, state?: string) => {
    setConnecting(provider);
    try {
      let response;
      if (provider === 'google') {
        response = await integrationsService.google.handleCallback(code, state);
      } else if (provider === 'outlook') {
        response = await integrationsService.outlook.handleCallback(code, state);
      }
      
      if (response?.success) {
        setSuccessMessage(`${provider === 'google' ? 'Google Calendar' : 'Outlook Calendar'} conectado com sucesso!`);
        setShowSuccessModal(true);
        await loadIntegrationStatus();
        
        // Limpar parâmetros da URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error(`Erro no callback do ${provider}:`, error);
      setErrorMessage(`Erro ao conectar com ${provider}. Tente novamente.`);
      setShowErrorModal(true);
    } finally {
      setConnecting(null);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      await settingsService.updateSettings(settings);
      setHasChanges(false);
      setSuccessMessage('Configurações salvas com sucesso!');
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      setErrorMessage(error.message || 'Erro ao salvar configurações. Tente novamente.');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      const defaultSettings = await settingsService.resetToDefault();
      setSettings(defaultSettings);
      setHasChanges(false);
      setSuccessMessage('Configurações restauradas com sucesso!');
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Erro ao restaurar configurações:', error);
      setErrorMessage(error.message || 'Erro ao restaurar configurações.');
      setShowErrorModal(true);
    }
  };

  const updateSettings = <K extends keyof SystemSettings>(
    section: K,
    values: Partial<SystemSettings[K]>
  ) => {
    if (!settings) return;
    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        ...values
      }
    }));
    setHasChanges(true);
  };

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setTheme(mode);
    if (settings) {
      updateSettings('theme', { mode });
    }
  };

  // Handlers para integrações
  const handleConnectGoogle = async () => {
    try {
      setConnecting('google');
      const authUrl = await integrationsService.google.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Erro ao conectar com Google:', error);
      setErrorMessage('Erro ao iniciar conexão com Google Calendar.');
      setShowErrorModal(true);
      setConnecting(null);
    }
  };

  const handleConnectOutlook = async () => {
    try {
      setConnecting('outlook');
      const authUrl = await integrationsService.outlook.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Erro ao conectar com Outlook:', error);
      setErrorMessage('Erro ao iniciar conexão com Outlook Calendar.');
      setShowErrorModal(true);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (provider: IntegrationProvider) => {
    try {
      if (provider === 'google') {
        await integrationsService.google.disconnect();
      } else if (provider === 'outlook') {
        await integrationsService.outlook.disconnect();
      } else if (provider === 'whatsapp') {
        await integrationsService.whatsapp.disconnect();
      }
      await loadIntegrationStatus();
      setSuccessMessage(`${getProviderName(provider)} desconectado com sucesso!`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error(`Erro ao desconectar ${provider}:`, error);
      setErrorMessage(`Erro ao desconectar ${getProviderName(provider)}.`);
      setShowErrorModal(true);
    }
  };

  const handleSyncCalendar = async (provider: 'google' | 'outlook') => {
    setSyncing(true);
    try {
      if (provider === 'google') {
        await integrationsService.google.syncEvents();
      } else {
        await integrationsService.outlook.syncEvents();
      }
      setSuccessMessage(`Calendário ${getProviderName(provider)} sincronizado com sucesso!`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error(`Erro ao sincronizar ${provider}:`, error);
      setErrorMessage(`Erro ao sincronizar com ${getProviderName(provider)}.`);
      setShowErrorModal(true);
    } finally {
      setSyncing(false);
    }
  };

  const handleConfigureWhatsApp = async () => {
    try {
      await integrationsService.whatsapp.configure(whatsAppConfig);
      await loadIntegrationStatus();
      setShowWhatsAppModal(false);
      setSuccessMessage('WhatsApp Business configurado com sucesso!');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Erro ao configurar WhatsApp:', error);
      setErrorMessage('Erro ao configurar WhatsApp. Verifique os dados.');
      setShowErrorModal(true);
    }
  };

  const handleSendTestWhatsApp = async () => {
    const phoneNumber = prompt('Digite o número para enviar a mensagem de teste (com DDD):');
    if (!phoneNumber) return;
    
    try {
      await integrationsService.whatsapp.sendTestMessage(phoneNumber);
      setSuccessMessage('Mensagem de teste enviada com sucesso!');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setErrorMessage('Erro ao enviar mensagem de teste.');
      setShowErrorModal(true);
    }
  };

  const getProviderName = (provider: IntegrationProvider): string => {
    const names: Record<IntegrationProvider, string> = {
      google: 'Google Calendar',
      outlook: 'Outlook Calendar',
      whatsapp: 'WhatsApp Business'
    };
    return names[provider];
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'empresa', label: 'Empresa', icon: <MdBusiness size={18} /> },
    { id: 'aparencia', label: 'Aparência', icon: <MdPalette size={18} /> },
    { id: 'notificacoes', label: 'Notificações', icon: <MdNotifications size={18} /> },
    { id: 'financeiro', label: 'Financeiro', icon: <MdPayment size={18} /> },
    { id: 'seguranca', label: 'Segurança', icon: <MdSecurity size={18} /> },
    { id: 'integracoes', label: 'Integrações', icon: <FiGlobe size={18} /> }
  ];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando configurações...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className={styles.errorContainer}>
        <MdWarning size={48} />
        <h3>Erro ao carregar configurações</h3>
        <button onClick={loadSettings} className={styles.retryButton}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className={styles.settingsPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <FiSettings size={28} />
            Configurações do Sistema
          </h1>
          <p className={styles.pageSubtitle}>
            Gerencie as configurações gerais do sistema
          </p>
        </div>

        <div className={styles.headerActions}>
          {hasChanges && (
            <span className={styles.unsavedBadge}>
              <FiAlertCircle size={14} />
              Alterações não salvas
            </span>
          )}
          <button
            className={styles.secondaryButton}
            onClick={handleReset}
            disabled={saving}
          >
            Restaurar Padrão
          </button>
          <button
            className={styles.primaryButton}
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <>
                <span className={styles.buttonSpinner}></span>
                Salvando...
              </>
            ) : (
              <>
                <FiSave size={18} />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>

      <div className={styles.settingsContainer}>
        <div className={styles.settingsSidebar}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.settingsContent}>
          {/* Aba Empresa */}
          {activeTab === 'empresa' && (
            <div className={styles.settingsSection}>
              <h2 className={styles.sectionTitle}>Informações da Empresa</h2>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <MdBusiness size={14} />
                    Nome da Empresa *
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.company.name}
                    onChange={(e) => updateSettings('company', { name: e.target.value })}
                    placeholder="Nome da empresa"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    CNPJ/CPF *
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.company.document}
                    onChange={(e) => updateSettings('company', { document: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <FiPhone size={14} />
                    Telefone
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.company.phone}
                    onChange={(e) => updateSettings('company', { phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <FiMail size={14} />
                    E-mail
                  </label>
                  <input
                    type="email"
                    className={styles.formInput}
                    value={settings.company.email}
                    onChange={(e) => updateSettings('company', { email: e.target.value })}
                    placeholder="contato@empresa.com"
                  />
                </div>

                <div className={styles.formGroupFull}>
                  <label className={styles.formLabel}>
                    Endereço
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.company.address}
                    onChange={(e) => updateSettings('company', { address: e.target.value })}
                    placeholder="Rua, número, bairro"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Cidade
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.company.city}
                    onChange={(e) => updateSettings('company', { city: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Estado
                  </label>
                  <select
                    className={styles.formInput}
                    value={settings.company.state}
                    onChange={(e) => updateSettings('company', { state: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    CEP
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.company.zipCode}
                    onChange={(e) => updateSettings('company', { zipCode: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
              </div>

              <div className={styles.infoBox}>
                <FiInfo size={20} />
                <div>
                  <strong>Logo da empresa</strong>
                  <p>Recomendamos uma imagem quadrada de pelo menos 200x200 pixels.</p>
                  <button className={styles.uploadButton} onClick={() => {}}>
                    Upload de Logo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Aba Aparência */}
          {activeTab === 'aparencia' && (
            <div className={styles.settingsSection}>
              <h2 className={styles.sectionTitle}>Personalização Visual</h2>
              
              <div className={styles.themeSection}>
                <p className={styles.sectionDescription}>
                  Escolha o tema visual do sistema
                </p>
                
                <div className={styles.themeOptions}>
                  <div className={styles.themeOption}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="themeMode"
                        checked={theme === 'light'}
                        onChange={() => handleThemeChange('light')}
                      />
                      <div className={styles.themeCard}>
                        <FiSun size={32} />
                        <span>Claro</span>
                        <small>Tema claro tradicional</small>
                      </div>
                    </label>
                  </div>

                  <div className={styles.themeOption}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="themeMode"
                        checked={theme === 'dark'}
                        onChange={() => handleThemeChange('dark')}
                      />
                      <div className={styles.themeCard}>
                        <FiMoon size={32} />
                        <span>Escuro</span>
                        <small>Melhor para ambientes com pouca luz</small>
                      </div>
                    </label>
                  </div>

                  <div className={styles.themeOption}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="themeMode"
                        checked={theme === 'system'}
                        onChange={() => handleThemeChange('system')}
                      />
                      <div className={styles.themeCard}>
                        <FiMonitor size={32} />
                        <span>Sistema</span>
                        <small>Acompanha a configuração do sistema</small>
                      </div>
                    </label>
                  </div>
                </div>

                <div className={styles.themeNote}>
                  <FiInfo size={16} />
                  <span>O tema será aplicado imediatamente em todo o sistema</span>
                </div>
              </div>
            </div>
          )}

          {/* Aba Notificações */}
          {activeTab === 'notificacoes' && (
            <div className={styles.settingsSection}>
              <h2 className={styles.sectionTitle}>Configurações de Notificações</h2>
              
              <div className={styles.notificationsSection}>
                <h3>Canais de Notificação</h3>
                
                <label className={styles.switchLabel}>
                  <div className={styles.switchInfo}>
                    <FiMail size={18} />
                    <div>
                      <strong>Notificações por E-mail</strong>
                      <p>Receber alertas e relatórios por e-mail</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailEnabled}
                    onChange={(e) => updateSettings('notifications', { emailEnabled: e.target.checked })}
                  />
                  <span className={styles.switchSlider}></span>
                </label>

                <label className={styles.switchLabel}>
                  <div className={styles.switchInfo}>
                    <FiBell size={18} />
                    <div>
                      <strong>Notificações no Sistema</strong>
                      <p>Receber alertas dentro do sistema</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.systemNotifications}
                    onChange={(e) => updateSettings('notifications', { systemNotifications: e.target.checked })}
                  />
                  <span className={styles.switchSlider}></span>
                </label>
              </div>

              <div className={styles.notificationsSection}>
                <h3>Alertas do Sistema</h3>
                
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={settings.notifications.newEventAlert}
                    onChange={(e) => updateSettings('notifications', { newEventAlert: e.target.checked })}
                  />
                  <MdEvent size={16} />
                  <span>Novo evento cadastrado</span>
                </label>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={settings.notifications.eventReminder}
                    onChange={(e) => updateSettings('notifications', { eventReminder: e.target.checked })}
                  />
                  <FiCalendar size={16} />
                  <span>Lembrete de evento</span>
                </label>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={settings.notifications.paymentReceived}
                    onChange={(e) => updateSettings('notifications', { paymentReceived: e.target.checked })}
                  />
                  <FiDollarSign size={16} />
                  <span>Pagamento recebido</span>
                </label>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={settings.notifications.lowStockAlert}
                    onChange={(e) => updateSettings('notifications', { lowStockAlert: e.target.checked })}
                  />
                  <FiPackage size={16} />
                  <span>Estoque baixo</span>
                </label>
              </div>

              <div className={styles.notificationsSection}>
                <h3>Configurações de Lembrete</h3>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <FiClock size={14} />
                    Lembrar com antecedência (dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className={styles.formInput}
                    value={settings.notifications.reminderDays}
                    onChange={(e) => updateSettings('notifications', { reminderDays: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Aba Financeiro */}
          {activeTab === 'financeiro' && (
            <div className={styles.settingsSection}>
              <h2 className={styles.sectionTitle}>Configurações Financeiras</h2>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <FiDollarSign size={14} />
                    Moeda Padrão
                  </label>
                  <select
                    className={styles.formInput}
                    value={settings.financial.currency}
                    onChange={(e) => updateSettings('financial', { currency: e.target.value as any })}
                  >
                    <option value="BRL">Real Brasileiro (R$)</option>
                    <option value="USD">Dólar Americano ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Prazo de Pagamento Padrão (dias)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={styles.formInput}
                    value={settings.financial.defaultPaymentTerms}
                    onChange={(e) => updateSettings('financial', { defaultPaymentTerms: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className={styles.notificationsSection}>
                <h3>Configurações de Sinal</h3>
                
                <label className={styles.switchLabel}>
                  <div className={styles.switchInfo}>
                    <strong>Exigir sinal</strong>
                    <p>Obrigar pagamento de sinal para confirmar eventos</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.financial.requireDeposit}
                    onChange={(e) => updateSettings('financial', { requireDeposit: e.target.checked })}
                  />
                  <span className={styles.switchSlider}></span>
                </label>

                {settings.financial.requireDeposit && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Percentual do Sinal (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className={styles.formInput}
                      value={settings.financial.depositPercentage}
                      onChange={(e) => updateSettings('financial', { depositPercentage: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                )}
              </div>

              <label className={styles.switchLabel}>
                <div className={styles.switchInfo}>
                  <strong>Gerar notas automaticamente</strong>
                  <p>Criar nota fiscal automaticamente após confirmação</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.financial.autoGenerateInvoices}
                  onChange={(e) => updateSettings('financial', { autoGenerateInvoices: e.target.checked })}
                />
                <span className={styles.switchSlider}></span>
              </label>
            </div>
          )}

          {/* Aba Segurança */}
          {activeTab === 'seguranca' && (
            <div className={styles.settingsSection}>
              <h2 className={styles.sectionTitle}>Configurações de Segurança</h2>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <FiLock size={14} />
                    Tempo de Sessão (minutos)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    className={styles.formInput}
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSettings('security', { sessionTimeout: parseInt(e.target.value) || 30 })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Expiração de Senha (dias)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={styles.formInput}
                    value={settings.security.passwordExpiryDays}
                    onChange={(e) => updateSettings('security', { passwordExpiryDays: parseInt(e.target.value) || 0 })}
                  />
                  <small className={styles.helpText}>0 = nunca expira</small>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Tentativas de Login
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    className={styles.formInput}
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => updateSettings('security', { maxLoginAttempts: parseInt(e.target.value) || 5 })}
                  />
                </div>
              </div>

              <label className={styles.switchLabel}>
                <div className={styles.switchInfo}>
                  <strong>Autenticação de dois fatores (2FA)</strong>
                  <p>Adicionar uma camada extra de segurança ao login</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.security.twoFactorAuth}
                  onChange={(e) => updateSettings('security', { twoFactorAuth: e.target.checked })}
                />
                <span className={styles.switchSlider}></span>
              </label>

              <div className={styles.securityNotice}>
                <MdWarning size={20} />
                <p>
                  Para sua segurança, recomenda-se alterar a senha regularmente e ativar a 
                  autenticação de dois fatores.
                </p>
              </div>
            </div>
          )}

          {/* Aba Integrações */}
          {activeTab === 'integracoes' && (
            <div className={styles.settingsSection}>
              <h2 className={styles.sectionTitle}>Integrações</h2>
              <p className={styles.sectionDescription}>
                Conecte o sistema com serviços externos para sincronizar dados e automatizar processos
              </p>
              
              <div className={styles.integrationsGrid}>
                {/* Google Calendar */}
                <div className={styles.integrationCard}>
                  <div className={styles.integrationHeader}>
                    <img 
                      src="https://www.google.com/calendar/images/calendar_48.png" 
                      alt="Google Calendar" 
                      className={styles.integrationIcon}
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234285F4"%3E%3Cpath d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM7 12h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"/%3E%3C/svg%3E';
                      }}
                    />
                    <div>
                      <h3>Google Calendar</h3>
                      <p>Sincronize eventos automaticamente com o Google Calendar</p>
                      {integrationStatus.google?.email && (
                        <span className={styles.connectedEmail}>
                          <FiCheck size={12} /> Conectado como: {integrationStatus.google.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.integrationActions}>
                    {integrationStatus.google?.connected ? (
                      <>
                        <button 
                          className={styles.syncButton}
                          onClick={() => handleSyncCalendar('google')}
                          disabled={syncing}
                        >
                          <FiRefreshCw size={14} className={syncing ? styles.spinning : ''} />
                          Sincronizar
                        </button>
                        <button 
                          className={styles.disconnectButton}
                          onClick={() => handleDisconnect('google')}
                        >
                          <FiX size={14} />
                          Desconectar
                        </button>
                      </>
                    ) : (
                      <button 
                        className={styles.connectButton}
                        onClick={handleConnectGoogle}
                        disabled={connecting === 'google'}
                      >
                        {connecting === 'google' ? (
                          <>
                            <span className={styles.buttonSpinner}></span>
                            Conectando...
                          </>
                        ) : (
                          <>
                            <FiExternalLink size={14} />
                            Conectar
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Outlook Calendar */}
                <div className={styles.integrationCard}>
                  <div className={styles.integrationHeader}>
                    <img 
                      src="https://outlook.live.com/favicon.ico" 
                      alt="Outlook" 
                      className={styles.integrationIcon}
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%230078D4"%3E%3Cpath d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/%3E%3C/svg%3E';
                      }}
                    />
                    <div>
                      <h3>Outlook Calendar</h3>
                      <p>Integração com calendário da Microsoft</p>
                      {integrationStatus.outlook?.email && (
                        <span className={styles.connectedEmail}>
                          <FiCheck size={12} /> Conectado como: {integrationStatus.outlook.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.integrationActions}>
                    {integrationStatus.outlook?.connected ? (
                      <>
                        <button 
                          className={styles.syncButton}
                          onClick={() => handleSyncCalendar('outlook')}
                          disabled={syncing}
                        >
                          <FiRefreshCw size={14} className={syncing ? styles.spinning : ''} />
                          Sincronizar
                        </button>
                        <button 
                          className={styles.disconnectButton}
                          onClick={() => handleDisconnect('outlook')}
                        >
                          <FiX size={14} />
                          Desconectar
                        </button>
                      </>
                    ) : (
                      <button 
                        className={styles.connectButton}
                        onClick={handleConnectOutlook}
                        disabled={connecting === 'outlook'}
                      >
                        {connecting === 'outlook' ? (
                          <>
                            <span className={styles.buttonSpinner}></span>
                            Conectando...
                          </>
                        ) : (
                          <>
                            <FiExternalLink size={14} />
                            Conectar
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* WhatsApp Business */}
                <div className={styles.integrationCard}>
                  <div className={styles.integrationHeader}>
                    <img 
                      src="https://static.whatsapp.net/rsrc.php/v3/yP/r/rYZqPCBaG70.png" 
                      alt="WhatsApp" 
                      className={styles.integrationIcon}
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2325D366"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12c0 1.77.47 3.43 1.28 4.88L2 22l5.28-1.38c1.4.77 3 1.22 4.72 1.22 5.52 0 10-4.48 10-10S17.52 2 12 2z"/%3E%3C/svg%3E';
                      }}
                    />
                    <div>
                      <h3>WhatsApp Business</h3>
                      <p>Enviar notificações e lembretes via WhatsApp</p>
                      {integrationStatus.whatsapp?.phoneNumber && (
                        <span className={styles.connectedEmail}>
                          <FiCheck size={12} /> Conectado: {integrationStatus.whatsapp.phoneNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.integrationActions}>
                    {integrationStatus.whatsapp?.connected ? (
                      <>
                        <button 
                          className={styles.testButton}
                          onClick={handleSendTestWhatsApp}
                        >
                          <FiMail size={14} />
                          Testar
                        </button>
                        <button 
                          className={styles.disconnectButton}
                          onClick={() => handleDisconnect('whatsapp')}
                        >
                          <FiX size={14} />
                          Desconectar
                        </button>
                      </>
                    ) : (
                      <button 
                        className={styles.connectButton}
                        onClick={() => setShowWhatsAppModal(true)}
                      >
                        <FiSettings size={14} />
                        Configurar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.integrationNote}>
                <FiInfo size={16} />
                <span>As integrações permitem sincronizar dados automaticamente. Configure cada serviço individualmente.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Configuração do WhatsApp */}
      {showWhatsAppModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Configurar WhatsApp Business</h3>
              <button className={styles.closeButton} onClick={() => setShowWhatsAppModal(false)}>
                <FiX size={20} />
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone Number ID</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={whatsAppConfig.phoneNumberId}
                  onChange={(e) => setWhatsAppConfig({ ...whatsAppConfig, phoneNumberId: e.target.value })}
                  placeholder="ID do número de telefone"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Business Account ID</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={whatsAppConfig.businessAccountId}
                  onChange={(e) => setWhatsAppConfig({ ...whatsAppConfig, businessAccountId: e.target.value })}
                  placeholder="ID da conta business"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Access Token</label>
                <input
                  type="password"
                  className={styles.formInput}
                  value={whatsAppConfig.accessToken}
                  onChange={(e) => setWhatsAppConfig({ ...whatsAppConfig, accessToken: e.target.value })}
                  placeholder="Token de acesso"
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.secondaryButton} onClick={() => setShowWhatsAppModal(false)}>
                Cancelar
              </button>
              <button className={styles.primaryButton} onClick={handleConfigureWhatsApp}>
                Salvar Configuração
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modais de Feedback */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        title="Sucesso!"
        message={successMessage}
        type="success"
        onConfirm={() => setShowSuccessModal(false)}
        onCancel={() => setShowSuccessModal(false)}
        confirmText="OK"
      />

      <ErrorModal
        isOpen={showErrorModal}
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />
    </div>
  );
};

export default SettingsPage;