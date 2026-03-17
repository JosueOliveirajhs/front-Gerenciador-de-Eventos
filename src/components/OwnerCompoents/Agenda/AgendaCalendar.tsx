// src/components/admin/agenda/AgendaCalendar.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import { Event } from '../../../types/Event';
import { eventService } from '../../../services/events';
import styles from './AgendaCalendar.module.css';
import 'react-calendar/dist/Calendar.css';

type ViewType = 'day' | 'week' | 'month' | 'year';
type EventType = 'ALL' | 'ANIVERSARIO' | 'CASAMENTO' | 'CORPORATIVO' | 'FORMATURA' | 'OUTRO';

interface BlockedDate {
  date: string;
  reason: string;
  recurring?: boolean;
}

export const AgendaCalendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [eventTypeFilter, setEventTypeFilter] = useState<EventType>('ALL');
  const [showBlockedDates, setShowBlockedDates] = useState(false);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflicts, setConflicts] = useState<Event[]>([]);
  const [upcomingAlerts, setUpcomingAlerts] = useState<Event[]>([]);

  // Carregar eventos
  useEffect(() => {
    loadEvents();
    loadBlockedDates();
    checkUpcomingEvents();
  }, []);

  // Filtrar eventos por tipo
  useEffect(() => {
    filterEvents();
  }, [events, eventTypeFilter, selectedDate, viewType]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventService.getAllEvents();
      setEvents(data);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBlockedDates = () => {
    // Carregar do localStorage ou API
    const saved = localStorage.getItem('blockedDates');
    if (saved) {
      setBlockedDates(JSON.parse(saved));
    }
  };

  const checkUpcomingEvents = () => {
    // Verificar eventos nos próximos 7 dias
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const upcoming = events.filter(event => {
      const eventDate = new Date(event.eventDate + 'T12:00:00');
      return eventDate >= today && 
             eventDate <= nextWeek && 
             event.status === 'CONFIRMED';
    });

    setUpcomingAlerts(upcoming);
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Filtrar por tipo
    if (eventTypeFilter !== 'ALL') {
      filtered = filtered.filter(e => e.eventType === eventTypeFilter);
    }

    // Filtrar por data baseado na visualização
    if (viewType === 'day') {
      filtered = filtered.filter(e => 
        isSameDay(new Date(e.eventDate), selectedDate)
      );
    } else if (viewType === 'week') {
      filtered = filtered.filter(e => 
        isInWeek(new Date(e.eventDate), selectedDate)
      );
    } else if (viewType === 'month') {
      filtered = filtered.filter(e => 
        e.eventDate.startsWith(selectedDate.toISOString().slice(0, 7))
      );
    }

    setFilteredEvents(filtered);
  };

  // Utilitários de data
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.toDateString() === date2.toDateString();
  };

  const isInWeek = (date: Date, weekStart: Date): boolean => {
    const start = new Date(weekStart);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return date >= start && date <= end;
  };

  const formatDateForDisplay = (dateString: string): string => {
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (time: string): string => {
    return time.substring(0, 5);
  };

  // Verificar conflitos
  const checkConflicts = (date: Date, startTime: string, endTime: string): Event[] => {
    const dateStr = date.toISOString().split('T')[0];
    
    return events.filter(event => {
      if (event.eventDate !== dateStr) return false;
      
      const eventStart = event.startTime;
      const eventEnd = event.endTime;
      
      // Verificar sobreposição de horários
      return (startTime < eventEnd && endTime > eventStart);
    });
  };

  // Bloquear data
  const handleBlockDate = (date: Date, reason: string, recurring?: boolean) => {
    const newBlocked: BlockedDate = {
      date: date.toISOString().split('T')[0],
      reason,
      recurring
    };

    const updated = [...blockedDates, newBlocked];
    setBlockedDates(updated);
    localStorage.setItem('blockedDates', JSON.stringify(updated));
    setShowBlockModal(false);
  };

  // Desbloquear data
  const handleUnblockDate = (dateToRemove: string) => {
    const updated = blockedDates.filter(b => b.date !== dateToRemove);
    setBlockedDates(updated);
    localStorage.setItem('blockedDates', JSON.stringify(updated));
  };

  // Verificar se data está bloqueada
  const isDateBlocked = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return blockedDates.some(b => b.date === dateStr);
  };

  // Tile content do calendário
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;

    const dateStr = date.toISOString().split('T')[0];
    const dayEvents = events.filter(e => e.eventDate === dateStr);
    const isBlocked = isDateBlocked(date);

    if (dayEvents.length === 0 && !isBlocked) return null;

    return (
      <div className={styles.tileContent}>
        {isBlocked && (
          <span className={styles.blockedIndicator} title="Data bloqueada">
            🔒
          </span>
        )}
        {dayEvents.length > 0 && (
          <span className={styles.eventIndicator}>
            {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
          </span>
        )}
      </div>
    );
  };

  // Eventos por hora (para visualização diária)
  const getEventsByHour = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return hours.map(hour => {
      const hourStr = `${hour.toString().padStart(2, '0')}:00`;
      const hourEvents = filteredEvents.filter(event => {
        const eventHour = parseInt(event.startTime.split(':')[0]);
        return eventHour === hour;
      });

      return {
        hour: hourStr,
        events: hourEvents
      };
    });
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando agenda...</p>
      </div>
    );
  }

  return (
    <div className={styles.agendaCalendar}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Agenda e Calendário</h1>
          
          <div className={styles.headerActions}>
            {/* Alertas de eventos próximos */}
            {upcomingAlerts.length > 0 && (
              <div className={styles.alertBadge}>
                <span className={styles.alertIcon}>🔔</span>
                <span className={styles.alertText}>
                  {upcomingAlerts.length} evento(s) nos próximos 7 dias
                </span>
                <div className={styles.alertDropdown}>
                  {upcomingAlerts.map(event => (
                    <div key={event.id} className={styles.alertItem}>
                      <strong>{event.title}</strong>
                      <span>{formatDateForDisplay(event.eventDate)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value as ViewType)}
              className={styles.viewSelect}
            >
              <option value="day">Dia</option>
              <option value="week">Semana</option>
              <option value="month">Mês</option>
              <option value="year">Ano</option>
            </select>

            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value as EventType)}
              className={styles.filterSelect}
            >
              <option value="ALL">Todos os eventos</option>
              <option value="ANIVERSARIO">Aniversários</option>
              <option value="CASAMENTO">Casamentos</option>
              <option value="CORPORATIVO">Corporativos</option>
              <option value="FORMATURA">Formaturas</option>
              <option value="OUTRO">Outros</option>
            </select>

            <button
              onClick={() => setShowBlockModal(true)}
              className={styles.secondaryButton}
            >
              <span>🔒 Bloquear Data</span>
            </button>

            <button
              onClick={() => setShowBlockedDates(!showBlockedDates)}
              className={`${styles.secondaryButton} ${showBlockedDates ? styles.active : ''}`}
            >
              <span>📅 Mostrar Bloqueados</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendário Principal */}
      <div className={styles.calendarContainer}>
        <div className={styles.calendarSection}>
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileContent={tileContent}
            tileClassName={({ date }) => {
              if (isDateBlocked(date)) return styles.blockedTile;
              return '';
            }}
          />
        </div>

        {/* Visualização de Eventos */}
        <div className={styles.eventsSection}>
          <div className={styles.eventsHeader}>
            <h3>
              {viewType === 'day' && 'Eventos do Dia'}
              {viewType === 'week' && 'Eventos da Semana'}
              {viewType === 'month' && 'Eventos do Mês'}
            </h3>
            <span className={styles.eventCount}>
              {filteredEvents.length} evento(s)
            </span>
          </div>

          {viewType === 'day' ? (
            // Visualização por hora (diária)
            <div className={styles.hourlyView}>
              {getEventsByHour().map(({ hour, events }) => (
                <div key={hour} className={styles.hourRow}>
                  <div className={styles.hourLabel}>{hour}</div>
                  <div className={styles.hourEvents}>
                    {events.map(event => (
                      <div
                        key={event.id}
                        className={`${styles.eventCard} ${styles[event.status.toLowerCase()]}`}
                        onClick={() => {
                          // Abrir detalhes do evento
                          window.location.href = `/admin/events/${event.id}`;
                        }}
                      >
                        <div className={styles.eventTime}>
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </div>
                        <div className={styles.eventTitle}>{event.title}</div>
                        <div className={styles.eventClient}>
                          {event.client?.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Visualização em lista (semanal/mensal)
            <div className={styles.eventsList}>
              {filteredEvents
                .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
                .map(event => (
                  <div
                    key={event.id}
                    className={`${styles.eventListItem} ${styles[event.status.toLowerCase()]}`}
                  >
                    <div className={styles.eventDate}>
                      {formatDateForDisplay(event.eventDate)}
                    </div>
                    <div className={styles.eventInfo}>
                      <strong>{event.title}</strong>
                      <span>{event.client?.name}</span>
                    </div>
                    <div className={styles.eventTime}>
                      {formatTime(event.startTime)}h
                    </div>
                    <div className={styles.eventStatus}>
                      {event.status}
                    </div>
                  </div>
                ))}

              {filteredEvents.length === 0 && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📅</div>
                  <h4>Nenhum evento encontrado</h4>
                  <p>Não há eventos para o período selecionado.</p>
                </div>
              )}
            </div>
          )}

          {/* Datas bloqueadas */}
          {showBlockedDates && (
            <div className={styles.blockedDatesList}>
              <h4>Datas Bloqueadas</h4>
              {blockedDates.map(blocked => (
                <div key={blocked.date} className={styles.blockedDateItem}>
                  <span className={styles.blockedDate}>
                    {new Date(blocked.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                  <span className={styles.blockedReason}>{blocked.reason}</span>
                  <button
                    onClick={() => handleUnblockDate(blocked.date)}
                    className={styles.unblockButton}
                  >
                    🔓
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Bloqueio de Data */}
      {showBlockModal && (
        <BlockDateModal
          selectedDate={selectedDate}
          onConfirm={handleBlockDate}
          onCancel={() => setShowBlockModal(false)}
        />
      )}

      {/* Modal de Conflito */}
      {showConflictModal && (
        <ConflictModal
          conflicts={conflicts}
          onClose={() => setShowConflictModal(false)}
          formatDateForDisplay={formatDateForDisplay}
        />
      )}

      {/* Integração Futura */}
      <div className={styles.integrationBar}>
        <span>🔌 Integrações:</span>
        <button className={styles.integrationButton} disabled>
          <img src="/google-calendar-icon.png" alt="Google Calendar" />
          Google Calendar (Em breve)
        </button>
        <button className={styles.integrationButton} disabled>
          <img src="/outlook-icon.png" alt="Outlook" />
          Outlook (Em breve)
        </button>
      </div>
    </div>
  );
};

// Modal de Bloqueio de Data
interface BlockDateModalProps {
  selectedDate: Date;
  onConfirm: (date: Date, reason: string, recurring?: boolean) => void;
  onCancel: () => void;
}

const BlockDateModal: React.FC<BlockDateModalProps> = ({
  selectedDate,
  onConfirm,
  onCancel
}) => {
  const [reason, setReason] = useState('');
  const [recurring, setRecurring] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onConfirm(selectedDate, reason, recurring);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Bloquear Data</h3>
          <button onClick={onCancel} className={styles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalContent}>
            <p>
              Data selecionada:{' '}
              <strong>
                {selectedDate.toLocaleDateString('pt-BR')}
              </strong>
            </p>

            <div className={styles.formGroup}>
              <label>Motivo do bloqueio *</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Feriado, Manutenção, Férias"
                required
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                />
                Bloquear todos os anos (recorrente)
              </label>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onCancel} className={styles.secondaryButton}>
              Cancelar
            </button>
            <button type="submit" className={styles.primaryButton}>
              Bloquear Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal de Conflitos
interface ConflictModalProps {
  conflicts: Event[];
  onClose: () => void;
  formatDateForDisplay: (date: string) => string;
}

const ConflictModal: React.FC<ConflictModalProps> = ({
  conflicts,
  onClose,
  formatDateForDisplay
}) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.conflictModal}`}>
        <div className={styles.modalHeader}>
          <h3>⚠️ Conflito de Agenda Detectado</h3>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <div className={styles.modalContent}>
          <p>Os seguintes eventos já estão agendados para este horário:</p>

          {conflicts.map(event => (
            <div key={event.id} className={styles.conflictItem}>
              <strong>{event.title}</strong>
              <span>{formatDateForDisplay(event.eventDate)}</span>
              <span>
                {event.startTime.substring(0,5)} - {event.endTime.substring(0,5)}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.primaryButton}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};