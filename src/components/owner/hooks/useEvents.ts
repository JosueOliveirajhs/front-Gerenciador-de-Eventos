// src/components/admin/events/hooks/useEvents.ts

import { useState, useCallback } from 'react';
import { Event, CreateEventData } from '../../../types/Event';
import { eventService } from '../../../services/events';

interface EventStats {
  monthEvents: number;
  monthRevenue: number;
  confirmedEvents: number;
  pendingPayments: number;
  totalEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  quoteEvents: number;
}

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats>({
    monthEvents: 0,
    monthRevenue: 0,
    confirmedEvents: 0,
    pendingPayments: 0,
    totalEvents: 0,
    completedEvents: 0,
    cancelledEvents: 0,
    quoteEvents: 0
  });

  const loadData = useCallback(async () => {
    try {
      const eventsData = await eventService.getAllEvents();
      setEvents(eventsData);
      calculateStats(eventsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }, []);

  const calculateStats = (eventsData: Event[], selectedMonth?: string) => {
    const month = selectedMonth || new Date().toISOString().slice(0, 7);
    
    const monthEvents = eventsData.filter(event => 
      event.eventDate.startsWith(month) && event.status !== 'CANCELLED'
    );

    const monthRevenue = monthEvents.reduce((sum, event) => 
      sum + (typeof event.totalValue === 'string' ? parseFloat(event.totalValue) : event.totalValue), 0
    );

    const confirmedEvents = eventsData.filter(e => e.status === 'CONFIRMED').length;
    const completedEvents = eventsData.filter(e => e.status === 'COMPLETED').length;
    const cancelledEvents = eventsData.filter(e => e.status === 'CANCELLED').length;
    const quoteEvents = eventsData.filter(e => e.status === 'QUOTE').length;
    
    const pendingPayments = eventsData.filter(e => 
      e.status === 'CONFIRMED' && 
      (typeof e.depositValue === 'string' ? parseFloat(e.depositValue) : e.depositValue) < 
      (typeof e.totalValue === 'string' ? parseFloat(e.totalValue) : e.totalValue)
    ).length;

    setStats({
      monthEvents: monthEvents.length,
      monthRevenue,
      confirmedEvents,
      pendingPayments,
      totalEvents: eventsData.length,
      completedEvents,
      cancelledEvents,
      quoteEvents
    });
  };

  const handleCreateEvent = async (eventData: CreateEventData) => {
    try {
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
      
      const newEvent = await eventService.createEvent(formattedData);
      setEvents(prev => [...prev, newEvent]);
      calculateStats([...events, newEvent]);
      return newEvent;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
  };

  const handleUpdateEvent = async (id: number, eventData: CreateEventData) => {
    try {
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
      
      const updatedEvent = await eventService.updateEvent(id, formattedData);
      setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event));
      calculateStats(events.map(event => event.id === id ? updatedEvent : event));
      return updatedEvent;
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    }
  };

  const handleUpdateEventStatus = async (id: number, status: Event['status']) => {
    try {
      setEvents(prev => prev.map(event => 
        event.id === id ? { ...event, status } : event
      ));
      
      const updatedEvent = await eventService.updateEventStatus(id, status);
      setEvents(prev => prev.map(event => 
        event.id === id ? updatedEvent : event
      ));
      calculateStats(events.map(event => event.id === id ? updatedEvent : event));
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      await loadData();
    }
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      await eventService.deleteEvent(id);
      setEvents(prev => prev.filter(event => event.id !== id));
      calculateStats(events.filter(event => event.id !== id));
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      throw error;
    }
  };

  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return 'Data inválida';
    try {
      const date = new Date(dateString + 'T12:00:00-03:00');
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return 'Data inválida';
    }
  };

  const formatDateTimeForDisplay = (dateString: string, time: string): string => {
    try {
      const date = new Date(dateString + 'T12:00:00-03:00');
      return `${date.toLocaleDateString('pt-BR')} às ${time.substring(0, 5)}`;
    } catch (error) {
      return 'Data inválida';
    }
  };

  const formatCurrency = (value: string | number): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const getFilteredEvents = (status: string, clientId: number | 'ALL', search: string) => {
    return events.filter(event => {
      if (status !== 'ALL' && event.status !== status) return false;
      if (clientId !== 'ALL' && event.clientId !== clientId) return false;
      if (search) {
        const term = search.toLowerCase();
        return (
          event.title.toLowerCase().includes(term) ||
          event.client?.name?.toLowerCase().includes(term) ||
          event.eventType.toLowerCase().includes(term)
        );
      }
      return true;
    });
  };

  const getEventsForDate = (date: Date): Event[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.eventDate === dateStr);
  };

  return {
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
  };
};