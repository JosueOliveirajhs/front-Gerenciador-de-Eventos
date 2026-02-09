import React, { useState } from 'react';
import { CreateEventData } from '../../types/Event';
import { eventService } from '../../services/events';
import { useAuth } from '../../context/AuthContext';
import styles from './NewBooking.module.css';

export const NewBooking: React.FC = () => {
  const [formData, setFormData] = useState<Omit<CreateEventData, 'clientId'>>({
    title: '',
    eventDate: '',
    startTime: '18:00',
    endTime: '23:00',
    guestCount: 50,
    eventType: 'ANIVERSARIO',
    totalValue: 0,
    depositValue: 0,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const eventData: CreateEventData = {
        ...formData,
        clientId: user!.id
      };
      
      await eventService.createEvent(eventData);
      setSubmitted(true);
      
      // Reset form
      setFormData({
        title: '',
        eventDate: '',
        startTime: '18:00',
        endTime: '23:00',
        guestCount: 50,
        eventType: 'ANIVERSARIO',
        totalValue: 0,
        depositValue: 0,
        notes: ''
      });
    } catch (error) {
      console.error('Erro ao solicitar reserva:', error);
      alert('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.bookingSuccess}>
        <h2 className={styles.successTitle}>✅ Solicitação Enviada!</h2>
        <p className={styles.successText}>Sua solicitação de reserva foi enviada com sucesso.</p>
        <p className={styles.successText}>Entraremos em contato em breve para confirmar a disponibilidade e detalhes.</p>
        <button 
          onClick={() => setSubmitted(false)} 
          className={styles.btnPrimary}
        >
          Fazer Nova Solicitação
        </button>
      </div>
    );
  }

  return (
    <div className={styles.newBooking}>
      <h2 className={styles.title}>Nova Solicitação de Reserva</h2>
      <p className={styles.description}>Preencha os dados do seu evento e entraremos em contato para confirmar.</p>

      <form onSubmit={handleSubmit} className={styles.bookingForm}>
        <div className={styles.formGroup}>
          <label>Título do Evento *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="Ex: Aniversário de 30 anos, Casamento João e Maria..."
            required
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Data do Evento *</label>
            <input
              type="date"
              value={formData.eventDate}
              onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Horário Início *</label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({...formData, startTime: e.target.value})}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Horário Término *</label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({...formData, endTime: e.target.value})}
              required
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Número de Convidados *</label>
            <input
              type="number"
              value={formData.guestCount}
              onChange={(e) => setFormData({...formData, guestCount: Number(e.target.value)})}
              required
              min="1"
              max="200"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Tipo de Evento *</label>
            <select
              value={formData.eventType}
              onChange={(e) => setFormData({...formData, eventType: e.target.value})}
              required
            >
              <option value="ANIVERSARIO">Aniversário</option>
              <option value="CASAMENTO">Casamento</option>
              <option value="CORPORATIVO">Evento Corporativo</option>
              <option value="FORMATURA">Formatura</option>
              <option value="CONFRATERNIZACAO">Confraternização</option>
              <option value="OUTRO">Outro</option>
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Valor Estimado (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.totalValue}
              onChange={(e) => setFormData({...formData, totalValue: Number(e.target.value)})}
              placeholder="Orçamento aproximado"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Sinal Estimado (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.depositValue}
              onChange={(e) => setFormData({...formData, depositValue: Number(e.target.value)})}
              placeholder="Valor para reserva"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Observações ou Requisitos Especiais</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Alguma necessidade especial, tema específico, etc."
            rows={4}
          />
        </div>

        <div className={styles.formActions}>
          <button 
            type="submit" 
            disabled={loading}
            className={styles.btnPrimary}
          >
            {loading ? 'Enviando...' : 'Solicitar Reserva'}
          </button>
        </div>
      </form>
    </div>
  );
};