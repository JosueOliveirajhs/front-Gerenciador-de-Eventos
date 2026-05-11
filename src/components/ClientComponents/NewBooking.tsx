// src/components/ClientComponents/NewBooking.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { CreateEventData } from '../../types/Event';
import { Event } from '../../types/Event';
import { eventService } from '../../services/events';
import { notificationService } from '../../services/notification';
import { useAuth } from '../../context/AuthContext';
import { 
  FiCalendar, 
  FiClock, 
  FiUsers, 
  FiDollarSign, 
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiMapPin,
  FiChevronRight,
  FiAlertTriangle,
  FiX
} from 'react-icons/fi';
import { 
  MdEvent, 
  MdOutlineEventNote,
  MdSchedule,
  MdWarning
} from 'react-icons/md';
import styles from './NewBooking.module.css';

interface NewBookingProps {
  onSuccess?: () => void;
}

interface TimeConflict {
  event: Event;
  startTime: string;
  endTime: string;
  overlap: string;
}

export const NewBooking: React.FC<NewBookingProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<Omit<CreateEventData, 'clientId'>>({
    title: '',
    eventDate: '',
    startTime: '18:00',
    endTime: '23:00',
    guestCount: 50,
    eventType: 'ANIVERSARIO',
    totalValue: 0,
    depositValue: 0,
    notes: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    loadAllEvents();
  }, []);

  const loadAllEvents = async () => {
    try {
      const [myEventsData, availabilityData] = await Promise.all([
        eventService.getMyEvents(),
        eventService.getAvailability()
      ]);
      
      // Filtra eventos do proprio cliente
      const filteredMyEvents = myEventsData.filter(
        e => e.status === 'CONFIRMED' || e.status === 'QUOTE'
      );
      
      // Converte dados de disponibilidade para o formato de eventos
      // com IDs unicos baseados em data/hora (evita duplicacao no React)
      const allEventsFormatted = availabilityData.map((a: any, index: number) => ({
        id: `avail-${index}-${a.date}-${a.startTime}-${a.endTime}`,
        title: 'Horario ocupado',
        eventDate: a.date,
        startTime: a.startTime + ':00',
        endTime: a.endTime + ':00',
        status: 'CONFIRMED',
        eventType: '',
        guestCount: 0,
        client: { id: 0, name: 'Indisponivel' }
      }));
      
      // Combina eventos do cliente com disponibilidade
      const combined = [...filteredMyEvents];
      
      // Adiciona disponibilidade que NAO conflita com eventos do proprio cliente
      allEventsFormatted.forEach(availEvent => {
        const isDuplicate = filteredMyEvents.some(myEvent => 
          myEvent.eventDate === availEvent.eventDate &&
          myEvent.startTime?.substring(0, 5) === availEvent.startTime?.substring(0, 5) &&
          myEvent.endTime?.substring(0, 5) === availEvent.endTime?.substring(0, 5)
        );
        
        if (!isDuplicate) {
          combined.push(availEvent as any);
        }
      });
      
      setMyEvents(filteredMyEvents);
      setAllEvents(combined as any);
      
      console.log('✅ Eventos carregados - Meus:', filteredMyEvents.length, 
                  '| Disponibilidade:', allEventsFormatted.length, 
                  '| Combinados (sem duplicatas):', combined.length);
    } catch (error) {
      console.warn('Nao foi possivel carregar eventos');
    }
  };

  // Todas as datas que possuem eventos
  const unavailableDates = useMemo(() => {
    const dates = new Set<string>();
    allEvents.forEach(event => {
      if (event.eventDate) {
        dates.add(event.eventDate);
      }
    });
    return dates;
  }, [allEvents]);

  // Verifica se a data selecionada tem algum evento
  const hasEventsOnDate = useMemo(() => {
    if (!formData.eventDate) return false;
    return unavailableDates.has(formData.eventDate);
  }, [formData.eventDate, unavailableDates]);

  const getOverlapDescription = (
    reqStart: string, 
    reqEnd: string, 
    eventStart: string, 
    eventEnd: string
  ): string => {
    if (reqStart >= eventStart && reqEnd <= eventEnd) {
      return 'Dentro do horario';
    }
    if (reqStart <= eventStart && reqEnd >= eventEnd) {
      return 'Engloba o horario';
    }
    if (reqStart < eventEnd && reqEnd > eventEnd) {
      return 'Inicio conflita';
    }
    if (reqStart < eventStart && reqEnd > eventStart) {
      return 'Termino conflita';
    }
    return 'Sobreposicao';
  };

  // Conflitos de horario na data selecionada
 // Conflitos de horario na data selecionada (SEM DUPLICATAS)
const timeConflicts = useMemo((): TimeConflict[] => {
    if (!formData.eventDate || !formData.startTime || !formData.endTime) {
      return [];
    }

    const conflictsMap = new Map<string, TimeConflict>();
    const requestedStart = formData.startTime;
    const requestedEnd = formData.endTime;

    allEvents.forEach(event => {
      if (event.eventDate !== formData.eventDate) return;
      
      const eventStart = event.startTime?.substring(0, 5) || '';
      const eventEnd = event.endTime?.substring(0, 5) || '';
      
      // Chave unica para evitar duplicatas
      const key = `${eventStart}-${eventEnd}-${event.client?.id || 'avail'}`;
      
      const hasOverlap = 
        (requestedStart >= eventStart && requestedStart < eventEnd) ||
        (requestedEnd > eventStart && requestedEnd <= eventEnd) ||
        (requestedStart <= eventStart && requestedEnd >= eventEnd);

      if (hasOverlap && !conflictsMap.has(key)) {
        conflictsMap.set(key, {
          event,
          startTime: eventStart,
          endTime: eventEnd,
          overlap: getOverlapDescription(requestedStart, requestedEnd, eventStart, eventEnd)
        });
      }
    });

    return Array.from(conflictsMap.values())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [formData.eventDate, formData.startTime, formData.endTime, allEvents]);

  
  // Verifica se o proprio cliente ja tem evento na data
  const hasMyEventOnDate = useMemo(() => {
    if (!formData.eventDate) return false;
    return myEvents.some(e => e.eventDate === formData.eventDate);
  }, [formData.eventDate, myEvents]);

  // Status final de disponibilidade
  const availabilityStatus = useMemo(() => {
    if (!formData.eventDate || !formData.startTime || !formData.endTime) {
      return null;
    }

    // Conflito de horario (prioridade maxima)
    if (timeConflicts.length > 0) {
      return 'conflict';
    }

    // Aviso: data tem eventos mas horario esta livre
    if (hasEventsOnDate) {
      return 'warning_date_has_events';
    }

    // Aviso: cliente ja tem evento na data mas horario esta livre
    if (hasMyEventOnDate) {
      return 'warning_my_event';
    }

    return 'available';
  }, [timeConflicts, hasMyEventOnDate, hasEventsOnDate, formData.eventDate, formData.startTime, formData.endTime]);

  // Se a data tem eventos, mostra os horarios ocupados
  const occupiedTimeSlots = useMemo(() => {
    if (!formData.eventDate) return [];
    
    // Usa um Set para evitar duplicatas de horarios
    const uniqueSlots = new Map<string, { title: string; startTime: string; endTime: string; status: string; isMine: boolean }>();
    
    allEvents
      .filter(e => e.eventDate === formData.eventDate)
      .forEach(e => {
        const startTime = e.startTime?.substring(0, 5) || '';
        const endTime = e.endTime?.substring(0, 5) || '';
        const key = `${startTime}-${endTime}`;
        
        // So adiciona se nao existir ainda
        if (!uniqueSlots.has(key)) {
          uniqueSlots.set(key, {
            title: e.title,
            startTime,
            endTime,
            status: e.status,
            isMine: e.client?.id === user?.id
          });
        }
      });
    
    return Array.from(uniqueSlots.values())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [formData.eventDate, allEvents, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (availabilityStatus === 'conflict') {
      return;
    }
    
    setLoading(true);

    try {
      const eventData: CreateEventData = {
        ...formData,
        clientId: user!.id
      };
      
      const createdEvent = await eventService.createEvent(eventData);
      
      try {
        await notificationService.createNotification({
          titulo: `Nova Solicitacao de Reserva: ${formData.title}`,
          mensagem: `${user?.name} solicitou uma reserva para ${getEventTypeLabel(formData.eventType)} no dia ${formatDateForDisplay(formData.eventDate)} com ${formData.guestCount} convidados.`,
          tipo: 'event',
          prioridade: 'high',
          destinatarios: [],
          urlAcao: `/owner/events/${createdEvent.id}`,
          metadata: JSON.stringify({
            eventId: createdEvent.id,
            clientId: user?.id,
            clientName: user?.name,
            eventDate: formData.eventDate,
            guestCount: formData.guestCount,
            eventType: formData.eventType,
            startTime: formData.startTime,
            endTime: formData.endTime,
            location: formData.location,
            totalValue: formData.totalValue,
            notes: formData.notes
          })
        });
      } catch (notifError) {
        console.error('Erro ao enviar notificacao:', notifError);
      }
      
      setSubmitted(true);
      setFormData({
        title: '',
        eventDate: '',
        startTime: '18:00',
        endTime: '23:00',
        guestCount: 50,
        eventType: 'ANIVERSARIO',
        totalValue: 0,
        depositValue: 0,
        notes: '',
        location: ''
      });
      
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao solicitar reserva:', error);
      alert('Erro ao enviar solicitacao. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getEventTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'ANIVERSARIO': 'Aniversario',
      'CASAMENTO': 'Casamento',
      'CORPORATIVO': 'Corporativo',
      'FORMATURA': 'Formatura',
      'CONFRATERNIZACAO': 'Confraternizacao',
      'OUTRO': 'Outro'
    };
    return labels[type] || type;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <FiCheckCircle size={14} color="#10b981" />;
      case 'QUOTE': return <FiClock size={14} color="#f59e0b" />;
      default: return <FiInfo size={14} />;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'CONFIRMED': return 'Confirmado';
      case 'QUOTE': return 'Em Cotacao';
      default: return status;
    }
  };

  const guestCountOptions = [30, 50, 80, 100, 150, 200];

  if (submitted) {
    return (
      <div className={styles.successContainer}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <MdOutlineEventNote size={64} color="#10b981" />
          </div>
          <h2 className={styles.successTitle}>
            <FiCheckCircle size={28} />
            Solicitacao Enviada!
          </h2>
          <p className={styles.successText}>
            Sua solicitacao de reserva foi enviada com sucesso.
          </p>
          <p className={styles.successSubtext}>
            Nossa equipe analisara sua solicitacao e voce recebera uma notificacao em breve.
          </p>
          <div className={styles.successActions}>
            <button onClick={() => setSubmitted(false)} className={styles.primaryButton}>
              <MdOutlineEventNote size={20} />
              Fazer Nova Solicitacao
            </button>
            <button onClick={() => window.location.href = '/client/events'} className={styles.secondaryButton}>
              <MdEvent size={20} />
              Ver Meus Eventos
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.newBooking}>
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.titleIcon}>
            <MdOutlineEventNote size={28} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Nova Solicitacao de Reserva</h1>
            <p className={styles.pageSubtitle}>
              Preencha os dados do seu evento e nossa equipe analisara sua solicitacao
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.bookingForm}>
        <div className={styles.formSection}>
          <label className={styles.formLabel}>
            <MdEvent size={18} />
            Titulo do Evento <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Aniversario de 30 anos, Casamento Joao e Maria..."
            required
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formSection}>
            <label className={styles.formLabel}>
              <FiCalendar size={16} />
              Data do Evento <span className={styles.required}>*</span>
            </label>
            <input
              type="date"
              className={styles.formInput}
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              required
              min={new Date().toISOString().split('T')[0]}
            />
            {hasEventsOnDate && !timeConflicts.length && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12px', color: '#a16207' }}>
                <FiInfo size={12} />
                Esta data ja possui eventos. Escolha um horario livre.
              </span>
            )}
          </div>
          <div className={styles.formSection}>
            <label className={styles.formLabel}>
              <FiClock size={16} />
              Horario Inicio <span className={styles.required}>*</span>
            </label>
            <input
              type="time"
              className={styles.formInput}
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
            />
          </div>
          <div className={styles.formSection}>
            <label className={styles.formLabel}>
              <FiClock size={16} />
              Horario Termino <span className={styles.required}>*</span>
            </label>
            <input
              type="time"
              className={styles.formInput}
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Horarios ocupados na data selecionada */}
        {hasEventsOnDate && occupiedTimeSlots.length > 0 && (
          <div className={styles.occupiedSlotsBox}>
            <div className={styles.occupiedSlotsHeader}>
              <FiClock size={16} color="#f59e0b" />
              <span className={styles.occupiedSlotsTitle}>
                Horarios ocupados em {formatDateForDisplay(formData.eventDate)}:
              </span>
            </div>
            <div className={styles.occupiedSlotsList}>
              {occupiedTimeSlots.map((slot, index) => (
                <div key={index} className={`${styles.occupiedSlotItem} ${slot.isMine ? styles.occupiedSlotMine : ''}`}>
                  <span className={styles.occupiedSlotTime}>
                    {slot.startTime} - {slot.endTime}
                  </span>
                  <span className={styles.occupiedSlotStatus}>
                    {getStatusLabel(slot.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Indicador de Disponibilidade */}
        {availabilityStatus && (
          <div className={styles.availabilityContainer}>
            {availabilityStatus === 'available' && (
              <div className={styles.availableBox}>
                <FiCheckCircle size={20} color="#10b981" />
                <div>
                  <p className={styles.availabilityTitle}>Horario disponivel!</p>
                  <p className={styles.availabilityText}>
                    Nao ha outros eventos neste dia e horario.
                  </p>
                </div>
              </div>
            )}

            {availabilityStatus === 'warning_date_has_events' && (
              <div className={styles.warningBox}>
                <FiAlertTriangle size={20} color="#f59e0b" />
                <div>
                  <p className={styles.warningTitle}>
                    Esta data possui outros eventos
                  </p>
                  <p className={styles.warningText}>
                    Porem, o horario selecionado esta livre. Voce pode enviar a solicitacao.
                  </p>
                </div>
              </div>
            )}

            {availabilityStatus === 'warning_my_event' && (
              <div className={styles.warningBox}>
                <FiAlertTriangle size={20} color="#f59e0b" />
                <div>
                  <p className={styles.warningTitle}>
                    Voce ja possui um evento nesta data
                  </p>
                  <p className={styles.warningText}>
                    Mas o horario selecionado esta livre. Verifique se os horarios nao conflitam.
                  </p>
                </div>
              </div>
            )}

            {availabilityStatus === 'conflict' && (
              <div className={styles.conflictBox}>
                <div className={styles.conflictHeader}>
                  <div className={styles.conflictHeaderIcon}>
                    <MdWarning size={20} color="#ef4444" />
                  </div>
                  <div>
                    <p className={styles.conflictTitle}>
                      Conflito de horario detectado!
                    </p>
                    <p className={styles.conflictSubtitle}>
                      {timeConflicts.length} evento(s) ja ocupa(m) este horario. Altere o horario para continuar.
                    </p>
                  </div>
                </div>

                <div className={styles.conflictList}>
                  {timeConflicts.map((conflict, index) => (
                    <div key={`conflict-${index}-${conflict.startTime}-${conflict.endTime}`} className={styles.conflictItem}>
                      <div className={`${styles.conflictItemIcon} ${
                        conflict.event.client?.id === user?.id 
                          ? styles.conflictItemOwn 
                          : styles.conflictItemOther
                      }`}>
                        <MdSchedule size={18} color={
                          conflict.event.client?.id === user?.id ? '#f59e0b' : '#3b82f6'
                        } />
                      </div>

                      <div className={styles.conflictItemInfo}>
                        <div className={styles.conflictItemTags}>
                          <span className={`${styles.conflictTag} ${
                            conflict.event.client?.id === user?.id
                              ? styles.conflictTagOwn
                              : styles.conflictTagOther
                          }`}>
                            {conflict.event.client?.id === user?.id ? 'Seu evento' : 'Outro cliente'}
                          </span>
                          <span className={styles.conflictStatusIcon}>
                            {getStatusIcon(conflict.event.status)}
                          </span>
                        </div>
                        <p className={styles.conflictItemTitle}>
                          {conflict.event.title}
                        </p>
                        <div className={styles.conflictItemMeta}>
                          <span className={styles.conflictItemTime}>
                            <FiClock size={12} />
                            {conflict.startTime} - {conflict.endTime}
                          </span>
                          <span className={styles.conflictItemOverlap}>
                            <FiAlertTriangle size={12} />
                            {conflict.overlap}
                          </span>
                        </div>
                        {conflict.event.client?.name && conflict.event.client?.name !== 'Indisponivel' && (
                          <p className={styles.conflictItemClient}>
                            Cliente: {conflict.event.client.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.conflictAction}>
                  <FiAlertCircle size={16} color="#ef4444" />
                  <span>Altere o horario para um periodo livre para continuar.</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className={styles.formSection}>
          <label className={styles.formLabel}>
            <FiMapPin size={16} />
            Local do Evento
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={formData.location || ''}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Endereco ou nome do local"
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formSection}>
            <label className={styles.formLabel}>
              <FiUsers size={16} />
              Numero de Convidados <span className={styles.required}>*</span>
            </label>
            <div className={styles.guestCountContainer}>
              <input
                type="number"
                className={styles.formInput}
                value={formData.guestCount}
                onChange={(e) => setFormData({ ...formData, guestCount: Number(e.target.value) })}
                required
                min="1"
                max="500"
              />
              <div className={styles.guestCountPresets}>
                {guestCountOptions.map(count => (
                  <button
                    key={count}
                    type="button"
                    className={`${styles.presetButton} ${formData.guestCount === count ? styles.active : ''}`}
                    onClick={() => setFormData({ ...formData, guestCount: count })}
                  >
                    <FiUsers size={14} />
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.formSection}>
            <label className={styles.formLabel}>
              <MdEvent size={16} />
              Tipo de Evento <span className={styles.required}>*</span>
            </label>
            <select
              className={styles.formSelect}
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              required
            >
              <option value="ANIVERSARIO">Aniversario</option>
              <option value="CASAMENTO">Casamento</option>
              <option value="CORPORATIVO">Evento Corporativo</option>
              <option value="FORMATURA">Formatura</option>
              <option value="CONFRATERNIZACAO">Confraternizacao</option>
              <option value="OUTRO">Outro</option>
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formSection}>
            <label className={styles.formLabel}>
              <FiDollarSign size={16} />
              Orcamento Estimado
            </label>
            <div className={styles.currencyInput}>
              <span className={styles.currencySymbol}>R$</span>
              <input
                type="number"
                step="0.01"
                className={styles.formInput}
                value={formData.totalValue || ''}
                onChange={(e) => setFormData({ ...formData, totalValue: Number(e.target.value) })}
                placeholder="0,00"
              />
            </div>
          </div>
          <div className={styles.formSection}>
            <label className={styles.formLabel}>
              <FiDollarSign size={16} />
              Sinal Estimado
            </label>
            <div className={styles.currencyInput}>
              <span className={styles.currencySymbol}>R$</span>
              <input
                type="number"
                step="0.01"
                className={styles.formInput}
                value={formData.depositValue || ''}
                onChange={(e) => setFormData({ ...formData, depositValue: Number(e.target.value) })}
                placeholder="0,00"
              />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <label className={styles.formLabel}>
            <FiFileText size={16} />
            Observacoes ou Requisitos Especiais
          </label>
          <textarea
            className={styles.formTextarea}
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Alguma necessidade especial, tema especifico, restricoes alimentares, etc."
            rows={4}
          />
        </div>

        <div className={styles.infoBox}>
          <FiInfo size={16} />
          <span>
            Apos o envio, nossa equipe analisara sua solicitacao e voce recebera uma notificacao sobre a aprovacao.
          </span>
        </div>

        <div className={styles.formActions}>
          <button 
            type="button" 
            className={styles.cancelButton}
            onClick={() => window.history.back()}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={loading || availabilityStatus === 'conflict'}
            className={styles.submitButton}
          >
            {loading ? (
              <>
                <div className={styles.buttonSpinner}></div>
                Enviando...
              </>
            ) : (
              <>
                <MdOutlineEventNote size={20} />
                Solicitar Reserva
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewBooking;