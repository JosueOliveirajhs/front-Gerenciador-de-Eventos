// src/hooks/useClientData.ts

import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { Event } from '../../../types/Event';
import { Payment } from '../../../types/Payment';
import { eventService } from '../../../services/events';
import { paymentService } from '../../../services/payments';

interface ClientStats {
  totalEvents: number;
  confirmedEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  quoteEvents: number;
  totalSpent: number;
  averageTicket: number;
  pendingPayments: number;
  paidPayments: number;
  overduePayments: number;
  firstEventDate: string | null;
  lastEventDate: string | null;
  favoriteEventType: string;
  eventsByType: Record<string, number>;
  monthlyAverage: number;
  paymentRate: number;
}

export const useClientData = (clientId: number) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ClientStats>({
    totalEvents: 0,
    confirmedEvents: 0,
    completedEvents: 0,
    cancelledEvents: 0,
    quoteEvents: 0,
    totalSpent: 0,
    averageTicket: 0,
    pendingPayments: 0,
    paidPayments: 0,
    overduePayments: 0,
    firstEventDate: null,
    lastEventDate: null,
    favoriteEventType: '',
    eventsByType: {},
    monthlyAverage: 0,
    paymentRate: 0
  });

  const loadClientData = useCallback(async () => {
    if (!clientId) return;
    
    try {
      setLoading(true);
      setError(null);

      console.log(`📊 Carregando dados do cliente ${clientId}...`);

      // Buscar eventos do cliente
      const clientEvents = await eventService.getEventsByClientId(clientId);
      setEvents(clientEvents);
      console.log(`✅ Eventos carregados: ${clientEvents.length}`);

      // Buscar pagamentos do cliente
      const clientPayments = await paymentService.getPaymentsByClientId(clientId);
      setPayments(clientPayments);
      console.log(`✅ Pagamentos carregados: ${clientPayments.length}`);

      // Calcular estatísticas
      calculateStats(clientEvents, clientPayments);

    } catch (err) {
      console.error('❌ Erro ao carregar dados do cliente:', err);
      setError('Erro ao carregar dados do cliente');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadClientData();
  }, [loadClientData]);

  const calculateStats = (clientEvents: Event[], clientPayments: Payment[]) => {
    // Estatísticas básicas
    const totalEvents = clientEvents.length;
    const confirmedEvents = clientEvents.filter(e => e.status === 'CONFIRMED').length;
    const completedEvents = clientEvents.filter(e => e.status === 'COMPLETED').length;
    const cancelledEvents = clientEvents.filter(e => e.status === 'CANCELLED').length;
    const quoteEvents = clientEvents.filter(e => e.status === 'QUOTE').length;

    // Valores financeiros
    const totalSpent = clientEvents
      .filter(e => e.status === 'CONFIRMED' || e.status === 'COMPLETED')
      .reduce((sum, e) => sum + (e.totalValue || 0), 0);
    
    const averageTicket = totalEvents > 0 ? totalSpent / totalEvents : 0;

    // Pagamentos
    const pendingPayments = clientPayments.filter(p => p.status === 'PENDING').length;
    const paidPayments = clientPayments.filter(p => p.status === 'PAID').length;
    const overduePayments = clientPayments.filter(p => 
      p.status === 'PENDING' && new Date(p.dueDate) < new Date()
    ).length;

    // Datas dos eventos
    const sortedEvents = [...clientEvents].sort((a, b) => 
      new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
    );
    
    const firstEventDate = sortedEvents.length > 0 ? sortedEvents[0].eventDate : null;
    const lastEventDate = sortedEvents.length > 0 ? sortedEvents[sortedEvents.length - 1].eventDate : null;

    // Tipo de evento favorito
    const eventsByType: Record<string, number> = {};
    clientEvents.forEach(e => {
      eventsByType[e.eventType] = (eventsByType[e.eventType] || 0) + 1;
    });
    
    const favoriteEventType = Object.entries(eventsByType)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    // Média mensal
    const firstDate = firstEventDate ? new Date(firstEventDate) : null;
    const lastDate = lastEventDate ? new Date(lastEventDate) : null;
    
    let monthlyAverage = 0;
    if (firstDate && lastDate && totalEvents > 0) {
      const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + 
                         (lastDate.getMonth() - firstDate.getMonth()) + 1;
      monthlyAverage = totalEvents / monthsDiff;
    }

    // Taxa de pagamento
    const paymentRate = clientPayments.length > 0 
      ? (paidPayments / clientPayments.length) * 100 
      : 0;

    setStats({
      totalEvents,
      confirmedEvents,
      completedEvents,
      cancelledEvents,
      quoteEvents,
      totalSpent,
      averageTicket,
      pendingPayments,
      paidPayments,
      overduePayments,
      firstEventDate,
      lastEventDate,
      favoriteEventType,
      eventsByType,
      monthlyAverage,
      paymentRate
    });

    console.log('📊 Estatísticas calculadas:', {
      totalEvents,
      confirmedEvents,
      completedEvents,
      totalSpent,
      monthlyAverage
    });
  };

  const refreshData = useCallback(() => {
    loadClientData();
  }, [loadClientData]);

  return {
    events,
    payments,
    stats,
    loading,
    error,
    refreshData
  };
};