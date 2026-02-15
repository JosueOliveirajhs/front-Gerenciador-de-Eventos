// src/components/admin/financial/FinancialReports.tsx

import React, { useState, useEffect } from 'react';
import { 
  FiRefreshCw, 
  FiCalendar, 
  FiDollarSign,
  FiCreditCard,
  FiClock,
  FiTarget,
  FiTrendingUp,
  FiPercent,
  FiChevronDown,
  FiChevronUp,
  FiInfo
} from 'react-icons/fi';
import { 
  MdAttachMoney, 
  MdPayment, 
  MdWarning,
  MdCheckCircle,
  MdCancel,
  MdEvent,
  MdPeople,
  MdDateRange,
  MdDescription,
  MdReceipt,
  MdMoneyOff
} from 'react-icons/md';
import { 
  FaMoneyBillWave, 
  FaChartLine, 
  FaChartPie,
  FaHandHoldingUsd 
} from 'react-icons/fa';
import { Event } from '../../types/Event';
import { Payment } from '../../types/Payment';
import { eventService } from '../../services/events';
import { paymentService } from '../../services/payments';
import styles from './FinancialReports.module.css';

interface Commission {
  id: number;
  eventId: number;
  eventTitle: string;
  sellerName: string;
  amount: number;
  percentage: number;
  status: 'PENDING' | 'PAID';
  dueDate: string;
}

export const FinancialReports: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissions, setCommissions] = useState<Commission[]>([]);

  useEffect(() => {
    loadFinancialData();
  }, [selectedMonth]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('💰 Carregando dados financeiros...');
      
      const [eventsData, paymentsData] = await Promise.all([
        eventService.getAllEvents(),
        paymentService.findAllPayments()
      ]);
      
      setEvents(eventsData);
      setPayments(paymentsData);
      
      console.log('✅ Dados carregados:', {
        eventos: eventsData.length,
        pagamentos: paymentsData.length
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados financeiros:', error);
      
      try {
        console.log('🔄 Tentando carregar apenas eventos...');
        const eventsData = await eventService.getAllEvents();
        setEvents(eventsData);
        setPayments([]);
        console.log('✅ Eventos carregados, pagamentos em fallback');
      } catch (fallbackError) {
        setError('Erro ao carregar dados financeiros. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return 'Data inválida';
    
    try {
      const date = new Date(dateString + 'T12:00:00-03:00');
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

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
    
    return revenue;
  };

  const getPendingPayments = () => {
    const pendingPayments = payments.filter(payment => {
      const event = events.find(e => e.id === payment.eventId);
      return event && isEventInSelectedMonth(event) && payment.status === 'PENDING';
    });
    
    return pendingPayments.length;
  };

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

  const getRecentPayments = () => {
    const monthPayments = payments.filter(payment => {
      const event = events.find(e => e.id === payment.eventId);
      return event && isEventInSelectedMonth(event);
    });
    
    return monthPayments
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
      .slice(0, 10);
  };

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

  const getOverduePayments = () => {
    const today = new Date();
    const overduePayments = payments.filter(payment => {
      const event = events.find(e => e.id === payment.eventId);
      const isOverdue = new Date(payment.dueDate) < today;
      return event && isEventInSelectedMonth(event) && payment.status === 'PENDING' && isOverdue;
    });
    
    return overduePayments.length;
  };

  const calculateCommissions = (): Commission[] => {
    const commissionsList: Commission[] = [];
    
    events.forEach(event => {
      if (event.status === 'COMPLETED' && isEventInSelectedMonth(event)) {
        const value = typeof event.totalValue === 'string' 
          ? parseFloat(event.totalValue) 
          : event.totalValue;
        
        const sellerName = event.client?.name || 'Vendedor Padrão';
        
        commissionsList.push({
          id: event.id,
          eventId: event.id,
          eventTitle: event.title,
          sellerName,
          amount: value * 0.1, // 10% de comissão
          percentage: 10,
          status: 'PENDING',
          dueDate: new Date(new Date(event.eventDate).setDate(new Date(event.eventDate).getDate() + 30)).toISOString()
        });
      }
    });
    
    return commissionsList;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

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
        <MdWarning className={styles.errorIcon} size={48} />
        <h3>Erro ao carregar relatórios</h3>
        <p>{error}</p>
        <button onClick={loadFinancialData} className={styles.retryButton}>
          <FiRefreshCw size={18} />
          Tentar Novamente
        </button>
      </div>
    );
  }

  const stats = getDetailedStats();
  const revenueForecast = getRevenueForecast();
  const overduePayments = getOverduePayments();
  const commissionsList = calculateCommissions();

  return (
    <div className={styles.financialReports}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>
            <MdAttachMoney size={32} />
            Relatórios Financeiros
          </h1>
          <div className={styles.monthSelector}>
            <label className={styles.selectorLabel}>
              <FiCalendar size={16} />
              Período:
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={styles.monthInput}
            />
            <button onClick={loadFinancialData} className={styles.refreshButton}>
              <FiRefreshCw size={16} />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas Financeiras */}
      <div className={styles.financialStats}>
        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statIcon}>
            <FaMoneyBillWave size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Receita do Mês</h3>
            <p className={`${styles.statNumber} ${styles.revenue}`}>
              {formatCurrency(getMonthlyRevenue())}
            </p>
            <div className={styles.statBreakdown}>
              <span>
                <MdEvent size={12} /> {stats.completedEvents} eventos realizados
              </span>
              <span>
                <FiTarget size={12} /> +{formatCurrency(revenueForecast)} previstos
              </span>
            </div>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statIcon}>
            <MdPayment size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Total Recebido</h3>
            <p className={`${styles.statNumber} ${styles.paid}`}>
              {formatCurrency(getPaidAmount())}
            </p>
            <div className={styles.statBreakdown}>
              <span>
                <MdCheckCircle size={12} /> {stats.paidPayments} pagamentos
              </span>
              <span>
                <FiTrendingUp size={12} /> {(stats.totalPayments > 0 ? (stats.paidPayments / stats.totalPayments * 100).toFixed(0) : 0)}% concluídos
              </span>
            </div>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statIcon}>
            <FiClock size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Pagamentos Pendentes</h3>
            <p className={`${styles.statNumber} ${styles.pending}`}>
              {getPendingPayments()}
            </p>
            <div className={styles.statBreakdown}>
              <span>
                <MdWarning size={12} /> {overduePayments} em atraso
              </span>
              <span>
                <MdReceipt size={12} /> {stats.pendingPayments} totais
              </span>
            </div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statIcon}>
            <FiTarget size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Previsão de Receita</h3>
            <p className={`${styles.statNumber} ${styles.forecast}`}>
              {formatCurrency(revenueForecast)}
            </p>
            <div className={styles.statBreakdown}>
              <span>
                <MdEvent size={12} /> {stats.confirmedEvents} eventos confirmados
              </span>
              <span>
                <FaChartLine size={12} /> {stats.totalEvents} totais no mês
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo do Mês */}
      <div className={`${styles.monthSummary} ${styles.card}`}>
        <h3 className={styles.summaryTitle}>
          <FaChartPie size={18} />
          Resumo do Mês - {selectedMonth}
        </h3>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>
              <MdEvent size={14} /> Eventos Totais
            </span>
            <span className={styles.summaryValue}>{stats.totalEvents}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>
              <MdCheckCircle size={14} /> Confirmados
            </span>
            <span className={styles.summaryValue}>{stats.confirmedEvents}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>
              <FaHandHoldingUsd size={14} /> Realizados
            </span>
            <span className={styles.summaryValue}>{stats.completedEvents}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>
              <MdPayment size={14} /> Pagamentos
            </span>
            <span className={styles.summaryValue}>{stats.totalPayments}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>
              <FiPercent size={14} /> Taxa de Conclusão
            </span>
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
            <MdPayment size={20} />
            Pagamentos do Mês 
            {payments.length === 0 && ' (Modo Fallback - Apenas Eventos)'}
          </h2>
          <span className={styles.sectionBadge}>{getRecentPayments().length}</span>
        </div>

        {getRecentPayments().length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              {payments.length === 0 ? <FaChartLine size={48} /> : <MdMoneyOff size={48} />}
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
              <FiRefreshCw size={16} />
              Tentar Novamente
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
                          <MdPeople size={14} />
                          {event?.client?.name || '-'}
                        </div>
                      </td>
                      <td>
                        <div className={styles.valueCell}>
                          <FiDollarSign size={14} />
                          {formatCurrency(typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount)}
                        </div>
                      </td>
                      <td>
                        <div className={`${styles.dateCell} ${isOverdue ? styles.overdueDate : ''}`}>
                          <MdDateRange size={14} />
                          {formatDateForDisplay(payment.dueDate)}
                          {isOverdue && (
                            <span className={styles.overdueBadge}>
                              <MdWarning size={12} /> ATRASADO
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[payment.status.toLowerCase()]}`}>
                          {payment.status === 'PENDING' ? (
                            <><FiClock size={12} /> Pendente</>
                          ) : payment.status === 'PAID' ? (
                            <><MdCheckCircle size={12} /> Pago</>
                          ) : (
                            <><MdWarning size={12} /> Atrasado</>
                          )}
                        </span>
                      </td>
                      <td>
                        <div className={styles.methodCell}>
                          <FiCreditCard size={14} />
                          {payment.paymentMethod || '-'}
                        </div>
                      </td>
                      <td>
                        <div className={styles.descriptionCell}>
                          <MdDescription size={14} />
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

      {/* Seção de Comissões */}
      <div className={`${styles.commissionsSection} ${styles.card}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <FaHandHoldingUsd size={20} />
            Comissões a Pagar
          </h2>
          <button 
            onClick={() => setShowCommissionModal(!showCommissionModal)}
            className={styles.secondaryButton}
          >
            {showCommissionModal ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
            {showCommissionModal ? 'Ocultar' : 'Calcular Comissões'}
          </button>
        </div>

        {showCommissionModal && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Vendedor</th>
                  <th>Valor do Evento</th>
                  <th>%</th>
                  <th>Comissão</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {commissionsList.map(comm => {
                  const event = events.find(e => e.id === comm.eventId);
                  return (
                    <tr key={comm.id}>
                      <td>
                        <strong>{comm.eventTitle}</strong>
                      </td>
                      <td>
                        <MdPeople size={14} />
                        {comm.sellerName}
                      </td>
                      <td className={styles.valueCell}>
                        {formatCurrency(event ? (typeof event.totalValue === 'string' ? parseFloat(event.totalValue) : event.totalValue) : 0)}
                      </td>
                      <td>
                        <FiPercent size={14} />
                        {comm.percentage}%
                      </td>
                      <td className={styles.revenue}>
                        <strong>{formatCurrency(comm.amount)}</strong>
                      </td>
                      <td>
                        <MdDateRange size={14} />
                        {new Date(comm.dueDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[comm.status.toLowerCase()]}`}>
                          {comm.status === 'PENDING' ? (
                            <><FiClock size={12} /> Pendente</>
                          ) : (
                            <><MdCheckCircle size={12} /> Pago</>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {commissionsList.length === 0 && (
                  <tr>
                    <td colSpan={7} className={styles.emptyTableCell}>
                      <FiInfo size={16} />
                      Nenhuma comissão calculada para o período
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className={styles.debugInfo}>
        <details>
          <summary>
            <FiInfo size={16} />
            Informações de Debug
          </summary>
          <div className={styles.debugContent}>
            <p><strong>Mês Selecionado:</strong> {selectedMonth}</p>
            <p><strong>Total de Eventos:</strong> {events.length}</p>
            <p><strong>Total de Pagamentos:</strong> {payments.length}</p>
            <p><strong>Eventos do Mês:</strong> {stats.totalEvents}</p>
            <p><strong>Pagamentos do Mês:</strong> {getRecentPayments().length}</p>
            <p><strong>Comissões Calculadas:</strong> {commissionsList.length}</p>
          </div>
        </details>
      </div>
    </div>
  );
};