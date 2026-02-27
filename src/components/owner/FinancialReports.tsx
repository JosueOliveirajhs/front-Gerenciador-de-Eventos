// src/components/admin/FinancialReports.tsx

import React, { useState, useEffect } from 'react';
import { 
  MdAttachMoney,
  MdWarning,
  MdAddCircle,
  MdEvent,
  MdReceipt,
  MdEdit,
  MdDelete,
  MdClose,
  MdRestaurant,
  MdLocalBar,
  MdPalette,
  MdCake,
  MdInventory,
  MdPeople,
  MdMoneyOff,
  MdCheckCircle,
  MdCancel
} from 'react-icons/md';
import { 
  FaMoneyBillWave, 
  FaChartLine, 
  FaChartPie,
  FaCrown,
  FaMusic,
  FaCamera,
  FaTruck,
  FaGift
} from 'react-icons/fa';
import { 
  FiRefreshCw, 
  FiCalendar, 
  FiPercent,
  FiTrendingUp,
  FiMoreVertical
} from 'react-icons/fi';
import { Event } from '../../types/Event';
import { eventService } from '../../services/events';
import styles from './FinancialReports.module.css';

// ============ TIPOS ============
interface Expense {
  id: string;
  eventId: number;
  eventTitle: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  supplier?: string;
  paymentMethod?: string;
  status: 'PENDING' | 'PAID';
}

interface EventFinancial {
  eventId: number;
  eventTitle: string;
  eventDate: string;
  clientName: string;
  revenue: number;
  expenses: Expense[];
  netProfit: number;
  profitMargin: number;
  status: string;
}

type PeriodType = 'MONTHLY' | 'QUARTERLY' | 'SEMESTERLY';

interface Category {
  id: string;
  name: string;
  icon: JSX.Element;
}

// ============ CONSTANTES ============
const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: 'Alimentação', icon: <MdRestaurant /> },
  { id: 'drinks', name: 'Bebidas', icon: <MdLocalBar /> },
  { id: 'decoration', name: 'Decoração', icon: <MdPalette /> },
  { id: 'music', name: 'Música/DJ', icon: <FaMusic /> },
  { id: 'photography', name: 'Fotografia', icon: <FaCamera /> },
  { id: 'furniture', name: 'Móveis', icon: <FaCrown /> },
  { id: 'cake', name: 'Bolo/Doces', icon: <MdCake /> },
  { id: 'staff', name: 'Equipe', icon: <MdPeople /> },
  { id: 'transport', name: 'Transporte', icon: <FaTruck /> },
  { id: 'gifts', name: 'Brindes', icon: <FaGift /> },
  { id: 'venue', name: 'Espaço', icon: <FaCrown /> },
  { id: 'marketing', name: 'Marketing', icon: <FiTrendingUp /> },
  { id: 'other', name: 'Outros', icon: <MdInventory /> }
];

// ============ UTILS ============
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'Data inválida';
  try {
    const date = new Date(dateString + 'T12:00:00-03:00');
    return date.toLocaleDateString('pt-BR');
  } catch {
    return 'Data inválida';
  }
};

const getPeriodLabel = (month: string, period: PeriodType): string => {
  const [year, monthNum] = month.split('-');
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  if (period === 'MONTHLY') {
    return `${months[parseInt(monthNum) - 1]} de ${year}`;
  } else if (period === 'QUARTERLY') {
    const quarter = Math.ceil(parseInt(monthNum) / 3);
    return `${quarter}º Trimestre de ${year}`;
  } else {
    const semester = parseInt(monthNum) <= 6 ? 1 : 2;
    return `${semester}º Semestre de ${year}`;
  }
};

const isEventInPeriod = (event: Event, month: string, period: PeriodType): boolean => {
  if (!event.eventDate) return false;
  
  try {
    const eventDate = new Date(event.eventDate + 'T12:00:00-03:00');
    const [year, monthNum] = month.split('-').map(Number);
    const eventYear = eventDate.getFullYear();
    const eventMonth = eventDate.getMonth() + 1;
    
    if (period === 'MONTHLY') {
      return eventYear === year && eventMonth === monthNum;
    } else if (period === 'QUARTERLY') {
      const quarter = Math.ceil(monthNum / 3);
      const eventQuarter = Math.ceil(eventMonth / 3);
      return eventYear === year && eventQuarter === quarter;
    } else {
      const semester = monthNum <= 6 ? 1 : 2;
      const eventSemester = eventMonth <= 6 ? 1 : 2;
      return eventYear === year && eventSemester === semester;
    }
  } catch {
    return false;
  }
};

// ============ COMPONENTE PRINCIPAL ============
export const FinancialReports: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('MONTHLY');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventFinancial | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
    loadExpenses();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const eventsData = await eventService.getAllEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      setError('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = () => {
    const saved = localStorage.getItem('event_expenses');
    if (saved) {
      setExpenses(JSON.parse(saved));
    }
  };

  const saveExpenses = (newExpenses: Expense[]) => {
    localStorage.setItem('event_expenses', JSON.stringify(newExpenses));
    setExpenses(newExpenses);
  };

  // CRUD de despesas
  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = { ...expense, id: Date.now().toString() };
    saveExpenses([...expenses, newExpense]);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    const updated = expenses.map(exp => 
      exp.id === id ? { ...exp, ...updates } : exp
    );
    saveExpenses(updated);
  };

  const deleteExpense = (id: string) => {
    if (window.confirm('Excluir esta despesa?')) {
      saveExpenses(expenses.filter(exp => exp.id !== id));
    }
  };

  // Filtrar eventos do período
  const eventsInPeriod = events.filter(event => 
    isEventInPeriod(event, selectedMonth, selectedPeriod) && 
    (event.status === 'CONFIRMED' || event.status === 'COMPLETED')
  );

  const eventIdsInPeriod = eventsInPeriod.map(e => e.id);

  // Despesas do período
  const expensesInPeriod = expenses.filter(exp => 
    eventIdsInPeriod.includes(exp.eventId)
  );

  // Cálculos financeiros
  const totalRevenue = eventsInPeriod.reduce((sum, event) => {
    const value = typeof event.totalValue === 'string' 
      ? parseFloat(event.totalValue) 
      : event.totalValue || 0;
    return sum + value;
  }, 0);

  const totalExpenses = expensesInPeriod.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Despesas por categoria
  const expensesByCategory = expensesInPeriod.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  // Dados financeiros por evento
  const eventFinancials: EventFinancial[] = eventsInPeriod.map(event => {
    const eventExpenses = expenses.filter(exp => exp.eventId === event.id);
    const revenue = typeof event.totalValue === 'string' 
      ? parseFloat(event.totalValue) 
      : event.totalValue || 0;
    const totalEventExpenses = eventExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netEventProfit = revenue - totalEventExpenses;
    
    return {
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.eventDate,
      clientName: event.client?.name || 'Cliente não informado',
      revenue,
      expenses: eventExpenses,
      netProfit: netEventProfit,
      profitMargin: revenue > 0 ? (netEventProfit / revenue) * 100 : 0,
      status: event.status
    };
  }).sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  // Handlers
  const handleAddExpense = () => {
    setEditingExpense(null);
    setShowExpenseModal(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowExpenseModal(true);
  };

  const handleSaveExpense = (formData: FormData) => {
    const expenseData = {
      eventId: parseInt(formData.get('eventId') as string),
      eventTitle: events.find(e => e.id === parseInt(formData.get('eventId') as string))?.title || '',
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string),
      date: formData.get('date') as string,
      supplier: formData.get('supplier') as string,
      paymentMethod: formData.get('paymentMethod') as string,
      status: formData.get('status') as 'PENDING' | 'PAID'
    };

    if (editingExpense) {
      updateExpense(editingExpense.id, expenseData);
    } else {
      addExpense(expenseData);
    }
    
    setShowExpenseModal(false);
    setEditingExpense(null);
  };

  const handleViewEventExpenses = (event: EventFinancial) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
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
        <MdWarning size={48} className={styles.errorIcon} />
        <h3>Erro ao carregar</h3>
        <p>{error}</p>
        <button onClick={loadData} className={styles.retryButton}>
          <FiRefreshCw size={18} />
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className={styles.financialReports}>
      {/* Cabeçalho */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>
            <MdAttachMoney size={32} />
            Relatórios Financeiros
          </h1>
          
          <div className={styles.periodControls}>
            <div className={styles.periodSelector}>
              <label className={styles.selectorLabel}>
                <FiCalendar size={16} />
                Período:
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as PeriodType)}
                className={styles.periodSelect}
              >
                <option value="MONTHLY">Mensal</option>
                <option value="QUARTERLY">Trimestral</option>
                <option value="SEMESTERLY">Semestral</option>
              </select>
            </div>
            
            <div className={styles.monthSelector}>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={styles.monthInput}
              />
              <button onClick={loadData} className={styles.refreshButton}>
                <FiRefreshCw size={16} />
                Atualizar
              </button>
            </div>
          </div>
        </div>
        
        <div className={styles.periodTitle}>
          <h2>{getPeriodLabel(selectedMonth, selectedPeriod)}</h2>
          <span className={styles.eventCount}>
            {eventsInPeriod.length} eventos
          </span>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className={styles.financialSummary}>
        <div className={`${styles.summaryCard} ${styles.revenueCard}`}>
          <div className={styles.cardIcon}>
            <FaMoneyBillWave />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Receita Total</span>
            <span className={styles.cardValue}>{formatCurrency(totalRevenue)}</span>
            <span className={styles.cardDetail}>
              {eventsInPeriod.length} eventos
            </span>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.expensesCard}`}>
          <div className={styles.cardIcon}>
            <MdMoneyOff />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Despesas Totais</span>
            <span className={styles.cardValue}>{formatCurrency(totalExpenses)}</span>
            <span className={styles.cardDetail}>
              {Object.keys(expensesByCategory).length} categorias
            </span>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.profitCard}`}>
          <div className={styles.cardIcon}>
            <FaChartLine />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Lucro Líquido</span>
            <span className={`${styles.cardValue} ${netProfit >= 0 ? styles.positive : styles.negative}`}>
              {formatCurrency(netProfit)}
            </span>
            <span className={styles.cardDetail}>
              Margem: {profitMargin.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.marginCard}`}>
          <div className={styles.cardIcon}>
            <FiPercent />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Margem de Lucro</span>
            <span className={`${styles.cardValue} ${
              profitMargin >= 20 ? styles.excellent : 
              profitMargin >= 10 ? styles.good : 
              styles.attention
            }`}>
              {profitMargin.toFixed(1)}%
            </span>
            <span className={styles.cardDetail}>
              {profitMargin >= 20 ? 'Excelente' : 
               profitMargin >= 10 ? 'Boa' : 
               profitMargin >= 0 ? 'Atenção' : 'Prejuízo'}
            </span>
          </div>
        </div>
      </div>

      {/* Despesas por Categoria */}
      <div className={`${styles.categorySection} ${styles.card}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <FaChartPie size={20} />
            Despesas por Categoria
          </h2>
          <button onClick={handleAddExpense} className={styles.primaryButton}>
            <MdAddCircle size={18} />
            Nova Despesa
          </button>
        </div>

        <div className={styles.categoryGrid}>
          {EXPENSE_CATEGORIES.map(category => {
            const amount = expensesByCategory[category.id] || 0;
            if (amount === 0) return null;
            
            const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
            
            return (
              <div key={category.id} className={styles.categoryItem}>
                <div className={styles.categoryIcon}>
                  {category.icon}
                </div>
                <div className={styles.categoryInfo}>
                  <span className={styles.categoryName}>{category.name}</span>
                  <span className={styles.categoryAmount}>{formatCurrency(amount)}</span>
                  <div className={styles.categoryBar}>
                    <div 
                      className={styles.categoryBarFill}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className={styles.categoryPercentage}>
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
          
          {Object.keys(expensesByCategory).length === 0 && (
            <div className={styles.emptyCategories}>
              <p>Nenhuma despesa no período</p>
              <button onClick={handleAddExpense} className={styles.secondaryButton}>
                <MdAddCircle size={16} />
                Adicionar despesa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Eventos */}
      <div className={`${styles.eventsSection} ${styles.card}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <MdEvent size={20} />
            Detalhamento por Evento
          </h2>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Receita</th>
                <th>Despesas</th>
                <th>Lucro</th>
                <th>Margem</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {eventFinancials.map(event => (
                <React.Fragment key={event.eventId}>
                  <tr>
                    <td className={styles.eventCell}>
                      <strong>{event.eventTitle}</strong>
                    </td>
                    <td>{formatDate(event.eventDate)}</td>
                    <td className={styles.clientCell}>
                      <MdPeople size={14} />
                      {event.clientName}
                    </td>
                    <td className={styles.valueCell}>
                      {formatCurrency(event.revenue)}
                    </td>
                    <td className={styles.valueCell}>
                      <button
                        onClick={() => handleViewEventExpenses(event)}
                        className={styles.expensesButton}
                      >
                        {formatCurrency(event.expenses.reduce((s, e) => s + e.amount, 0))}
                      </button>
                    </td>
                    <td className={`${styles.valueCell} ${event.netProfit >= 0 ? styles.positive : styles.negative}`}>
                      {formatCurrency(event.netProfit)}
                    </td>
                    <td>
                      <span className={`${styles.marginBadge} ${
                        event.profitMargin >= 20 ? styles.excellent : 
                        event.profitMargin >= 10 ? styles.good : 
                        styles.attention
                      }`}>
                        {event.profitMargin.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${
                        event.status === 'CONFIRMED' ? styles.confirmed :
                        event.status === 'COMPLETED' ? styles.completed :
                        event.status === 'QUOTE' ? styles.quote :
                        styles.cancelled
                      }`}>
                        {event.status === 'CONFIRMED' ? 'Confirmado' :
                         event.status === 'COMPLETED' ? 'Realizado' :
                         event.status === 'QUOTE' ? 'Orçamento' : 'Cancelado'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setExpandedEvent(
                          expandedEvent === event.eventId ? null : event.eventId
                        )}
                        className={styles.actionButton}
                      >
                        <FiMoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                  {expandedEvent === event.eventId && (
                    <tr className={styles.expandedRow}>
                      <td colSpan={9}>
                        <div className={styles.expandedContent}>
                          <h4>Últimas despesas</h4>
                          {event.expenses.length > 0 ? (
                            <div className={styles.expandedExpenses}>
                              {event.expenses.slice(0, 3).map(exp => (
                                <div key={exp.id} className={styles.expandedExpense}>
                                  <span className={styles.expenseCategory}>
                                    {EXPENSE_CATEGORIES.find(c => c.id === exp.category)?.icon}
                                    {exp.category}
                                  </span>
                                  <span>{exp.description}</span>
                                  <span className={styles.valueCell}>
                                    {formatCurrency(exp.amount)}
                                  </span>
                                  <span className={`${styles.statusBadge} ${
                                    exp.status === 'PAID' ? styles.paid : styles.pending
                                  }`}>
                                    {exp.status === 'PAID' ? 'Pago' : 'Pendente'}
                                  </span>
                                </div>
                              ))}
                              {event.expenses.length > 3 && (
                                <button
                                  onClick={() => handleViewEventExpenses(event)}
                                  className={styles.viewAllButton}
                                >
                                  Ver todas ({event.expenses.length})
                                </button>
                              )}
                            </div>
                          ) : (
                            <p>Nenhuma despesa</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {eventFinancials.length === 0 && (
                <tr>
                  <td colSpan={9} className={styles.emptyTableCell}>
                    Nenhum evento no período
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Despesas */}
      {showExpenseModal && (
        <div className={styles.modal} onClick={() => setShowExpenseModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                <MdAddCircle size={20} />
                {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
              </h3>
              <button 
                onClick={() => {
                  setShowExpenseModal(false);
                  setEditingExpense(null);
                }}
                className={styles.closeButton}
              >
                <MdClose size={20} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveExpense(new FormData(e.currentTarget));
            }}>
              <div className={styles.formGroup}>
                <label>Evento:</label>
                <select 
                  name="eventId" 
                  required
                  defaultValue={editingExpense?.eventId || ''}
                >
                  <option value="">Selecione</option>
                  {eventsInPeriod.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>Categoria:</label>
                <select 
                  name="category" 
                  required
                  defaultValue={editingExpense?.category || ''}
                >
                  <option value="">Selecione</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>Descrição:</label>
                <input 
                  type="text" 
                  name="description" 
                  required 
                  defaultValue={editingExpense?.description || ''}
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Valor (R$):</label>
                  <input 
                    type="number" 
                    name="amount" 
                    step="0.01" 
                    required 
                    defaultValue={editingExpense?.amount || ''}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Data:</label>
                  <input 
                    type="date" 
                    name="date" 
                    required 
                    defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Fornecedor:</label>
                  <input 
                    type="text" 
                    name="supplier" 
                    defaultValue={editingExpense?.supplier || ''}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Pagamento:</label>
                  <select name="paymentMethod" defaultValue={editingExpense?.paymentMethod || ''}>
                    <option value="">Selecione</option>
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                    <option value="CARTAO_DEBITO">Cartão de Débito</option>
                    <option value="PIX">PIX</option>
                    <option value="TRANSFERENCIA">Transferência</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>Status:</label>
                <select name="status" defaultValue={editingExpense?.status || 'PENDING'}>
                  <option value="PENDING">Pendente</option>
                  <option value="PAID">Pago</option>
                </select>
              </div>
              
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowExpenseModal(false);
                    setEditingExpense(null);
                  }}
                  className={styles.cancelButton}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.submitButton}>
                  {editingExpense ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedEvent && (
        <div className={styles.modal} onClick={() => setShowDetailsModal(false)}>
          <div className={`${styles.modalContent} ${styles.detailsModal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                <MdReceipt size={20} />
                Despesas: {selectedEvent.eventTitle}
              </h3>
              <button onClick={() => setShowDetailsModal(false)} className={styles.closeButton}>
                <MdClose size={20} />
              </button>
            </div>
            
            <div className={styles.detailsSummary}>
              <div className={styles.summaryItem}>
                <span>Total:</span>
                <strong>{formatCurrency(selectedEvent.expenses.reduce((s, e) => s + e.amount, 0))}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Despesas:</span>
                <strong>{selectedEvent.expenses.length}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Receita:</span>
                <strong>{formatCurrency(selectedEvent.revenue)}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Lucro:</span>
                <strong className={selectedEvent.netProfit >= 0 ? styles.positive : styles.negative}>
                  {formatCurrency(selectedEvent.netProfit)}
                </strong>
              </div>
            </div>
            
            <div className={styles.detailsList}>
              <table className={styles.detailsTable}>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Categoria</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEvent.expenses.map(expense => (
                    <tr key={expense.id}>
                      <td>{formatDate(expense.date)}</td>
                      <td>
                        <span className={styles.categoryBadge}>
                          {EXPENSE_CATEGORIES.find(c => c.id === expense.category)?.icon}
                          {expense.category}
                        </span>
                      </td>
                      <td>{expense.description}</td>
                      <td className={styles.valueCell}>{formatCurrency(expense.amount)}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${
                          expense.status === 'PAID' ? styles.paid : styles.pending
                        }`}>
                          {expense.status === 'PAID' ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            onClick={() => {
                              setShowDetailsModal(false);
                              handleEditExpense(expense);
                            }}
                            className={styles.iconButton}
                            title="Editar"
                          >
                            <MdEdit size={16} />
                          </button>
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            className={`${styles.iconButton} ${styles.deleteButton}`}
                            title="Excluir"
                          >
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className={styles.modalActions}>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleAddExpense();
                }}
                className={styles.primaryButton}
              >
                <MdAddCircle size={16} />
                Nova Despesa
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className={styles.secondaryButton}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};