// src/components/owner/FinancialReports.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  MdCancel,
  MdFilterList,
  MdExpandMore,
  MdExpandLess
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
  FiSearch,
  FiX,
  FiTag,
  FiDollarSign,
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle
} from 'react-icons/fi';
import { Event } from '../../../../types/Event';
import { eventService } from '../../../../services/events';
import { expenseService, Expense, CreateExpenseDTO, EXPENSE_CATEGORIES } from '../../../../services/expense';
import { ConfirmationModal } from '../../../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../../../common/Alerts/ErrorModal';
import styles from './FinancialReports.module.css';

// ============ TIPOS ============
interface EventFinancial {
  eventId: number;
  eventTitle: string;
  eventDate: string;
  clientName: string;
  guestCount: number;
  revenue: number;
  expenses: Expense[];
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  status: string;
}

type PeriodType = 'MONTHLY' | 'QUARTERLY' | 'SEMESTERLY';

interface ExpenseFilters {
  searchTerm: string;
  category: string;
  status: string;
  paymentMethod: string;
  dateRange: {
    start: string;
    end: string;
  };
  minValue: string;
  maxValue: string;
}

interface EventFilters {
  searchTerm: string;
  eventType: string;
  status: string;
  dateRange: {
    start: string;
    end: string;
  };
  minValue: string;
  maxValue: string;
  minGuests: string;
  maxGuests: string;
}

// ============ CONSTANTES ============
const CATEGORY_ICONS: Record<string, JSX.Element> = {
  'Alimentação': <MdRestaurant />,
  'Bebidas': <MdLocalBar />,
  'Decoração': <MdPalette />,
  'Música/DJ': <FaMusic />,
  'Fotografia': <FaCamera />,
  'Móveis': <FaCrown />,
  'Bolo/Doces': <MdCake />,
  'Equipe': <MdPeople />,
  'Transporte': <FaTruck />,
  'Brindes': <FaGift />,
  'Espaço': <FaCrown />,
  'Marketing': <FiTrendingUp />,
  'Outros': <MdInventory />
};

const PAYMENT_METHODS = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
  { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
  { value: 'PIX', label: 'PIX' },
  { value: 'TRANSFERENCIA', label: 'Transferência' }
];

const EVENT_TYPES = [
  { value: 'ALL', label: 'Todos os tipos' },
  { value: 'CASAMENTO', label: 'Casamento' },
  { value: 'ANIVERSARIO', label: 'Aniversário' },
  { value: 'CORPORATIVO', label: 'Corporativo' },
  { value: 'FORMATURA', label: 'Formatura' },
  { value: 'CONFRATERNIZACAO', label: 'Confraternização' },
  { value: 'OUTRO', label: 'Outro' }
];

const EVENT_STATUS = [
  { value: 'ALL', label: 'Todos os status' },
  { value: 'CONFIRMED', label: 'Confirmados' },
  { value: 'COMPLETED', label: 'Realizados' },
  { value: 'QUOTE', label: 'Em Cotação' },
  { value: 'CANCELLED', label: 'Cancelados' }
];

// ============ UTILS ============
const formatCurrency = (value: number): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
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

const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString + 'T12:00:00-03:00');
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('MONTHLY');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventFinancial | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [preSelectedEventId, setPreSelectedEventId] = useState<number | null>(null);
  
  // Estados dos filtros
  const [showExpenseFilters, setShowExpenseFilters] = useState(false);
  const [showEventFilters, setShowEventFilters] = useState(false);
  
  const [expenseFilters, setExpenseFilters] = useState<ExpenseFilters>({
    searchTerm: '',
    category: 'ALL',
    status: 'ALL',
    paymentMethod: 'ALL',
    dateRange: { start: '', end: '' },
    minValue: '',
    maxValue: ''
  });

  const [eventFilters, setEventFilters] = useState<EventFilters>({
    searchTerm: '',
    eventType: 'ALL',
    status: 'ALL',
    dateRange: { start: '', end: '' },
    minValue: '',
    maxValue: '',
    minGuests: '',
    maxGuests: ''
  });

  // Carregar dados
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Carregando dados financeiros...');
      
      const [eventsData, expensesData] = await Promise.all([
        eventService.getAllEvents(),
        expenseService.getAllExpenses()
      ]);
      
      console.log('📊 Dados carregados:', {
        eventos: eventsData.length,
        despesas: expensesData.length
      });
      
      console.log('📋 Lista completa de despesas:');
      expensesData.forEach((exp: Expense) => {
        console.log(`  💵 Despesa ID ${exp.id}: Evento ${exp.eventId} - ${exp.descricao} - R$ ${exp.valor} - Status: ${exp.status}`);
      });
      
      console.log('📋 Lista completa de eventos:');
      eventsData.forEach((ev: Event) => {
        const eventExpenses = expensesData.filter((exp: Expense) => Number(exp.eventId) === Number(ev.id));
        console.log(`  📅 Evento ID ${ev.id}: "${ev.title}" - ${eventExpenses.length} despesas - Total: R$ ${eventExpenses.reduce((s, e) => s + Number(e.valor), 0)}`);
      });
      
      setEvents(eventsData);
      setExpenses(expensesData);
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      setError('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  // CRUD de despesas
  const handleAddExpense = async (expenseData: CreateExpenseDTO) => {
    try {
      setLoading(true);
      
      console.log('📝 Criando despesa:', expenseData);
      
      if (!expenseData.eventId || expenseData.eventId <= 0) {
        throw new Error('Selecione um evento válido');
      }
      if (!expenseData.descricao?.trim()) {
        throw new Error('Descrição é obrigatória');
      }
      if (!expenseData.valor || expenseData.valor <= 0) {
        throw new Error('Valor deve ser maior que zero');
      }
      if (!expenseData.data) {
        throw new Error('Data é obrigatória');
      }

      const payload: CreateExpenseDTO = {
        eventId: Number(expenseData.eventId),
        descricao: expenseData.descricao.trim(),
        valor: Number(expenseData.valor),
        data: expenseData.data,
        categoria: expenseData.categoria || 'Outros',
        fornecedor: expenseData.fornecedor?.trim() || undefined,
        formaPagamento: expenseData.formaPagamento || 'PIX',
        status: expenseData.status || 'PENDING'
      };

      console.log('📤 Payload para API:', payload);
      
      const newExpense = await expenseService.createExpense(payload);
      
      console.log('✅ Despesa criada:', newExpense);
      
      setSuccessMessage('Despesa adicionada com sucesso!');
      setShowSuccessModal(true);
      setShowExpenseModal(false);
      setEditingExpense(null);
      setPreSelectedEventId(null);
      
      await loadData();
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error: any) {
      console.error('❌ Erro ao criar despesa:', error);
      
      let errorMessage = 'Erro ao adicionar despesa';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExpense = async (id: number, updates: Partial<CreateExpenseDTO>) => {
    try {
      setLoading(true);
      
      const currentExpenses = await expenseService.getAllExpenses();
      const currentExpense = currentExpenses.find(e => e.id === id);
      
      if (!currentExpense) {
        throw new Error('Despesa não encontrada');
      }
      
      const payload: Partial<CreateExpenseDTO> = {
        eventId: updates.eventId !== undefined ? Number(updates.eventId) : currentExpense.eventId,
        descricao: updates.descricao !== undefined ? updates.descricao : currentExpense.descricao,
        valor: updates.valor !== undefined ? Number(updates.valor) : currentExpense.valor,
        data: updates.data !== undefined ? updates.data : currentExpense.data,
        categoria: updates.categoria !== undefined ? updates.categoria : currentExpense.categoria,
        fornecedor: updates.fornecedor !== undefined ? updates.fornecedor : currentExpense.fornecedor,
        formaPagamento: updates.formaPagamento !== undefined ? updates.formaPagamento : currentExpense.formaPagamento,
        status: updates.status || currentExpense.status
      };
      
      const updated = await expenseService.updateExpense(id, payload);
      
      console.log('✅ Despesa atualizada:', updated);
      
      setSuccessMessage('Despesa atualizada com sucesso!');
      setShowSuccessModal(true);
      setShowExpenseModal(false);
      setEditingExpense(null);
      setPreSelectedEventId(null);
      
      await loadData();
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error: any) {
      console.error('❌ Erro ao atualizar despesa:', error);
      
      let errorMessage = 'Erro ao atualizar despesa';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      setLoading(true);
      await expenseService.deleteExpense(id);
      
      setSuccessMessage('Despesa excluída com sucesso!');
      setShowSuccessModal(true);
      setShowDeleteConfirm(false);
      setExpenseToDelete(null);
      
      await loadData();
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error: any) {
      console.error('❌ Erro ao excluir despesa:', error);
      
      let errorMessage = 'Erro ao excluir despesa';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = useCallback(async (expense: Expense) => {
    try {
      const newStatus = expense.status === 'PAID' ? 'PENDING' : 'PAID';
      
      await expenseService.updateExpenseStatus(expense.id, newStatus);
      
      setSuccessMessage(`Despesa marcada como ${newStatus === 'PAID' ? 'Paga' : 'Pendente'}!`);
      setShowSuccessModal(true);
      
      await loadData();
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error: any) {
      console.error('❌ Erro ao alterar status:', error);
      setError('Erro ao atualizar status da despesa');
      setShowErrorModal(true);
    }
  }, [loadData]);

  // Handlers dos filtros
  const handleExpenseFilterChange = useCallback((field: keyof ExpenseFilters, value: any) => {
    setExpenseFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleExpenseDateRangeChange = useCallback((field: 'start' | 'end', value: string) => {
    setExpenseFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [field]: value }
    }));
  }, []);

  const handleClearExpenseFilters = useCallback(() => {
    setExpenseFilters({
      searchTerm: '',
      category: 'ALL',
      status: 'ALL',
      paymentMethod: 'ALL',
      dateRange: { start: '', end: '' },
      minValue: '',
      maxValue: ''
    });
  }, []);

  const handleEventFilterChange = useCallback((field: keyof EventFilters, value: any) => {
    setEventFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleEventDateRangeChange = useCallback((field: 'start' | 'end', value: string) => {
    setEventFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [field]: value }
    }));
  }, []);

  const handleClearEventFilters = useCallback(() => {
    setEventFilters({
      searchTerm: '',
      eventType: 'ALL',
      status: 'ALL',
      dateRange: { start: '', end: '' },
      minValue: '',
      maxValue: '',
      minGuests: '',
      maxGuests: ''
    });
  }, []);

  // Filtrar eventos do período
  const eventsInPeriod = useMemo(() => {
    const filtered = events.filter(event => 
      isEventInPeriod(event, selectedMonth, selectedPeriod)
    );
    return filtered;
  }, [events, selectedMonth, selectedPeriod]);

  // Eventos filtrados
  const filteredEvents = useMemo(() => {
    const result = eventsInPeriod.filter(event => {
      if (eventFilters.searchTerm && eventFilters.searchTerm.trim() !== '') {
        const term = eventFilters.searchTerm.toLowerCase().trim();
        const title = event.title?.toLowerCase() || '';
        const clientName = event.client?.name?.toLowerCase() || '';
        if (!title.includes(term) && !clientName.includes(term)) {
          return false;
        }
      }

      if (eventFilters.eventType !== 'ALL' && event.eventType !== eventFilters.eventType) {
        return false;
      }

      if (eventFilters.status !== 'ALL' && event.status !== eventFilters.status) {
        return false;
      }

      if (eventFilters.dateRange.start && eventFilters.dateRange.start !== '') {
        const eventDate = new Date(event.eventDate);
        const startDate = new Date(eventFilters.dateRange.start);
        if (eventDate < startDate) return false;
      }
      if (eventFilters.dateRange.end && eventFilters.dateRange.end !== '') {
        const eventDate = new Date(event.eventDate);
        const endDate = new Date(eventFilters.dateRange.end);
        if (eventDate > endDate) return false;
      }

      const eventValue = Number(event.totalValue) || 0;
        
      if (eventFilters.minValue && eventFilters.minValue !== '') {
        const minVal = parseFloat(eventFilters.minValue);
        if (!isNaN(minVal) && eventValue < minVal) return false;
      }
      if (eventFilters.maxValue && eventFilters.maxValue !== '') {
        const maxVal = parseFloat(eventFilters.maxValue);
        if (!isNaN(maxVal) && eventValue > maxVal) return false;
      }

      const guestCount = event.guestCount || 0;
      if (eventFilters.minGuests && eventFilters.minGuests !== '') {
        const minGuests = parseInt(eventFilters.minGuests);
        if (!isNaN(minGuests) && guestCount < minGuests) return false;
      }
      if (eventFilters.maxGuests && eventFilters.maxGuests !== '') {
        const maxGuests = parseInt(eventFilters.maxGuests);
        if (!isNaN(maxGuests) && guestCount > maxGuests) return false;
      }

      return true;
    });

    return result;
  }, [eventsInPeriod, eventFilters]);

  // IDs dos eventos filtrados
  const filteredEventIds = useMemo(() => {
    return filteredEvents.map(e => Number(e.id));
  }, [filteredEvents]);

  // Despesas dos eventos filtrados
  const expensesForFilteredEvents = useMemo(() => {
    const filtered = expenses.filter(exp => {
      const expEventId = Number(exp.eventId);
      return filteredEventIds.includes(expEventId);
    });
    
    return filtered;
  }, [expenses, filteredEventIds]);

  // Despesas filtradas pelos filtros de despesas
  const filteredExpenses = useMemo(() => {
    const result = expensesForFilteredEvents.filter(expense => {
      if (expenseFilters.searchTerm && expenseFilters.searchTerm.trim() !== '') {
        const term = expenseFilters.searchTerm.toLowerCase().trim();
        const descricao = expense.descricao?.toLowerCase() || '';
        const fornecedor = expense.fornecedor?.toLowerCase() || '';
        if (!descricao.includes(term) && !fornecedor.includes(term)) {
          return false;
        }
      }

      if (expenseFilters.category !== 'ALL' && expense.categoria !== expenseFilters.category) {
        return false;
      }

      if (expenseFilters.status !== 'ALL' && expense.status !== expenseFilters.status) {
        return false;
      }

      if (expenseFilters.paymentMethod !== 'ALL' && expense.formaPagamento !== expenseFilters.paymentMethod) {
        return false;
      }

      if (expenseFilters.dateRange.start && expenseFilters.dateRange.start !== '') {
        const expenseDate = new Date(expense.data);
        const startDate = new Date(expenseFilters.dateRange.start);
        if (expenseDate < startDate) return false;
      }
      if (expenseFilters.dateRange.end && expenseFilters.dateRange.end !== '') {
        const expenseDate = new Date(expense.data);
        const endDate = new Date(expenseFilters.dateRange.end);
        if (expenseDate > endDate) return false;
      }

      if (expenseFilters.minValue && expenseFilters.minValue !== '') {
        const minVal = parseFloat(expenseFilters.minValue);
        if (!isNaN(minVal) && Number(expense.valor) < minVal) return false;
      }
      if (expenseFilters.maxValue && expenseFilters.maxValue !== '') {
        const maxVal = parseFloat(expenseFilters.maxValue);
        if (!isNaN(maxVal) && Number(expense.valor) > maxVal) return false;
      }

      return true;
    });

    return result;
  }, [expensesForFilteredEvents, expenseFilters]);

  // Cálculos financeiros
  const totalRevenue = useMemo(() => {
    return filteredEvents.reduce((acc, event) => {
      return acc + (Number(event.totalValue) || 0);
    }, 0);
  }, [filteredEvents]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((acc, exp) => acc + (Number(exp.valor) || 0), 0);
  }, [filteredExpenses]);

  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Despesas por categoria
  const expensesByCategory = useMemo(() => 
    filteredExpenses.reduce((acc, exp) => {
      const categoryName = exp.categoria || 'Outros';
      acc[categoryName] = (acc[categoryName] || 0) + (Number(exp.valor) || 0);
      return acc;
    }, {} as Record<string, number>),
  [filteredExpenses]);

  // Dados financeiros por evento
  const eventFinancials = useMemo((): EventFinancial[] => {
    return filteredEvents.map(event => {
      const eventId = Number(event.id);
      const eventExpenses = filteredExpenses.filter(exp => Number(exp.eventId) === eventId);
      const revenue = Number(event.totalValue) || 0;
      const totalEventExpenses = eventExpenses.reduce((sum, exp) => sum + (Number(exp.valor) || 0), 0);
      const netEventProfit = revenue - totalEventExpenses;
      
      return {
        eventId: eventId,
        eventTitle: event.title,
        eventDate: event.eventDate,
        clientName: event.client?.name || 'Cliente não informado',
        guestCount: event.guestCount || 0,
        revenue,
        expenses: eventExpenses,
        totalExpenses: totalEventExpenses,
        netProfit: netEventProfit,
        profitMargin: revenue > 0 ? (netEventProfit / revenue) * 100 : 0,
        status: event.status
      };
    }).sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  }, [filteredEvents, filteredExpenses]);

  // Handlers
  const handleOpenExpenseModal = useCallback((expense?: Expense, eventId?: number) => {
    if (expense) {
      setEditingExpense(expense);
      setPreSelectedEventId(null);
    } else {
      setEditingExpense(null);
      setPreSelectedEventId(eventId || null);
    }
    setShowExpenseModal(true);
  }, []);

  const handleSaveExpense = useCallback((formData: FormData) => {
    const eventId = parseInt(formData.get('eventId') as string);
    
    if (isNaN(eventId) || eventId <= 0) {
      setError('Selecione um evento válido');
      setShowErrorModal(true);
      return;
    }
    
    const expenseData: CreateExpenseDTO = {
      eventId: eventId,
      descricao: formData.get('description') as string,
      valor: parseFloat(formData.get('amount') as string) || 0,
      data: formData.get('date') as string,
      categoria: formData.get('category') as string,
      fornecedor: (formData.get('supplier') as string) || undefined,
      formaPagamento: (formData.get('paymentMethod') as string) || undefined,
      status: (formData.get('status') as string) || 'PENDING'
    };

    if (editingExpense) {
      handleUpdateExpense(editingExpense.id, expenseData);
    } else {
      handleAddExpense(expenseData);
    }
  }, [editingExpense]);

  const handleViewEventExpenses = useCallback((event: EventFinancial) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  }, []);

  const confirmDeleteExpense = useCallback((id: number) => {
    setExpenseToDelete(id);
    setShowDeleteConfirm(true);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const hasActiveExpenseFilters = useMemo(() => {
    return expenseFilters.searchTerm.trim() !== '' ||
           expenseFilters.category !== 'ALL' ||
           expenseFilters.status !== 'ALL' ||
           expenseFilters.paymentMethod !== 'ALL' ||
           expenseFilters.dateRange.start !== '' ||
           expenseFilters.dateRange.end !== '' ||
           expenseFilters.minValue !== '' ||
           expenseFilters.maxValue !== '';
  }, [expenseFilters]);

  const hasActiveEventFilters = useMemo(() => {
    return eventFilters.searchTerm.trim() !== '' ||
           eventFilters.eventType !== 'ALL' ||
           eventFilters.status !== 'ALL' ||
           eventFilters.dateRange.start !== '' ||
           eventFilters.dateRange.end !== '' ||
           eventFilters.minValue !== '' ||
           eventFilters.maxValue !== '' ||
           eventFilters.minGuests !== '' ||
           eventFilters.maxGuests !== '';
  }, [eventFilters]);

  if (loading && events.length === 0) {
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
        <button onClick={handleRefresh} className={styles.retryButton}>
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
              <span className={styles.selectorLabel}>
                <FiCalendar size={16} />
                Período:
              </span>
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
              <button onClick={handleRefresh} className={styles.refreshButton}>
                <FiRefreshCw size={16} />
                Atualizar
              </button>
            </div>
          </div>
        </div>
        
        <div className={styles.periodTitle}>
          <h2>{getPeriodLabel(selectedMonth, selectedPeriod)}</h2>
          <span className={styles.eventCount}>
            {filteredEvents.length} eventos
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
              {filteredEvents.length} eventos
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
              {filteredExpenses.length} despesas
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
      <div className={styles.categorySection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <FaChartPie size={20} />
            Despesas por Categoria
          </h2>
          <button onClick={() => handleOpenExpenseModal()} className={styles.primaryButton}>
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
                  {CATEGORY_ICONS[category.id] || <MdInventory />}
                </div>
                <div className={styles.categoryInfo}>
                  <h4 className={styles.categoryName}>{category.name}</h4>
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
              <MdReceipt size={48} />
              <p>Nenhuma despesa no período</p>
              <button onClick={() => handleOpenExpenseModal()} className={styles.secondaryButton}>
                <MdAddCircle size={16} />
                Adicionar despesa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filtros de Eventos */}
      <div className={styles.expenseFiltersSection}>
        <button 
          onClick={() => setShowEventFilters(!showEventFilters)}
          className={styles.expenseFilterToggle}
        >
          <MdFilterList size={18} />
          {showEventFilters ? 'Ocultar filtros de eventos' : 'Filtrar eventos'}
          {hasActiveEventFilters && (
            <span className={styles.filterCount}>
              {filteredEvents.length}/{eventsInPeriod.length}
            </span>
          )}
          {showEventFilters ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        </button>

        {showEventFilters && (
          <div className={styles.expenseFiltersPanel}>
            <div className={styles.expenseSearchBox}>
              <FiSearch size={16} />
              <input
                type="text"
                placeholder="Buscar por título ou cliente..."
                value={eventFilters.searchTerm}
                onChange={(e) => handleEventFilterChange('searchTerm', e.target.value)}
                className={styles.expenseSearchInput}
              />
              {eventFilters.searchTerm && (
                <button 
                  onClick={() => handleEventFilterChange('searchTerm', '')}
                  className={styles.clearSearchButton}
                >
                  <FiX size={14} />
                </button>
              )}
            </div>

            <div className={styles.expenseFiltersGrid}>
              <div className={styles.filterGroup}>
                <label><MdEvent size={14} /> Tipo de Evento</label>
                <select
                  value={eventFilters.eventType}
                  onChange={(e) => handleEventFilterChange('eventType', e.target.value)}
                  className={styles.filterSelect}
                >
                  {EVENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label><FiCheckCircle size={14} /> Status</label>
                <select
                  value={eventFilters.status}
                  onChange={(e) => handleEventFilterChange('status', e.target.value)}
                  className={styles.filterSelect}
                >
                  {EVENT_STATUS.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label><FiCalendar size={14} /> Período do Evento</label>
                <div className={styles.dateRangeInputs}>
                  <input
                    type="date"
                    value={eventFilters.dateRange.start}
                    onChange={(e) => handleEventDateRangeChange('start', e.target.value)}
                    className={styles.dateInput}
                    placeholder="De"
                  />
                  <span>até</span>
                  <input
                    type="date"
                    value={eventFilters.dateRange.end}
                    onChange={(e) => handleEventDateRangeChange('end', e.target.value)}
                    className={styles.dateInput}
                    placeholder="Até"
                  />
                </div>
              </div>

              <div className={styles.filterGroup}>
                <label><FiDollarSign size={14} /> Valor do Evento</label>
                <div className={styles.valueRangeInputs}>
                  <input
                    type="number"
                    placeholder="Mínimo"
                    value={eventFilters.minValue}
                    onChange={(e) => handleEventFilterChange('minValue', e.target.value)}
                    className={styles.valueInput}
                    min="0"
                  />
                  <span>até</span>
                  <input
                    type="number"
                    placeholder="Máximo"
                    value={eventFilters.maxValue}
                    onChange={(e) => handleEventFilterChange('maxValue', e.target.value)}
                    className={styles.valueInput}
                    min="0"
                  />
                </div>
              </div>

              <div className={styles.filterGroup}>
                <label><MdPeople size={14} /> Convidados</label>
                <div className={styles.valueRangeInputs}>
                  <input
                    type="number"
                    placeholder="Mínimo"
                    value={eventFilters.minGuests}
                    onChange={(e) => handleEventFilterChange('minGuests', e.target.value)}
                    className={styles.valueInput}
                    min="0"
                  />
                  <span>até</span>
                  <input
                    type="number"
                    placeholder="Máximo"
                    value={eventFilters.maxGuests}
                    onChange={(e) => handleEventFilterChange('maxGuests', e.target.value)}
                    className={styles.valueInput}
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className={styles.expenseFiltersActions}>
              <span className={styles.filterResults}>
                <strong>{filteredEvents.length}</strong> evento(s) encontrado(s)
              </span>
              {hasActiveEventFilters && (
                <button onClick={handleClearEventFilters} className={styles.clearFiltersButton}>
                  <FiX size={14} />
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filtros de Despesas */}
      <div className={styles.expenseFiltersSection}>
        <button 
          onClick={() => setShowExpenseFilters(!showExpenseFilters)}
          className={styles.expenseFilterToggle}
        >
          <MdFilterList size={18} />
          {showExpenseFilters ? 'Ocultar filtros de despesas' : 'Filtrar despesas'}
          {hasActiveExpenseFilters && (
            <span className={styles.filterCount}>
              {filteredExpenses.length}/{expensesForFilteredEvents.length}
            </span>
          )}
          {showExpenseFilters ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        </button>

        {showExpenseFilters && (
          <div className={styles.expenseFiltersPanel}>
            <div className={styles.expenseSearchBox}>
              <FiSearch size={16} />
              <input
                type="text"
                placeholder="Buscar por descrição ou fornecedor..."
                value={expenseFilters.searchTerm}
                onChange={(e) => handleExpenseFilterChange('searchTerm', e.target.value)}
                className={styles.expenseSearchInput}
              />
              {expenseFilters.searchTerm && (
                <button 
                  onClick={() => handleExpenseFilterChange('searchTerm', '')}
                  className={styles.clearSearchButton}
                >
                  <FiX size={14} />
                </button>
              )}
            </div>

            <div className={styles.expenseFiltersGrid}>
              <div className={styles.filterGroup}>
                <label><FiTag size={14} /> Categoria</label>
                <select
                  value={expenseFilters.category}
                  onChange={(e) => handleExpenseFilterChange('category', e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="ALL">Todas as categorias</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label><FiCheckCircle size={14} /> Status</label>
                <select
                  value={expenseFilters.status}
                  onChange={(e) => handleExpenseFilterChange('status', e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="ALL">Todos os status</option>
                  <option value="PAID">Pagas</option>
                  <option value="PENDING">Pendentes</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label><FiDollarSign size={14} /> Forma de Pagamento</label>
                <select
                  value={expenseFilters.paymentMethod}
                  onChange={(e) => handleExpenseFilterChange('paymentMethod', e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="ALL">Todas as formas</option>
                  {PAYMENT_METHODS.map(method => (
                    <option key={method.value} value={method.value}>{method.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label><FiCalendar size={14} /> Período da Despesa</label>
                <div className={styles.dateRangeInputs}>
                  <input
                    type="date"
                    value={expenseFilters.dateRange.start}
                    onChange={(e) => handleExpenseDateRangeChange('start', e.target.value)}
                    className={styles.dateInput}
                  />
                  <span>até</span>
                  <input
                    type="date"
                    value={expenseFilters.dateRange.end}
                    onChange={(e) => handleExpenseDateRangeChange('end', e.target.value)}
                    className={styles.dateInput}
                  />
                </div>
              </div>

              <div className={styles.filterGroup}>
                <label><FiDollarSign size={14} /> Valor da Despesa</label>
                <div className={styles.valueRangeInputs}>
                  <input
                    type="number"
                    placeholder="Mínimo"
                    value={expenseFilters.minValue}
                    onChange={(e) => handleExpenseFilterChange('minValue', e.target.value)}
                    className={styles.valueInput}
                    min="0"
                    step="0.01"
                  />
                  <span>até</span>
                  <input
                    type="number"
                    placeholder="Máximo"
                    value={expenseFilters.maxValue}
                    onChange={(e) => handleExpenseFilterChange('maxValue', e.target.value)}
                    className={styles.valueInput}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className={styles.expenseFiltersActions}>
              <span className={styles.filterResults}>
                <strong>{filteredExpenses.length}</strong> despesa(s) encontrada(s)
              </span>
              {hasActiveExpenseFilters && (
                <button onClick={handleClearExpenseFilters} className={styles.clearFiltersButton}>
                  <FiX size={14} />
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Eventos */}
      <div className={styles.eventsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <MdEvent size={20} />
            Detalhamento por Evento
          </h2>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.eventsTable}>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Convidados</th>
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
                  <tr className={styles.eventRow}>
                    <td className={styles.eventTitleCell}>
                      <strong>{event.eventTitle}</strong>
                    </td>
                    <td>{formatDate(event.eventDate)}</td>
                    <td className={styles.clientCell}>
                      <MdPeople size={14} />
                      {event.clientName}
                    </td>
                    <td className={styles.guestsCell}>{event.guestCount}</td>
                    <td className={styles.valueCell}>{formatCurrency(event.revenue)}</td>
                    <td className={styles.valueCell}>
                      <button
                        onClick={() => handleViewEventExpenses(event)}
                        className={styles.expensesLink}
                      >
                        {formatCurrency(event.totalExpenses)}
                        <span className={styles.expenseCount}>({event.expenses.length})</span>
                      </button>
                    </td>
                    <td className={`${styles.valueCell} ${event.netProfit >= 0 ? styles.positive : styles.negative}`}>
                      {formatCurrency(event.netProfit)}
                    </td>
                    <td>
                      <span className={`${styles.marginBadge} ${
                        event.profitMargin >= 20 ? styles.excellent : 
                        event.profitMargin >= 10 ? styles.good : 
                        event.profitMargin >= 0 ? styles.warning : 
                        styles.danger
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
                        onClick={() => setExpandedEventId(
                          expandedEventId === event.eventId ? null : event.eventId
                        )}
                        className={styles.expandButton}
                      >
                        {expandedEventId === event.eventId ? 
                          <MdExpandLess size={20} /> : 
                          <MdExpandMore size={20} />
                        }
                      </button>
                    </td>
                  </tr>
                  {expandedEventId === event.eventId && (
                    <tr className={styles.expandedRow}>
                      <td colSpan={10}>
                        <div className={styles.expandedContent}>
                          <div className={styles.expandedHeader}>
                            <h4>Despesas do Evento</h4>
                            <button
                              onClick={() => {
                                setExpandedEventId(null);
                                handleOpenExpenseModal(undefined, event.eventId);
                              }}
                              className={styles.addExpenseButton}
                            >
                              <MdAddCircle size={16} />
                              Adicionar Despesa
                            </button>
                          </div>
                          {event.expenses.length > 0 ? (
                            <table className={styles.expensesTable}>
                              <thead>
                                <tr>
                                  <th>Data</th>
                                  <th>Categoria</th>
                                  <th>Descrição</th>
                                  <th>Fornecedor</th>
                                  <th>Valor</th>
                                  <th>Status</th>
                                  <th>Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {event.expenses.map(exp => (
                                  <tr key={exp.id}>
                                    <td>{formatDate(exp.data)}</td>
                                    <td>
                                      <span className={styles.categoryBadge}>
                                        {CATEGORY_ICONS[exp.categoria || 'Outros'] || <MdInventory />}
                                        {exp.categoria || 'Outros'}
                                      </span>
                                    </td>
                                    <td>{exp.descricao}</td>
                                    <td>{exp.fornecedor || '-'}</td>
                                    <td className={styles.valueCell}>{formatCurrency(exp.valor)}</td>
                                    <td>
                                      <button
                                        onClick={() => handleToggleStatus(exp)}
                                        className={`${styles.statusBadge} ${
                                          exp.status === 'PAID' ? styles.paid : styles.pending
                                        }`}
                                        style={{ cursor: 'pointer' }}
                                      >
                                        {exp.status === 'PAID' ? <MdCheckCircle size={14} /> : <MdCancel size={14} />}
                                        {exp.status === 'PAID' ? 'Pago' : 'Pendente'}
                                      </button>
                                    </td>
                                    <td>
                                      <div className={styles.expenseActions}>
                                        <button
                                          onClick={() => handleOpenExpenseModal(exp)}
                                          className={styles.iconButton}
                                          title="Editar"
                                        >
                                          <MdEdit size={16} />
                                        </button>
                                        <button
                                          onClick={() => confirmDeleteExpense(exp.id)}
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
                          ) : (
                            <div className={styles.noExpenses}>
                              <MdReceipt size={32} />
                              <p>Nenhuma despesa cadastrada para este evento</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {eventFinancials.length === 0 && (
                <tr>
                  <td colSpan={10} className={styles.emptyTableCell}>
                    Nenhum evento encontrado no período selecionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Despesas */}
      {showExpenseModal && (
        <div className={styles.modalOverlay} onClick={() => {
          setShowExpenseModal(false);
          setEditingExpense(null);
          setPreSelectedEventId(null);
        }}>
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
                  setPreSelectedEventId(null);
                }}
                className={styles.closeButton}
              >
                <MdClose size={20} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSaveExpense(formData);
            }}>
              {/* Campo de Evento */}
              {editingExpense ? (
                <div className={styles.formGroup}>
                  <label>Evento *</label>
                  <select 
                    name="eventId" 
                    required
                    defaultValue={editingExpense?.eventId || ''}
                  >
                    <option value="">Selecione um evento</option>
                    {filteredEvents.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.title} - {formatDate(event.eventDate)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : preSelectedEventId ? (
                <div className={styles.formGroup}>
                  <label>Evento *</label>
                  <input 
                    type="text" 
                    value={(() => {
                      const event = filteredEvents.find(e => e.id === preSelectedEventId);
                      return event ? `${event.title} - ${formatDate(event.eventDate)}` : '';
                    })()}
                    readOnly
                    className={styles.formInput}
                    style={{ backgroundColor: 'var(--bg-tertiary)', cursor: 'not-allowed' }}
                  />
                  <input type="hidden" name="eventId" value={preSelectedEventId} />
                </div>
              ) : (
                <div className={styles.formGroup}>
                  <label>Evento *</label>
                  <select 
                    name="eventId" 
                    required
                    defaultValue=""
                  >
                    <option value="">Selecione um evento</option>
                    {filteredEvents.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.title} - {formatDate(event.eventDate)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className={styles.formGroup}>
                <label>Categoria *</label>
                <select 
                  name="category" 
                  required
                  defaultValue={editingExpense?.categoria || ''}
                >
                  <option value="">Selecione uma categoria</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>Descrição *</label>
                <input 
                  type="text" 
                  name="description" 
                  required 
                  defaultValue={editingExpense?.descricao || ''}
                  placeholder="Ex: Buffet, Decoração, etc"
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Valor (R$) *</label>
                  <input 
                    type="number" 
                    name="amount" 
                    step="0.01" 
                    min="0.01"
                    required 
                    defaultValue={editingExpense?.valor || ''}
                    placeholder="0,00"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Data *</label>
                  <input 
                    type="date" 
                    name="date" 
                    required 
                    defaultValue={editingExpense ? formatDateForInput(editingExpense.data) : new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Fornecedor</label>
                  <input 
                    type="text" 
                    name="supplier" 
                    defaultValue={editingExpense?.fornecedor || ''}
                    placeholder="Nome do fornecedor"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Forma de Pagamento</label>
                  <select name="paymentMethod" defaultValue={editingExpense?.formaPagamento || ''}>
                    <option value="">Selecione</option>
                    {PAYMENT_METHODS.map(method => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>Status</label>
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
                    setPreSelectedEventId(null);
                  }}
                  className={styles.cancelButton}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.submitButton} disabled={loading}>
                  {loading ? 'Salvando...' : (editingExpense ? 'Atualizar' : 'Salvar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedEvent && (
        <div className={styles.modalOverlay} onClick={() => setShowDetailsModal(false)}>
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
                <span>Total Despesas</span>
                <strong>{formatCurrency(selectedEvent.totalExpenses)}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Quantidade</span>
                <strong>{selectedEvent.expenses.length}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Receita</span>
                <strong>{formatCurrency(selectedEvent.revenue)}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Lucro</span>
                <strong className={selectedEvent.netProfit >= 0 ? styles.positive : styles.negative}>
                  {formatCurrency(selectedEvent.netProfit)}
                </strong>
              </div>
            </div>
            
            <div className={styles.detailsList}>
              {selectedEvent.expenses.length > 0 ? (
                <table className={styles.detailsTable}>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Categoria</th>
                      <th>Descrição</th>
                      <th>Fornecedor</th>
                      <th>Valor</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEvent.expenses.map(expense => (
                      <tr key={expense.id}>
                        <td>{formatDate(expense.data)}</td>
                        <td>
                          <span className={styles.categoryBadge}>
                            {CATEGORY_ICONS[expense.categoria || 'Outros'] || <MdInventory />}
                            {expense.categoria || 'Outros'}
                          </span>
                        </td>
                        <td>{expense.descricao}</td>
                        <td>{expense.fornecedor || '-'}</td>
                        <td className={styles.valueCell}>{formatCurrency(expense.valor)}</td>
                        <td>
                          <button
                            onClick={() => handleToggleStatus(expense)}
                            className={`${styles.statusBadge} ${
                              expense.status === 'PAID' ? styles.paid : styles.pending
                            }`}
                            style={{ cursor: 'pointer', border: 'none' }}
                          >
                            {expense.status === 'PAID' ? <MdCheckCircle size={14} /> : <MdCancel size={14} />}
                            {expense.status === 'PAID' ? 'Pago' : 'Pendente'}
                          </button>
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              onClick={() => {
                                setShowDetailsModal(false);
                                handleOpenExpenseModal(expense);
                              }}
                              className={styles.iconButton}
                              title="Editar"
                            >
                              <MdEdit size={16} />
                            </button>
                            <button
                              onClick={() => confirmDeleteExpense(expense.id)}
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
              ) : (
                <div className={styles.emptyState}>
                  <MdReceipt size={48} />
                  <p>Nenhuma despesa cadastrada para este evento</p>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleOpenExpenseModal(undefined, selectedEvent.eventId);
                    }}
                    className={styles.secondaryButton}
                  >
                    <MdAddCircle size={16} />
                    Adicionar primeira despesa
                  </button>
                </div>
              )}
            </div>
            
            <div className={styles.modalActions}>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleOpenExpenseModal(undefined, selectedEvent.eventId);
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

      {/* Modais de Confirmação */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita."
        type="warning"
        onConfirm={() => expenseToDelete && handleDeleteExpense(expenseToDelete)}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setExpenseToDelete(null);
        }}
        confirmText="Excluir"
        cancelText="Cancelar"
      />

      <ConfirmationModal
        isOpen={showSuccessModal}
        title="Sucesso!"
        message={successMessage || ''}
        type="success"
        onConfirm={() => setShowSuccessModal(false)}
        onCancel={() => setShowSuccessModal(false)}
        confirmText="OK"
      />

      <ErrorModal
        isOpen={showErrorModal}
        message={error || 'Erro ao processar operação'}
        onClose={() => setShowErrorModal(false)}
      />
    </div>
  );
};

export default FinancialReports;