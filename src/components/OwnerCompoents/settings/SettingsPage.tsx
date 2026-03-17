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
  FiInfo, // ✅ Adicionado FiInfo que estava faltando
  FiSettings // ✅ Adicionado FiSettings que estava faltando
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
import styles from './SettingsPage.module.css';

// Interface para as configurações do sistema
interface SystemSettings {
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

// Dados mocados
const MOCK_SETTINGS: SystemSettings = {
  company: {
    name: "Eventos Fáceis LTDA",
    document: "12.345.678/0001-90",
    phone: "(11) 99999-9999",
    email: "contato@eventosfaceis.com.br",
    address: "Av. Paulista, 1000",
    city: "São Paulo",
    state: "SP",
    zipCode: "01310-100"
  },
  theme: {
    mode: 'system',
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
    whatsApp: true,
    emailMarketing: false
  }
};

type TabType = 'empresa' | 'aparencia' | 'notificacoes' | 'financeiro' | 'seguranca' | 'integracoes';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(MOCK_SETTINGS);
  const [activeTab, setActiveTab] = useState<TabType>('empresa');
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
      setSuccessMessage('Configurações salvas com sucesso!');
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMessage('Erro ao salvar configurações. Tente novamente.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings(MOCK_SETTINGS);
    setHasChanges(false);
    setSuccessMessage('Configurações restauradas com sucesso!');
    setShowSuccessModal(true);
  };

  const updateSettings = <K extends keyof SystemSettings>(
    section: K,
    values: Partial<SystemSettings[K]>
  ) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
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
            disabled={loading}
          >
            Restaurar Padrão
          </button>
          <button
            className={styles.primaryButton}
            onClick={handleSave}
            disabled={loading || !hasChanges}
          >
            {loading ? (
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
                    <option value="SP">São Paulo</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="ES">Espírito Santo</option>
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
                  <button className={styles.uploadButton}>
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