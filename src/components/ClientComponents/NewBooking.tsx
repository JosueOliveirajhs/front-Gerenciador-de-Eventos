// src/components/ClientComponents/NewBooking.tsx
import React, { useState, useEffect } from 'react';
import { CreateEventData } from '../../types/Event';
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
  FiGift,
  FiHeart,
  FiBriefcase,
  FiStar,
  FiCoffee,
  FiMoreHorizontal
} from 'react-icons/fi';
import { 
  MdEvent, 
  MdOutlineEventNote,
  MdCake,
  MdDiamond,
  MdBusiness,
  MdSchool,
  MdCelebration,
  MdAutoAwesome
} from 'react-icons/md';
import styles from './NewBooking.module.css';

interface NewBookingProps {
  onSuccess?: () => void;
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
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [selectedDateAvailable, setSelectedDateAvailable] = useState<boolean | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadUnavailableDates();
  }, []);

  const loadUnavailableDates = async () => {
    try {
      const events = await eventService.getMyEvents();
      const dates = events
        .filter(e => e.status === 'CONFIRMED' || e.status === 'QUOTE')
        .map(e => e.eventDate);
      setUnavailableDates(dates);
    } catch (error) {
      console.warn('Não foi possível carregar datas indisponíveis');
    }
  };

  const checkDateAvailability = async (date: string) => {
    if (!date) {
      setSelectedDateAvailable(null);
      return;
    }

    setCheckingAvailability(true);
    
    try {
      const isUnavailable = unavailableDates.includes(date);
      setSelectedDateAvailable(!isUnavailable);
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      setSelectedDateAvailable(null);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setFormData({ ...formData, eventDate: date });
    checkDateAvailability(date);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedDateAvailable === false) {
      alert('A data selecionada não está disponível. Por favor, escolha outra data.');
      return;
    }
    
    setLoading(true);

    try {
      const eventData: CreateEventData = {
        ...formData,
        clientId: user!.id
      };
      
      const createdEvent = await eventService.createEvent(eventData);
      console.log('✅ Evento criado:', createdEvent);
      
      // Enviar notificação para os OWNERS
      try {
        await notificationService.createNotification({
          titulo: `Nova Solicitação de Reserva: ${formData.title}`,
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
        
        console.log('✅ Notificação de nova reserva enviada para os administradores');
      } catch (notifError) {
        console.error('Erro ao enviar notificação:', notifError);
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
      setSelectedDateAvailable(null);
      
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao solicitar reserva:', error);
      alert('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getEventTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'ANIVERSARIO': 'Aniversário',
      'CASAMENTO': 'Casamento',
      'CORPORATIVO': 'Corporativo',
      'FORMATURA': 'Formatura',
      'CONFRATERNIZACAO': 'Confraternização',
      'OUTRO': 'Outro'
    };
    return labels[type] || type;
  };

  // ✅ Ícones profissionais React em vez de emojis
  const eventTypes = [
    { value: 'ANIVERSARIO', label: 'Aniversário', icon: <MdCake size={18} /> },
    { value: 'CASAMENTO', label: 'Casamento', icon: <MdDiamond size={18} /> },
    { value: 'CORPORATIVO', label: 'Evento Corporativo', icon: <MdBusiness size={18} /> },
    { value: 'FORMATURA', label: 'Formatura', icon: <MdSchool size={18} /> },
    { value: 'CONFRATERNIZACAO', label: 'Confraternização', icon: <MdCelebration size={18} /> },
    { value: 'OUTRO', label: 'Outro', icon: <MdAutoAwesome size={18} /> }
  ];

  const guestCountOptions = [30, 50, 80, 100, 150, 200];

  if (submitted) {
    return (
      <div className={styles.successContainer}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <MdOutlineEventNote size={64} color="#10b981" />
          </div>
          <h2 className={styles.successTitle}>
            <FiCheckCircle size={28} className={styles.successTitleIcon} />
            Solicitação Enviada!
          </h2>
          <p className={styles.successText}>
            Sua solicitação de reserva foi enviada com sucesso.
          </p>
          <p className={styles.successSubtext}>
            Nossa equipe analisará sua solicitação e você receberá uma notificação em breve.
          </p>
          <div className={styles.successActions}>
            <button 
              onClick={() => setSubmitted(false)} 
              className={styles.primaryButton}
            >
              <MdOutlineEventNote size={20} />
              Fazer Nova Solicitação
            </button>
            <button 
              onClick={() => window.location.href = '/client/events'} 
              className={styles.secondaryButton}
            >
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
            <h1 className={styles.pageTitle}>Nova Solicitação de Reserva</h1>
            <p className={styles.pageSubtitle}>
              Preencha os dados do seu evento e nossa equipe analisará sua solicitação
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.bookingForm}>
        {/* Título do Evento */}
        <div className={styles.formSection}>
          <label className={styles.formLabel}>
            <MdEvent size={18} />
            Título do Evento <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Aniversário de 30 anos, Casamento João e Maria..."
            required
          />
        </div>

        {/* Data e Horários */}
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
              onChange={handleDateChange}
              required
              min={new Date().toISOString().split('T')[0]}
            />
            {checkingAvailability && (
              <span className={styles.checkingMessage}>
                <FiClock size={12} className={styles.spinIcon} />
                Verificando disponibilidade...
              </span>
            )}
            {selectedDateAvailable === true && (
              <span className={styles.availableMessage}>
                <FiCheckCircle size={14} />
                Data disponível para solicitação!
              </span>
            )}
            {selectedDateAvailable === false && (
              <span className={styles.unavailableMessage}>
                <FiAlertCircle size={14} />
                Você já tem um evento nesta data.
              </span>
            )}
          </div>
          <div className={styles.formSection}>
            <label className={styles.formLabel}>
              <FiClock size={16} />
              Horário Início <span className={styles.required}>*</span>
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
              Horário Término <span className={styles.required}>*</span>
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

        {/* Localização */}
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
            placeholder="Endereço ou nome do local"
          />
        </div>

        {/* Convidados e Tipo */}
        <div className={styles.formRow}>
          <div className={styles.formSection}>
            <label className={styles.formLabel}>
              <FiUsers size={16} />
              Número de Convidados <span className={styles.required}>*</span>
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
              {eventTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Valores */}
        <div className={styles.formRow}>
          <div className={styles.formSection}>
            <label className={styles.formLabel}>
              <FiDollarSign size={16} />
              Orçamento Estimado
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

        {/* Observações */}
        <div className={styles.formSection}>
          <label className={styles.formLabel}>
            <FiFileText size={16} />
            Observações ou Requisitos Especiais
          </label>
          <textarea
            className={styles.formTextarea}
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Alguma necessidade especial, tema específico, restrições alimentares, etc."
            rows={4}
          />
        </div>

        {/* Info Box */}
        <div className={styles.infoBox}>
          <FiInfo size={16} />
          <span>
            Após o envio, nossa equipe analisará sua solicitação e você receberá uma notificação sobre a aprovação.
          </span>
        </div>

        {/* Actions */}
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
            disabled={loading || selectedDateAvailable === false}
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