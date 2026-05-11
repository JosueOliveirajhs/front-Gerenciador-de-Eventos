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
  FiPlus,
  FiEye,
  FiDownload,
  FiExternalLink,
  FiRefreshCw,
  FiAlertCircle
} from 'react-icons/fi';
import { MdEvent, MdAttachMoney, MdWarning, MdPictureAsPdf } from 'react-icons/md';
import { Event, CreateEventData } from '../../../types/Event';
import { User } from '../../../types/User';
import { Payment } from '../../../types/Payment';
import { paymentService } from '../../../services/payments';
import { api } from '../../../services/api';
import { EventConflictChecker } from './EventConflictChecker';
import { ConfirmationModal } from '../../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../../common/Alerts/ErrorModal';

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

const API_URL = 'http://localhost:8080';

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
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [eventPayments, setEventPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [newPaymentData, setNewPaymentData] = useState({
    description: '',
    amount: '',
    dueDate: ''
  });

  // Preview state (igual ClientDocuments)
  const [previewPayment, setPreviewPayment] = useState<Payment | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

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

  const getCurrentISODate = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const totalValue = parseFloat(formData.totalValue);
      const depositValue = parseFloat(formData.depositValue);
      const balanceValue = totalValue - depositValue;
      
      const paymentData = {
        description: `Pagamento do evento: ${formData.title}`,
        amount: balanceValue > 0 ? balanceValue : totalValue,
        dueDate: formData.eventDate,
        status: 'PENDING',
        paymentDate: getCurrentISODate(),
        paymentMethod: null,
        billingType: null,
        invoiceUrl: null,
        receiptUrl: null,
        uploadedAt: getCurrentISODate(),
        rejectionReason: null,
        userId: null
      };
      
      const submitData = {
        ...formData,
        clientId: Number(formData.clientId),
        guestCount: Number(formData.guestCount),
        totalValue: formData.totalValue,
        depositValue: formData.depositValue,
        payment: paymentData
      };
      
      await onSubmit(submitData);
      
      setSuccessMessage(editingEvent 
        ? 'Evento atualizado com sucesso!' 
        : 'Evento criado com sucesso!'
      );
      setShowSuccessModal(true);
      
    } catch (error: any) {
      console.error('Erro ao salvar evento:', error);
      setErrorMessage(error?.message || 'Erro ao salvar evento. Tente novamente.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    onCancel();
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  const handleCreatePayment = async () => {
    if (!newPaymentData.description || !newPaymentData.amount || !newPaymentData.dueDate) {
      setErrorMessage('Preencha todos os campos do pagamento.');
      setShowErrorModal(true);
      return;
    }
    
    try {
      await paymentService.createPayment({
        eventId: editingEvent!.id,
        amount: parseFloat(newPaymentData.amount),
        dueDate: newPaymentData.dueDate,
        description: newPaymentData.description,
        status: 'PENDING',
        paymentDate: getCurrentISODate(),
        uploadedAt: getCurrentISODate()
      });
      
      setSuccessMessage('Pagamento criado com sucesso!');
      setShowSuccessModal(true);
      setShowNewPaymentForm(false);
      setNewPaymentData({ description: '', amount: '', dueDate: '' });
      loadEventPayments();
      
    } catch (err: any) {
      console.error('Erro ao criar pagamento:', err);
      setErrorMessage(err?.message || 'Erro ao criar pagamento. Tente novamente.');
      setShowErrorModal(true);
    }
  };

  // ✅ VISUALIZAR BOLETO - Via backend proxy
  // ✅ VISUALIZAR BOLETO - Com token JWT
const handleViewBoleto = async (payment: Payment) => {
  if (!payment.id) {
    setErrorMessage('Boleto não disponível.');
    setShowErrorModal(true);
    return;
  }

  setPreviewPayment(payment);
  setPreviewLoading(true);
  setPreviewError(null);

  try {
    // ✅ Pegar o token JWT do localStorage
    const token = localStorage.getItem('token');
    
    const url = `${API_URL}/payments/${payment.id}/invoice/download`;
    
    const response = await fetch(url, {
      headers: token ? { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : {}
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    setPreviewUrl(blobUrl);
    setPreviewLoading(false);

  } catch (err: any) {
    console.error('Erro ao carregar boleto:', err);
    setPreviewLoading(false);
    setPreviewError(err.message || 'Erro ao carregar documento');
  }
};


  // ✅ FECHAR PREVIEW
  const handleClosePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewPayment(null);
    setPreviewUrl('');
    setPreviewLoading(false);
    setPreviewError(null);
  };

  // ✅ DOWNLOAD - Via backend proxy
  const handleDownloadBoleto = (payment: Payment) => {
    if (payment.id) {
      window.open(`${API_URL}/payments/${payment.id}/invoice/download`, '_blank', 'noopener,noreferrer');
    } else if (payment.invoiceUrl) {
      window.open(payment.invoiceUrl, '_blank', 'noopener,noreferrer');
    } else {
      setErrorMessage('Boleto não disponível para download.');
      setShowErrorModal(true);
    }
  };

  // ✅ ABRIR EM NOVA ABA - URL direta
  const handleOpenBoleto = (payment: Payment) => {
    if (payment.invoiceUrl) {
      window.open(payment.invoiceUrl, '_blank', 'noopener,noreferrer');
    } else {
      setErrorMessage('Boleto não disponível.');
      setShowErrorModal(true);
    }
  };

  const handleUploadInvoice = async (paymentId: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/payments/${paymentId}/upload-invoice`, formData, { 
          headers: { 'Content-Type': 'multipart/form-data' } 
        });
        if (response.status === 200) {
          setSuccessMessage('Boleto anexado com sucesso!');
          setShowSuccessModal(true);
          loadEventPayments();
        }
      } catch (err: any) {
        console.error('Erro ao anexar boleto:', err);
        setErrorMessage(err?.message || 'Erro ao anexar boleto. Tente novamente.');
        setShowErrorModal(true);
      }
    };
    input.click();
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (value: any): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

            {/* SEÇÃO FINANCEIRA */}
            {editingEvent && (
              <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid var(--border-color)' }}>
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
                      <input type="text" placeholder="Descrição" value={newPaymentData.description}
                        onChange={e => setNewPaymentData({...newPaymentData, description: e.target.value})}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px' }} />
                      <input type="number" placeholder="Valor" value={newPaymentData.amount}
                        onChange={e => setNewPaymentData({...newPaymentData, amount: e.target.value})}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px' }} />
                      <input type="date" value={newPaymentData.dueDate}
                        onChange={e => setNewPaymentData({...newPaymentData, dueDate: e.target.value})}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                      <button type="button" onClick={() => setShowNewPaymentForm(false)}
                        style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
                      <button type="button" onClick={handleCreatePayment}
                        style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: '#10b981', color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Criar</button>
                    </div>
                  </div>
                )}

                {loadingPayments ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    <FiRefreshCw size={16} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
                    Carregando pagamentos...
                  </div>
                ) : eventPayments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
                    Nenhum pagamento registrado para este evento.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {eventPayments.map(payment => (
                      <div key={payment.id} style={{
                        background: 'var(--bg-tertiary)', padding: '14px 16px', borderRadius: '12px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '200px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '10px',
                            background: payment.invoiceUrl ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <MdPictureAsPdf size={22} color={payment.invoiceUrl ? '#ef4444' : '#64748b'} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
                              {payment.description}
                            </p>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                              <span>Venc: {formatDate(payment.dueDate)}</span>
                              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(payment.amount)}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          {payment.invoiceUrl && (
                            <>
                              <button type="button" onClick={() => handleViewBoleto(payment)}
                                style={{ padding: '8px 12px', background: 'rgba(0, 180, 216, 0.1)', color: '#00B4D8',
                                  border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex',
                                  alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}
                                title="Visualizar boleto"><FiEye size={14} />Ver</button>
                              <button type="button" onClick={() => handleDownloadBoleto(payment)}
                                style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                                  border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex',
                                  alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}
                                title="Download boleto"><FiDownload size={14} />Baixar</button>
                              <button type="button" onClick={() => handleOpenBoleto(payment)}
                                style={{ padding: '8px 12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b',
                                  border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex',
                                  alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}
                                title="Abrir em nova aba"><FiExternalLink size={14} />Abrir</button>
                            </>
                          )}
                          <button type="button" onClick={() => handleUploadInvoice(payment.id)}
                            style={{ padding: '8px 12px', background: 'rgba(0, 180, 216, 0.1)', color: '#00B4D8',
                              border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex',
                              alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}
                            title="Anexar boleto"><FiUpload size={14} />Anexar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.formLabel}><FiFileText size={14} /> Observações</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className={styles.formTextarea} rows={3} placeholder="Detalhes adicionais sobre o evento..." />
            </div>

            <div className={styles.formActions}>
              <button type="button" onClick={onCancel} className={styles.secondaryButton}>Cancelar</button>
              <button type="submit" className={styles.primaryButton} disabled={loading || (hasConflict && !editingEvent)}>
                <FiSave size={18} />
                {loading ? 'Salvando...' : (editingEvent ? 'Salvar Alterações' : 'Criar Evento')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL PREVIEW */}
      {previewPayment && previewUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '20px' }} onClick={handleClosePreview}>
          <div style={{ background: 'var(--card-bg)', borderRadius: '20px', width: '100%', maxWidth: '900px',
            height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', background: 'linear-gradient(135deg, #00B4D8 0%, #0096B4 100%)',
              color: 'white', flexShrink: 0, flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)',
                  borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MdPictureAsPdf size={22} color="white" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{previewPayment.description}</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
                    Venc: {formatDate(previewPayment.dueDate)} • {formatCurrency(previewPayment.amount)}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => handleDownloadBoleto(previewPayment)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                    background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                  <FiDownload size={16} />Download</button>
                <button type="button" onClick={handleClosePreview}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                    background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                  <FiX size={16} />Fechar</button>
              </div>
            </div>
            <div style={{ flex: 1, background: '#f8fafc', position: 'relative' }}>
              {previewLoading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'var(--text-muted)' }}>
                  <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)',
                    borderTop: '3px solid #00B4D8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: '14px' }}>Carregando documento...</p>
                </div>
              )}
              {previewError && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'var(--text-muted)',
                  padding: '40px', textAlign: 'center' }}>
                  <FiAlertCircle size={48} color="#ef4444" />
                  <p style={{ fontSize: '14px', maxWidth: '400px' }}>{previewError}</p>
                  <button type="button" onClick={() => handleDownloadBoleto(previewPayment)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                      background: '#00B4D8', color: 'white', border: 'none', borderRadius: '8px',
                      fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                    <FiDownload size={16} />Baixar documento</button>
                </div>
              )}
              <iframe src={previewUrl}
                style={{ width: '100%', height: '100%', border: 'none',
                  display: previewLoading || previewError ? 'none' : 'block' }}
                title={previewPayment.description || 'Boleto'} />
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal isOpen={showSuccessModal} title="Sucesso!" message={successMessage}
        type="success" onConfirm={handleSuccessClose} onCancel={handleSuccessClose} confirmText="OK" />
      <ErrorModal isOpen={showErrorModal} message={errorMessage} onClose={handleErrorClose} />

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </>
  );
};