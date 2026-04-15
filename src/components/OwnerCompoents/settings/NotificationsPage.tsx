// src/pages/OwnerCompoents/settings/NotificationsPage.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FiBell, 
  FiCheck, 
  FiTrash2, 
  FiSettings, 
  FiX,
  FiSend,
  FiUsers,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiDollarSign,
  FiPackage,
  FiAlertCircle,
  FiInfo,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import { notificationService } from '../../../services/notification';
import { userService } from '../../../services/users';
import { teamService } from '../../../services/teamService';
import { LoadingSpinner } from '../../../components/common/Loading/LoadingSpinner';
import { EmptyState } from '../../../components/common/EmptyState/EmptyState';
import { ConfirmationModal } from '../../../components/common/Alerts/ConfirmationModal';
import { ErrorModal } from '../../../components/common/Alerts/ErrorModal';
import styles from './NotificationsPage.module.css';

interface Notification {
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

interface Recipient {
  id: number;
  name: string;
  email: string;
  userType: string;
  role?: string;
  cpf?: string;
}

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showManager, setShowManager] = useState(false);
  
  // Estados para criar notificação
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tipo, setTipo] = useState('system');
  const [prioridade, setPrioridade] = useState('medium');
  const [urlAcao, setUrlAcao] = useState('');
  
  // Destinatários
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // ✅ Filtros para destinatários
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'client' | 'employee'>('all');
  const [showRecipientList, setShowRecipientList] = useState(true);
  
  // Filtros para notificações
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [filterNotificationType, setFilterNotificationType] = useState<string>('all');
  
  // Preferências
  const [preferences, setPreferences] = useState({
    email: {
      newEvent: true,
      eventReminder: true,
      paymentReceived: true,
      lowStock: true,
      systemUpdates: true
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
      end: '07:00'
    }
  });
  
  // Modais
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  // ✅ Carregar notificações
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationService.getAllNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Carregar destinatários (CLIENTES + FUNCIONÁRIOS)
  const loadRecipients = useCallback(async () => {
    try {
      console.log('👥 Carregando destinatários...');
      
      const [clients, teamMembers] = await Promise.all([
        userService.getAllClients(),
        teamService.getTeamMembers()
      ]);
      
      const allRecipients: Recipient[] = [
        ...clients.map(c => ({ ...c, userType: 'CLIENT' })),
        ...teamMembers.map(m => ({ ...m, userType: 'OWNER' }))
      ];
      
      const uniqueRecipients = allRecipients.filter(
        (recipient, index, self) => 
          self.findIndex(r => r.id === recipient.id) === index
      );
      
      setRecipients(uniqueRecipients);
      console.log(`✅ Total de destinatários: ${uniqueRecipients.length}`);
    } catch (error) {
      console.error('❌ Erro ao carregar destinatários:', error);
    }
  }, []);

  // ✅ Carregar preferências
  const loadPreferences = useCallback(async () => {
    try {
      const prefs = await notificationService.getPreferences();
      if (prefs) {
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    loadRecipients();
    loadPreferences();
  }, [loadNotifications, loadRecipients, loadPreferences]);

  // ✅ Destinatários filtrados
  const filteredRecipients = useMemo(() => {
    return recipients.filter(recipient => {
      // Filtro por tipo
      if (filterType === 'client' && recipient.userType !== 'CLIENT') return false;
      if (filterType === 'employee' && recipient.userType !== 'OWNER') return false;
      
      // Filtro por busca
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          recipient.name?.toLowerCase().includes(search) ||
          recipient.email?.toLowerCase().includes(search) ||
          recipient.cpf?.includes(search)
        );
      }
      
      return true;
    });
  }, [recipients, filterType, searchTerm]);

  // ✅ Contagem de destinatários por tipo
  const recipientCounts = useMemo(() => {
    return {
      all: recipients.length,
      client: recipients.filter(r => r.userType === 'CLIENT').length,
      employee: recipients.filter(r => r.userType === 'OWNER').length
    };
  }, [recipients]);

  // ✅ Notificações filtradas
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Filtro por status
      if (filterStatus === 'unread' && notification.lida) return false;
      if (filterStatus === 'read' && !notification.lida) return false;
      
      // Filtro por tipo
      if (filterNotificationType !== 'all' && notification.tipo !== filterNotificationType) return false;
      
      return true;
    });
  }, [notifications, filterStatus, filterNotificationType]);

  // ✅ Selecionar/deselecionar todos os filtrados
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(filteredRecipients.map(r => r.id));
    }
    setSelectAll(!selectAll);
  };

  // ✅ Selecionar/deselecionar um destinatário
  const handleSelectRecipient = (id: number) => {
    setSelectedRecipients(prev => {
      if (prev.includes(id)) {
        return prev.filter(r => r !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // ✅ Enviar notificação
  const handleCreateNotification = async () => {
    if (!titulo.trim()) {
      setErrorMessage('O título é obrigatório');
      setShowErrorModal(true);
      return;
    }
    
    if (!mensagem.trim()) {
      setErrorMessage('A mensagem é obrigatória');
      setShowErrorModal(true);
      return;
    }
    
    if (selectedRecipients.length === 0) {
      setErrorMessage('Selecione pelo menos um destinatário');
      setShowErrorModal(true);
      return;
    }
    
    setSending(true);
    
    try {
      const payload = {
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        tipo: tipo,
        prioridade: prioridade,
        destinatarios: selectedRecipients,
        urlAcao: urlAcao.trim() || null
      };
      
      console.log('📤 Enviando notificação:', payload);
      
      await notificationService.createNotification(payload);
      
      setSuccessMessage('Notificação enviada com sucesso!');
      setShowSuccessModal(true);
      
      // Limpar formulário
      setTitulo('');
      setMensagem('');
      setUrlAcao('');
      setSelectedRecipients([]);
      setSelectAll(false);
      setShowManager(false);
      setSearchTerm('');
      setFilterType('all');
      
      await loadNotifications();
    } catch (error: any) {
      console.error('Erro ao enviar notificação:', error);
      setErrorMessage(error.message || 'Erro ao enviar notificação');
      setShowErrorModal(true);
    } finally {
      setSending(false);
    }
  };

  // ✅ Marcar como lida
  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, lida: true } : n)
      );
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  // ✅ Marcar todas como lidas
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
      setSuccessMessage('Todas as notificações marcadas como lidas');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  // ✅ Excluir notificação
  const handleDeleteNotification = async () => {
    if (!notificationToDelete) return;
    
    try {
      await notificationService.deleteNotification(notificationToDelete);
      setNotifications(prev => prev.filter(n => n.id !== notificationToDelete));
      setSuccessMessage('Notificação excluída com sucesso');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      setErrorMessage('Erro ao excluir notificação');
      setShowErrorModal(true);
    } finally {
      setShowDeleteConfirm(false);
      setNotificationToDelete(null);
    }
  };

  // ✅ Salvar preferências
  const handleSavePreferences = async () => {
    try {
      await notificationService.updatePreferences(preferences);
      setSuccessMessage('Preferências salvas com sucesso!');
      setShowSuccessModal(true);
      setShowPreferences(false);
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      setErrorMessage('Erro ao salvar preferências');
      setShowErrorModal(true);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      'event': <FiCalendar size={20} />,
      'payment': <FiDollarSign size={20} />,
      'stock': <FiPackage size={20} />,
      'alert': <FiAlertCircle size={20} />,
      'system': <FiInfo size={20} />
    };
    return icons[type] || <FiBell size={20} />;
  };

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'event': '#3b82f6',
      'payment': '#10b981',
      'stock': '#f59e0b',
      'alert': '#ef4444',
      'system': '#6b7280'
    };
    return colors[type] || '#6b7280';
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      'low': '#6b7280',
      'medium': '#3b82f6',
      'high': '#f59e0b',
      'urgent': '#ef4444'
    };
    return colors[priority] || '#6b7280';
  };

  const getPriorityLabel = (priority: string): string => {
    const labels: Record<string, string> = {
      'low': 'Baixa',
      'medium': 'Média',
      'high': 'Alta',
      'urgent': 'Urgente'
    };
    return labels[priority] || priority;
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  if (loading) {
    return <LoadingSpinner text="Carregando notificações..." fullScreen />;
  }

  return (
    <div className={styles.notificationsPage}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <FiBell size={28} />
            Notificações
            {unreadCount > 0 && (
              <span className={styles.unreadBadge}>{unreadCount}</span>
            )}
          </h1>
          <p className={styles.pageSubtitle}>
            Gerencie suas notificações e preferências
          </p>
        </div>
        
        <div className={styles.headerActions}>
          <button 
            className={`${styles.secondaryButton} ${showPreferences ? styles.active : ''}`}
            onClick={() => setShowPreferences(!showPreferences)}
          >
            <FiSettings size={18} />
            {showPreferences ? 'Fechar Preferências' : 'Preferências'}
          </button>
          
          <button 
            className={styles.primaryButton}
            onClick={() => setShowManager(!showManager)}
          >
            <FiSend size={18} />
            {showManager ? 'Cancelar' : 'Enviar Notificação'}
          </button>
        </div>
      </div>

      {/* Painel de Preferências */}
      {showPreferences && (
        <div className={styles.preferencesPanel}>
          <h2 className={styles.panelTitle}>Preferências de Notificação</h2>
          
          <div className={styles.preferencesGrid}>
            <div className={styles.preferencesColumn}>
              <h4>Notificações por Email</h4>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={preferences.email.newEvent}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    email: { ...prev.email, newEvent: e.target.checked }
                  }))}
                />
                Novos eventos
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={preferences.email.eventReminder}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    email: { ...prev.email, eventReminder: e.target.checked }
                  }))}
                />
                Lembretes de eventos
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={preferences.email.paymentReceived}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    email: { ...prev.email, paymentReceived: e.target.checked }
                  }))}
                />
                Pagamentos recebidos
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={preferences.email.lowStock}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    email: { ...prev.email, lowStock: e.target.checked }
                  }))}
                />
                Estoque baixo
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={preferences.email.systemUpdates}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    email: { ...prev.email, systemUpdates: e.target.checked }
                  }))}
                />
                Atualizações do sistema
              </label>
            </div>
            
            <div className={styles.preferencesColumn}>
              <h4>Notificações no Aplicativo</h4>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={preferences.inApp.newEvent}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    inApp: { ...prev.inApp, newEvent: e.target.checked }
                  }))}
                />
                Novos eventos
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={preferences.inApp.eventReminder}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    inApp: { ...prev.inApp, eventReminder: e.target.checked }
                  }))}
                />
                Lembretes de eventos
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={preferences.inApp.paymentReceived}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    inApp: { ...prev.inApp, paymentReceived: e.target.checked }
                  }))}
                />
                Pagamentos recebidos
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={preferences.inApp.lowStock}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    inApp: { ...prev.inApp, lowStock: e.target.checked }
                  }))}
                />
                Estoque baixo
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={preferences.inApp.systemUpdates}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    inApp: { ...prev.inApp, systemUpdates: e.target.checked }
                  }))}
                />
                Atualizações do sistema
              </label>
            </div>
            
            <div className={styles.preferencesColumn}>
              <h4>Configurações Gerais</h4>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Dias de antecedência para lembretes</label>
                <input 
                  type="number" 
                  min="1" 
                  max="30"
                  value={preferences.reminderDays}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    reminderDays: parseInt(e.target.value) || 3
                  }))}
                  className={styles.formInput}
                />
              </div>
              
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={preferences.quietHours.enabled}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, enabled: e.target.checked }
                  }))}
                />
                Horário de silêncio
              </label>
              
              {preferences.quietHours.enabled && (
                <div className={styles.quietHoursInputs}>
                  <input 
                    type="time" 
                    value={preferences.quietHours.start}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      quietHours: { ...prev.quietHours, start: e.target.value }
                    }))}
                    className={styles.formInput}
                  />
                  <span>até</span>
                  <input 
                    type="time" 
                    value={preferences.quietHours.end}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      quietHours: { ...prev.quietHours, end: e.target.value }
                    }))}
                    className={styles.formInput}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.panelActions}>
            <button 
              className={styles.secondaryButton}
              onClick={() => setShowPreferences(false)}
            >
              Cancelar
            </button>
            <button 
              className={styles.primaryButton}
              onClick={handleSavePreferences}
            >
              Salvar Preferências
            </button>
          </div>
        </div>
      )}

      {/* Painel de Envio de Notificação */}
      {showManager && (
        <div className={styles.managerPanel}>
          <div className={styles.managerHeader}>
            <h2 className={styles.panelTitle}>Enviar Notificação</h2>
            <button 
              className={styles.toggleRecipientList}
              onClick={() => setShowRecipientList(!showRecipientList)}
            >
              {showRecipientList ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
              {showRecipientList ? 'Ocultar' : 'Mostrar'} lista
            </button>
          </div>
          
          <div className={styles.managerGrid}>
            <div className={styles.managerForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Título *</label>
                <input 
                  type="text" 
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Título da notificação"
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mensagem *</label>
                <textarea 
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Digite a mensagem..."
                  className={styles.formTextarea}
                  rows={4}
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tipo</label>
                  <select 
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className={styles.formSelect}
                  >
                    <option value="system">Sistema</option>
                    <option value="event">Evento</option>
                    <option value="payment">Pagamento</option>
                    <option value="stock">Estoque</option>
                    <option value="alert">Alerta</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Prioridade</label>
                  <select 
                    value={prioridade}
                    onChange={(e) => setPrioridade(e.target.value)}
                    className={styles.formSelect}
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Link de Ação (opcional)</label>
                <input 
                  type="text" 
                  value={urlAcao}
                  onChange={(e) => setUrlAcao(e.target.value)}
                  placeholder="/dashboard, /events/123, etc."
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.selectedCount}>
                <FiUsers size={14} />
                <span>{selectedRecipients.length} destinatário(s) selecionado(s)</span>
              </div>
            </div>
            
            {showRecipientList && (
              <div className={styles.managerUsers}>
                <div className={styles.recipientHeader}>
                  <h4 className={styles.managerUsersTitle}>
                    <FiUsers size={16} />
                    Destinatários
                  </h4>
                  
                  {/* ✅ Filtros de tipo */}
                  <div className={styles.recipientFilters}>
                    <button 
                      className={`${styles.filterChip} ${filterType === 'all' ? styles.active : ''}`}
                      onClick={() => setFilterType('all')}
                    >
                      Todos ({recipientCounts.all})
                    </button>
                    <button 
                      className={`${styles.filterChip} ${filterType === 'client' ? styles.active : ''}`}
                      onClick={() => setFilterType('client')}
                    >
                      Clientes ({recipientCounts.client})
                    </button>
                    <button 
                      className={`${styles.filterChip} ${filterType === 'employee' ? styles.active : ''}`}
                      onClick={() => setFilterType('employee')}
                    >
                      Funcionários ({recipientCounts.employee})
                    </button>
                  </div>
                </div>
                
                {/* ✅ Barra de busca */}
                <div className={styles.recipientSearch}>
                  <FiSearch size={16} />
                  <input 
                    type="text" 
                    placeholder="Buscar por nome, email ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.recipientSearchInput}
                  />
                  {searchTerm && (
                    <button 
                      className={styles.clearSearch}
                      onClick={() => setSearchTerm('')}
                    >
                      <FiX size={14} />
                    </button>
                  )}
                </div>
                
                <label className={styles.selectAllLabel}>
                  <input 
                    type="checkbox" 
                    checked={selectAll && filteredRecipients.length > 0}
                    onChange={handleSelectAll}
                  />
                  <strong>Selecionar Todos os Filtrados</strong>
                  <span className={styles.filteredCount}>({filteredRecipients.length})</span>
                </label>
                
                <div className={styles.usersListContainer}>
                  {filteredRecipients.length === 0 ? (
                    <div className={styles.noRecipients}>
                      <FiUsers size={24} />
                      <p>Nenhum destinatário encontrado</p>
                    </div>
                  ) : (
                    filteredRecipients.map(recipient => (
                      <label key={recipient.id} className={styles.recipientItem}>
                        <input 
                          type="checkbox" 
                          checked={selectedRecipients.includes(recipient.id)}
                          onChange={() => handleSelectRecipient(recipient.id)}
                        />
                        <div className={styles.recipientInfo}>
                          <span className={styles.recipientName}>{recipient.name}</span>
                          <span className={styles.recipientEmail}>{recipient.email}</span>
                        </div>
                        {recipient.userType === 'OWNER' && (
                          <span className={styles.employeeBadge}>Funcionário</span>
                        )}
                        {recipient.userType === 'CLIENT' && (
                          <span className={styles.clientBadge}>Cliente</span>
                        )}
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className={styles.panelActions}>
            <button 
              className={styles.secondaryButton}
              onClick={() => {
                setShowManager(false);
                setTitulo('');
                setMensagem('');
                setUrlAcao('');
                setSelectedRecipients([]);
                setSelectAll(false);
                setSearchTerm('');
                setFilterType('all');
              }}
            >
              Cancelar
            </button>
            <button 
              className={styles.primaryButton}
              onClick={handleCreateNotification}
              disabled={sending}
            >
              {sending ? 'Enviando...' : 'Enviar Notificação'}
            </button>
          </div>
        </div>
      )}

      {/* Filtros de Notificações */}
      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <button 
            className={`${styles.filterButton} ${filterStatus === 'all' ? styles.activeFilter : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            Todas ({notifications.length})
          </button>
          <button 
            className={`${styles.filterButton} ${filterStatus === 'unread' ? styles.activeFilter : ''}`}
            onClick={() => setFilterStatus('unread')}
          >
            Não lidas ({unreadCount})
          </button>
          <button 
            className={`${styles.filterButton} ${filterStatus === 'read' ? styles.activeFilter : ''}`}
            onClick={() => setFilterStatus('read')}
          >
            Lidas ({notifications.filter(n => n.lida).length})
          </button>
        </div>
        
        <div className={styles.filterGroup}>
          <select 
            className={styles.filterSelect}
            value={filterNotificationType}
            onChange={(e) => setFilterNotificationType(e.target.value)}
          >
            <option value="all">Todos os tipos</option>
            <option value="event">Eventos</option>
            <option value="payment">Pagamentos</option>
            <option value="stock">Estoque</option>
            <option value="alert">Alertas</option>
            <option value="system">Sistema</option>
          </select>
        </div>
        
        {unreadCount > 0 && (
          <button 
            className={styles.secondaryButton}
            onClick={handleMarkAllAsRead}
          >
            <FiCheck size={16} />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Lista de Notificações */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<FiBell size={48} />}
          title="Nenhuma notificação"
          description={
            filterStatus !== 'all' || filterNotificationType !== 'all'
              ? 'Nenhuma notificação corresponde aos filtros aplicados.'
              : 'Você não tem notificações no momento.'
          }
        />
      ) : (
        <div className={styles.notificationsList}>
          {filteredNotifications.map(notification => (
            <div 
              key={notification.id} 
              className={`${styles.notificationCard} ${!notification.lida ? styles.unread : ''}`}
            >
              <div 
                className={styles.notificationIcon}
                style={{ backgroundColor: getTypeColor(notification.tipo) + '20', color: getTypeColor(notification.tipo) }}
              >
                {getTypeIcon(notification.tipo)}
              </div>
              
              <div className={styles.notificationContent}>
                <div className={styles.notificationHeader}>
                  <h3 className={styles.notificationTitle}>
                    {!notification.lida && <span className={styles.unreadDot} />}
                    {notification.titulo}
                  </h3>
                  <div className={styles.notificationMeta}>
                    <span 
                      className={styles.priorityBadge}
                      style={{ backgroundColor: getPriorityColor(notification.prioridade) }}
                    >
                      {getPriorityLabel(notification.prioridade)}
                    </span>
                    <span className={styles.notificationTime}>
                      {new Date(notification.dataCriacao).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
                
                <p className={styles.notificationMessage}>{notification.mensagem}</p>
                
                {notification.remetenteNome && (
                  <p className={styles.notificationSender}>
                    Enviado por: <strong>{notification.remetenteNome}</strong>
                  </p>
                )}
                
                <div className={styles.notificationFooter}>
                  {notification.urlAcao && (
                    <a 
                      href={notification.urlAcao} 
                      className={styles.notificationAction}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver detalhes →
                    </a>
                  )}
                  
                  <div className={styles.notificationActions}>
                    {!notification.lida && (
                      <button 
                        className={styles.markReadButton}
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <FiCheck size={14} />
                        Marcar como lida
                      </button>
                    )}
                    <button 
                      className={styles.deleteButton}
                      onClick={() => {
                        setNotificationToDelete(notification.id);
                        setShowDeleteConfirm(true);
                      }}
                      title="Excluir notificação"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Excluir Notificação"
        message="Tem certeza que deseja excluir esta notificação?"
        type="warning"
        onConfirm={handleDeleteNotification}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setNotificationToDelete(null);
        }}
        confirmText="Excluir"
      />
    </div>
  );
};

export default NotificationsPage;