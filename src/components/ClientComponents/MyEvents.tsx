// src/components/ClientComponents/MyEvents.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Event } from '../../types/Event';
import { eventService } from '../../services/events';
import { useAuth } from '../../context/AuthContext';
import { 
  FiCalendar, 
  FiClock, 
  FiUsers, 
  FiDollarSign, 
  FiEye, 
  FiPlus,
  FiMapPin,
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCw
} from 'react-icons/fi';
import { 
  MdEvent, 
  MdCheckCircle, 
  MdPending, 
  MdCancel,
  MdOutlineEventNote,
  MdAccessTime,
  MdLocationOn
} from 'react-icons/md';
import styles from './MyEvents.module.css';

interface MyEventsProps {
  onViewChange?: (view: string, params?: any) => void;
}

export const MyEvents: React.FC<MyEventsProps> = ({ onViewChange }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadEvents();
  }, [user]);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📅 Carregando eventos...');
      
      let data: Event[] = [];
      
      try {
        data = await eventService.getMyEvents();
      } catch (apiError) {
        console.warn('⚠️ API indisponível, tentando fallback...');
        
        if (user?.id) {
          try {
            data = await eventService.getEventsByClientId(String(user.id));
          } catch (fallbackError) {
            console.warn('⚠️ Fallback também falhou');
          }
        }
      }
      
      // Ordenar por data (mais próximo primeiro)
      const sortedEvents = data.sort((a, b) => {
        return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      });
      
      setEvents(sortedEvents);
      console.log('✅ Eventos carregados:', sortedEvents.length);
      
    } catch (err) {
      console.error('❌ Erro ao carregar eventos:', err);
      setError('Não foi possível carregar seus eventos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Data inválida';
    }
  };

  const formatTime = (time: string): string => {
    return time?.substring(0, 5) || '00:00';
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
      CONFIRMED: {
        icon: <MdCheckCircle size={16} />,
        label: 'Confirmado',
        color: '#10b981',
        bgColor: '#d1fae5'
      },
      QUOTE: {
        icon: <MdPending size={16} />,
        label: 'Em Cotação',
        color: '#f59e0b',
        bgColor: '#fef3c7'
      },
      COMPLETED: {
        icon: <MdCheckCircle size={16} />,
        label: 'Realizado',
        color: '#64748b',
        bgColor: '#f1f5f9'
      },
      CANCELLED: {
        icon: <MdCancel size={16} />,
        label: 'Cancelado',
        color: '#ef4444',
        bgColor: '#fee2e2'
      }
    };
    return configs[status] || {
      icon: <MdEvent size={16} />,
      label: status || 'Desconhecido',
      color: '#64748b',
      bgColor: '#f1f5f9'
    };
  };

  const getEventTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      ANIVERSARIO: '🎂',
      CASAMENTO: '💍',
      CORPORATIVO: '💼',
      FORMATURA: '🎓',
      CONFRATERNIZACAO: '🎉',
      OUTRO: '✨'
    };
    return icons[type] || '📅';
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ANIVERSARIO: 'Aniversário',
      CASAMENTO: 'Casamento',
      CORPORATIVO: 'Corporativo',
      FORMATURA: 'Formatura',
      CONFRATERNIZACAO: 'Confraternização',
      OUTRO: 'Outro'
    };
    return labels[type] || type;
  };

  const isUpcoming = (dateString: string): boolean => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  };

  const getDaysUntil = (dateString: string): number => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleEventClick = (eventId: string) => {
    onViewChange?.('tracking', { eventId });
  };

  const handleNewBooking = () => {
    onViewChange?.('new-booking');
  };

  // Separar eventos futuros e passados
  const upcomingEvents = events.filter(e => isUpcoming(e.eventDate) && e.status !== 'CANCELLED');
  const pastEvents = events.filter(e => !isUpcoming(e.eventDate) || e.status === 'CANCELLED' || e.status === 'COMPLETED');

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando seus eventos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <FiAlertCircle size={48} color="#ef4444" />
        <h3>Erro ao carregar</h3>
        <p>{error}</p>
        <button onClick={handleRefresh} className={styles.retryButton}>
          <FiRefreshCw size={16} />
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className={styles.myEvents}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.titleIcon}>
            <MdOutlineEventNote size={28} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Meus Eventos</h1>
            <p className={styles.pageSubtitle}>
              {events.length === 0 
                ? 'Você ainda não tem eventos' 
                : `${events.length} ${events.length === 1 ? 'evento' : 'eventos'} ${upcomingEvents.length > 0 ? `• ${upcomingEvents.length} futuro${upcomingEvents.length > 1 ? 's' : ''}` : ''}`
              }
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FiRefreshCw size={18} className={refreshing ? styles.spinning : ''} />
          </button>
          <button className={styles.newBookingButton} onClick={handleNewBooking}>
            <FiPlus size={18} />
            Nova Reserva
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <MdEvent size={48} />
          </div>
          <h3>Nenhum evento encontrado</h3>
          <p>Quando você fizer uma reserva, seus eventos aparecerão aqui.</p>
          <button className={styles.createButton} onClick={handleNewBooking}>
            <FiPlus size={18} />
            Solicitar Primeira Reserva
          </button>
        </div>
      ) : (
        <>
          {/* Eventos Futuros */}
          {upcomingEvents.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <FiCalendar size={20} />
                Próximos Eventos
                <span className={styles.sectionCount}>{upcomingEvents.length}</span>
              </h2>
              <div className={styles.eventsGrid}>
                {upcomingEvents.map(event => {
                  const statusConfig = getStatusConfig(event.status);
                  const daysUntil = getDaysUntil(event.eventDate);
                  
                  return (
                    <div 
                      key={event.id} 
                      className={styles.eventCard}
                      onClick={() => handleEventClick(String(event.id))}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.eventType}>
                          <span className={styles.typeIcon}>{getEventTypeIcon(event.eventType)}</span>
                          <span className={styles.typeLabel}>{getEventTypeLabel(event.eventType)}</span>
                        </div>
                        <div 
                          className={styles.statusBadge}
                          style={{ 
                            backgroundColor: statusConfig.bgColor, 
                            color: statusConfig.color 
                          }}
                        >
                          {statusConfig.icon}
                          <span>{statusConfig.label}</span>
                        </div>
                      </div>
                      
                      <h3 className={styles.eventTitle}>{event.title || 'Evento sem título'}</h3>
                      
                      <div className={styles.eventDetails}>
                        <div className={styles.detailItem}>
                          <FiCalendar size={16} />
                          <span>{formatDate(event.eventDate)}</span>
                          {daysUntil <= 30 && daysUntil > 0 && (
                            <span className={styles.daysUntil}>
                              {daysUntil === 0 ? 'Hoje!' : `${daysUntil} dias`}
                            </span>
                          )}
                        </div>
                        <div className={styles.detailItem}>
                          <FiClock size={16} />
                          <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                        </div>
                        {event.location && (
                          <div className={styles.detailItem}>
                            <MdLocationOn size={16} />
                            <span>{event.location}</span>
                          </div>
                        )}
                        <div className={styles.detailItem}>
                          <FiUsers size={16} />
                          <span>{event.guestCount || 0} convidados</span>
                        </div>
                        {event.totalValue > 0 && (
                          <div className={styles.detailItem}>
                            <FiDollarSign size={16} />
                            <span className={styles.value}>{formatCurrency(event.totalValue)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className={styles.cardFooter}>
                        {event.status === 'QUOTE' && (
                          <span className={styles.waitingBadge}>
                            <FiClock size={12} />
                            Aguardando confirmação
                          </span>
                        )}
                        <button className={styles.viewButton}>
                          <FiEye size={14} />
                          Acompanhar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Eventos Passados */}
          {pastEvents.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <MdAccessTime size={20} />
                Eventos Anteriores
                <span className={styles.sectionCount}>{pastEvents.length}</span>
              </h2>
              <div className={styles.eventsGrid}>
                {pastEvents.map(event => {
                  const statusConfig = getStatusConfig(event.status);
                  
                  return (
                    <div 
                      key={event.id} 
                      className={`${styles.eventCard} ${styles.pastEvent}`}
                      onClick={() => handleEventClick(String(event.id))}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.eventType}>
                          <span className={styles.typeIcon}>{getEventTypeIcon(event.eventType)}</span>
                          <span className={styles.typeLabel}>{getEventTypeLabel(event.eventType)}</span>
                        </div>
                        <div 
                          className={styles.statusBadge}
                          style={{ 
                            backgroundColor: statusConfig.bgColor, 
                            color: statusConfig.color 
                          }}
                        >
                          {statusConfig.icon}
                          <span>{statusConfig.label}</span>
                        </div>
                      </div>
                      
                      <h3 className={styles.eventTitle}>{event.title || 'Evento sem título'}</h3>
                      
                      <div className={styles.eventDetails}>
                        <div className={styles.detailItem}>
                          <FiCalendar size={16} />
                          <span>{formatDate(event.eventDate)}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <FiClock size={16} />
                          <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <FiUsers size={16} />
                          <span>{event.guestCount || 0} convidados</span>
                        </div>
                      </div>
                      
                      <div className={styles.cardFooter}>
                        <button className={styles.viewButton}>
                          <FiEye size={14} />
                          Ver detalhes
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyEvents;