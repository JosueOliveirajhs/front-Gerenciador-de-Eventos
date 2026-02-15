// src/components/admin/events/components/EventForm.tsx

import React, { useState, useEffect } from 'react';
import { 
  FiX, 
  FiSave, 
  FiUser, 
  FiCalendar, 
  FiClock, 
  FiUsers,
  FiDollarSign,
  FiFileText 
} from 'react-icons/fi';
import { MdEvent, MdAttachMoney, MdWarning } from 'react-icons/md';
import { Event, CreateEventData } from '../../../types/Event';
import { User } from '../../../types/User';
import { EventConflictChecker } from './EventConflictChecker';
import styles from '../EventManagement.module.css';

interface EventFormProps {
  clients: User[];
  onSubmit: (eventData: CreateEventData) => Promise<void>;
  onCancel: () => void;
  editingEvent?: Event | null;
  formatDateForInput: (dateString: string) => string;
  formatDateForDisplay: (dateString: string) => string;
  existingEvents: Event[];
}

export const EventForm: React.FC<EventFormProps> = ({
  clients,
  onSubmit,
  onCancel,
  editingEvent,
  formatDateForInput,
  existingEvents
}) => {
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    eventDate: '',
    startTime: '18:00',
    endTime: '23:00',
    guestCount: 50,
    eventType: 'ANIVERSARIO',
    clientId: 0,
    totalValue: '0',
    depositValue: '0',
    notes: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [hasConflict, setHasConflict] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title,
        eventDate: formatDateForInput(editingEvent.eventDate),
        startTime: editingEvent.startTime.substring(0, 5),
        endTime: editingEvent.endTime.substring(0, 5),
        guestCount: editingEvent.guestCount,
        eventType: editingEvent.eventType,
        clientId: editingEvent.client?.id || 0,
        totalValue: editingEvent.totalValue.toString(),
        depositValue: editingEvent.depositValue.toString(),
        notes: editingEvent.notes || ''
      });
    }
    setErrors({});
  }, [editingEvent, formatDateForInput]);

  const formatCurrencyInput = (value: string): string => {
    const numbersOnly = value.replace(/[^\d]/g, '');
    if (!numbersOnly) return '0';
    const numericValue = parseFloat(numbersOnly) / 100;
    return numericValue.toFixed(2);
  };

  const displayCurrencyValue = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0,00';
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleCurrencyInputChange = (field: 'totalValue' | 'depositValue', value: string) => {
    const formattedValue = formatCurrencyInput(value);
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Título do evento é obrigatório';
    }

    if (!formData.eventDate) {
      newErrors.eventDate = 'Data do evento é obrigatória';
    }

    if (formData.clientId === 0) {
      newErrors.clientId = 'Selecione um cliente';
    }

    const totalValue = parseFloat(formData.totalValue);
    if (isNaN(totalValue) || totalValue <= 0) {
      newErrors.totalValue = 'Valor total deve ser maior que zero';
    }

    const depositValue = parseFloat(formData.depositValue);
    if (isNaN(depositValue) || depositValue < 0) {
      newErrors.depositValue = 'Valor do sinal não pode ser negativo';
    }

    if (depositValue > totalValue) {
      newErrors.depositValue = 'Sinal não pode ser maior que o valor total';
    }

    if (formData.guestCount <= 0) {
      newErrors.guestCount = 'Número de convidados deve ser maior que zero';
    }

    if (hasConflict && !editingEvent) {
      newErrors.general = 'Existe conflito de horário com outro evento';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const submitData = {
        ...formData,
        clientId: Number(formData.clientId),
        guestCount: Number(formData.guestCount),
        totalValue: formData.totalValue,
        depositValue: formData.depositValue
      };
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <MdEvent size={20} />
            {editingEvent ? 'Editar Evento' : 'Novo Evento'}
          </h3>
          <button onClick={onCancel} className={styles.closeButton}>
            <FiX size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {formData.eventDate && formData.startTime && formData.endTime && (
            <EventConflictChecker
              eventId={editingEvent?.id}
              date={formData.eventDate}
              startTime={formData.startTime}
              endTime={formData.endTime}
              onConflictDetected={setHasConflict}
            />
          )}

          {errors.general && (
            <div className={styles.generalError}>
              <MdWarning size={18} />
              {errors.general}
            </div>
          )}

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <MdEvent size={14} /> Título do Evento *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className={`${styles.formInput} ${errors.title ? styles.error : ''}`}
                placeholder="Ex: Aniversário João Silva"
              />
              {errors.title && <span className={styles.errorText}>{errors.title}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <FiUser size={14} /> Cliente *
              </label>
              <select
                value={formData.clientId || ''}
                onChange={(e) => setFormData({...formData, clientId: Number(e.target.value)})}
                className={`${styles.formInput} ${errors.clientId ? styles.error : ''}`}
              >
                <option value="">Selecione um cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.cpf}
                  </option>
                ))}
              </select>
              {errors.clientId && <span className={styles.errorText}>{errors.clientId}</span>}
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <FiCalendar size={14} /> Data do Evento *
              </label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                className={`${styles.formInput} ${errors.eventDate ? styles.error : ''}`}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.eventDate && <span className={styles.errorText}>{errors.eventDate}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <FiClock size={14} /> Horário Início *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                className={styles.formInput}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <FiClock size={14} /> Horário Término *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                className={styles.formInput}
              />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <FiUsers size={14} /> Nº de Convidados *
              </label>
              <input
                type="number"
                value={formData.guestCount}
                onChange={(e) => setFormData({...formData, guestCount: Number(e.target.value)})}
                className={`${styles.formInput} ${errors.guestCount ? styles.error : ''}`}
                min="1"
              />
              {errors.guestCount && <span className={styles.errorText}>{errors.guestCount}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <MdEvent size={14} /> Tipo de Evento *
              </label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({...formData, eventType: e.target.value})}
                className={styles.formInput}
              >
                <option value="ANIVERSARIO">Aniversário</option>
                <option value="CASAMENTO">Casamento</option>
                <option value="CORPORATIVO">Corporativo</option>
                <option value="FORMATURA">Formatura</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <MdAttachMoney size={14} /> Valor Total (R$) *
              </label>
              <input
                type="text"
                value={displayCurrencyValue(formData.totalValue)}
                onChange={(e) => handleCurrencyInputChange('totalValue', e.target.value)}
                className={`${styles.formInput} ${errors.totalValue ? styles.error : ''}`}
                placeholder="0,00"
              />
              {errors.totalValue && <span className={styles.errorText}>{errors.totalValue}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <FiDollarSign size={14} /> Sinal (R$) *
              </label>
              <input
                type="text"
                value={displayCurrencyValue(formData.depositValue)}
                onChange={(e) => handleCurrencyInputChange('depositValue', e.target.value)}
                className={`${styles.formInput} ${errors.depositValue ? styles.error : ''}`}
                placeholder="0,00"
              />
              {errors.depositValue && <span className={styles.errorText}>{errors.depositValue}</span>}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <FiFileText size={14} /> Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className={styles.formTextarea}
              rows={3}
              placeholder="Detalhes adicionais sobre o evento..."
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={onCancel} className={styles.secondaryButton}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className={styles.primaryButton}
              disabled={loading || (hasConflict && !editingEvent)}
            >
              <FiSave size={18} />
              {loading ? 'Salvando...' : (editingEvent ? 'Salvar Alterações' : 'Criar Evento')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};