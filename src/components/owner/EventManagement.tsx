import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, 
  FiList, 
  FiPlus,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import { 
  MdEvent, 
  MdPeople,
  MdWarning 
} from 'react-icons/md';
import { Event } from '../../types/Event';
import { User } from '../../types/User';
import { eventService } from '../../services/events';
import { userService } from '../../services/users';
import { EventStats } from './events/EventStats';
import { EventToolbar } from './events/EventToolbar';
import { EventCalendar } from './events/EventCalendar';
import { EventList } from './events/EventList';
import { EventForm } from './events/EventForm';
import { DeleteConfirmationModal } from './events/DeleteConfirmationModal';
import { ConfirmationModal } from '../common/Alerts/ConfirmationModal'; // ✅ IMPORT CORRETO
import { useEvents } from './hooks/useEvents';
import styles from './EventManagement.module.css';

export const EventManagement: React.FC = () => {
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterClient, setFilterClient] = useState<number | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para modal de sucesso
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successType, setSuccessType] = useState<'create' | 'update' | 'delete'>('create');

  const {
    events,
    stats,
    loadData,
    handleCreateEvent,
    handleUpdateEvent,
    handleUpdateEventStatus,
    handleDeleteEvent,
    formatDateForInput,
    formatDateForDisplay,
    formatDateTimeForDisplay,
    formatCurrency,
    getFilteredEvents,
    getEventsForDate
  } = useEvents();

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadClients = async () => {
    try {
      const clientsData = await userService.getAllClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (event: Event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleFormSubmit = async (eventData: any) => {
    try {
      if (editingEvent) {
        await handleUpdateEvent(editingEvent.id, eventData);
        setSuccessMessage(`Evento "${editingEvent.title}" atualizado com sucesso!`);
        setSuccessType('update');
      } else {
        await handleCreateEvent(eventData);
        setSuccessMessage('Evento criado com sucesso!');
        setSuccessType('create');
      }
      setShowSuccessModal(true);
      // Não fechar o formulário aqui - deixa o modal de sucesso decidir
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      alert('Erro ao salvar evento: ' + error);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  const handleDeleteConfirm = async (eventId: number) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      try {
        await handleDeleteEvent(eventId);
        setSuccessMessage(`Evento "${event.title}" excluído com sucesso!`);
        setSuccessType('delete');
        setShowSuccessModal(true);
      } catch (error) {
        console.error('Erro ao excluir evento:', error);
        alert('Erro ao excluir evento: ' + error);
      }
    }
    setShowDeleteModal(null);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    // Só fecha o formulário se não for uma exclusão (exclusão já fecha automaticamente)
    if (successType !== 'delete') {
      setShowForm(false);
      setEditingEvent(null);
    }
  };

  const filteredEvents = getFilteredEvents(filterStatus, filterClient, searchTerm);

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
      <EventStats stats={stats} selectedMonth={selectedMonth} formatCurrency={formatCurrency} />

      <EventToolbar
        viewMode={viewMode}
        onViewChange={setViewMode}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterClient={filterClient}
        onFilterClientChange={setFilterClient}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        clients={clients}
        onNewEvent={() => setShowForm(true)}
      />

      {showForm && (
        <EventForm
          clients={clients}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          editingEvent={editingEvent}
          formatDateForInput={formatDateForInput}
          formatDateForDisplay={formatDateForDisplay}
          existingEvents={events}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmationModal
          event={showDeleteModal}
          onConfirm={() => handleDeleteConfirm(showDeleteModal.id)}
          onCancel={() => setShowDeleteModal(null)}
          formatDateForDisplay={formatDateForDisplay}
        />
      )}

      {/* ✅ MODAL DE SUCESSO - Agora usando ConfirmationModal */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        title="Sucesso!"
        message={successMessage}
        type="success"
        onConfirm={handleSuccessClose}
        onCancel={handleSuccessClose}
        confirmText="OK"
      />

      {viewMode === 'calendar' ? (
        <div className={styles.calendarView}>
          <EventCalendar
            events={events}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onEventClick={(event) => {
              handleEditClick(event);
            }}
            formatCurrency={formatCurrency}
            getEventsForDate={getEventsForDate}
          />
        </div>
      ) : (
        <EventList
          events={filteredEvents}
          onEdit={handleEditClick}
          onDelete={(event) => setShowDeleteModal(event)}
          onStatusChange={handleUpdateEventStatus}
          formatDateForDisplay={formatDateForDisplay}
          formatCurrency={formatCurrency}
          getStatusVariant={(status) => ({
            QUOTE: 'quote',
            CONFIRMED: 'confirmed',
            COMPLETED: 'completed',
            CANCELLED: 'cancelled'
          }[status])}
          getStatusIcon={(status) => ({
            QUOTE: <FiAlertCircle size={16} />,
            CONFIRMED: <FiCheckCircle size={16} />,
            COMPLETED: <FiCheckCircle size={16} />,
            CANCELLED: <FiAlertCircle size={16} />
          }[status])}
        />
      )}
    </div>
  );
};