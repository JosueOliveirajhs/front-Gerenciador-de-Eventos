// src/components/OwnerCompoents/settings/SettingsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
  FiRefreshCw,
  FiMapPin
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
import { useAuth } from '../../../context/AuthContext';
import styles from './SettingsPage.module.css';

import { paymentService } from '../../../services/payments';

type TabType = 'empresa' | 'aparencia' | 'notificacoes' | 'financeiro' | 'seguranca' | 'integracoes' | 'assinatura';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  
  // ✅ Verificar se é CLIENT
  const isClient = user?.userType === 'CLIENT';
  
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(isClient ? 'aparencia' : 'empresa');
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
  
  // Estados para Assinatura
  const [subLoading, setSubLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('MONTHLY');

  useEffect(() => {
    loadSettings();
    if (!isClient) {
      loadIntegrationStatus();
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const provider = urlParams.get('provider');
    
    if (code && provider) {
      handleOAuthCallback(provider as IntegrationProvider, code, urlParams.get('state') || undefined);
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

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setTheme(mode);
    if (settings) {
      updateSettings('theme', { mode } as any);
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

  // ✅ Tabs: CLIENT não vê 'empresa' e 'integracoes'
  const tabs: { id: TabType; label: string; icon: React.ReactNode; showForClient?: boolean }[] = [
    { id: 'empresa', label: 'Empresa', icon: <MdBusiness size={18} />, showForClient: false },
    { id: 'aparencia', label: 'Aparência', icon: <MdPalette size={18} />, showForClient: true },
    { id: 'notificacoes', label: 'Notificações', icon: <MdNotifications size={18} />, showForClient: true },
    { id: 'financeiro', label: 'Financeiro', icon: <MdPayment size={18} />, showForClient: false },
    { id: 'assinatura', label: 'Assinatura', icon: <FiPackage size={18} />, showForClient: false },
    { id: 'seguranca', label: 'Segurança', icon: <MdSecurity size={18} />, showForClient: true },
    { id: 'integracoes', label: 'Integrações', icon: <FiGlobe size={18} />, showForClient: false }
  ];

  // Filtrar tabs para CLIENT
  const visibleTabs = isClient 
    ? tabs.filter(tab => tab.showForClient !== false)
    : tabs;

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
      {/* Cabeçalho */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <FiSettings size={28} />
            Configurações
          </h1>
          <p className={styles.pageSubtitle}>
            {isClient 
              ? 'Personalize sua experiência no sistema' 
              : 'Gerencie as configurações gerais do sistema'}
          </p>
        </div>

        <div className={styles.headerActions}>
          {hasChanges && (
            <span className={styles.unsavedBadge}>
              <FiAlertCircle size={14} />
              Alterações não salvas
            </span>
          )}
          {!isClient && (
            <button
              className={styles.secondaryButton}
              onClick={handleReset}
              disabled={saving}
            >
              Restaurar Padrão
            </button>
          )}
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

      {/* Container Principal */}
      <div className={styles.settingsContainer}>
        {/* Sidebar */}
        <div className={styles.settingsSidebar}>
          {visibleTabs.map(tab => (
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

        {/* Conteúdo */}
        <div className={styles.settingsContent}>
          
          {/* ============================================ */}
          {/* ABA EMPRESA (APENAS OWNER) */}
          {/* ============================================ */}
          {activeTab === 'empresa' && !isClient && (
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
                    <FiMapPin size={14} />
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
                  <label className={styles.formLabel}>Cidade</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.company.city}
                    onChange={(e) => updateSettings('company', { city: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Estado</label>
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
                  <label className={styles.formLabel}>CEP</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.company.zipCode}
                    onChange={(e) => updateSettings('company', { zipCode: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* ABA APARÊNCIA (TODOS) */}
          {/* ============================================ */}
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

          {/* ============================================ */}
          {/* ABA NOTIFICAÇÕES (TODOS) */}
          {/* ============================================ */}
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

          {/* ============================================ */}
          {/* ABA FINANCEIRO (APENAS OWNER) */}
          {/* ============================================ */}
          {activeTab === 'financeiro' && !isClient && (
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

          {/* ============================================ */}
          {/* ABA SEGURANÇA (TODOS) */}
          {/* ============================================ */}
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

          {/* ============================================ */}
          {/* ABA INTEGRAÇÕES (APENAS OWNER) */}
          {/* ============================================ */}
          {activeTab === 'integracoes' && !isClient && (
            <div className={styles.settingsSection}>
              <h2 className={styles.sectionTitle}>Integrações</h2>
              <p className={styles.sectionDescription}>
                Conecte o sistema com serviços externos para sincronizar dados e automatizar processos
              </p>
              
              {/* ... (conteúdo de integrações existente) ... */}
            </div>
          )}

          {/* ============================================ */}
          {/* ABA ASSINATURA (APENAS OWNER) */}
          {/* ============================================ */}
          {activeTab === 'assinatura' && !isClient && (
            <div className={styles.settingsSection}>
              <h2 className={styles.sectionTitle}>Plano de Assinatura</h2>
              <p className={styles.sectionDescription}>
                Escolha o plano ideal para a sua organização.
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0', gap: '10px' }}>
                <button 
                  onClick={() => setBillingCycle('MONTHLY')} 
                  style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #3b82f6', background: billingCycle === 'MONTHLY' ? '#3b82f6' : 'transparent', color: billingCycle === 'MONTHLY' ? '#fff' : '#3b82f6', cursor: 'pointer' }}
                >
                  Mensal
                </button>
                <button 
                  onClick={() => setBillingCycle('SEMIANNUALLY')} 
                  style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #3b82f6', background: billingCycle === 'SEMIANNUALLY' ? '#3b82f6' : 'transparent', color: billingCycle === 'SEMIANNUALLY' ? '#fff' : '#3b82f6', cursor: 'pointer' }}
                >
                  Semestral (10% off)
                </button>
                <button 
                  onClick={() => setBillingCycle('YEARLY')} 
                  style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #3b82f6', background: billingCycle === 'YEARLY' ? '#3b82f6' : 'transparent', color: billingCycle === 'YEARLY' ? '#fff' : '#3b82f6', cursor: 'pointer' }}
                >
                  Anual (20% off)
                </button>
              </div>

              <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  { id: 'ESSENCIAL', name: 'Essencial', price: 297.00, features: ['Eventos Básicos', 'Suporte Padrão'] },
                  { id: 'PROFISSIONAL', name: 'Profissional', price: 497.00, features: ['Eventos Ilimitados', 'Integrações', 'Suporte Prioritário'], recommended: true },
                  { id: 'PREMIUM', name: 'Premium', price: 697.00, features: ['Tudo do Profissional', 'Automações', 'Múltiplos Usuários'] },
                  { id: 'ENTERPRISE', name: 'Enterprise', price: 1197.00, features: ['White Label', 'API de Acesso', 'Gerente de Contas'] }
                ].map(plan => {
                  let finalPrice = plan.price;
                  if (billingCycle === 'SEMIANNUALLY') finalPrice = (plan.price * 6) * 0.9;
                  if (billingCycle === 'YEARLY') finalPrice = (plan.price * 12) * 0.8;

                  return (
                    <div key={plan.id} style={{ flex: '1', minWidth: '220px', maxWidth: '280px', padding: '20px', border: plan.recommended ? '2px solid #3b82f6' : '1px solid #cbd5e1', borderRadius: '8px', textAlign: 'center', position: 'relative' }}>
                      {plan.recommended && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#3b82f6', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>Recomendado</div>}
                      <h3>{plan.name}</h3>
                      <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '15px 0' }}>
                        R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        <small style={{ fontSize: '12px', display: 'block', fontWeight: 'normal', color: '#64748b' }}>
                          {billingCycle === 'MONTHLY' ? '/mês' : billingCycle === 'SEMIANNUALLY' ? '/semestre' : '/ano'}
                        </small>
                      </p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', textAlign: 'left', lineHeight: '1.6', fontSize: '14px' }}>
                        {plan.features.map((feat, idx) => (
                          <li key={idx}><FiCheck color="#10b981"/> {feat}</li>
                        ))}
                      </ul>
                      <button 
                        disabled={subLoading}
                        onClick={async () => {
                          try {
                            setSubLoading(true);
                            await paymentService.createSubscription(user?.id || 0, { 
                              planType: plan.id, 
                              billingCycle: billingCycle, 
                              billingType: 'UNDEFINED' // Permite que a organização escolha a forma de pagamento depois
                            });
                            alert(`Plano ${plan.name} selecionado com sucesso!`);
                          } catch (err: any) {
                            alert('Erro ao assinar: ' + (err.response?.data?.error || err.message));
                          } finally {
                            setSubLoading(false);
                          }
                        }}
                        style={{ width: '100%', padding: '10px', background: plan.recommended ? '#10b981' : '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: plan.recommended ? 'bold' : 'normal' }}
                      >
                        {subLoading ? 'Processando...' : 'Assinar ' + plan.name}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
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