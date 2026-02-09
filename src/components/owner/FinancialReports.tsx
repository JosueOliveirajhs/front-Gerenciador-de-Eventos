import React, { useState, useEffect } from 'react';
import { Event } from '../../types/Event';
import { Payment } from '../../types/Payment';
import { eventService } from '../../services/events';
import { paymentService } from '../../services/payments';
import styles from './FinancialReports.module.css';

export const FinancialReports: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    loadFinancialData();
  }, [selectedMonth]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('💰 Carregando dados financeiros...');
      
      // ✅ CORREÇÃO: Usar métodos disponíveis do paymentService
      const [eventsData, paymentsData] = await Promise.all([
        eventService.getAllEvents(),
        paymentService.findAllPayments() // ✅ Método correto
      ]);
      
      setEvents(eventsData);
      setPayments(paymentsData);
      
      console.log('✅ Dados carregados:', {
        eventos: eventsData.length,
        pagamentos: paymentsData.length
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados financeiros:', error);
      
      // ✅ CORREÇÃO: Tentar carregar apenas eventos se pagamentos falharem
      try {
        console.log('🔄 Tentando carregar apenas eventos...');
        const eventsData = await eventService.getAllEvents();
        setEvents(eventsData);
        setPayments([]); // Pagamentos vazios
        console.log('✅ Eventos carregados, pagamentos em fallback');
      } catch (fallbackError) {
        setError('Erro ao carregar dados financeiros. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORREÇÃO: Função para corrigir problema de timezone nas datas
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

  // ✅ CORREÇÃO: Função para verificar se evento está no mês selecionado
  const isEventInSelectedMonth = (event: Event): boolean => {
    if (!event.eventDate) return false;
    
    try {
      const eventDate = new Date(event.eventDate + 'T12:00:00-03:00');
      const eventMonth = eventDate.toISOString().slice(0, 7);
      return eventMonth === selectedMonth;
    } catch (error) {
      console.error('Erro ao verificar data do evento:', error);
      return false;
    }
  };

  // ✅ CORREÇÃO: Calcular receita do mês
  const getMonthlyRevenue = () => {
    const monthEvents = events.filter(event => 
      isEventInSelectedMonth(event) && 
      (event.status === 'CONFIRMED' || event.status === 'COMPLETED')
    );
    
    const revenue = monthEvents.reduce((sum, event) => {
      const value = typeof event.totalValue === 'string' 
        ? parseFloat(event.totalValue) 
        : event.totalValue;
      return sum + (value || 0);
    }, 0);
    
    console.log('📊 Receita do mês:', {
      mes: selectedMonth,
      eventos: monthEvents.length,
      receita: revenue
    });
    
    return revenue;
  };

  // ✅ CORREÇÃO: Contar pagamentos pendentes do mês
  const getPendingPayments = () => {
    const pendingPayments = payments.filter(payment => {
      // Verificar se o pagamento pertence a um evento do mês selecionado
      const event = events.find(e => e.id === payment.eventId);
      return event && isEventInSelectedMonth(event) && payment.status === 'PENDING';
    });
    
    return pendingPayments.length;
  };

  // ✅ CORREÇÃO: Calcular total recebido no mês
  const getPaidAmount = () => {
    const paidPayments = payments.filter(payment => {
      const event = events.find(e => e.id === payment.eventId);
      return event && isEventInSelectedMonth(event) && payment.status === 'PAID';
    });
    
    const total = paidPayments.reduce((sum, payment) => {
      const amount = typeof payment.amount === 'string' 
        ? parseFloat(payment.amount) 
        : payment.amount;
      return sum + (amount || 0);
    }, 0);
    
    return total;
  };

  // ✅ CORREÇÃO: Buscar pagamentos recentes (do mês selecionado)
  const getRecentPayments = () => {
    const monthPayments = payments.filter(payment => {
      const event = events.find(e => e.id === payment.eventId);
      return event && isEventInSelectedMonth(event);
    });
    
    return monthPayments
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
      .slice(0, 10);
  };

  // ✅ NOVO: Calcular previsão de receita
  const getRevenueForecast = () => {
    const confirmedEvents = events.filter(event => 
      isEventInSelectedMonth(event) && event.status === 'CONFIRMED'
    );
    
    return confirmedEvents.reduce((sum, event) => {
      const value = typeof event.totalValue === 'string' 
        ? parseFloat(event.totalValue) 
        : event.totalValue;
      return sum + (value || 0);
    }, 0);
  };

  // ✅ NOVO: Calcular pagamentos em atraso
  const getOverduePayments = () => {
    const today = new Date();
    const overduePayments = payments.filter(payment => {
      const event = events.find(e => e.id === payment.eventId);
      const isOverdue = new Date(payment.dueDate) < today;
      return event && isEventInSelectedMonth(event) && payment.status === 'PENDING' && isOverdue;
    });
    
    return overduePayments.length;
  };

  // ✅ NOVO: Formatar valores monetários
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // ✅ NOVO: Obter estatísticas detalhadas
  const getDetailedStats = () => {
    const monthEvents = events.filter(event => isEventInSelectedMonth(event));
    const monthPayments = payments.filter(payment => {
      const event = events.find(e => e.id === payment.eventId);
      return event && isEventInSelectedMonth(event);
    });

    return {
      totalEvents: monthEvents.length,
      confirmedEvents: monthEvents.filter(e => e.status === 'CONFIRMED').length,
      completedEvents: monthEvents.filter(e => e.status === 'COMPLETED').length,
      totalPayments: monthPayments.length,
      paidPayments: monthPayments.filter(p => p.status === 'PAID').length,
      pendingPayments: monthPayments.filter(p => p.status === 'PENDING').length,
    };
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando relatórios financeiros...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <div className={styles.errorIcon}>⚠️</div>
        <h3>Erro ao carregar relatórios</h3>
        <p>{error}</p>
        <button onClick={loadFinancialData} className={styles.retryButton}>
          🔄 Tentar Novamente
        </button>
      </div>
    );
  }

  const stats = getDetailedStats();
  const revenueForecast = getRevenueForecast();
  const overduePayments = getOverduePayments();

  return (
    <div className={styles.financialReports}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Relatórios Financeiros</h1>
          <div className={styles.monthSelector}>
            <label className={styles.selectorLabel}>Período:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={styles.monthInput}
            />
            <button onClick={loadFinancialData} className={styles.refreshButton}>
              🔄 Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas Financeiras */}
      <div className={styles.financialStats}>
        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Receita do Mês</h3>
            <p className={`${styles.statNumber} ${styles.revenue}`}>
              {formatCurrency(getMonthlyRevenue())}
            </p>
            <div className={styles.statBreakdown}>
              <span>📊 {stats.completedEvents} eventos realizados</span>
              <span>🎯 +{formatCurrency(revenueForecast)} previstos</span>
            </div>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statIcon}>💳</div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Total Recebido</h3>
            <p className={`${styles.statNumber} ${styles.paid}`}>
              {formatCurrency(getPaidAmount())}
            </p>
            <div className={styles.statBreakdown}>
              <span>✅ {stats.paidPayments} pagamentos</span>
              <span>📈 {(stats.totalPayments > 0 ? (stats.paidPayments / stats.totalPayments * 100).toFixed(0) : 0)}% concluídos</span>
            </div>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statIcon}>⏳</div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Pagamentos Pendentes</h3>
            <p className={`${styles.statNumber} ${styles.pending}`}>
              {getPendingPayments()}
            </p>
            <div className={styles.statBreakdown}>
              <span>🚨 {overduePayments} em atraso</span>
              <span>📋 {stats.pendingPayments} totais</span>
            </div>
          </div>
        </div>

        {/* ✅ NOVO: Card de Previsão */}
        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Previsão de Receita</h3>
            <p className={`${styles.statNumber} ${styles.forecast}`}>
              {formatCurrency(revenueForecast)}
            </p>
            <div className={styles.statBreakdown}>
              <span>📅 {stats.confirmedEvents} eventos confirmados</span>
              <span>💼 {stats.totalEvents} totais no mês</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo do Mês */}
      <div className={`${styles.monthSummary} ${styles.card}`}>
        <h3 className={styles.summaryTitle}>Resumo do Mês - {selectedMonth}</h3>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Eventos Totais</span>
            <span className={styles.summaryValue}>{stats.totalEvents}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Confirmados</span>
            <span className={styles.summaryValue}>{stats.confirmedEvents}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Realizados</span>
            <span className={styles.summaryValue}>{stats.completedEvents}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Pagamentos</span>
            <span className={styles.summaryValue}>{stats.totalPayments}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Taxa de Conclusão</span>
            <span className={styles.summaryValue}>
              {stats.totalPayments > 0 ? (stats.paidPayments / stats.totalPayments * 100).toFixed(0) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Pagamentos Recentes */}
      <div className={`${styles.paymentsSection} ${styles.card}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Pagamentos do Mês 
            {payments.length === 0 && ' (Modo Fallback - Apenas Eventos)'}
          </h2>
          <span className={styles.sectionBadge}>{getRecentPayments().length}</span>
        </div>

        {getRecentPayments().length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              {payments.length === 0 ? '📊' : '💸'}
            </div>
            <h3 className={styles.emptyTitle}>
              {payments.length === 0 
                ? 'Dados de Pagamentos Não Disponíveis' 
                : 'Nenhum pagamento encontrado'}
            </h3>
            <p className={styles.emptyText}>
              {payments.length === 0 
                ? 'Os dados de pagamentos não puderam ser carregados. Mostrando apenas informações dos eventos.'
                : `Não há pagamentos registrados para ${selectedMonth}.`}
            </p>
            <button onClick={loadFinancialData} className={styles.retryButton}>
              🔄 Tentar Novamente
            </button>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Cliente</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th>Método</th>
                  <th>Descrição</th>
                </tr>
              </thead>
              <tbody>
                {getRecentPayments().map(payment => {
                  const event = events.find(e => e.id === payment.eventId);
                  const isOverdue = payment.status === 'PENDING' && new Date(payment.dueDate) < new Date();
                  
                  return (
                    <tr key={payment.id} className={isOverdue ? styles.overdueRow : ''}>
                      <td>
                        <div className={styles.eventCell}>
                          <strong>{event?.title || 'Evento não encontrado'}</strong>
                          {event && (
                            <small className={styles.eventType}>{event.eventType}</small>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.clientCell}>
                          {event?.client?.name || '-'}
                        </div>
                      </td>
                      <td>
                        <div className={styles.valueCell}>
                          {formatCurrency(typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount)}
                        </div>
                      </td>
                      <td>
                        <div className={`${styles.dateCell} ${isOverdue ? styles.overdueDate : ''}`}>
                          {formatDateForDisplay(payment.dueDate)}
                          {isOverdue && <span className={styles.overdueBadge}>ATRASADO</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[payment.status.toLowerCase()]}`}>
                          {payment.status === 'PENDING' ? 'Pendente' : 
                           payment.status === 'PAID' ? 'Pago' : 'Atrasado'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.methodCell}>
                          {payment.paymentMethod || '-'}
                        </div>
                      </td>
                      <td>
                        <div className={styles.descriptionCell}>
                          {payment.description || '-'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ✅ NOVO: Debug Info (remover em produção) */}
      <div className={styles.debugInfo}>
        <details>
          <summary>🔧 Informações de Debug</summary>
          <div className={styles.debugContent}>
            <p><strong>Mês Selecionado:</strong> {selectedMonth}</p>
            <p><strong>Total de Eventos:</strong> {events.length}</p>
            <p><strong>Total de Pagamentos:</strong> {payments.length}</p>
            <p><strong>Eventos do Mês:</strong> {stats.totalEvents}</p>
            <p><strong>Pagamentos do Mês:</strong> {getRecentPayments().length}</p>
            <p><strong>Status Pagamentos:</strong> {payments.length === 0 ? 'FALLBACK' : 'NORMAL'}</p>
          </div>
        </details>
      </div>
    </div>
  );
};