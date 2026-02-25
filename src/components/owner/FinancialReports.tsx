// src/components/admin/FinancialReports.tsx
// VERSÃO CORRIGIDA COM IMPORTS CORRETOS DO MD

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
  FiInfo,
  FiPieChart,
  FiBarChart2,
  FiGift,
  FiMusic,
  FiCamera,
  FiTruck
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
  MdMoneyOff,
  MdAddCircle,
  MdDelete,
  MdEdit,
  MdRestaurant,
  MdLocalBar,
  MdChair,
  MdBrush,
  MdCake,           
  // MdCrown não existe - substituir por alternativas
  MdInventory,
  MdPalette,
  MdStore,
  MdLocalShipping,
  MdCelebration,
  MdStar,           // Alternativa para destaque
  MdEmojiEvents,    // Alternativa para conquistas/premiação
  MdWorkspacePremium // Alternativa para premium/destaque
} from 'react-icons/md';
import { 
  FaMoneyBillWave, 
  FaChartLine, 
  FaChartPie,
  FaHandHoldingUsd,
  FaBoxes,
  FaUtensils,
  FaChair,
  FaMusic,
  FaCamera,
  FaGlassCheers,
  FaTshirt,
  FaPalette,
  FaTruck,
  FaGift,
  FaCrown,          // ← FaCrown existe e funciona
  FaBirthdayCake   
} from 'react-icons/fa';
import { Event } from '../../types/Event';
import { Payment } from '../../types/Payment';
import { eventService } from '../../services/events';
import { paymentService } from '../../services/payments';
import styles from './FinancialReports.module.css';

// Interfaces
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

interface EventFinancialDetails {
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

export const FinancialReports: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('MONTHLY');
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedEventForExpense, setSelectedEventForExpense] = useState<number | null>(null);

  // Categorias de despesas pré-definidas com ícones CORRIGIDOS
  const expenseCategories = [
    { id: 'food', name: 'Alimentação', icon: <MdRestaurant /> },
    { id: 'drinks', name: 'Bebidas', icon: <MdLocalBar /> },
    { id: 'decoration', name: 'Decoração', icon: <MdPalette /> },
    { id: 'music', name: 'Música/DJ', icon: <FiMusic /> },
    { id: 'photography', name: 'Fotografia/Filmagem', icon: <FiCamera /> },
    { id: 'furniture', name: 'Móveis', icon: <MdChair /> },
    { id: 'cake', name: 'Bolo/Doces', icon: <MdCake /> },
    { id: 'staff', name: 'Equipe', icon: <MdPeople /> },
    { id: 'transport', name: 'Transporte', icon: <FiTruck /> },
    { id: 'gifts', name: 'Brindes/Lembranças', icon: <FiGift /> },
    { id: 'venue', name: 'Espaço/Local', icon: <FaCrown /> },     // ← Usando FaCrown em vez de MdCrown
    { id: 'marketing', name: 'Marketing/Divulgação', icon: <FiTrendingUp /> },
    { id: 'other', name: 'Outros', icon: <MdInventory /> }
  ];

  useEffect(() => {
    loadFinancialData();
    loadExpenses();
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

  const loadExpenses = () => {
    // Carrega despesas do localStorage (simulação - substituir por chamada API)
    const savedExpenses = localStorage.getItem('event_expenses');
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
  };

  const saveExpenses = (newExpenses: Expense[]) => {
    localStorage.setItem('event_expenses', JSON.stringify(newExpenses));
    setExpenses(newExpenses);
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = {
      ...expense,
      id: Date.now().toString()
    };
    const updatedExpenses = [...expenses, newExpense];
    saveExpenses(updatedExpenses);
  };

  const updateExpense = (id: string, updatedExpense: Partial<Expense>) => {
    const updatedExpenses = expenses.map(exp => 
      exp.id === id ? { ...exp, ...updatedExpense } : exp
    );
    saveExpenses(updatedExpenses);
  };

  const deleteExpense = (id: string) => {
    const updatedExpenses = expenses.filter(exp => exp.id !== id);
    saveExpenses(updatedExpenses);
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

  const isEventInSelectedPeriod = (event: Event): boolean => {
    if (!event.eventDate) return false;
    
    try {
      const eventDate = new Date(event.eventDate + 'T12:00:00-03:00');
      const [year, month] = selectedMonth.split('-').map(Number);
      const eventYear = eventDate.getFullYear();
      const eventMonth = eventDate.getMonth() + 1;
      
      if (selectedPeriod === 'MONTHLY') {
        return eventYear === year && eventMonth === month;
      } else if (selectedPeriod === 'QUARTERLY') {
        // Calcula o trimestre (1-4)
        const quarter = Math.ceil(month / 3);
        const eventQuarter = Math.ceil(eventMonth / 3);
        return eventYear === year && eventQuarter === quarter;
      } else if (selectedPeriod === 'SEMESTERLY') {
        // Calcula o semestre (1-2)
        const semester = month <= 6 ? 1 : 2;
        const eventSemester = eventMonth <= 6 ? 1 : 2;
        return eventYear === year && eventSemester === semester;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao verificar data do evento:', error);
      return false;
    }
  };

  const getEventsInPeriod = (): Event[] => {
    return events.filter(event => 
      isEventInSelectedPeriod(event) && 
      (event.status === 'CONFIRMED' || event.status === 'COMPLETED')
    );
  };

  const getTotalRevenue = (): number => {
    const periodEvents = getEventsInPeriod();
    return periodEvents.reduce((sum, event) => {
      const value = typeof event.totalValue === 'string' 
        ? parseFloat(event.totalValue) 
        : event.totalValue;
      return sum + (value || 0);
    }, 0);
  };

  const getTotalExpenses = (): number => {
    const periodEvents = getEventsInPeriod();
    const periodEventIds = periodEvents.map(e => e.id);
    
    return expenses
      .filter(exp => periodEventIds.includes(exp.eventId))
      .reduce((sum, exp) => sum + exp.amount, 0);
  };

  const getNetProfit = (): number => {
    return getTotalRevenue() - getTotalExpenses();
  };

  const getProfitMargin = (): number => {
    const revenue = getTotalRevenue();
    if (revenue === 0) return 0;
    return (getNetProfit() / revenue) * 100;
  };

  const getExpensesByCategory = (): Record<string, number> => {
    const periodEvents = getEventsInPeriod();
    const periodEventIds = periodEvents.map(e => e.id);
    
    return expenses
      .filter(exp => periodEventIds.includes(exp.eventId))
      .reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {} as Record<string, number>);
  };

  const getEventFinancialDetails = (): EventFinancialDetails[] => {
    const periodEvents = getEventsInPeriod();
    
    return periodEvents.map(event => {
      const eventExpenses = expenses.filter(exp => exp.eventId === event.id);
      const revenue = typeof event.totalValue === 'string' 
        ? parseFloat(event.totalValue) 
        : event.totalValue;
      const totalExpenses = eventExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const netProfit = revenue - totalExpenses;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
      
      return {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.eventDate,
        clientName: event.client?.name || 'Cliente não informado',
        revenue,
        expenses: eventExpenses,
        netProfit,
        profitMargin,
        status: event.status
      };
    }).sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  };

  const getPeriodLabel = (): string => {
    const [year, month] = selectedMonth.split('-');
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    if (selectedPeriod === 'MONTHLY') {
      return `${monthNames[parseInt(month) - 1]} de ${year}`;
    } else if (selectedPeriod === 'QUARTERLY') {
      const quarter = Math.ceil(parseInt(month) / 3);
      return `${quarter}º Trimestre de ${year}`;
    } else {
      const semester = parseInt(month) <= 6 ? 1 : 2;
      return `${semester}º Semestre de ${year}`;
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = expenseCategories.find(c => c.id === categoryId);
    return category?.icon || <MdInventory />;
  };

  const getCategoryName = (categoryId: string) => {
    const category = expenseCategories.find(c => c.id === categoryId);
    return category?.name || categoryId;
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

  const totalRevenue = getTotalRevenue();
  const totalExpenses = getTotalExpenses();
  const netProfit = getNetProfit();
  const profitMargin = getProfitMargin();
  const expensesByCategory = getExpensesByCategory();
  const eventFinancials = getEventFinancialDetails();

  return (
    <div className={styles.financialReports}>
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
              <button onClick={loadFinancialData} className={styles.refreshButton}>
                <FiRefreshCw size={16} />
                Atualizar
              </button>
            </div>
          </div>
        </div>
        
        <div className={styles.periodTitle}>
          <h2>{getPeriodLabel()}</h2>
          <span className={styles.eventCount}>
            {getEventsInPeriod().length} eventos no período
          </span>
        </div>
      </div>

      {/* Cards de Resumo Financeiro */}
      <div className={styles.financialSummary}>
        <div className={`${styles.summaryCard} ${styles.revenueCard}`}>
          <div className={styles.cardIcon}>
            <FaMoneyBillWave />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Receita Total</span>
            <span className={styles.cardValue}>{formatCurrency(totalRevenue)}</span>
            <span className={styles.cardDetail}>
              {getEventsInPeriod().length} eventos realizados
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
            <span className={`${styles.cardValue} ${profitMargin >= 20 ? styles.excellent : profitMargin >= 10 ? styles.good : styles.attention}`}>
              {profitMargin.toFixed(1)}%
            </span>
            <span className={styles.cardDetail}>
              {profitMargin >= 20 ? 'Excelente' : profitMargin >= 10 ? 'Boa' : 'Atenção'}
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
          <button
            onClick={() => setShowExpenseModal(true)}
            className={styles.primaryButton}
          >
            <MdAddCircle size={18} />
            Adicionar Despesa
          </button>
        </div>

        <div className={styles.categoryGrid}>
          {expenseCategories.map(category => {
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
              <p>Nenhuma despesa registrada no período</p>
              <button 
                onClick={() => setShowExpenseModal(true)}
                className={styles.secondaryButton}
              >
                <MdAddCircle size={16} />
                Adicionar primeira despesa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detalhamento por Evento */}
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
              </tr>
            </thead>
            <tbody>
              {eventFinancials.map(event => (
                <tr key={event.eventId}>
                  <td>
                    <strong>{event.eventTitle}</strong>
                  </td>
                  <td>{formatDateForDisplay(event.eventDate)}</td>
                  <td>
                    <MdPeople size={14} />
                    {event.clientName}
                  </td>
                  <td className={styles.valueCell}>
                    {formatCurrency(event.revenue)}
                  </td>
                  <td className={styles.valueCell}>
                    {formatCurrency(event.expenses.reduce((sum, e) => sum + e.amount, 0))}
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
                    <span className={`${styles.statusBadge} ${styles[event.status.toLowerCase()]}`}>
                      {event.status === 'CONFIRMED' ? 'Confirmado' :
                       event.status === 'COMPLETED' ? 'Realizado' :
                       event.status === 'QUOTE' ? 'Orçamento' : 'Cancelado'}
                    </span>
                  </td>
                </tr>
              ))}
              {eventFinancials.length === 0 && (
                <tr>
                  <td colSpan={8} className={styles.emptyTableCell}>
                    Nenhum evento encontrado no período
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Despesas */}
      {showExpenseModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>
                <MdAddCircle size={20} />
                {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
              </h3>
              <button 
                onClick={() => {
                  setShowExpenseModal(false);
                  setEditingExpense(null);
                  setSelectedEventForExpense(null);
                }}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
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
              setSelectedEventForExpense(null);
            }}>
              <div className={styles.formGroup}>
                <label>Evento:</label>
                <select 
                  name="eventId" 
                  required
                  defaultValue={selectedEventForExpense || ''}
                >
                  <option value="">Selecione um evento</option>
                  {getEventsInPeriod().map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {formatDateForDisplay(event.eventDate)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>Categoria:</label>
                <select name="category" required>
                  <option value="">Selecione a categoria</option>
                  {expenseCategories.map(cat => (
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
                  placeholder="Ex: Buffet, Decoração, etc"
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Valor (R$):</label>
                  <input 
                    type="number" 
                    name="amount" 
                    step="0.01" 
                    min="0" 
                    required 
                    placeholder="0,00"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Data:</label>
                  <input 
                    type="date" 
                    name="date" 
                    required 
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Fornecedor:</label>
                  <input 
                    type="text" 
                    name="supplier" 
                    placeholder="Nome do fornecedor"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Forma de Pagamento:</label>
                  <select name="paymentMethod">
                    <option value="">Selecione</option>
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                    <option value="CARTAO_DEBITO">Cartão de Débito</option>
                    <option value="PIX">PIX</option>
                    <option value="TRANSFERENCIA">Transferência</option>
                    <option value="BOLETO">Boleto</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>Status:</label>
                <select name="status" defaultValue="PENDING">
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
    </div>
  );
};