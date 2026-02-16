import React, { useState } from 'react';
import { 
  FiBell, 
  FiMail, 
  FiMessageSquare,
  FiCalendar,
  FiDollarSign,
  FiPackage,
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiFilter,
  FiCheck,
  FiX,
  FiTrash2
} from 'react-icons/fi';
import { 
  MdEvent, 
  MdPayment, 
  MdWarning,
  MdInfo,
  MdVerified
} from 'react-icons/md';
import { ConfirmationModal } from '../../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../../common/Alerts/ErrorModal';
import styles from './NotificationsPage.module.css';

interface Notification {
  id: number;
  type: 'event' | 'payment' | 'stock' | 'system' | 'reminder';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
}

interface NotificationPreferences {
  email: {
    newEvent: boolean;
    eventReminder: boolean;
    paymentReceived: boolean;
    lowStock: boolean;
    systemUpdates: boolean;
  };
  inApp: {
    newEvent: boolean;
    eventReminder: boolean;
    paymentReceived: boolean;
    lowStock: boolean;
    systemUpdates: boolean;
  };
  reminderDays: number;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

// Dados mocados
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: 'event',
    title: 'Novo evento cadastrado',
    message: 'Casamento de João e Maria foi cadastrado para 15/03/2026',
    timestamp: '2026-02-16T09:30:00',
    read: false,
    priority: 'medium',
    actionUrl: '/admin/events/1'
  },
  {
    id: 2,
    type: 'payment',
    title: 'Pagamento recebido',
    message: 'Sinal de R$ 5.000,00 recebido para o evento Casamento João e Maria',
    timestamp: '2026-02-15T14:20:00',
    read: false,
    priority: 'high',
    actionUrl: '/admin/events/1/financial'
  },
  {
    id: 3,
    type: 'stock',
    title: 'Estoque baixo',
    message: 'Cadeira Tiffany Branca está com apenas 15 unidades disponíveis',
    timestamp: '2026-02-15T11:00:00',
    read: true,
    priority: 'high',
    actionUrl: '/admin/items'
  },
  {
    id: 4,
    type: 'reminder',
    title: 'Lembrete de evento',
    message: 'Evento Aniversário Sofia acontece em 3 dias',
    timestamp: '2026-02-14T08:00:00',
    read: true,
    priority: 'medium',
    actionUrl: '/admin/events/2'
  },
  {
    id: 5,
    type: 'system',
    title: 'Atualização do sistema',
    message: 'Nova versão disponível com melhorias de desempenho',
    timestamp: '2026-02-13T18:00:00',
    read: true,
    priority: 'low'
  },
  {
    id: 6,
    type: 'event',
    title: 'Evento cancelado',
    message: 'Evento Corporativo foi cancelado pelo cliente',
    timestamp: '2026-02-12T16:45:00',
    read: true,
    priority: 'high',
    actionUrl: '/admin/events/4'
  },
  {
    id: 7,
    type: 'payment',
    title: 'Pagamento atrasado',
    message: 'Pagamento do evento Formatura Direito está atrasado',
    timestamp: '2026-02-11T10:15:00',
    read: true,
    priority: 'high',
    actionUrl: '/admin/events/3/financial'
  },
  {
    id: 8,
    type: 'reminder',
    title: 'Tarefa pendente',
    message: 'Contratar buffet para o evento Casamento João e Maria',
    timestamp: '2026-02-10T09:00:00',
    read: true,
    priority: 'medium',
    actionUrl: '/admin/checklist/1'
  }
];

const MOCK_PREFERENCES: NotificationPreferences = {
  email: {
    newEvent: true,
    eventReminder: true,
    paymentReceived: true,
    lowStock: true,
    systemUpdates: false
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
    end: '08:00'
  }
};

type NotificationFilter = 'all' | 'unread' | 'event' | 'payment' | 'stock' | 'reminder' | 'system';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [preferences, setPreferences] = useState<NotificationPreferences>(MOCK_PREFERENCES);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.read);
    return notifications.filter(n => n.type === filter);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    setSuccessMessage('Todas as notificações foram marcadas como lidas');
    setShowSuccessModal(true);
  };

  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAll = () => {
    setNotifications([]);
    setShowClearConfirm(false);
    setSuccessMessage('Todas as notificações foram removidas');
    setShowSuccessModal(true);
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
      setShowPreferences(false);
      setSuccessMessage('Preferências salvas com sucesso!');
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMessage('Erro ao salvar preferências. Tente novamente.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

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
      case 'high':
        return <span className={`${styles.priorityBadge} ${styles.priorityHigh}`}>Alta</span>;
      case 'medium':
        return <span className={`${styles.priorityBadge} ${styles.priorityMedium}`}>Média</span>;
      case 'low':
        return <span className={`${styles.priorityBadge} ${styles.priorityLow}`}>Baixa</span>;
      default:
        return null;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) {
      return 'Agora mesmo';
    } else if (hours < 24) {
      return `Há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else if (days === 1) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const filteredNotifications = getFilteredNotifications();

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
            className={`${styles.secondaryButton} ${showPreferences ? styles.active : ''}`}
            onClick={() => setShowPreferences(!showPreferences)}
          >
            <FiBell size={18} />
            Preferências
          </button>
          <button
            className={styles.secondaryButton}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <FiCheck size={18} />
            Marcar todas como lidas
          </button>
          <button
            className={styles.secondaryButton}
            onClick={handleClearAll}
            disabled={notifications.length === 0}
          >
            <FiTrash2 size={18} />
            Limpar todas
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <button
            className={`${styles.filterButton} ${filter === 'all' ? styles.activeFilter : ''}`}
            onClick={() => setFilter('all')}
          >
            Todas
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'unread' ? styles.activeFilter : ''}`}
            onClick={() => setFilter('unread')}
          >
            Não lidas
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'event' ? styles.activeFilter : ''}`}
            onClick={() => setFilter('event')}
          >
            Eventos
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'payment' ? styles.activeFilter : ''}`}
            onClick={() => setFilter('payment')}
          >
            Pagamentos
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'stock' ? styles.activeFilter : ''}`}
            onClick={() => setFilter('stock')}
          >
            Estoque
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'reminder' ? styles.activeFilter : ''}`}
            onClick={() => setFilter('reminder')}
          >
            Lembretes
          </button>
        </div>
      </div>

      {/* Painel de Preferências */}
      {showPreferences && (
        <div className={styles.preferencesPanel}>
          <h3 className={styles.preferencesTitle}>Preferências de Notificação</h3>

          <div className={styles.preferencesGrid}>
            <div className={styles.preferencesColumn}>
              <h4>Notificações por E-mail</h4>
              
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={preferences.email.newEvent}
                  onChange={(e) => {
                    setPreferences({
                      ...preferences,
                      email: { ...preferences.email, newEvent: e.target.checked }
                    });
                    setHasChanges(true);
                  }}
                />
                <MdEvent size={16} />
                <span>Novo evento</span>
              </label>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={preferences.email.eventReminder}
                  onChange={(e) => {
                    setPreferences({
                      ...preferences,
                      email: { ...preferences.email, eventReminder: e.target.checked }
                    });
                    setHasChanges(true);
                  }}
                />
                <FiCalendar size={16} />
                <span>Lembrete de evento</span>
              </label>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={preferences.email.paymentReceived}
                  onChange={(e) => {
                    setPreferences({
                      ...preferences,
                      email: { ...preferences.email, paymentReceived: e.target.checked }
                    });
                    setHasChanges(true);
                  }}
                />
                <FiDollarSign size={16} />
                <span>Pagamento recebido</span>
              </label>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={preferences.email.lowStock}
                  onChange={(e) => {
                    setPreferences({
                      ...preferences,
                      email: { ...preferences.email, lowStock: e.target.checked }
                    });
                    setHasChanges(true);
                  }}
                />
                <FiPackage size={16} />
                <span>Estoque baixo</span>
              </label>
            </div>

            <div className={styles.preferencesColumn}>
              <h4>Notificações no App</h4>
              
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={preferences.inApp.newEvent}
                  onChange={(e) => {
                    setPreferences({
                      ...preferences,
                      inApp: { ...preferences.inApp, newEvent: e.target.checked }
                    });
                    setHasChanges(true);
                  }}
                />
                <MdEvent size={16} />
                <span>Novo evento</span>
              </label>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={preferences.inApp.eventReminder}
                  onChange={(e) => {
                    setPreferences({
                      ...preferences,
                      inApp: { ...preferences.inApp, eventReminder: e.target.checked }
                    });
                    setHasChanges(true);
                  }}
                />
                <FiCalendar size={16} />
                <span>Lembrete de evento</span>
              </label>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={preferences.inApp.paymentReceived}
                  onChange={(e) => {
                    setPreferences({
                      ...preferences,
                      inApp: { ...preferences.inApp, paymentReceived: e.target.checked }
                    });
                    setHasChanges(true);
                  }}
                />
                <FiDollarSign size={16} />
                <span>Pagamento recebido</span>
              </label>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={preferences.inApp.lowStock}
                  onChange={(e) => {
                    setPreferences({
                      ...preferences,
                      inApp: { ...preferences.inApp, lowStock: e.target.checked }
                    });
                    setHasChanges(true);
                  }}
                />
                <FiPackage size={16} />
                <span>Estoque baixo</span>
              </label>
            </div>

            <div className={styles.preferencesColumn}>
              <h4>Configurações Adicionais</h4>

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
                  value={preferences.reminderDays}
                  onChange={(e) => {
                    setPreferences({
                      ...preferences,
                      reminderDays: parseInt(e.target.value)
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <label className={styles.switchLabel}>
                <div className={styles.switchInfo}>
                  <strong>Modo silencioso</strong>
                  <small>Não receber notificações neste período</small>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.quietHours.enabled}
                  onChange={(e) => {
                    setPreferences({
                      ...preferences,
                      quietHours: { ...preferences.quietHours, enabled: e.target.checked }
                    });
                    setHasChanges(true);
                  }}
                />
                <span className={styles.switchSlider}></span>
              </label>

              {preferences.quietHours.enabled && (
                <div className={styles.quietHoursInputs}>
                  <input
                    type="time"
                    className={styles.formInput}
                    value={preferences.quietHours.start}
                    onChange={(e) => {
                      setPreferences({
                        ...preferences,
                        quietHours: { ...preferences.quietHours, start: e.target.value }
                      });
                      setHasChanges(true);
                    }}
                  />
                  <span>até</span>
                  <input
                    type="time"
                    className={styles.formInput}
                    value={preferences.quietHours.end}
                    onChange={(e) => {
                      setPreferences({
                        ...preferences,
                        quietHours: { ...preferences.quietHours, end: e.target.value }
                      });
                      setHasChanges(true);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className={styles.preferencesActions}>
            <button
              className={styles.secondaryButton}
              onClick={() => {
                setPreferences(MOCK_PREFERENCES);
                setHasChanges(false);
                setShowPreferences(false);
              }}
            >
              Cancelar
            </button>
            <button
              className={styles.primaryButton}
              onClick={handleSavePreferences}
              disabled={loading || !hasChanges}
            >
              {loading ? (
                <>
                  <span className={styles.buttonSpinner}></span>
                  Salvando...
                </>
              ) : (
                <>
                  <FiCheck size={18} />
                  Salvar Preferências
                </>
              )}
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
            <div
              key={notification.id}
              className={`${styles.notificationCard} ${!notification.read ? styles.unread : ''}`}
            >
              <div 
                className={styles.notificationIcon}
                style={{ backgroundColor: `${getTypeColor(notification.type)}20` }}
              >
                <div style={{ color: getTypeColor(notification.type) }}>
                  {getTypeIcon(notification.type)}
                </div>
              </div>

              <div className={styles.notificationContent}>
                <div className={styles.notificationHeader}>
                  <h3 className={styles.notificationTitle}>
                    {notification.title}
                    {!notification.read && (
                      <span className={styles.unreadDot}></span>
                    )}
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
                    <button
                      className={styles.markReadButton}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <FiCheck size={14} />
                      Marcar como lida
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
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

      <ConfirmationModal
        isOpen={showClearConfirm}
        title="Limpar Todas as Notificações"
        message="Tem certeza que deseja remover todas as notificações? Esta ação não pode ser desfeita."
        type="warning"
        onConfirm={confirmClearAll}
        onCancel={() => setShowClearConfirm(false)}
        confirmText="Limpar"
      />
    </div>
  );
};

export default NotificationsPage;