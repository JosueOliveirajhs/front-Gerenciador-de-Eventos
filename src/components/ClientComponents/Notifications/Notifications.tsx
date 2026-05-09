// src/components/ClientComponents/Notifications/Notifications.tsx
import React, { useState, useEffect } from 'react';
import { 
  FiBell, 
  FiCheck, 
  FiCalendar, 
  FiDollarSign, 
  FiFileText,
  FiMessageCircle,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiTrash2,
  FiSettings,
  FiBellOff,
  FiMail,
  FiSmartphone
} from 'react-icons/fi';
import { 
  MdEvent, 
  MdNotificationsActive,
  MdNotificationsOff,
  MdVerified
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { notificationService } from '../../../services/notification';
import { useAuth } from '../../../context/AuthContext';
import styles from './Notifications.module.css';

interface Notification {
  id: string;
  type: 'EVENT' | 'PAYMENT' | 'PROPOSAL' | 'CONTRACT' | 'MESSAGE' | 'SYSTEM' | 'REMINDER' | 'CONFIRMATION';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  eventId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  sentVia?: ('EMAIL' | 'WHATSAPP' | 'PUSH')[];
}

interface NotificationsProps {
  onNotificationClick?: (notification: Notification) => void;
  onViewChange?: (view: string, params?: any) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ 
  onNotificationClick, 
  onViewChange 
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'REMINDERS' | 'CONFIRMATIONS'>('ALL');
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    whatsappNotifications: false,
    eventReminders: true,
    paymentReminders: true,
    proposalUpdates: true,
    messages: true,
    confirmations: true
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setNotifications(getMockNotifications());
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMockNotifications = (): Notification[] => {
    const now = new Date();
    return [
      {
        id: 'notif-001',
        type: 'CONFIRMATION',
        title: 'Reserva Confirmada! 🎉',
        message: 'Sua solicitação de reserva para o evento "Aniversário de 30 anos - Maria" foi confirmada! Data: 15/06/2026 às 19:00.',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        read: true,
        eventId: 'evt-001',
        priority: 'HIGH',
        sentVia: ['EMAIL', 'WHATSAPP']
      },
      {
        id: 'notif-002',
        type: 'PROPOSAL',
        title: 'Proposta Comercial Enviada',
        message: 'Sua proposta comercial nº PROP-2026-0042 está pronta para análise. Valor total: R$ 22.500,00.',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        read: true,
        actionLabel: 'Visualizar Proposta',
        priority: 'HIGH',
        sentVia: ['EMAIL', 'PUSH']
      },
      {
        id: 'notif-003',
        type: 'PAYMENT',
        title: 'Pagamento Confirmado',
        message: 'Recebemos o pagamento de R$ 5.625,00 referente à 1ª parcela. Obrigado!',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        read: false,
        priority: 'MEDIUM',
        sentVia: ['EMAIL']
      },
      {
        id: 'notif-004',
        type: 'REMINDER',
        title: 'Lembrete: Checklist do Evento',
        message: 'Faltam 90 dias para seu evento! Não se esqueça de definir a lista de convidados e escolher a decoração.',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 12).toISOString(),
        read: false,
        actionLabel: 'Ver Checklist',
        eventId: 'evt-001',
        priority: 'MEDIUM',
        sentVia: ['EMAIL', 'WHATSAPP', 'PUSH']
      },
      {
        id: 'notif-005',
        type: 'MESSAGE',
        title: 'Nova Mensagem de Ana (Gerente)',
        message: 'A decoração ficará pronta até amanhã! Vou enviar fotos assim que estiver montada. 🌸',
        createdAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
        read: false,
        actionLabel: 'Responder',
        priority: 'MEDIUM'
      },
      {
        id: 'notif-006',
        type: 'REMINDER',
        title: 'Lembrete de Pagamento',
        message: 'A 2ª parcela de R$ 5.625,00 vence em 3 dias. Não se esqueça de efetuar o pagamento.',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(),
        read: false,
        actionLabel: 'Ver Pagamentos',
        priority: 'HIGH',
        sentVia: ['EMAIL', 'WHATSAPP']
      },
      {
        id: 'notif-007',
        type: 'EVENT',
        title: 'Atualização no Evento',
        message: 'O fornecedor de fotografia foi confirmado. Horário agendado: 19:30 às 23:00.',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
        read: true,
        eventId: 'evt-001',
        priority: 'LOW'
      },
      {
        id: 'notif-008',
        type: 'SYSTEM',
        title: 'Bem-vindo(a) ao EEMS!',
        message: 'Estamos felizes em ter você conosco. Conte com nossa equipe para tornar seu evento inesquecível!',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        read: true,
        priority: 'LOW'
      }
    ];
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.type === 'PROPOSAL') {
      onViewChange?.('proposal');
    } else if (notification.type === 'PAYMENT') {
      onViewChange?.('payments');
    } else if (notification.type === 'REMINDER' && notification.eventId) {
      onViewChange?.('tracking', { eventId: notification.eventId });
    } else if (notification.type === 'MESSAGE') {
      onViewChange?.('messages');
    } else if (notification.type === 'CONFIRMATION') {
      onViewChange?.('events');
    }
    
    onNotificationClick?.(notification);
  };

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'EVENT': return <MdEvent size={18} />;
      case 'PAYMENT': return <FiDollarSign size={18} />;
      case 'PROPOSAL': return <FiFileText size={18} />;
      case 'CONTRACT': return <FiFileText size={18} />;
      case 'MESSAGE': return <FiMessageCircle size={18} />;
      case 'REMINDER': return <FiClock size={18} />;
      case 'CONFIRMATION': return <FiCheckCircle size={18} />;
      case 'SYSTEM': return <FiBell size={18} />;
      default: return <FiBell size={18} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch(type) {
      case 'EVENT': return '#00B4D8';
      case 'PAYMENT': return '#10b981';
      case 'PROPOSAL': return '#f59e0b';
      case 'CONTRACT': return '#8b5cf6';
      case 'MESSAGE': return '#3b82f6';
      case 'REMINDER': return '#ef4444';
      case 'CONFIRMATION': return '#10b981';
      case 'SYSTEM': return '#64748b';
      default: return '#64748b';
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority !== 'HIGH') return null;
    
    return (
      <span className={styles.priorityBadge}>
        <FiAlertCircle size={10} />
        Urgente
      </span>
    );
  };

  const getSentViaIcons = (sentVia?: string[]) => {
    if (!sentVia) return null;
    
    return (
      <div className={styles.sentViaIcons}>
        {sentVia.includes('EMAIL') && <FiMail size={12} title="Enviado por Email" />}
        {sentVia.includes('WHATSAPP') && <FaWhatsapp size={12} title="Enviado por WhatsApp" />}
        {sentVia.includes('PUSH') && <FiSmartphone size={12} title="Notificação Push" />}
      </div>
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours} h`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    
    return date.toLocaleDateString('pt-BR');
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'ALL') return true;
    if (filter === 'UNREAD') return !n.read;
    if (filter === 'REMINDERS') return n.type === 'REMINDER';
    if (filter === 'CONFIRMATIONS') return n.type === 'CONFIRMATION';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const reminderCount = notifications.filter(n => n.type === 'REMINDER' && !n.read).length;

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando notificações...</p>
      </div>
    );
  }

  return (
    <div className={styles.notifications}>
      {/* Header */}
      <div className={styles.notificationsHeader}>
        <div className={styles.headerLeft}>
          <h2>
            <MdNotificationsActive size={24} />
            Central de Notificações
          </h2>
          {unreadCount > 0 && (
            <span className={styles.unreadCount}>{unreadCount} não lidas</span>
          )}
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.filterTabs}>
            <button 
              className={`${styles.filterTab} ${filter === 'ALL' ? styles.active : ''}`}
              onClick={() => setFilter('ALL')}
            >
              Todas
            </button>
            <button 
              className={`${styles.filterTab} ${filter === 'UNREAD' ? styles.active : ''}`}
              onClick={() => setFilter('UNREAD')}
            >
              Não lidas
              {unreadCount > 0 && <span className={styles.filterBadge}>{unreadCount}</span>}
            </button>
            <button 
              className={`${styles.filterTab} ${filter === 'REMINDERS' ? styles.active : ''}`}
              onClick={() => setFilter('REMINDERS')}
            >
              Lembretes
              {reminderCount > 0 && <span className={styles.filterBadge}>{reminderCount}</span>}
            </button>
          </div>
          
          <button 
            className={styles.settingsButton}
            onClick={() => setShowSettings(!showSettings)}
            title="Configurações de notificação"
          >
            <FiSettings size={18} />
          </button>
          
          {unreadCount > 0 && (
            <button 
              className={styles.markAllButton}
              onClick={markAllAsRead}
            >
              <FiCheckCircle size={16} />
              Marcar todas como lidas
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className={styles.settingsPanel}>
          <h3>
            <FiSettings size={18} />
            Preferências de Notificação
          </h3>
          
          <div className={styles.settingsSection}>
            <h4>Canais de Comunicação</h4>
            <div className={styles.settingsGrid}>
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <FiMail size={18} />
                  <div>
                    <strong>Email</strong>
                    <span>{user?.email}</span>
                  </div>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) => setPreferences({...preferences, emailNotifications: e.target.checked})}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <FiSmartphone size={18} />
                  <div>
                    <strong>Push</strong>
                    <span>Notificações no navegador</span>
                  </div>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={preferences.pushNotifications}
                    onChange={(e) => setPreferences({...preferences, pushNotifications: e.target.checked})}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <FaWhatsapp size={18} />
                  <div>
                    <strong>WhatsApp</strong>
                    <span>+55 (11) 99999-9999</span>
                  </div>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={preferences.whatsappNotifications}
                    onChange={(e) => setPreferences({...preferences, whatsappNotifications: e.target.checked})}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          </div>
          
          <div className={styles.settingsSection}>
            <h4>Tipos de Notificação</h4>
            <div className={styles.settingsGrid}>
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <FiCheckCircle size={16} style={{ color: '#10b981' }} />
                  <span>Confirmações de reserva</span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={preferences.confirmations}
                    onChange={(e) => setPreferences({...preferences, confirmations: e.target.checked})}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <FiClock size={16} style={{ color: '#ef4444' }} />
                  <span>Lembretes de evento</span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={preferences.eventReminders}
                    onChange={(e) => setPreferences({...preferences, eventReminders: e.target.checked})}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <FiDollarSign size={16} style={{ color: '#f59e0b' }} />
                  <span>Lembretes de pagamento</span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={preferences.paymentReminders}
                    onChange={(e) => setPreferences({...preferences, paymentReminders: e.target.checked})}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <FiFileText size={16} style={{ color: '#3b82f6' }} />
                  <span>Atualizações de proposta</span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={preferences.proposalUpdates}
                    onChange={(e) => setPreferences({...preferences, proposalUpdates: e.target.checked})}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <FiMessageCircle size={16} style={{ color: '#8b5cf6' }} />
                  <span>Novas mensagens</span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={preferences.messages}
                    onChange={(e) => setPreferences({...preferences, messages: e.target.checked})}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className={styles.notificationsList}>
        {filteredNotifications.length === 0 ? (
          <div className={styles.emptyState}>
            {filter === 'UNREAD' ? (
              <MdNotificationsOff size={48} />
            ) : (
              <FiBellOff size={48} />
            )}
            <h3>
              {filter === 'UNREAD' ? 'Tudo em dia!' : 'Nenhuma notificação'}
            </h3>
            <p>
              {filter === 'UNREAD' 
                ? 'Você não tem notificações não lidas.' 
                : filter === 'REMINDERS'
                  ? 'Você não tem lembretes pendentes.'
                  : 'Suas notificações aparecerão aqui.'
              }
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''} ${notification.priority === 'HIGH' ? styles.highPriority : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div 
                className={styles.notificationIcon}
                style={{ background: `${getNotificationColor(notification.type)}20`, color: getNotificationColor(notification.type) }}
              >
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className={styles.notificationContent}>
                <div className={styles.notificationHeader}>
                  <h4>{notification.title}</h4>
                  <div className={styles.notificationBadges}>
                    {getPriorityBadge(notification.priority)}
                    {getSentViaIcons(notification.sentVia)}
                  </div>
                  {!notification.read && <span className={styles.unreadDot} />}
                </div>
                
                <p className={styles.notificationMessage}>{notification.message}</p>
                
                <div className={styles.notificationFooter}>
                  <span className={styles.notificationTime}>
                    <FiClock size={12} />
                    {formatTime(notification.createdAt)}
                  </span>
                  
                  {notification.actionLabel && (
                    <span className={styles.actionLink}>
                      {notification.actionLabel} →
                    </span>
                  )}
                </div>
              </div>
              
              <div className={styles.notificationActions}>
                {!notification.read && (
                  <button
                    className={styles.markReadButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    title="Marcar como lida"
                  >
                    <FiCheck size={14} />
                  </button>
                )}
                <button
                  className={styles.deleteButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  title="Excluir"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;