// src/components/admin/events/EventManagement.tsx

import React, { useState, useEffect } from 'react';
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
    if (editingEvent) {
      await handleUpdateEvent(editingEvent.id, eventData);
    } else {
      await handleCreateEvent(eventData);
    }
    setShowForm(false);
    setEditingEvent(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  const handleDeleteConfirm = async (eventId: number) => {
    await handleDeleteEvent(eventId);
    setShowDeleteModal(null);
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
            QUOTE: '📝',
            CONFIRMED: '✅',
            COMPLETED: '🎉',
            CANCELLED: '❌'
          }[status])}
        />
      )}
    </div>
  );
};