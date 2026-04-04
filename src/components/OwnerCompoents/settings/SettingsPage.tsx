// src/pages/Settings/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  FiSave, 
  FiUser, 
  FiBell, 
  FiLock, 
  FiMail,
  FiGlobe,
  FiSun,
  FiMoon,
  FiMonitor,
  FiDollarSign,
  FiCalendar,
  FiClock,
  FiUsers,
  FiPackage,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiPhone,
  FiInfo,
  FiSettings
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
import styles from './SettingsPage.module.css';

type TabType = 'empresa' | 'aparencia' | 'notificacoes' | 'financeiro' | 'seguranca' | 'integracoes';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('empresa');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Carregar configurações
  useEffect(() => {
    loadSettings();
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
                  />
                </div>
              </div>

              <div className={styles.infoBox}>
                <FiInfo size={20} />
                <div>
                  <strong>Logo da empresa</strong>
                  <p>Recomendamos uma imagem quadrada de pelo menos 200x200 pixels.</p>
                  <button className={styles.uploadButton} onClick={() => {
                    // Implementar upload de logo
                  }}>
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
              
              <div className={styles.themeOptions}>
                <div className={styles.themeOption}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="themeMode"
                      checked={settings.theme.mode === 'light'}
                      onChange={() => updateSettings('theme', { mode: 'light' })}
                    />
                    <div className={styles.themeCard}>
                      <FiSun size={24} />
                      <span>Claro</span>
                    </div>
                  </label>
                </div>

                <div className={styles.themeOption}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="themeMode"
                      checked={settings.theme.mode === 'dark'}
                      onChange={() => updateSettings('theme', { mode: 'dark' })}
                    />
                    <div className={styles.themeCard}>
                      <FiMoon size={24} />
                      <span>Escuro</span>
                    </div>
                  </label>
                </div>

                <div className={styles.themeOption}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="themeMode"
                      checked={settings.theme.mode === 'system'}
                      onChange={() => updateSettings('theme', { mode: 'system' })}
                    />
                    <div className={styles.themeCard}>
                      <FiMonitor size={24} />
                      <span>Sistema</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className={styles.colorPickerSection}>
                <h3>Cores do Tema</h3>
                <div className={styles.colorOptions}>
                  <div className={styles.colorOption}>
                    <label>Cor Primária</label>
                    <div className={styles.colorInput}>
                      <input
                        type="color"
                        value={settings.theme.primaryColor}
                        onChange={(e) => updateSettings('theme', { primaryColor: e.target.value })}
                      />
                      <span>{settings.theme.primaryColor}</span>
                    </div>
                  </div>

                  <div className={styles.colorOption}>
                    <label>Cor de Destaque</label>
                    <div className={styles.colorInput}>
                      <input
                        type="color"
                        value={settings.theme.accentColor}
                        onChange={(e) => updateSettings('theme', { accentColor: e.target.value })}
                      />
                      <span>{settings.theme.accentColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.previewSection}>
                <h3>Prévia</h3>
                <div className={styles.previewCard}>
                  <div 
                    className={styles.previewButton}
                    style={{ backgroundColor: settings.theme.primaryColor }}
                  >
                    Botão Primário
                  </div>
                  <div 
                    className={styles.previewButton}
                    style={{ backgroundColor: settings.theme.accentColor }}
                  >
                    Botão de Destaque
                  </div>
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
                      <strong>Notificações por SMS</strong>
                      <p>Receber alertas importantes por SMS</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.smsEnabled}
                    onChange={(e) => updateSettings('notifications', { smsEnabled: e.target.checked })}
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
                    onChange={(e) => updateSettings('notifications', { reminderDays: parseInt(e.target.value) })}
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
                    onChange={(e) => updateSettings('financial', { defaultPaymentTerms: parseInt(e.target.value) })}
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
                      onChange={(e) => updateSettings('financial', { depositPercentage: parseInt(e.target.value) })}
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
                    onChange={(e) => updateSettings('security', { sessionTimeout: parseInt(e.target.value) })}
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
                    onChange={(e) => updateSettings('security', { passwordExpiryDays: parseInt(e.target.value) })}
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
                    onChange={(e) => updateSettings('security', { maxLoginAttempts: parseInt(e.target.value) })}
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
                <MdWarning size={20} color="#f59e0b" />
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
              
              <div className={styles.integrationsGrid}>
                <div className={styles.integrationCard}>
                  <img src="/google-calendar-icon.png" alt="Google Calendar" className={styles.integrationIcon} />
                  <h3>Google Calendar</h3>
                  <p>Sincronize eventos automaticamente</p>
                  <label className={styles.switchLabel}>
                    <input
                      type="checkbox"
                      checked={settings.integrations.googleCalendar}
                      onChange={(e) => updateSettings('integrations', { googleCalendar: e.target.checked })}
                    />
                    <span className={styles.switchSlider}></span>
                  </label>
                </div>

                <div className={styles.integrationCard}>
                  <img src="/outlook-icon.png" alt="Outlook" className={styles.integrationIcon} />
                  <h3>Outlook Calendar</h3>
                  <p>Integração com calendário da Microsoft</p>
                  <label className={styles.switchLabel}>
                    <input
                      type="checkbox"
                      checked={settings.integrations.outlookCalendar}
                      onChange={(e) => updateSettings('integrations', { outlookCalendar: e.target.checked })}
                    />
                    <span className={styles.switchSlider}></span>
                  </label>
                </div>

                <div className={styles.integrationCard}>
                  <img src="/whatsapp-icon.png" alt="WhatsApp" className={styles.integrationIcon} />
                  <h3>WhatsApp</h3>
                  <p>Enviar notificações via WhatsApp</p>
                  <label className={styles.switchLabel}>
                    <input
                      type="checkbox"
                      checked={settings.integrations.whatsApp}
                      onChange={(e) => updateSettings('integrations', { whatsApp: e.target.checked })}
                    />
                    <span className={styles.switchSlider}></span>
                  </label>
                </div>

                <div className={styles.integrationCard}>
                  <img src="/mailchimp-icon.png" alt="Mailchimp" className={styles.integrationIcon} />
                  <h3>E-mail Marketing</h3>
                  <p>Integração com Mailchimp</p>
                  <label className={styles.switchLabel}>
                    <input
                      type="checkbox"
                      checked={settings.integrations.emailMarketing}
                      onChange={(e) => updateSettings('integrations', { emailMarketing: e.target.checked })}
                    />
                    <span className={styles.switchSlider}></span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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