import React, { useState, useEffect } from 'react';
import { Event } from '../../types/Event';
import { eventService } from '../../services/events';
import { useAuth } from '../../context/AuthContext';
import { FiCalendar, FiClock, FiUsers, FiDollarSign } from 'react-icons/fi';
import { MdEvent, MdCheckCircle, MdPending, MdCancel } from 'react-icons/md';
import styles from './MyEvents.module.css';

export const MyEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    console.log('👤 Usuário atual:', user);
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📅 Carregando eventos do cliente...');
      console.log('🆔 ID do usuário:', user?.id);
      
      // Tenta primeiro com getMyEvents
      const data = await eventService.getMyEvents();
      console.log('✅ Eventos carregados:', data);
      
      if (data.length === 0) {
        console.log('⚠️ Nenhum evento encontrado com getMyEvents');
        
        // Se não encontrar, tenta com getEventsByClientId
        if (user?.id) {
          console.log('🔄 Tentando buscar por clientId:', user.id);
          const clientEvents = await eventService.getEventsByClientId(user.id);
          console.log('📊 Eventos por clientId:', clientEvents);
          setEvents(clientEvents);
        } else {
          setEvents(data);
        }
      } else {
        setEvents(data);
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar eventos:', error);
      setError('Erro ao carregar eventos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Data inválida';
    }
  };

  const formatTime = (time: string) => {
    return time?.substring(0, 5) || '00:00';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'CONFIRMED': return <MdCheckCircle color="#10b981" size={20} />;
      case 'QUOTE': return <MdPending color="#f59e0b" size={20} />;
      case 'CANCELLED': return <MdCancel color="#ef4444" size={20} />;
      case 'COMPLETED': return <MdCheckCircle color="#64748b" size={20} />;
      default: return <MdEvent color="#64748b" size={20} />;
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'CONFIRMED': return 'Confirmado';
      case 'QUOTE': return 'Em Cotação';
      case 'COMPLETED': return 'Realizado';
      case 'CANCELLED': return 'Cancelado';
      default: return status || 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando eventos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={loadEvents} className={styles.retryButton}>
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className={styles.myEvents}>
      <h2 className={styles.title}>🎉 Meus Eventos</h2>

      {events.length === 0 ? (
        <div className={styles.emptyState}>
          <MdEvent size={48} />
          <p>Você ainda não tem eventos</p>
          <p className={styles.emptySubtext}>
            Quando você fizer uma reserva, seus eventos aparecerão aqui.
          </p>
        </div>
      ) : (
        <>
          <p className={styles.eventCount}>
            Total: {events.length} {events.length === 1 ? 'evento' : 'eventos'}
          </p>
          <div className={styles.eventsGrid}>
            {events
              .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
              .map(event => (
                <div key={event.id} className={styles.eventCard}>
                  <div className={styles.eventHeader}>
                    <h4>{event.title || 'Evento sem título'}</h4>
                    <div className={`${styles.status} ${styles[event.status?.toLowerCase() || 'quote']}`}>
                      {getStatusIcon(event.status)}
                      <span>{getStatusText(event.status)}</span>
                    </div>
                  </div>

                  <div className={styles.eventDetails}>
                    <div className={styles.detail}>
                      <FiCalendar size={14} />
                      <span>{formatDate(event.eventDate)}</span>
                    </div>
                    <div className={styles.detail}>
                      <FiClock size={14} />
                      <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                    </div>
                    <div className={styles.detail}>
                      <FiUsers size={14} />
                      <span>{event.guestCount || 0} convidados</span>
                    </div>
                    {event.totalValue > 0 && (
                      <div className={styles.detail}>
                        <FiDollarSign size={14} />
                        <span>{formatCurrency(event.totalValue)}</span>
                      </div>
                    )}
                  </div>

                  {event.status === 'QUOTE' && (
                    <div className={styles.eventNote}>
                      ⏳ Aguardando confirmação da equipe
                    </div>
                  )}
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
};