// src/components/admin/events/EventConflictChecker.tsx
import React, { useState, useEffect } from 'react';
import { Event } from '../../../types/Event';
import { eventService } from '../../../services/events';
import { 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiClock, 
  FiUser,
  FiLoader,
  FiCalendar,
  FiAlertCircle
} from 'react-icons/fi';
import { MdEvent, MdWarning, MdError, MdSchedule } from 'react-icons/md';
import styles from './EventConflictChecker.module.css';

interface Conflict {
    type: 'date' | 'time' | 'resource';
    message: string;
    events: Event[];
}

interface EventConflictCheckerProps {
    eventId?: number;
    date: string;
    startTime: string;
    endTime: string;
    onConflictDetected?: (hasConflict: boolean) => void;
}

export const EventConflictChecker: React.FC<EventConflictCheckerProps> = ({
    eventId,
    date,
    startTime,
    endTime,
    onConflictDetected
}) => {
    const [conflicts, setConflicts] = useState<Conflict[]>([]);
    const [loading, setLoading] = useState(false);
    const [allEvents, setAllEvents] = useState<Event[]>([]);

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        checkConflicts();
    }, [date, startTime, endTime, allEvents]);

    const loadEvents = async () => {
        try {
            const data = await eventService.getAllEvents();
            setAllEvents(data);
        } catch (error) {
            console.error('Erro ao carregar eventos:', error);
        }
    };

    const checkConflicts = () => {
        if (!date || !startTime || !endTime) return;

        setLoading(true);
        const foundConflicts: Conflict[] = [];

        // Converter horários para minutos para comparação
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);

        // Filtrar eventos na mesma data (excluindo o evento atual se for edição)
        const sameDateEvents = allEvents.filter(event => 
            event.eventDate === date && 
            event.id !== eventId &&
            event.status !== 'CANCELLED'
        );

        // Verificar conflitos de horário
        const timeConflicts = sameDateEvents.filter(event => {
            const eventStart = timeToMinutes(event.startTime);
            const eventEnd = timeToMinutes(event.endTime);
            
            return (startMinutes < eventEnd && endMinutes > eventStart);
        });

        if (timeConflicts.length > 0) {
            foundConflicts.push({
                type: 'time',
                message: `Conflito de horário com ${timeConflicts.length} evento(s)`,
                events: timeConflicts
            });
        }

        setConflicts(foundConflicts);
        
        if (onConflictDetected) {
            onConflictDetected(foundConflicts.length > 0);
        }

        setLoading(false);
    };

    const timeToMinutes = (time: string): number => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const formatTime = (time: string): string => {
        return time.substring(0, 5);
    };

    const getConflictIcon = (type: string): React.ReactNode => {
        switch(type) {
            case 'time':
                return <FiClock size={18} />;
            case 'date':
                return <FiCalendar size={18} />;
            case 'resource':
                return <MdEvent size={18} />;
            default:
                return <FiAlertTriangle size={18} />;
        }
    };

    const getConflictColor = (type: string): string => {
        switch(type) {
            case 'time':
                return '#f59e0b';
            case 'date':
                return '#ef4444';
            case 'resource':
                return '#8b5cf6';
            default:
                return '#f59e0b';
        }
    };

    const getEventStatusIcon = (status: string): React.ReactNode => {
        switch(status?.toLowerCase()) {
            case 'confirmed':
                return <FiCheckCircle size={12} />;
            case 'completed':
                return <FiCheckCircle size={12} />;
            case 'cancelled':
                return <FiAlertCircle size={12} />;
            default:
                return <FiClock size={12} />;
        }
    };

    return (
        <div className={styles.container}>
            {loading && (
                <div className={styles.loading}>
                    <FiLoader className={styles.spinner} size={18} />
                    Verificando disponibilidade...
                </div>
            )}

            {conflicts.length > 0 && (
                <div className={styles.conflictsList}>
                    {conflicts.map((conflict, index) => (
                        <div key={index} className={`${styles.conflict} ${styles[conflict.type]}`}>
                            <div className={styles.conflictHeader}>
                                <span 
                                    className={styles.conflictIcon}
                                    style={{ color: getConflictColor(conflict.type) }}
                                >
                                    {getConflictIcon(conflict.type)}
                                </span>
                                <span className={styles.conflictMessage}>{conflict.message}</span>
                            </div>
                            
                            <div className={styles.conflictEvents}>
                                {conflict.events.map(event => (
                                    <div key={event.id} className={styles.conflictEvent}>
                                        <div className={styles.conflictEventInfo}>
                                            <strong>
                                                <MdEvent size={14} />
                                                {event.title}
                                            </strong>
                                            <span className={styles.conflictEventTime}>
                                                <FiClock size={12} />
                                                {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                            </span>
                                            <span className={styles.conflictEventClient}>
                                                <FiUser size={12} />
                                                {event.client?.name}
                                            </span>
                                        </div>
                                        <span className={`${styles.conflictEventStatus} ${styles[event.status?.toLowerCase() || 'quote']}`}>
                                            {getEventStatusIcon(event.status)}
                                            {event.status || 'QUOTE'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && conflicts.length === 0 && date && (
                <div className={styles.noConflicts}>
                    <FiCheckCircle size={18} className={styles.successIcon} />
                    <span>Horário disponível!</span>
                </div>
            )}
        </div>
    );
};