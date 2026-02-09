import React, { useState, useEffect } from 'react';
import { Event } from '../../types/Event';
import { Payment } from '../../types/Payment';
import { eventService } from '../../services/events';
import { paymentService } from '../../services/payments';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './ClientDashboard.module.css';

export const ClientDashboard: React.FC = () => {
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]); // TODOS os eventos do sistema
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando dados do cliente...');
      
      // Carregar eventos do cliente
      const myEventsData = await eventService.getMyEvents();
      console.log('✅ Meus eventos carregados:', myEventsData);
      setMyEvents(myEventsData);

      // Carregar TODOS os eventos do sistema para ver disponibilidade
      const allEventsData = await eventService.getAllEvents();
      console.log('✅ Todos os eventos carregados:', allEventsData);
      setAllEvents(allEventsData);

      // Carregar pagamentos
      const allPayments: Payment[] = [];
      for (const event of myEventsData) {
        try {
          const eventPayments = await paymentService.getEventPayments(event.id);
          allPayments.push(...eventPayments);
        } catch (error) {
          console.warn(`⚠️ Erro ao buscar pagamentos do evento ${event.id}:`, error);
        }
      }
      setPayments(allPayments);
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados do cliente:', error);
      setError('Erro ao carregar seus eventos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Estatísticas calculadas dos eventos do usuário
  const getStats = () => {
    const confirmedEvents = myEvents.filter(e => e.status === 'CONFIRMED').length;
    const pendingEvents = myEvents.filter(e => e.status === 'QUOTE').length;
    const totalSpent = myEvents
      .filter(e => e.status === 'CONFIRMED' || e.status === 'COMPLETED')
      .reduce((sum, event) => sum + (event.totalValue || 0), 0);
    
    const pendingPayments = payments.filter(p => p.status === 'PENDING').length;

    return {
      totalEvents: myEvents.length,
      confirmedEvents,
      pendingEvents,
      totalSpent,
      pendingPayments
    };
  };

  // Gerar calendário
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const calendar = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      calendar.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return calendar;
  };

  // Verificar se data tem eventos do USUÁRIO
  const hasUserEventsOnDate = (date: Date) => {
    return myEvents.some(event => {
      const eventDate = new Date(event.eventDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Verificar se data está ocupada por QUALQUER evento CONFIRMADO
  const isDateOccupied = (date: Date) => {
    return allEvents.some(event => {
      const eventDate = new Date(event.eventDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear() &&
        (event.status === 'CONFIRMED' || event.status === 'COMPLETED')
      );
    });
  };

  // Verificar disponibilidade da data
  const isDateAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    // Datas passadas não estão disponíveis
    if (checkDate < today) return false;
    
    // Verificar se já existe evento CONFIRMADO de QUALQUER usuário nesta data
    return !isDateOccupied(date);
  };

  // Navegação do calendário
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Quando selecionar uma data
  const handleDateSelect = (date: Date) => {
    if (isDateAvailable(date)) {
      setSelectedDate(date);
    }
  };

  // Navegar para nova reserva
  const handleNewBooking = () => {
    navigate('/new-booking');
  };

  // Navegar para reserva com data selecionada
  const handleBookWithDate = () => {
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      navigate('/new-booking', { 
        state: { 
          preSelectedDate: formattedDate
        } 
      });
    }
  };

  // Próximo evento do usuário
  const getNextEvent = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureEvents = myEvents
      .filter(event => {
        const eventDate = new Date(event.eventDate);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today && (event.status === 'CONFIRMED' || event.status === 'QUOTE');
      })
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    
    return futureEvents[0] || null;
  };

  // Eventos do mês atual do usuário
  const getCurrentMonthEvents = () => {
    return myEvents.filter(event => {
      const eventDate = new Date(event.eventDate);
      return (
        eventDate.getMonth() === currentMonth.getMonth() &&
        eventDate.getFullYear() === currentMonth.getFullYear()
      );
    });
  };

  // Eventos ocupados do mês (de todos os usuários)
  const getOccupiedDatesThisMonth = () => {
    const occupiedDates = new Set();
    
    allEvents
      .filter(event => event.status === 'CONFIRMED' || event.status === 'COMPLETED')
      .forEach(event => {
        const eventDate = new Date(event.eventDate);
        if (
          eventDate.getMonth() === currentMonth.getMonth() &&
          eventDate.getFullYear() === currentMonth.getFullYear()
        ) {
          occupiedDates.add(eventDate.getDate());
        }
      });
    
    return Array.from(occupiedDates);
  };

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Formatar hora
  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const stats = getStats();
  const nextEvent = getNextEvent();
  const calendar = generateCalendar();
  const currentMonthEvents = getCurrentMonthEvents();
  const occupiedDates = getOccupiedDatesThisMonth();
  const today = new Date();

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando seus eventos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.loading}>
        <div className={styles.emptyIcon}>❌</div>
        <p>{error}</p>
        <button 
          className={styles.newBookingBtn}
          onClick={loadClientData}
          style={{ width: 'auto', marginTop: '1rem' }}
        >
          🔄 Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.title}>Meu Espaço de Eventos</h1>
      
      {/* Cards de Estatísticas */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Meus Eventos</h3>
            <p className={styles.statNumber}>{stats.totalEvents}</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Confirmados</h3>
            <p className={styles.statNumber}>{stats.confirmedEvents}</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Total Investido</h3>
            <p className={`${styles.statNumber} ${styles.revenue}`}>
              {formatCurrency(stats.totalSpent)}
            </p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statIcon}>📅</div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Dias Ocupados</h3>
            <p className={styles.statNumber}>{occupiedDates.length}</p>
          </div>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        <div className={styles.mainContent}>
          {/* Calendário de Disponibilidade */}
          <div className={`${styles.card} ${styles.calendar}`}>
            <div className={styles.calendarHeader}>
              <h3>📅 Calendário de Disponibilidade</h3>
              <div className={styles.calendarNav}>
                <button onClick={prevMonth}>‹</button>
                <button onClick={() => setCurrentMonth(new Date())}>Hoje</button>
                <button onClick={nextMonth}>›</button>
              </div>
            </div>
            
            <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
              💚 Datas disponíveis • 🔴 Datas ocupadas • 🔵 Seus eventos
            </p>
            
            <div className={styles.calendarGrid}>
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className={styles.calendarDay}>
                  {day}
                </div>
              ))}
              
              {calendar.map(date => {
                const isToday = date.toDateString() === today.toDateString();
                const isAvailable = isDateAvailable(date);
                const isOccupied = isDateOccupied(date);
                const hasUserEvents = hasUserEventsOnDate(date);
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                
                let dateClass = styles.calendarDate;
                if (isToday) dateClass += ` ${styles.today}`;
                if (isAvailable) dateClass += ` ${styles.available}`;
                if (isOccupied) dateClass += ` ${styles.occupied}`;
                if (!isAvailable && !isOccupied) dateClass += ` ${styles.unavailable}`;
                if (date < today) dateClass += ` ${styles.past}`;
                if (isSelected) dateClass += ` ${styles.selected}`;
                if (!isCurrentMonth) dateClass += ` ${styles.otherMonth}`;
                
                return (
                  <div
                    key={date.toISOString()}
                    className={dateClass}
                    onClick={() => handleDateSelect(date)}
                    title={
                      isAvailable ? 'Data disponível para reserva' : 
                      isOccupied ? 'Data ocupada por outro evento' :
                      hasUserEvents ? 'Você tem evento nesta data (em análise)' : 
                      'Data indisponível'
                    }
                  >
                    {date.getDate()}
                    {/* Indicador de evento do usuário (mesmo que esteja ocupado) */}
                    {hasUserEvents && (
                      <span style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        fontSize: '0.75rem',
                        color: isOccupied ? '#ffffff' : '#6366f1'
                      }}>
                        •
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legenda Detalhada */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.5rem',
              marginTop: '1rem',
              fontSize: '0.75rem',
              color: '#64748b'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ width: '12px', height: '12px', background: '#d1fae5', borderRadius: '2px' }}></div>
                Disponível
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ width: '12px', height: '12px', background: '#fecaca', borderRadius: '2px' }}></div>
                Ocupado
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ width: '12px', height: '12px', background: '#6366f1', borderRadius: '2px' }}></div>
                Hoje
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  background: 'transparent', 
                  borderRadius: '2px',
                  border: '1px solid #6366f1',
                  position: 'relative'
                }}>
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    fontSize: '0.5rem',
                    color: '#6366f1'
                  }}>•</span>
                </div>
                Meu evento
              </div>
            </div>

            {/* Botão de Nova Reserva */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button 
                className={styles.newBookingBtn}
                onClick={handleNewBooking}
              >
                📝 Nova Reserva
              </button>
              
              {selectedDate && isDateAvailable(selectedDate) && (
                <button 
                  className={styles.newBookingBtn}
                  onClick={handleBookWithDate}
                  style={{ 
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    flex: 1
                  }}
                >
                  🗓️ Reservar {formatDate(selectedDate.toISOString())}
                </button>
              )}
            </div>
          </div>

          {/* Meus Eventos */}
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>🎉 Meus Eventos</h3>
              <span style={{ 
                background: '#f1f5f9', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '20px', 
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#64748b'
              }}>
                {myEvents.length} evento{myEvents.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {myEvents.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📅</div>
                <p className={styles.emptyText}>Você ainda não tem eventos.</p>
                <p className={styles.emptyText} style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Faça sua primeira reserva!
                </p>
                <button 
                  className={styles.newBookingBtn}
                  onClick={handleNewBooking}
                  style={{ marginTop: '1rem', width: 'auto' }}
                >
                  📝 Fazer Primeira Reserva
                </button>
              </div>
            ) : (
              <div className={styles.eventsList}>
                {myEvents
                  .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
                  .slice(0, 5)
                  .map(event => (
                  <div key={event.id} className={styles.eventCard}>
                    <div className={styles.eventHeader}>
                      <h4>{event.title}</h4>
                      <span className={`${styles.status} ${styles[event.status.toLowerCase()]}`}>
                        {event.status === 'QUOTE' ? 'Em Cotação' :
                         event.status === 'CONFIRMED' ? 'Confirmado' :
                         event.status === 'COMPLETED' ? 'Realizado' : 'Cancelado'}
                      </span>
                    </div>
                    <div className={styles.eventDetailsGrid}>
                      <div className={styles.eventDetailItem}>
                        <span>📅</span>
                        {formatDate(event.eventDate)}
                      </div>
                      <div className={styles.eventDetailItem}>
                        <span>⏰</span>
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </div>
                      <div className={styles.eventDetailItem}>
                        <span>👥</span>
                        {event.guestCount} convidados
                      </div>
                      {event.totalValue && event.totalValue > 0 && (
                        <div className={styles.eventDetailItem}>
                          <span>💰</span>
                          {formatCurrency(event.totalValue)}
                        </div>
                      )}
                    </div>
                    {event.notes && (
                      <p className={styles.eventNotes}>{event.notes}</p>
                    )}
                    {event.status === 'QUOTE' && (
                      <div style={{ 
                        marginTop: '0.5rem', 
                        padding: '0.5rem', 
                        background: '#fffbeb', 
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        color: '#d97706'
                      }}>
                        ⏳ Aguardando confirmação da equipe
                      </div>
                    )}
                  </div>
                ))}
                
                {myEvents.length > 5 && (
                  <button 
                    className={styles.quickActionBtn}
                    onClick={() => navigate('/my-events')}
                    style={{ marginTop: '1rem' }}
                  >
                    📋 Ver todos os {myEvents.length} eventos
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.sidebar}>
          {/* Próximo Evento */}
          {nextEvent ? (
            <div className={styles.card}>
              <h3>⏭️ Próximo Evento</h3>
              <div style={{ 
                padding: '1rem', 
                background: nextEvent.status === 'CONFIRMED' ? '#f0fdf4' : '#fffbeb', 
                borderRadius: '8px',
                border: `1px solid ${nextEvent.status === 'CONFIRMED' ? '#d1fae5' : '#fef3c7'}`
              }}>
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: nextEvent.status === 'CONFIRMED' ? '#059669' : '#d97706',
                  fontSize: '1rem'
                }}>
                  {nextEvent.title}
                </h4>
                <p style={{ margin: '0.25rem 0', color: '#64748b', fontSize: '0.875rem' }}>
                  <strong>📅 Data:</strong> {formatDate(nextEvent.eventDate)}
                </p>
                <p style={{ margin: '0.25rem 0', color: '#64748b', fontSize: '0.875rem' }}>
                  <strong>⏰ Horário:</strong> {formatTime(nextEvent.startTime)} às {formatTime(nextEvent.endTime)}
                </p>
                <p style={{ margin: '0.25rem 0', color: '#64748b', fontSize: '0.875rem' }}>
                  <strong>🎯 Status:</strong> 
                  <span style={{ 
                    color: nextEvent.status === 'CONFIRMED' ? '#059669' : '#d97706',
                    fontWeight: '600',
                    marginLeft: '0.25rem'
                  }}>
                    {nextEvent.status === 'CONFIRMED' ? 'Confirmado' : 'Em Cotação'}
                  </span>
                </p>
                {nextEvent.totalValue && nextEvent.totalValue > 0 && (
                  <p style={{ margin: '0.25rem 0', color: '#64748b', fontSize: '0.875rem' }}>
                    <strong>💰 Valor:</strong> {formatCurrency(nextEvent.totalValue)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.card}>
              <h3>⏭️ Próximo Evento</h3>
              <div style={{ 
                padding: '1.5rem', 
                background: '#f8fafc', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                  Nenhum evento agendado
                </p>
              </div>
            </div>
          )}

          {/* Eventos Ocupados Este Mês */}
          <div className={styles.card}>
            <h3>🚫 Dias Ocupados em {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
            {occupiedDates.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem', fontSize: '0.875rem' }}>
                Nenhum dia ocupado este mês 🎉
              </p>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '0.5rem',
                padding: '0.5rem'
              }}>
                {occupiedDates.sort((a, b) => a - b).map(day => (
                  <div key={day} style={{
                    width: '32px',
                    height: '32px',
                    background: '#fecaca',
                    color: '#dc2626',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {day}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ações Rápidas */}
          <div className={styles.card}>
            <h3>🚀 Ações Rápidas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                className={styles.quickActionBtn}
                onClick={handleNewBooking}
              >
                📝 Nova Reserva
              </button>
              <button 
                className={styles.quickActionBtn}
                onClick={() => navigate('/my-events')}
              >
                📋 Ver Meus Eventos
              </button>
              <button 
                className={styles.quickActionBtn}
                onClick={() => navigate('/payments')}
              >
                💰 Meus Pagamentos
              </button>
              <button 
                className={styles.quickActionBtn}
                onClick={loadClientData}
              >
                🔄 Atualizar Dados
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};