// src/components/admin/events/EventCalendar.tsx

import React from 'react';
import Calendar from 'react-calendar';
import { Event } from '../../../types/Event';
import { 
  FiCalendar, 
  FiClock, 
  FiUser 
} from 'react-icons/fi';
import { MdEvent, MdAttachMoney } from 'react-icons/md';
import styles from './EventCalendar.module.css';
import 'react-calendar/dist/Calendar.css';

interface EventCalendarProps {
  events: Event[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: Event) => void;
  formatCurrency: (value: string | number) => string;
  getEventsForDate: (date: Date) => Event[];
}

export const EventCalendar: React.FC<EventCalendarProps> = ({
  events,
  selectedDate,
  onDateChange,
  onEventClick,
  formatCurrency,
  getEventsForDate
}) => {
  const getEventStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      QUOTE: '#f59e0b',
      CONFIRMED: '#3b82f6',
      COMPLETED: '#10b981',
      CANCELLED: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status: string): string => {
    const icons: Record<string, string> = {
      QUOTE: '📝',
      CONFIRMED: '✅',
      COMPLETED: '🎉',
      CANCELLED: '❌'
    };
    return icons[status] || '📅';
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dayEvents = getEventsForDate(date);
      if (dayEvents.length > 0) {
        return styles.eventDay;
      }
    }
    return null;
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dayEvents = getEventsForDate(date);
      if (dayEvents.length > 0) {
        return (
          <div className={styles.eventCount}>
            {dayEvents.length}
          </div>
        );
      }
    }
    return null;
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  return (
    <div className={styles.container}>
      <div className={styles.calendarWrapper}>
        <Calendar
          onChange={onDateChange}
          value={selectedDate}
          tileClassName={tileClassName}
          tileContent={tileContent}
          locale="pt-BR"
        />
      </div>

      <div className={styles.dayEvents}>
        <h3 className={styles.dayEventsTitle}>
          <FiCalendar size={18} />
          Eventos em {selectedDate.toLocaleDateString('pt-BR')}
        </h3>
        
        {selectedDateEvents.length === 0 ? (
          <div className={styles.noDayEvents}>
            <MdEvent size={32} />
            <p>Nenhum evento agendado para esta data</p>
          </div>
        ) : (
          <div className={styles.dayEventsList}>
            {selectedDateEvents.map(event => (
              <div
                key={event.id}
                className={styles.dayEventCard}
                onClick={() => onEventClick(event)}
              >
                <div 
                  className={styles.dayEventStatus}
                  style={{ backgroundColor: getEventStatusColor(event.status) }}
                >
                  {getStatusIcon(event.status)}
                </div>
                <div className={styles.dayEventInfo}>
                  <h4 className={styles.dayEventTitle}>{event.title}</h4>
                  <p className={styles.dayEventTime}>
                    <FiClock size={12} />
                    {event.startTime.substring(0,5)} - {event.endTime.substring(0,5)}
                  </p>
                  <p className={styles.dayEventClient}>
                    <FiUser size={12} />
                    {event.client?.name}
                  </p>
                  <span className={styles.eventType}>
                    {event.eventType}
                  </span>
                </div>
                <div className={styles.dayEventValue}>
                  <MdAttachMoney size={14} />
                  {formatCurrency(event.totalValue)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};