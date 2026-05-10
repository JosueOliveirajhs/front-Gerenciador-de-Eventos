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
  FiFileText,
  FiUpload,
  FiPlus
} from 'react-icons/fi';
import { MdEvent, MdAttachMoney, MdWarning, MdAdd, MdDateRange, MdCheckCircle, MdPayment } from 'react-icons/md';
import { Event, CreateEventData } from '../../../types/Event';
import { User } from '../../../types/User';
import { Payment } from '../../../types/Payment';
import { paymentService } from '../../../services/payments';
import { api } from '../../../services/api';
import { EventConflictChecker } from './EventConflictChecker';
import { ConfirmationModal } from '../../common/Alerts/ConfirmationModal';

import styles from './EventManagement/EventManagement.module.css';

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
  
  // Estado para o modal de sucesso
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Estados para financeiro do evento
  const [eventPayments, setEventPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [newPaymentData, setNewPaymentData] = useState({
    description: '',
    amount: '',
    dueDate: ''
  });

  // DEBUG: Monitorar mudanças no showSuccessModal
  useEffect(() => {
    console.log('🎯 [EventForm] showSuccessModal mudou para:', showSuccessModal);
  }, [showSuccessModal]);

  // Carregar pagamentos do evento se estiver editando
  useEffect(() => {
    if (editingEvent) {
      loadEventPayments();
    }
  }, [editingEvent]);

  const loadEventPayments = async () => {
    if (!editingEvent) return;
    try {
      setLoadingPayments(true);
      const data = await paymentService.getPaymentsByEventId(editingEvent.id);
      setEventPayments(data);
    } catch (error) {
      console.error('Erro ao carregar pagamentos do evento:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

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
      
      console.log('📝 [EventForm] Enviando dados:', submitData);
      
      await onSubmit(submitData);
      
      console.log('✅ [EventForm] onSubmit executado com sucesso');
      
      // DEBUG: Verificar se está chegando aqui
      console.log('🔵 [EventForm] ANTES de setSuccessMessage');
      setSuccessMessage(editingEvent 
        ? 'Evento atualizado com sucesso!' 
        : 'Evento criado com sucesso!'
      );
      console.log('🟡 [EventForm] ANTES de setShowSuccessModal');
      setShowSuccessModal(true);
      console.log('🟢 [EventForm] DEPOIS de setShowSuccessModal');
      
    } catch (error) {
      console.error('❌ [EventForm] Erro ao salvar evento:', error);
      alert('Erro ao salvar evento: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    console.log('🔴 [EventForm] Fechando modal de sucesso');
    setShowSuccessModal(false);
    onCancel();
  };

  return (
    <>
      {/* Modal do Formulário */}
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
                <label className={styles.formLabel}><MdEvent size={14} /> Título do Evento *</label>
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
                <label className={styles.formLabel}><FiUser size={14} /> Cliente *</label>
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
                <label className={styles.formLabel}><FiCalendar size={14} /> Data do Evento *</label>
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
                <label className={styles.formLabel}><FiClock size={14} /> Horário Início *</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}><FiClock size={14} /> Horário Término *</label>
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
                <label className={styles.formLabel}><FiUsers size={14} /> Nº de Convidados *</label>
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
                <label className={styles.formLabel}><MdEvent size={14} /> Tipo de Evento *</label>
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
                <label className={styles.formLabel}><MdAttachMoney size={14} /> Valor Total (R$) *</label>
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
                <label className={styles.formLabel}><FiDollarSign size={14} /> Sinal (R$) *</label>
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

            {editingEvent && (
              <div className={styles.financeSection} style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>
                    <MdAttachMoney size={20} /> Gestão Financeira do Evento
                  </h4>
                  {!showNewPaymentForm && (
                    <button 
                      type="button"
                      onClick={() => setShowNewPaymentForm(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
                    >
                      <FiPlus size={16} /> Novo Pagamento
                    </button>
                  )}
                </div>

                {showNewPaymentForm && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '10px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-primary)' }}>Novo Pagamento</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <input 
                        type="text" 
                        placeholder="Descrição"
                        value={newPaymentData.description}
                        onChange={e => setNewPaymentData({...newPaymentData, description: e.target.value})}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px' }}
                      />
                      <input 
                        type="number" 
                        placeholder="Valor"
                        value={newPaymentData.amount}
                        onChange={e => setNewPaymentData({...newPaymentData, amount: e.target.value})}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px' }}
                      />
                      <input 
                        type="date" 
                        value={newPaymentData.dueDate}
                        onChange={e => setNewPaymentData({...newPaymentData, dueDate: e.target.value})}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                      <button 
                        type="button"
                        onClick={() => setShowNewPaymentForm(false)}
                        style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                      <button 
                        type="button"
                        onClick={async () => {
                          if (!newPaymentData.description || !newPaymentData.amount || !newPaymentData.dueDate) {
                            alert('Preencha todos os campos.');
                            return;
                          }
                          try {
                            await paymentService.createPayment({
                              eventId: editingEvent.id,
                              amount: parseFloat(newPaymentData.amount),
                              dueDate: newPaymentData.dueDate,
                              description: newPaymentData.description,
                              status: 'PENDING'
                            });
                            alert('Pagamento criado!');
                            setShowNewPaymentForm(false);
                            setNewPaymentData({ description: '', amount: '', dueDate: '' });
                            loadEventPayments();
                          } catch (err) {
                            alert('Erro ao criar pagamento.');
                          }
                        }}
                        style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: '#10b981', color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                      >
                        Criar
                      </button>
                    </div>
                  </div>
                )}

                {loadingPayments ? (
                  <p>Carregando pagamentos...</p>
                ) : eventPayments.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>Nenhum pagamento registrado para este evento.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {eventPayments.map(payment => (
                      <div key={payment.id} style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                        <div>
                          <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: '14px' }}>{payment.description}</p>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <span>Vencimento: {new Date(payment.dueDate).toLocaleDateString('pt-BR')}</span>
                            <span>Valor: {parseFloat(payment.amount.toString()).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {payment.invoiceUrl && (
                            <a href={payment.invoiceUrl} target="_blank" rel="noreferrer" style={{ padding: '6px', background: '#64748b', color: 'white', borderRadius: '4px', display: 'flex' }} title="Ver Boleto">
                              <FiFileText size={16} />
                            </a>
                          )}
                          <button 
                            type="button"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'application/pdf';
                              input.onchange = async (e: any) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  const response = await api.post(`/payments/${payment.id}/upload-invoice`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                                  if (response.status === 200) {
                                    alert('Boleto anexado com sucesso!');
                                    loadEventPayments();
                                  }
                                } catch (error) { alert('Erro ao anexar boleto'); }
                              };
                              input.click();
                            }}
                            style={{ padding: '6px', background: '#00B4D8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex' }}
                            title="Anexar Boleto"
                          >
                            <FiUpload size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.formLabel}><FiFileText size={14} /> Observações</label>
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

      {/* Modal de Sucesso */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        title="Sucesso!"
        message={successMessage}
        type="success"
        onConfirm={handleSuccessClose}
        onCancel={handleSuccessClose}
        confirmText="OK"
      />
    </>
  );
};