// src/components/OwnerCompoents/settings/NotificationsPage.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FiBell, FiCheck, FiTrash2, FiSettings, FiX, FiSend, FiUsers, FiSearch,
  FiCalendar, FiDollarSign, FiPackage, FiAlertCircle, FiInfo,
  FiChevronDown, FiChevronUp, FiCheckCircle, FiXCircle, FiClock
} from 'react-icons/fi';
import { notificationService } from '../../../services/notification';
import { eventService } from '../../../services/events';
import { userService } from '../../../services/users';
import { teamService } from '../../../services/teamService';
import { useAuth } from '../../../context/AuthContext';
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
  metadata?: string;
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
  const { user } = useAuth();
  
  // ✅ Verificar se é CLIENT
  const isClient = user?.userType === 'CLIENT';
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'client' | 'employee'>('all');
  const [showRecipientList, setShowRecipientList] = useState(true);
  
  // Filtros para notificações
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [filterNotificationType, setFilterNotificationType] = useState<string>('all');
  
  // Preferências
  const [preferences, setPreferences] = useState({
    email: { newEvent: true, eventReminder: true, paymentReceived: true, lowStock: true, systemUpdates: true },
    inApp: { newEvent: true, eventReminder: true, paymentReceived: true, lowStock: true, systemUpdates: true },
    reminderDays: 3,
    quietHours: { enabled: false, start: '22:00', end: '07:00' }
  });
  
  // Modais
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<number | null>(null);
  const [notificationToProcess, setNotificationToProcess] = useState<Notification | null>(null);
  const [sending, setSending] = useState(false);
  const [processing, setProcessing] = useState(false);

  // ✅ Carregar dados apenas uma vez
  useEffect(() => {
    if (dataLoaded) return;
    
    const loadAllData = async () => {
      setLoading(true);
      
      try {
        const notifData = await notificationService.getAllNotifications();
        setNotifications(notifData);
        console.log('✅ Notificações carregadas:', notifData.length, '| isClient:', isClient);
        
        // Apenas OWNER carrega destinatários e preferências
        if (!isClient) {
          try {
            const [clients, teamMembers] = await Promise.all([
              userService.getAllClients(),
              teamService.getTeamMembers()
            ]);
            
            const allRecipients: Recipient[] = [
              ...clients.map((c: any) => ({ ...c, userType: 'CLIENT' })),
              ...teamMembers.map((m: any) => ({ ...m, userType: 'OWNER' }))
            ];
            
            const uniqueRecipients = allRecipients.filter(
              (r, i, self) => self.findIndex(t => t.id === r.id) === i
            );
            
            setRecipients(uniqueRecipients);
            
            try {
              const prefs = await notificationService.getPreferences();
              if (prefs) setPreferences(prefs);
            } catch (e) {
              console.log('ℹ️ Usando preferências padrão');
            }
          } catch (e) {
            console.log('ℹ️ Dados de destinatários não carregados');
          }
        }
        
        setDataLoaded(true);
      } catch (error) {
        console.error('Erro ao carregar:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, [dataLoaded, isClient]);

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getAllNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Erro ao recarregar:', error);
    }
  }, []);

  // Destinatários filtrados
  const filteredRecipients = useMemo(() => {
    return recipients.filter(recipient => {
      if (filterType === 'client' && recipient.userType !== 'CLIENT') return false;
      if (filterType === 'employee' && recipient.userType !== 'OWNER') return false;
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

  const recipientCounts = useMemo(() => ({
    all: recipients.length,
    client: recipients.filter(r => r.userType === 'CLIENT').length,
    employee: recipients.filter(r => r.userType === 'OWNER').length
  }), [recipients]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      if (filterStatus === 'unread' && notification.lida) return false;
      if (filterStatus === 'read' && !notification.lida) return false;
      if (filterNotificationType !== 'all' && notification.tipo !== filterNotificationType) return false;
      return true;
    });
  }, [notifications, filterStatus, filterNotificationType]);

  // ✅ OWNER: Verificar solicitação de reserva
  const isReservationRequest = (notification: Notification): boolean => {
    if (isClient) return false;
    return notification.tipo === 'event' && 
           (notification.titulo.includes('Nova Solicitação') || 
            notification.titulo.includes('Reserva') ||
            notification.mensagem.includes('solicitou'));
  };

  // ✅ CLIENT: Verificar notificação de status
  const isStatusNotification = (notification: Notification): boolean => {
    return notification.tipo === 'event' && 
           (notification.titulo.includes('Reserva Confirmada') || 
            notification.titulo.includes('Reserva Não Aprovada') ||
            notification.titulo.includes('Reserva Recusada'));
  };

  const extractEventId = (notification: Notification): number | null => {
    const urlMatch = notification.urlAcao?.match(/\/events\/(\d+)/);
    if (urlMatch) return parseInt(urlMatch[1]);
    if (notification.metadata) {
      try {
        const meta = JSON.parse(notification.metadata);
        if (meta.eventId) return meta.eventId;
      } catch (e) {}
    }
    return null;
  };

  const extractClientId = (notification: Notification): number | null => {
    if (notification.metadata) {
      try {
        const meta = JSON.parse(notification.metadata);
        if (meta.clientId) return meta.clientId;
      } catch (e) {}
    }
    return notification.remetenteId;
  };

  // ✅ Aceitar reserva (apenas OWNER)
  const handleAcceptReservation = useCallback(async () => {
    if (!notificationToProcess || isClient) return;
    setProcessing(true);
    try {
      const eventId = extractEventId(notificationToProcess);
      const clientId = extractClientId(notificationToProcess);
      if (!eventId) {
        setErrorMessage('Não foi possível identificar o evento');
        setShowErrorModal(true);
        return;
      }
      await eventService.updateEventStatus(eventId, 'CONFIRMED');
      await notificationService.markAsRead(notificationToProcess.id);
      if (clientId) {
        await notificationService.createNotification({
          titulo: '✅ Reserva Confirmada!',
          mensagem: `Sua solicitação de reserva foi APROVADA! O evento está confirmado. Acesse o acompanhamento para ver os próximos passos.`,
          tipo: 'event',
          prioridade: 'high',
          destinatarios: [clientId],
          urlAcao: `/client/tracking/${eventId}`
        });
      }
      await eventService.createDefaultChecklist(eventId);
      setSuccessMessage('Reserva aceita com sucesso!');
      setShowSuccessModal(true);
      await refreshNotifications();
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro ao processar');
      setShowErrorModal(true);
    } finally {
      setProcessing(false);
      setShowAcceptConfirm(false);
      setNotificationToProcess(null);
    }
  }, [notificationToProcess, isClient, refreshNotifications]);

  // ✅ Recusar reserva (apenas OWNER)
  const handleRejectReservation = useCallback(async () => {
    if (!notificationToProcess || isClient) return;
    setProcessing(true);
    try {
      const eventId = extractEventId(notificationToProcess);
      const clientId = extractClientId(notificationToProcess);
      if (!eventId) {
        setErrorMessage('Não foi possível identificar o evento');
        setShowErrorModal(true);
        return;
      }
      await eventService.updateEventStatus(eventId, 'CANCELLED');
      await notificationService.markAsRead(notificationToProcess.id);
      if (clientId) {
        await notificationService.createNotification({
          titulo: '❌ Solicitação de Reserva Não Aprovada',
          mensagem: `Sua solicitação de reserva não pôde ser aprovada neste momento. Entre em contato para mais informações.`,
          tipo: 'event',
          prioridade: 'high',
          destinatarios: [clientId],
          urlAcao: `/client/new-booking`
        });
      }
      setSuccessMessage('Reserva recusada.');
      setShowSuccessModal(true);
      await refreshNotifications();
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro ao processar');
      setShowErrorModal(true);
    } finally {
      setProcessing(false);
      setShowRejectConfirm(false);
      setNotificationToProcess(null);
    }
  }, [notificationToProcess, isClient, refreshNotifications]);

  useEffect(() => {
    if (filteredRecipients.length > 0 && selectedRecipients.length === filteredRecipients.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedRecipients, filteredRecipients]);

  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(filteredRecipients.map(r => r.id));
    }
  }, [selectAll, filteredRecipients]);

  const handleSelectRecipient = useCallback((id: number) => {
    setSelectedRecipients(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  }, []);

  const handleCreateNotification = useCallback(async () => {
    if (!titulo.trim()) { setErrorMessage('Título obrigatório'); setShowErrorModal(true); return; }
    if (!mensagem.trim()) { setErrorMessage('Mensagem obrigatória'); setShowErrorModal(true); return; }
    if (selectedRecipients.length === 0) { setErrorMessage('Selecione destinatários'); setShowErrorModal(true); return; }
    setSending(true);
    try {
      await notificationService.createNotification({
        titulo: titulo.trim(), mensagem: mensagem.trim(), tipo, prioridade,
        destinatarios: selectedRecipients, urlAcao: urlAcao.trim() || null
      });
      setSuccessMessage('Notificação enviada!');
      setShowSuccessModal(true);
      setTitulo(''); setMensagem(''); setUrlAcao('');
      setSelectedRecipients([]); setShowManager(false);
      setSearchTerm(''); setFilterType('all');
      await refreshNotifications();
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro ao enviar');
      setShowErrorModal(true);
    } finally {
      setSending(false);
    }
  }, [titulo, mensagem, tipo, prioridade, selectedRecipients, urlAcao, refreshNotifications]);

  const handleMarkAsRead = useCallback(async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
      setSuccessMessage('Todas marcadas como lidas');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Erro:', error);
    }
  }, []);

  const handleDeleteNotification = useCallback(async () => {
    if (!notificationToDelete) return;
    try {
      await notificationService.deleteNotification(notificationToDelete);
      setNotifications(prev => prev.filter(n => n.id !== notificationToDelete));
      setSuccessMessage('Notificação excluída');
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMessage('Erro ao excluir');
      setShowErrorModal(true);
    } finally {
      setShowDeleteConfirm(false);
      setNotificationToDelete(null);
    }
  }, [notificationToDelete]);

  const handleSavePreferences = useCallback(async () => {
    try {
      await notificationService.updatePreferences(preferences);
      setSuccessMessage('Preferências salvas!');
      setShowSuccessModal(true);
      setShowPreferences(false);
    } catch (error) {
      setErrorMessage('Erro ao salvar');
      setShowErrorModal(true);
    }
  }, [preferences]);

  const handleCancelManager = useCallback(() => {
    setShowManager(false);
    setTitulo(''); setMensagem(''); setUrlAcao('');
    setSelectedRecipients([]); setSearchTerm(''); setFilterType('all');
  }, []);

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
      'event': '#3b82f6', 'payment': '#10b981', 'stock': '#f59e0b',
      'alert': '#ef4444', 'system': '#6b7280'
    };
    return colors[type] || '#6b7280';
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      'low': '#6b7280', 'medium': '#3b82f6', 'high': '#f59e0b', 'urgent': '#ef4444'
    };
    return colors[priority] || '#6b7280';
  };

  const getPriorityLabel = (priority: string): string => {
    const labels: Record<string, string> = {
      'low': 'Baixa', 'medium': 'Média', 'high': 'Alta', 'urgent': 'Urgente'
    };
    return labels[priority] || priority;
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner text="Carregando notificações..." />
      </div>
    );
  }

  return (
    <div className={styles.notificationsPage}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <FiBell size={28} />
            Notificações
            {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount}</span>}
          </h1>
          <p className={styles.pageSubtitle}>
            {isClient ? 'Acompanhe suas notificações e atualizações' : 'Gerencie notificações e aprove solicitações'}
          </p>
        </div>
        
        {/* ✅ Apenas OWNER vê botões de Preferências e Enviar */}
        {!isClient && (
          <div className={styles.headerActions}>
            <button className={`${styles.secondaryButton} ${showPreferences ? styles.active : ''}`}
                    onClick={() => setShowPreferences(!showPreferences)}>
              <FiSettings size={18} />
              {showPreferences ? 'Fechar' : 'Preferências'}
            </button>
            <button className={styles.primaryButton} onClick={() => setShowManager(!showManager)}>
              <FiSend size={18} />
              {showManager ? 'Cancelar' : 'Enviar Notificação'}
            </button>
          </div>
        )}
      </div>

      {/* Painel de Preferências - Apenas OWNER */}
      {showPreferences && !isClient && (
        <div className={styles.preferencesPanel}>
          <h2 className={styles.panelTitle}>Preferências de Notificação</h2>
          <div className={styles.preferencesGrid}>
            <div className={styles.preferencesColumn}>
              <h4>Email</h4>
              {Object.entries(preferences.email).map(([key, value]) => (
                <label key={key} className={styles.checkboxLabel}>
                  <input type="checkbox" checked={value}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev, email: { ...prev.email, [key]: e.target.checked }
                    }))} />
                  {key === 'newEvent' && 'Novos eventos'}
                  {key === 'eventReminder' && 'Lembretes'}
                  {key === 'paymentReceived' && 'Pagamentos'}
                  {key === 'lowStock' && 'Estoque baixo'}
                  {key === 'systemUpdates' && 'Atualizações'}
                </label>
              ))}
            </div>
            <div className={styles.preferencesColumn}>
              <h4>Aplicativo</h4>
              {Object.entries(preferences.inApp).map(([key, value]) => (
                <label key={key} className={styles.checkboxLabel}>
                  <input type="checkbox" checked={value}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev, inApp: { ...prev.inApp, [key]: e.target.checked }
                    }))} />
                  {key === 'newEvent' && 'Novos eventos'}
                  {key === 'eventReminder' && 'Lembretes'}
                  {key === 'paymentReceived' && 'Pagamentos'}
                  {key === 'lowStock' && 'Estoque baixo'}
                  {key === 'systemUpdates' && 'Atualizações'}
                </label>
              ))}
            </div>
            <div className={styles.preferencesColumn}>
              <h4>Geral</h4>
              <div className={styles.formGroup}>
                <label>Dias de antecedência</label>
                <input type="number" min="1" max="30" className={styles.formInput}
                  value={preferences.reminderDays}
                  onChange={(e) => setPreferences(prev => ({ ...prev, reminderDays: parseInt(e.target.value) || 3 }))} />
              </div>
            </div>
          </div>
          <div className={styles.panelActions}>
            <button className={styles.secondaryButton} onClick={() => setShowPreferences(false)}>Cancelar</button>
            <button className={styles.primaryButton} onClick={handleSavePreferences}>Salvar</button>
          </div>
        </div>
      )}

      {/* Painel de Envio - Apenas OWNER */}
      {showManager && !isClient && (
        <div className={styles.managerPanel}>
          <div className={styles.managerHeader}>
            <h2 className={styles.panelTitle}>Enviar Notificação</h2>
            <button className={styles.toggleRecipientList} onClick={() => setShowRecipientList(!showRecipientList)}>
              {showRecipientList ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
            </button>
          </div>
          <div className={styles.managerGrid}>
            <div className={styles.managerForm}>
              <div className={styles.formGroup}>
                <label>Título *</label>
                <input type="text" className={styles.formInput} value={titulo}
                  onChange={(e) => setTitulo(e.target.value)} placeholder="Título" />
              </div>
              <div className={styles.formGroup}>
                <label>Mensagem *</label>
                <textarea className={styles.formTextarea} value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)} placeholder="Mensagem..." rows={4} />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Tipo</label>
                  <select className={styles.formSelect} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                    <option value="system">Sistema</option>
                    <option value="event">Evento</option>
                    <option value="payment">Pagamento</option>
                    <option value="stock">Estoque</option>
                    <option value="alert">Alerta</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Prioridade</label>
                  <select className={styles.formSelect} value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Link (opcional)</label>
                <input type="text" className={styles.formInput} value={urlAcao}
                  onChange={(e) => setUrlAcao(e.target.value)} placeholder="/events/123" />
              </div>
              <div className={styles.selectedCount}>
                <FiUsers size={14} />
                <span>{selectedRecipients.length} selecionado(s)</span>
              </div>
            </div>
            {showRecipientList && (
              <div className={styles.managerUsers}>
                <div className={styles.recipientHeader}>
                  <h4><FiUsers size={16} /> Destinatários</h4>
                  <div className={styles.recipientFilters}>
                    <button className={`${styles.filterChip} ${filterType === 'all' ? styles.active : ''}`}
                      onClick={() => setFilterType('all')}>Todos ({recipientCounts.all})</button>
                    <button className={`${styles.filterChip} ${filterType === 'client' ? styles.active : ''}`}
                      onClick={() => setFilterType('client')}>Clientes ({recipientCounts.client})</button>
                    <button className={`${styles.filterChip} ${filterType === 'employee' ? styles.active : ''}`}
                      onClick={() => setFilterType('employee')}>Funcionários ({recipientCounts.employee})</button>
                  </div>
                </div>
                <div className={styles.recipientSearch}>
                  <FiSearch size={16} />
                  <input type="text" placeholder="Buscar..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} className={styles.recipientSearchInput} />
                  {searchTerm && <button className={styles.clearSearch} onClick={() => setSearchTerm('')}><FiX size={14} /></button>}
                </div>
                <label className={styles.selectAllLabel}>
                  <input type="checkbox" checked={selectAll && filteredRecipients.length > 0} onChange={handleSelectAll} />
                  <strong>Selecionar Todos</strong> ({filteredRecipients.length})
                </label>
                <div className={styles.usersListContainer}>
                  {filteredRecipients.length === 0 ? (
                    <div className={styles.noRecipients}><FiUsers size={24} /><p>Nenhum encontrado</p></div>
                  ) : (
                    filteredRecipients.map(recipient => (
                      <label key={recipient.id} className={styles.recipientItem}>
                        <input type="checkbox" checked={selectedRecipients.includes(recipient.id)}
                          onChange={() => handleSelectRecipient(recipient.id)} />
                        <div className={styles.recipientInfo}>
                          <span className={styles.recipientName}>{recipient.name}</span>
                          <span className={styles.recipientEmail}>{recipient.email}</span>
                        </div>
                        {recipient.userType === 'OWNER' && <span className={styles.employeeBadge}>Func.</span>}
                        {recipient.userType === 'CLIENT' && <span className={styles.clientBadge}>Cliente</span>}
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div className={styles.panelActions}>
            <button className={styles.secondaryButton} onClick={handleCancelManager}>Cancelar</button>
            <button className={styles.primaryButton} onClick={handleCreateNotification} disabled={sending}>
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <button className={`${styles.filterButton} ${filterStatus === 'all' ? styles.activeFilter : ''}`}
            onClick={() => setFilterStatus('all')}>Todas ({notifications.length})</button>
          <button className={`${styles.filterButton} ${filterStatus === 'unread' ? styles.activeFilter : ''}`}
            onClick={() => setFilterStatus('unread')}>Não lidas ({unreadCount})</button>
          <button className={`${styles.filterButton} ${filterStatus === 'read' ? styles.activeFilter : ''}`}
            onClick={() => setFilterStatus('read')}>Lidas ({notifications.filter(n => n.lida).length})</button>
        </div>
        <div className={styles.filterGroup}>
          <select className={styles.filterSelect} value={filterNotificationType}
            onChange={(e) => setFilterNotificationType(e.target.value)}>
            <option value="all">Todos os tipos</option>
            <option value="event">Eventos</option>
            <option value="payment">Pagamentos</option>
            <option value="stock">Estoque</option>
            <option value="alert">Alertas</option>
            <option value="system">Sistema</option>
          </select>
        </div>
        {unreadCount > 0 && (
          <button className={styles.markAllBtn} onClick={handleMarkAllAsRead}>
            <FiCheck size={16} /> Marcar todas
          </button>
        )}
      </div>

      {/* Lista */}
      {filteredNotifications.length === 0 ? (
        <EmptyState icon={<FiBell size={48} />} title="Nenhuma notificação"
          description={filterStatus !== 'all' || filterNotificationType !== 'all'
            ? 'Nenhuma corresponde aos filtros.' : 'Você não tem notificações.'} />
      ) : (
        <div className={styles.notificationsList}>
          {filteredNotifications.map(notification => {
            const isReservation = isReservationRequest(notification);
            const isStatus = isStatusNotification(notification);
            const isApproved = notification.titulo.includes('Confirmada');
            const isRejected = notification.titulo.includes('Não Aprovada') || notification.titulo.includes('Recusada');
            
            return (
              <div key={notification.id} 
                className={`${styles.notificationCard} ${!notification.lida ? styles.unread : ''} 
                  ${isReservation ? styles.reservationCard : ''} 
                  ${isApproved ? styles.approvedCard : ''} 
                  ${isRejected ? styles.rejectedCard : ''}`}>
                <div className={styles.notificationIcon}
                  style={{ backgroundColor: getTypeColor(notification.tipo) + '20', color: getTypeColor(notification.tipo) }}>
                  {isApproved ? <FiCheckCircle size={20} /> : isRejected ? <FiXCircle size={20} /> : getTypeIcon(notification.tipo)}
                </div>
                <div className={styles.notificationContent}>
                  <div className={styles.notificationHeader}>
                    <h3 className={styles.notificationTitle}>
                      {!notification.lida && <span className={styles.unreadDot} />}
                      {notification.titulo}
                    </h3>
                    <div className={styles.notificationMeta}>
                      <span className={styles.priorityBadge} style={{ backgroundColor: getPriorityColor(notification.prioridade) }}>
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
                      {isClient ? 'Enviado por: ' : 'Solicitado por: '}
                      <strong>{notification.remetenteNome}</strong>
                    </p>
                  )}
                  <div className={styles.notificationFooter}>
                    {/* ✅ OWNER: Botões Aceitar/Recusar */}
                    {isReservation && !notification.lida && !isClient && (
                      <div className={styles.reservationActions}>
                        <button className={styles.acceptButton}
                          onClick={() => { setNotificationToProcess(notification); setShowAcceptConfirm(true); }}
                          disabled={processing}>
                          <FiCheckCircle size={16} /> Aceitar
                        </button>
                        <button className={styles.rejectButton}
                          onClick={() => { setNotificationToProcess(notification); setShowRejectConfirm(true); }}
                          disabled={processing}>
                          <FiXCircle size={16} /> Recusar
                        </button>
                      </div>
                    )}
                    {/* ✅ CLIENT: Status visual */}
                    {isStatus && isClient && (
                      <div className={`${styles.statusBadge} ${isApproved ? styles.approved : styles.rejected}`}>
                        {isApproved ? <FiCheckCircle size={14} /> : <FiXCircle size={14} />}
                        <span>{isApproved ? 'Aprovado' : 'Não aprovado'}</span>
                      </div>
                    )}
                    <div className={styles.notificationActions}>
                      {!notification.lida && !isReservation && (
                        <button className={styles.markReadButton} onClick={() => handleMarkAsRead(notification.id)}>
                          <FiCheck size={14} /> Lida
                        </button>
                      )}
                      <button className={styles.deleteButton}
                        onClick={() => { setNotificationToDelete(notification.id); setShowDeleteConfirm(true); }}>
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modais */}
      <ConfirmationModal isOpen={showSuccessModal} title="Sucesso!" message={successMessage}
        type="success" onConfirm={() => setShowSuccessModal(false)} onCancel={() => setShowSuccessModal(false)} confirmText="OK" />
      <ErrorModal isOpen={showErrorModal} message={errorMessage} onClose={() => setShowErrorModal(false)} />
      <ConfirmationModal isOpen={showDeleteConfirm} title="Excluir" message="Excluir esta notificação?"
        type="warning" onConfirm={handleDeleteNotification}
        onCancel={() => { setShowDeleteConfirm(false); setNotificationToDelete(null); }} confirmText="Excluir" />
      
      {/* Modais de Aceitar/Recusar - Apenas OWNER */}
      {!isClient && (
        <>
          <ConfirmationModal isOpen={showAcceptConfirm} title="Confirmar Reserva"
            message="Aprovar esta solicitação? O cliente será notificado."
            type="success" onConfirm={handleAcceptReservation}
            onCancel={() => { setShowAcceptConfirm(false); setNotificationToProcess(null); }}
            confirmText="Aprovar" cancelText="Cancelar" />
          <ConfirmationModal isOpen={showRejectConfirm} title="Recusar Reserva"
            message="Recusar esta solicitação? O cliente será notificado."
            type="warning" onConfirm={handleRejectReservation}
            onCancel={() => { setShowRejectConfirm(false); setNotificationToProcess(null); }}
            confirmText="Recusar" cancelText="Cancelar" />
        </>
      )}
    </div>
  );
};

export default NotificationsPage;