import React, { useState, useEffect } from 'react';
import { Event, CreateEventData } from '../../types/Event';
import { User } from '../../types/User';
import { eventService } from '../../services/events';
import { userService } from '../../services/users';
import styles from './EventManagement.module.css'

export const EventManagement: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Event | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // ✅ FUNÇÃO CORRIGIDA: Converter data para formato correto
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    
    // Para datas do backend (YYYY-MM-DD), retorna direto
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Para datas completas com timezone, extrai apenas a parte da data
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  // ✅ FUNÇÃO CORRIGIDA: Exibir data formatada
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return 'Data inválida';
    
    try {
      // Adiciona timezone para evitar mudança de data
      const date = new Date(dateString + 'T12:00:00-03:00');
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  const checkAndRefreshToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return false;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      if (Date.now() >= exp) {
        console.log('Token expirado, redirecionando para login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return false;
      }
      return true;
    } catch (error) {
      console.error('Token inválido:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return false;
    }
  };

  const loadData = async () => {
    try {
      const [eventsData, clientsData] = await Promise.all([
        eventService.getAllEvents(),
        userService.getAllClients()
      ]);
      setEvents(eventsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (eventData: CreateEventData) => {
    try {
      // ✅ CORREÇÃO: Formatar dados corretamente para o backend
      const formattedData = {
        title: eventData.title,
        eventDate: eventData.eventDate, // Já está no formato YYYY-MM-DD
        startTime: eventData.startTime, // Manter como está (HH:mm)
        endTime: eventData.endTime,     // Manter como está (HH:mm)
        guestCount: Number(eventData.guestCount),
        eventType: eventData.eventType,
        clientId: Number(eventData.clientId),
        totalValue: eventData.totalValue.toString(), // Garantir que é string
        depositValue: eventData.depositValue.toString(), // Garantir que é string
        notes: eventData.notes || ''
      };
      
      console.log('📅 Dados enviados para criação:', formattedData);
      
      const newEvent = await eventService.createEvent(formattedData);
      setEvents(prev => [...prev, newEvent]);
      setShowForm(false);
      
      alert('Evento criado com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao criar evento:', error);
      
      // ✅ CORREÇÃO: Mostrar detalhes do erro
      if (error.response?.data) {
        console.error('Detalhes do erro:', error.response.data);
        alert(`Erro ao criar evento: ${JSON.stringify(error.response.data)}`);
      } else {
        alert('Erro ao criar evento. Verifique os dados e tente novamente.');
      }
    }
  };

  const handleUpdateEvent = async (eventData: CreateEventData) => {
    if (!editingEvent) return;
    
    try {
      // ✅ CORREÇÃO: Formatar dados corretamente para o backend
      const formattedData = {
        title: eventData.title,
        eventDate: eventData.eventDate,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        guestCount: Number(eventData.guestCount),
        eventType: eventData.eventType,
        clientId: Number(eventData.clientId),
        totalValue: eventData.totalValue.toString(),
        depositValue: eventData.depositValue.toString(),
        notes: eventData.notes || ''
      };
      
      console.log('📅 Dados enviados para atualização:', formattedData);
      
      const updatedEvent = await eventService.updateEvent(editingEvent.id, formattedData);
      setEvents(prev => prev.map(event => 
        event.id === editingEvent.id ? updatedEvent : event
      ));
      setEditingEvent(null);
      setShowForm(false);
      
      alert('Evento atualizado com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao atualizar evento:', error);
      
      if (error.response?.data) {
        console.error('Detalhes do erro:', error.response.data);
        alert(`Erro ao atualizar evento: ${JSON.stringify(error.response.data)}`);
      } else {
        alert('Erro ao atualizar evento. Verifique os dados e tente novamente.');
      }
    }
  };

  const handleUpdateEventStatus = async (eventId: number, status: Event['status']) => {
    try {
      const isTokenValid = await checkAndRefreshToken();
      if (!isTokenValid) return;
      
      console.log('Iniciando atualização de status:', { eventId, status });
      
      // Otimista update
      setEvents(prev => prev.map(event => 
        event.id === eventId ? { ...event, status } : event
      ));
      
      // ✅ PRIMEIRO: Tentar método normal
      console.log('🔄 Tentando método PATCH normal...');
      const updatedEvent = await eventService.updateEventStatus(eventId, status);
      
      console.log('✅ Status atualizado com sucesso:', updatedEvent);
      
      // Atualizar com dados reais do servidor
      setEvents(prev => prev.map(event => 
        event.id === eventId ? updatedEvent : event
      ));
      
    } catch (error: any) {
      console.error('❌ Erro com método PATCH:', error);
      
      // ✅ SEGUNDO: Tentar método alternativo se o primeiro falhar
      try {
        console.log('🔄 Tentando método POST alternativo...');
        const updatedEvent = await eventService.updateEventStatusTest(eventId, status);
        
        console.log('✅ Status atualizado com método alternativo:', updatedEvent);
        
        setEvents(prev => prev.map(event => 
          event.id === eventId ? updatedEvent : event
        ));
        
      } catch (secondError: any) {
        console.error('❌ Erro com método alternativo também:', secondError);
        
        // Reverter mudança otimista
        await loadData();
        
        if (error.response?.status === 403 || secondError.response?.status === 403) {
          alert('Token expirado ou inválido. Por favor, faça login novamente.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        } else {
          alert(`Erro ao atualizar status: ${error.message}`);
        }
      }
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await eventService.deleteEvent(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
      setShowDeleteModal(null);
      alert('Evento excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      alert('Erro ao excluir evento. Tente novamente.');
    }
  };

  const handleEditClick = (event: Event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleFormSubmit = (eventData: CreateEventData) => {
    if (editingEvent) {
      handleUpdateEvent(eventData);
    } else {
      handleCreateEvent(eventData);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  const getStatusVariant = (status: Event['status']) => {
    const variants = {
      QUOTE: 'quote',
      CONFIRMED: 'confirmed',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled'
    };
    return variants[status];
  };


  const formatCurrency = (value: string | number): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando eventos...</p>
      </div>
    );
  }

  return (
    <div className={styles.eventManagement}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Eventos</h1>
          <button 
            onClick={() => setShowForm(true)}
            className={styles.primaryButton}
          >
            <i className="bi bi-plus-lg"></i>
            Novo Evento
          </button>
        </div>
      </div>

      {showForm && (
        <EventForm
          clients={clients}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          editingEvent={editingEvent}
          formatDateForInput={formatDateForInput}
          formatDateForDisplay={formatDateForDisplay}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmationModal
          event={showDeleteModal}
          onConfirm={() => handleDeleteEvent(showDeleteModal.id)}
          onCancel={() => setShowDeleteModal(null)}
          formatDateForDisplay={formatDateForDisplay}
        />
      )}

      <div className={styles.eventsTable}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Evento</th>
                <th>Cliente</th>
                <th>Convidados</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event.id}>
                  <td>
                    <div className={styles.dateCell}>
                      {formatDateForDisplay(event.eventDate)}
                    </div>
                  </td>
                  <td>
                    <div className={styles.eventCell}>
                      <strong className={styles.eventTitle}>{event.title}</strong>
                      <span className={styles.eventType}>{event.eventType}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.clientCell}>
                      {event.client?.name || `Cliente ID: ${event.clientId}`}
                    </div>
                  </td>
                  <td>
                    <div className={styles.guestCell}>
                      {event.guestCount}
                    </div>
                  </td>
                  <td>
                    <div className={styles.valueCell}>
                      {formatCurrency(event.totalValue)}
                    </div>
                  </td>
                  <td>
                    <div className={styles.statusCell}>
                      <select
                        value={event.status}
                        onChange={(e) => handleUpdateEventStatus(event.id, e.target.value as Event['status'])}
                        className={`${styles.statusSelect} ${styles[getStatusVariant(event.status)]}`}
                      >
                        <option value="QUOTE">Cotação</option>
                        <option value="CONFIRMED">Confirmado</option>
                        <option value="COMPLETED">Realizado</option>
                        <option value="CANCELLED">Cancelado</option>
                      </select>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      <button
                        onClick={() => handleEditClick(event)}
                        className={styles.editButton}
                        title="Editar evento"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      
                      <button
                        onClick={() => setShowDeleteModal(event)}
                        className={styles.deleteButton}
                        title="Excluir evento"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {events.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📅</div>
            <h3 className={styles.emptyTitle}>Nenhum evento encontrado</h3>
            <p className={styles.emptyText}>
              Comece criando seu primeiro evento para ver a lista aqui.
            </p>
            <button 
              onClick={() => setShowForm(true)}
              className={styles.primaryButton}
            >
              <i className="bi bi-plus-lg"></i>
              Criar Primeiro Evento
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface EventFormProps {
  clients: User[];
  onSubmit: (eventData: CreateEventData) => void;
  onCancel: () => void;
  editingEvent?: Event | null;
  formatDateForInput: (dateString: string) => string;
  formatDateForDisplay: (dateString: string) => string;
}

const EventForm: React.FC<EventFormProps> = ({ 
  clients, 
  onSubmit, 
  onCancel, 
  editingEvent,
  formatDateForInput,
  formatDateForDisplay 
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
    } else {
      setFormData({
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
    }
    setErrors({});
  }, [editingEvent, formatDateForInput]);

  // ✅ CORREÇÃO: Funções para manipular valores monetários
  const formatCurrencyInput = (value: string): string => {
    // Remove tudo que não é número
    const numbersOnly = value.replace(/[^\d]/g, '');
    
    // Se estiver vazio, retorna '0'
    if (!numbersOnly) return '0';
    
    // Converte para número e divide por 100 para ter decimais
    const numericValue = parseFloat(numbersOnly) / 100;
    
    return numericValue.toFixed(2); // Sempre com 2 casas decimais
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
    // Formata o valor para armazenar (sem formatação, apenas números)
    const formattedValue = formatCurrencyInput(value);
    
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const submitData = {
      ...formData,
      clientId: Number(formData.clientId),
      guestCount: Number(formData.guestCount),
      totalValue: formData.totalValue,
      depositValue: formData.depositValue
    };
    
    console.log('📅 Dados validados do formulário:', submitData);
    
    onSubmit(submitData);
  };

  const handleInputChange = (field: keyof CreateEventData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {editingEvent ? 'Editar Evento' : 'Novo Evento'}
          </h3>
          <button onClick={onCancel} className={styles.closeButton}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Título do Evento *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`${styles.formInput} ${errors.title ? styles.error : ''}`}
                placeholder="Ex: Aniversário João Silva"
              />
              {errors.title && <span className={styles.errorText}>{errors.title}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Cliente *</label>
              <select
                value={formData.clientId || ''}
                onChange={(e) => handleInputChange('clientId', e.target.value === '' ? 0 : Number(e.target.value))}
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
              <label className={styles.formLabel}>Data do Evento *</label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) => handleInputChange('eventDate', e.target.value)}
                className={`${styles.formInput} ${errors.eventDate ? styles.error : ''}`}
              />
              {formData.eventDate && (
                <small className={styles.dateDebug}>
                  Data selecionada: {formatDateForDisplay(formData.eventDate)}
                </small>
              )}
              {errors.eventDate && <span className={styles.errorText}>{errors.eventDate}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Horário Início *</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className={styles.formInput}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Horário Término *</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                className={styles.formInput}
              />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nº de Convidados *</label>
              <input
                type="number"
                value={formData.guestCount}
                onChange={(e) => handleInputChange('guestCount', Number(e.target.value))}
                className={`${styles.formInput} ${errors.guestCount ? styles.error : ''}`}
                min="1"
              />
              {errors.guestCount && <span className={styles.errorText}>{errors.guestCount}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tipo de Evento *</label>
              <select
                value={formData.eventType}
                onChange={(e) => handleInputChange('eventType', e.target.value)}
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

          {/* ✅ CORREÇÃO: Inputs de valor monetário */}
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Valor Total (R$) *</label>
              <input
                type="text"
                value={displayCurrencyValue(formData.totalValue)}
                onChange={(e) => handleCurrencyInputChange('totalValue', e.target.value)}
                className={`${styles.formInput} ${errors.totalValue ? styles.error : ''}`}
                placeholder="0,00"
                onFocus={(e) => {
                  // Seleciona todo o texto quando foca
                  e.target.select();
                }}
                onBlur={(e) => {
                  // Garante que o valor está formatado ao sair do campo
                  const formatted = displayCurrencyValue(formData.totalValue);
                  if (e.target.value !== formatted) {
                    e.target.value = formatted;
                  }
                }}
              />
              {errors.totalValue && <span className={styles.errorText}>{errors.totalValue}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Sinal (R$) *</label>
              <input
                type="text"
                value={displayCurrencyValue(formData.depositValue)}
                onChange={(e) => handleCurrencyInputChange('depositValue', e.target.value)}
                className={`${styles.formInput} ${errors.depositValue ? styles.error : ''}`}
                placeholder="0,00"
                onFocus={(e) => e.target.select()}
                onBlur={(e) => {
                  const formatted = displayCurrencyValue(formData.depositValue);
                  if (e.target.value !== formatted) {
                    e.target.value = formatted;
                  }
                }}
              />
              {errors.depositValue && <span className={styles.errorText}>{errors.depositValue}</span>}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className={styles.formTextarea}
              rows={3}
              placeholder="Detalhes adicionais sobre o evento..."
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={onCancel} className={styles.secondaryButton}>
              <i className="bi bi-x-circle"></i>
              Cancelar
            </button>
            <button type="submit" className={styles.primaryButton}>
              <i className={`bi ${editingEvent ? 'bi-check-lg' : 'bi-plus-lg'}`}></i>
              {editingEvent ? 'Salvar Alterações' : 'Criar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteConfirmationModalProps {
  event: Event;
  onConfirm: () => void;
  onCancel: () => void;
  formatDateForDisplay: (dateString: string) => string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  event,
  onConfirm,
  onCancel,
  formatDateForDisplay
}) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.deleteModal}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Confirmar Exclusão</h3>
          <button onClick={onCancel} className={styles.closeButton}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        
        <div className={styles.modalContent}>
          <div className={styles.warningIcon}>
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <p className={styles.warningText}>
            Tem certeza que deseja excluir o evento <strong>"{event.title}"</strong>?
          </p>
          <p className={styles.warningSubtext}>
            Data: {formatDateForDisplay(event.eventDate)}<br />
            Cliente: {event.client?.name || 'N/A'}<br />
            Esta ação não pode ser desfeita.
          </p>
        </div>

        <div className={styles.modalActions}>
          <button type="button" onClick={onCancel} className={styles.secondaryButton}>
            <i className="bi bi-x-circle"></i>
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} className={styles.dangerButton}>
            <i className="bi bi-trash"></i>
            Excluir Evento
          </button>
        </div>
      </div>
    </div>
  );
};