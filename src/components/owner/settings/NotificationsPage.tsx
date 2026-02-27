import React, { useState, useEffect } from 'react';
import { 
  FiBell, FiCalendar, FiDollarSign, FiPackage, 
  FiClock, FiCheck, FiTrash2, FiPlus, FiSend, FiUsers
} from 'react-icons/fi';
import { MdEvent, MdPayment, MdInfo } from 'react-icons/md';
import { ConfirmationModal } from '../../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../../common/Alerts/ErrorModal';
import { notificationService, Notification, NotificationPreferences } from '../../../services/notification';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import styles from './NotificationsPage.module.css';

// Preferências Default
const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: { newEvent: true, eventReminder: true, paymentReceived: true, lowStock: true, systemUpdates: false },
  inApp: { newEvent: true, eventReminder: true, paymentReceived: true, lowStock: true, systemUpdates: true },
  reminderDays: 3,
  quietHours: { enabled: false, start: '22:00', end: '08:00' }
};

// Mock de Usuários para o Gerenciador (Substitua por uma chamada à API no futuro)
const MOCK_USERS = [
  { id: 1, name: 'Todos os Usuários' },
  { id: 2, name: 'João Silva (Cliente)' },
  { id: 3, name: 'Maria Oliveira (Cliente)' },
  { id: 4, name: 'Carlos Santos (Equipe)' },
  { id: 5, name: 'Empresa X (Parceiro)' },
];

type NotificationFilter = 'all' | 'unread' | 'event' | 'payment' | 'stock' | 'reminder' | 'system';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  
  // Painéis
  const [showPreferences, setShowPreferences] = useState(false);
  const [showManager, setShowManager] = useState(false); // Novo Estado para o Gerenciador
  
  // Estados de Carregamento
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Formulário do Gerenciador de Notificações
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'system' as Notification['type'],
    priority: 'medium' as Notification['priority'],
    selectedUsers: [] as number[]
  });
  
  // Modais de Feedback
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getAllNotifications();
      setNotifications(data || []);
    } catch (error) {
      setErrorMessage('Não foi possível carregar as notificações do servidor.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.read);
    return notifications.filter(n => n.type === filter);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // --- Ações Integradas com a API ---

  const handleMarkAsRead = async (id: number) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      await notificationService.markAsRead(id);
    } catch (error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
      setErrorMessage('Erro ao comunicar com o servidor.');
      setShowErrorModal(true);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setSuccessMessage('Todas as notificações foram marcadas como lidas');
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMessage('Erro ao atualizar notificações.');
      setShowErrorModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmClearAll = async () => {
    try {
      setActionLoading(true);
      await notificationService.clearAll(); 
      setNotifications([]);
      setSuccessMessage('Todas as notificações foram removidas');
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMessage('Erro ao limpar notificações.');
      setShowErrorModal(true);
    } finally {
      setShowClearConfirm(false);
      setActionLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setActionLoading(true);
      await notificationService.savePreferences(preferences); 
      setHasChanges(false);
      setShowPreferences(false);
      setSuccessMessage('Preferências salvas com sucesso!');
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMessage('Erro ao salvar preferências.');
      setShowErrorModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  // --- Funções do Gerenciador de Notificações ---
  const handleToggleUserSelection = (userId: number) => {
    setNewNotification(prev => {
      const isSelected = prev.selectedUsers.includes(userId);
      // Se for "Todos os usuários" (ID 1), limpa os outros e marca/desmarca
      if (userId === 1) {
        return { ...prev, selectedUsers: isSelected ? [] : [1] };
      }
      // Se selecionar um usuário específico, desmarca "Todos"
      const newSelected = isSelected 
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers.filter(id => id !== 1), userId];
      return { ...prev, selectedUsers: newSelected };
    });
  };

  const handleCreateNotification = async () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      setErrorMessage('Título e Descrição são obrigatórios.');
      setShowErrorModal(true);
      return;
    }
    if (newNotification.selectedUsers.length === 0) {
      setErrorMessage('Selecione pelo menos um destinatário.');
      setShowErrorModal(true);
      return;
    }

    try {
      setActionLoading(true);
      
      // MOCK DE ENVIO: Futuramente crie um endpoint POST /api/notifications e chame aqui
      // await notificationService.createNotification(newNotification);
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulando delay da API
      
      // Adiciona na tela localmente para feedback visual
      const createdNotification: Notification = {
        id: Date.now(),
        type: newNotification.type,
        title: newNotification.title,
        message: newNotification.message,
        timestamp: new Date().toISOString(),
        read: false,
        priority: newNotification.priority,
      };

      setNotifications([createdNotification, ...notifications]);
      
      setSuccessMessage('Notificação enviada com sucesso!');
      setShowSuccessModal(true);
      setShowManager(false);
      
      // Limpa formulário
      setNewNotification({
        title: '', message: '', type: 'system', priority: 'medium', selectedUsers: []
      });

    } catch (error) {
      setErrorMessage('Erro ao enviar notificação.');
      setShowErrorModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  // --- Funções de UI ---

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'event': return <MdEvent size={20} />;
      case 'payment': return <MdPayment size={20} />;
      case 'stock': return <FiPackage size={20} />;
      case 'reminder': return <FiClock size={20} />;
      case 'system': return <FiBell size={20} />;
      default: return <MdInfo size={20} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'event': return '#3b82f6';
      case 'payment': return '#10b981';
      case 'stock': return '#f59e0b';
      case 'reminder': return '#8b5cf6';
      case 'system': return '#64748b';
      default: return '#64748b';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'high': return <span className={`${styles.priorityBadge} ${styles.priorityHigh}`}>Alta / Urgente</span>;
      case 'medium': return <span className={`${styles.priorityBadge} ${styles.priorityMedium}`}>Média</span>;
      case 'low': return <span className={`${styles.priorityBadge} ${styles.priorityLow}`}>Baixa</span>;
      default: return null;
    }
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return 'Desconhecido';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Agora mesmo';
    if (hours < 24) return `Há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    if (days === 1) return 'Ontem';
    return date.toLocaleDateString('pt-BR');
  };

  const filteredNotifications = getFilteredNotifications();

  if (loading) {
    return <LoadingSpinner text="Carregando notificações..." fullScreen />;
  }

  return (
    <div className={styles.notificationsPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <FiBell size={28} />
            Notificações
          </h1>
          <p className={styles.pageSubtitle}>
            {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            className={`${styles.primaryButton} ${showManager ? styles.active : ''}`}
            onClick={() => {
              setShowManager(!showManager);
              setShowPreferences(false);
            }}
          >
            <FiPlus size={18} />
            Criar Notificação
          </button>
          
          <button
            className={`${styles.secondaryButton} ${showPreferences ? styles.active : ''}`}
            onClick={() => {
              setShowPreferences(!showPreferences);
              setShowManager(false);
            }}
          >
            <FiBell size={18} />
            Preferências
          </button>
          <button
            className={styles.secondaryButton}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || actionLoading}
          >
            <FiCheck size={18} />
            Marcar todas lidas
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => setShowClearConfirm(true)}
            disabled={notifications.length === 0 || actionLoading}
          >
            <FiTrash2 size={18} />
            Limpar todas
          </button>
        </div>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <button className={`${styles.filterButton} ${filter === 'all' ? styles.activeFilter : ''}`} onClick={() => setFilter('all')}>Todas</button>
          <button className={`${styles.filterButton} ${filter === 'unread' ? styles.activeFilter : ''}`} onClick={() => setFilter('unread')}>Não lidas</button>
          <button className={`${styles.filterButton} ${filter === 'event' ? styles.activeFilter : ''}`} onClick={() => setFilter('event')}>Eventos</button>
          <button className={`${styles.filterButton} ${filter === 'payment' ? styles.activeFilter : ''}`} onClick={() => setFilter('payment')}>Pagamentos</button>
          <button className={`${styles.filterButton} ${filter === 'stock' ? styles.activeFilter : ''}`} onClick={() => setFilter('stock')}>Estoque</button>
          <button className={`${styles.filterButton} ${filter === 'reminder' ? styles.activeFilter : ''}`} onClick={() => setFilter('reminder')}>Lembretes</button>
        </div>
      </div>

      {/* PAINEL: GERENCIADOR DE NOTIFICAÇÕES (Conforme esboço) */}
      {showManager && (
        <div className={styles.managerPanel}>
          <h3 className={styles.panelTitle}>Gerenciador de Notificações</h3>
          
          <div className={styles.managerGrid}>
            {/* Esquerda: Formulário */}
            <div className={styles.managerForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Título</label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  placeholder="Ex: Reunião reagendada"
                  value={newNotification.title}
                  onChange={e => setNewNotification({...newNotification, title: e.target.value})}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Descrição</label>
                <textarea 
                  className={`${styles.formInput} ${styles.formTextarea}`} 
                  placeholder="Detalhes da notificação..."
                  value={newNotification.message}
                  onChange={e => setNewNotification({...newNotification, message: e.target.value})}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Status / Categoria</label>
                <div className={styles.statusSelectsRow}>
                  <select 
                    className={styles.formInput}
                    value={newNotification.priority}
                    onChange={e => setNewNotification({...newNotification, priority: e.target.value as any})}
                  >
                    <option value="high">Urgente / Alta prioridade</option>
                    <option value="medium">Lembrete / Média</option>
                    <option value="low">Informativo / Baixa</option>
                  </select>

                  <select 
                    className={styles.formInput}
                    value={newNotification.type}
                    onChange={e => setNewNotification({...newNotification, type: e.target.value as any})}
                  >
                    <option value="system">Aviso de Sistema</option>
                    <option value="event">Aviso de Evento</option>
                    <option value="payment">Aviso de Pagamento</option>
                    <option value="reminder">Lembrete Geral</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Direita: Lista de Usuários */}
            <div className={styles.managerUsers}>
              <h4 className={styles.managerUsersTitle}>
                <FiUsers size={16} /> Lista de Usuários
              </h4>
              <div className={styles.usersListContainer}>
                {MOCK_USERS.map(user => (
                  <label key={user.id} className={styles.checkboxLabel}>
                    <input 
                      type="checkbox" 
                      checked={newNotification.selectedUsers.includes(user.id)}
                      onChange={() => handleToggleUserSelection(user.id)}
                    />
                    <span className={user.id === 1 ? styles.userAll : ''}>{user.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.panelActions}>
            <button className={styles.secondaryButton} onClick={() => setShowManager(false)}>
              Cancelar
            </button>
            <button className={styles.primaryButton} onClick={handleCreateNotification} disabled={actionLoading}>
              {actionLoading ? (<><span className={styles.buttonSpinner}></span> Enviando...</>) : (<><FiSend size={18} /> Enviar Notificação</>)}
            </button>
          </div>
        </div>
      )}

      {/* PAINEL: PREFERÊNCIAS (Original) */}
      {showPreferences && (
        <div className={styles.preferencesPanel}>
          <h3 className={styles.panelTitle}>Preferências de Notificação</h3>

          <div className={styles.preferencesGrid}>
            <div className={styles.preferencesColumn}>
              <h4>Notificações por E-mail</h4>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={preferences.email.newEvent} onChange={(e) => { setPreferences({ ...preferences, email: { ...preferences.email, newEvent: e.target.checked } }); setHasChanges(true); }} />
                <MdEvent size={16} /> <span>Novo evento</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={preferences.email.eventReminder} onChange={(e) => { setPreferences({ ...preferences, email: { ...preferences.email, eventReminder: e.target.checked } }); setHasChanges(true); }} />
                <FiCalendar size={16} /> <span>Lembrete de evento</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={preferences.email.paymentReceived} onChange={(e) => { setPreferences({ ...preferences, email: { ...preferences.email, paymentReceived: e.target.checked } }); setHasChanges(true); }} />
                <FiDollarSign size={16} /> <span>Pagamento recebido</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={preferences.email.lowStock} onChange={(e) => { setPreferences({ ...preferences, email: { ...preferences.email, lowStock: e.target.checked } }); setHasChanges(true); }} />
                <FiPackage size={16} /> <span>Estoque baixo</span>
              </label>
            </div>

            <div className={styles.preferencesColumn}>
              <h4>Notificações no App</h4>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={preferences.inApp.newEvent} onChange={(e) => { setPreferences({ ...preferences, inApp: { ...preferences.inApp, newEvent: e.target.checked } }); setHasChanges(true); }} />
                <MdEvent size={16} /> <span>Novo evento</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={preferences.inApp.eventReminder} onChange={(e) => { setPreferences({ ...preferences, inApp: { ...preferences.inApp, eventReminder: e.target.checked } }); setHasChanges(true); }} />
                <FiCalendar size={16} /> <span>Lembrete de evento</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={preferences.inApp.paymentReceived} onChange={(e) => { setPreferences({ ...preferences, inApp: { ...preferences.inApp, paymentReceived: e.target.checked } }); setHasChanges(true); }} />
                <FiDollarSign size={16} /> <span>Pagamento recebido</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={preferences.inApp.lowStock} onChange={(e) => { setPreferences({ ...preferences, inApp: { ...preferences.inApp, lowStock: e.target.checked } }); setHasChanges(true); }} />
                <FiPackage size={16} /> <span>Estoque baixo</span>
              </label>
            </div>

            <div className={styles.preferencesColumn}>
              <h4>Configurações Adicionais</h4>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <FiClock size={14} /> Lembrar com antecedência (dias)
                </label>
                <input type="number" min="1" max="30" className={styles.formInput} value={preferences.reminderDays} onChange={(e) => { setPreferences({ ...preferences, reminderDays: parseInt(e.target.value) }); setHasChanges(true); }} />
              </div>

              <label className={styles.switchLabel}>
                <div className={styles.switchInfo}>
                  <strong>Modo silencioso</strong>
                  <small>Não receber neste período</small>
                </div>
                <input type="checkbox" checked={preferences.quietHours.enabled} onChange={(e) => { setPreferences({ ...preferences, quietHours: { ...preferences.quietHours, enabled: e.target.checked } }); setHasChanges(true); }} />
                <span className={styles.switchSlider}></span>
              </label>

              {preferences.quietHours.enabled && (
                <div className={styles.quietHoursInputs}>
                  <input type="time" className={styles.formInput} value={preferences.quietHours.start} onChange={(e) => { setPreferences({ ...preferences, quietHours: { ...preferences.quietHours, start: e.target.value } }); setHasChanges(true); }} />
                  <span>até</span>
                  <input type="time" className={styles.formInput} value={preferences.quietHours.end} onChange={(e) => { setPreferences({ ...preferences, quietHours: { ...preferences.quietHours, end: e.target.value } }); setHasChanges(true); }} />
                </div>
              )}
            </div>
          </div>

          <div className={styles.panelActions}>
            <button className={styles.secondaryButton} onClick={() => { setPreferences(DEFAULT_PREFERENCES); setHasChanges(false); setShowPreferences(false); }}>
              Cancelar
            </button>
            <button className={styles.primaryButton} onClick={handleSavePreferences} disabled={actionLoading || !hasChanges}>
              {actionLoading ? (<><span className={styles.buttonSpinner}></span> Salvando...</>) : (<><FiCheck size={18} /> Salvar Preferências</>)}
            </button>
          </div>
        </div>
      )}

      {/* Lista de Notificações */}
      <div className={styles.notificationsList}>
        {filteredNotifications.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FiBell size={48} />
            </div>
            <h3 className={styles.emptyTitle}>Nenhuma notificação</h3>
            <p className={styles.emptyText}>
              {filter === 'all' 
                ? 'Você não tem nenhuma notificação no momento.'
                : 'Não há notificações para este filtro.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div key={notification.id} className={`${styles.notificationCard} ${!notification.read ? styles.unread : ''}`}>
              <div className={styles.notificationIcon} style={{ backgroundColor: `${getTypeColor(notification.type)}20` }}>
                <div style={{ color: getTypeColor(notification.type) }}>
                  {getTypeIcon(notification.type)}
                </div>
              </div>

              <div className={styles.notificationContent}>
                <div className={styles.notificationHeader}>
                  <h3 className={styles.notificationTitle}>
                    {notification.title}
                    {!notification.read && <span className={styles.unreadDot}></span>}
                  </h3>
                  <div className={styles.notificationMeta}>
                    {getPriorityBadge(notification.priority)}
                    <span className={styles.notificationTime}>
                      {formatTime(notification.timestamp)}
                    </span>
                  </div>
                </div>

                <p className={styles.notificationMessage}>
                  {notification.message}
                </p>

                <div className={styles.notificationFooter}>
                  {notification.actionUrl && (
                    <a href={notification.actionUrl} className={styles.notificationAction}>
                      Ver detalhes
                    </a>
                  )}
                  
                  {!notification.read && (
                    <button className={styles.markReadButton} onClick={() => handleMarkAsRead(notification.id)}>
                      <FiCheck size={14} /> Marcar como lida
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmationModal isOpen={showSuccessModal} title="Sucesso!" message={successMessage} type="success" onConfirm={() => setShowSuccessModal(false)} onCancel={() => setShowSuccessModal(false)} confirmText="OK" />
      <ErrorModal isOpen={showErrorModal} message={errorMessage} onClose={() => setShowErrorModal(false)} />
      <ConfirmationModal isOpen={showClearConfirm} title="Limpar Todas as Notificações" message="Tem certeza que deseja remover todas as notificações? Esta ação não pode ser desfeita." type="warning" onConfirm={confirmClearAll} onCancel={() => setShowClearConfirm(false)} confirmText="Limpar" />
    </div>
  );
};

export default NotificationsPage;