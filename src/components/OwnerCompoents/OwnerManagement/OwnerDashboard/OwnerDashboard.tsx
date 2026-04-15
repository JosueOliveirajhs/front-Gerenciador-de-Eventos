// src/components/admin/dashboard/OwnerDashboard.tsx
import React, { useState, useEffect, useMemo } from "react";
import { 
  FiRefreshCw, 
  FiCalendar, 
  FiClock,
  FiCheckCircle,
  FiTrendingUp,
  FiBarChart2,
  FiPieChart,
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiSearch
} from 'react-icons/fi';
import { 
  MdEvent, 
  MdAttachMoney, 
  MdWarning,
  MdCheckCircle,
  MdCancel,
  MdPeople,
  MdDashboard,
  MdFilterList
} from 'react-icons/md';
import { 
  FaMoneyBillWave, 
  FaChartLine, 
  FaChartBar,
  FaBoxes
} from 'react-icons/fa';
import { dashboardService, DashboardStats } from "../../../../services/dashboard";
import { EmptyState } from "../../../common/EmptyState/EmptyState";
import { useTheme } from "../../../../context/ThemeContext";
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import styles from "./OwnerDashboard.module.css";

interface DashboardFilters {
  period: 'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM';
  selectedMonth: string;
  selectedYear: string;
  dateRange: {
    start: string;
    end: string;
  };
  eventType: string;
  status: string;
  minValue: string;
  maxValue: string;
  searchTerm: string;
}

const EVENT_TYPES = [
  { value: 'ALL', label: 'Todos os tipos' },
  { value: 'CASAMENTO', label: 'Casamento' },
  { value: 'ANIVERSARIO', label: 'Aniversário' },
  { value: 'CORPORATIVO', label: 'Corporativo' },
  { value: 'FORMATURA', label: 'Formatura' },
  { value: 'CONFRATERNIZACAO', label: 'Confraternização' },
  { value: 'OUTRO', label: 'Outro' }
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Todos os status' },
  { value: 'CONFIRMED', label: 'Confirmados' },
  { value: 'QUOTE', label: 'Em Cotação' },
  { value: 'COMPLETED', label: 'Concluídos' },
  { value: 'CANCELLED', label: 'Cancelados' }
];

export const OwnerDashboard: React.FC = () => {
  const { isDark } = useTheme();
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    confirmedEvents: 0,
    completedEvents: 0,
    cancelledEvents: 0,
    quoteEvents: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    overduePayments: 0,
    upcomingEvents: [],
    eventsByStatus: {},
    eventsByMonth: {},
    revenueByMonth: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartKey, setChartKey] = useState(0);
  
  // Estados dos filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({
    period: 'MONTH',
    selectedMonth: new Date().toISOString().slice(0, 7),
    selectedYear: new Date().getFullYear().toString(),
    dateRange: {
      start: '',
      end: ''
    },
    eventType: 'ALL',
    status: 'ALL',
    minValue: '',
    maxValue: '',
    searchTerm: ''
  });

  const textColor = isDark ? '#f1f5f9' : '#263238';
  const textSecondary = isDark ? '#cbd5e1' : '#64748b';
  const gridColor = isDark ? '#334155' : '#e0e0e0';

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [isDark]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Carregando dados do dashboard...");

      const dashboardStats = await dashboardService.getDashboardStats();
      console.log("✅ Dados recebidos:", dashboardStats);

      setStats(dashboardStats);
      setChartKey(prev => prev + 1);
    } catch (error) {
      console.error("❌ Erro ao carregar dashboard:", error);
      setError("Erro ao carregar dados do dashboard. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Handlers dos filtros
  const handleFilterChange = (field: keyof DashboardFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [field]: value }
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      period: 'MONTH',
      selectedMonth: new Date().toISOString().slice(0, 7),
      selectedYear: new Date().getFullYear().toString(),
      dateRange: {
        start: '',
        end: ''
      },
      eventType: 'ALL',
      status: 'ALL',
      minValue: '',
      maxValue: '',
      searchTerm: ''
    });
  };

  // Filtrar próximos eventos
  const filteredUpcomingEvents = useMemo(() => {
    return stats.upcomingEvents.filter(event => {
      // Filtro por busca (título ou cliente)
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const matchesTitle = event.title?.toLowerCase().includes(term);
        const matchesClient = event.client?.name?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesClient) return false;
      }

      // Filtro por tipo de evento
      if (filters.eventType !== 'ALL' && event.eventType !== filters.eventType) {
        return false;
      }

      // Filtro por status
      if (filters.status !== 'ALL' && event.status !== filters.status) {
        return false;
      }

      // Filtro por valor mínimo
      if (filters.minValue && event.totalValue < parseFloat(filters.minValue)) {
        return false;
      }

      // Filtro por valor máximo
      if (filters.maxValue && event.totalValue > parseFloat(filters.maxValue)) {
        return false;
      }

      // Filtro por período personalizado
      if (filters.period === 'CUSTOM') {
        if (filters.dateRange.start && new Date(event.eventDate) < new Date(filters.dateRange.start)) {
          return false;
        }
        if (filters.dateRange.end && new Date(event.eventDate) > new Date(filters.dateRange.end)) {
          return false;
        }
      }

      return true;
    });
  }, [stats.upcomingEvents, filters]);

  const hasActiveFilters = useMemo(() => {
    return filters.searchTerm !== '' ||
           filters.eventType !== 'ALL' ||
           filters.status !== 'ALL' ||
           filters.minValue !== '' ||
           filters.maxValue !== '' ||
           filters.period === 'CUSTOM';
  }, [filters]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatCurrencyShort = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}K`;
    }
    return `R$ ${value}`;
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      QUOTE: "Orçamento",
      CONFIRMED: "Confirmado",
      COMPLETED: "Concluído",
      CANCELLED: "Cancelado",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      QUOTE: "#3b82f6",
      CONFIRMED: "#10b981",
      COMPLETED: "#f59e0b",
      CANCELLED: "#ef4444",
    };
    return colors[status] || "#6b7280";
  };

  const statusChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      },
      background: 'transparent',
      foreColor: textSecondary
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        horizontal: true,
        distributed: true,
        barHeight: '70%',
        dataLabels: {
          position: 'top'
        }
      }
    },
    colors: Object.keys(stats.eventsByStatus).map(status => getStatusColor(status)),
    dataLabels: {
      enabled: true,
      formatter: function(val: number) {
        return val.toString();
      },
      style: {
        fontSize: '12px',
        fontWeight: 'bold',
        colors: ['#fff']
      },
      background: {
        enabled: true,
        foreColor: '#fff',
        borderRadius: 4,
        padding: 4,
        opacity: 0.9
      }
    },
    xaxis: {
      categories: Object.keys(stats.eventsByStatus).map(getStatusLabel),
      labels: {
        style: {
          fontSize: '12px',
          fontWeight: 500,
          colors: textSecondary
        }
      },
      title: {
        text: 'Quantidade de Eventos',
        style: {
          fontSize: '14px',
          fontWeight: 600,
          color: textSecondary
        }
      },
      axisBorder: {
        color: gridColor
      },
      axisTicks: {
        color: gridColor
      }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
          fontWeight: 500,
          colors: textSecondary
        }
      }
    },
    title: {
      text: 'Distribuição de Eventos por Status',
      align: 'left',
      style: {
        fontSize: '16px',
        fontWeight: 600,
        color: textColor
      }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: function(val: number) {
          return val + ' eventos';
        }
      }
    },
    legend: {
      show: false
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true
        }
      }
    }
  };

  const statusChartSeries = [{
    name: 'Eventos',
    data: Object.values(stats.eventsByStatus)
  }];

  const monthlyEventsOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: true
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      },
      background: 'transparent',
      foreColor: textSecondary
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        horizontal: false,
        columnWidth: '55%',
        dataLabels: {
          position: 'top'
        }
      }
    },
    colors: ['#3b82f6'],
    dataLabels: {
      enabled: true,
      formatter: function(val: number) {
        return val.toString();
      },
      offsetY: -20,
      style: {
        fontSize: '12px',
        fontWeight: 'bold',
        colors: [isDark ? '#93c5fd' : '#3b82f6']
      }
    },
    xaxis: {
      categories: Object.keys(stats.eventsByMonth),
      labels: {
        rotate: -45,
        style: {
          fontSize: '11px',
          fontWeight: 500,
          colors: textSecondary
        }
      },
      title: {
        text: 'Mês/Ano',
        style: {
          fontSize: '14px',
          fontWeight: 600,
          color: textSecondary
        }
      },
      axisBorder: {
        color: gridColor
      },
      axisTicks: {
        color: gridColor
      }
    },
    yaxis: {
      title: {
        text: 'Quantidade de Eventos',
        style: {
          fontSize: '14px',
          fontWeight: 600,
          color: textSecondary
        }
      },
      labels: {
        formatter: function(val: number) {
          return Math.floor(val).toString();
        },
        style: {
          colors: textSecondary
        }
      },
      min: 0
    },
    title: {
      text: 'Eventos Realizados por Mês',
      align: 'left',
      style: {
        fontSize: '16px',
        fontWeight: 600,
        color: textColor
      }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: function(val: number) {
          return val + ' eventos';
        }
      }
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
      padding: {
        top: 30,
        right: 20,
        bottom: 20,
        left: 20
      }
    }
  };

  const monthlyEventsSeries = [{
    name: 'Eventos',
    data: Object.values(stats.eventsByMonth)
  }];

  const revenueOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 400,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          pan: true
        }
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      },
      background: 'transparent',
      foreColor: textSecondary,
      dropShadow: {
        enabled: true,
        top: 3,
        left: 3,
        blur: 5,
        opacity: 0.2,
        color: '#10b981'
      }
    },
    colors: ['#10b981'],
    dataLabels: {
      enabled: true,
      formatter: function(val: number) {
        return formatCurrencyShort(val * 1000);
      },
      background: {
        enabled: true,
        foreColor: '#fff',
        borderRadius: 4,
        padding: 4,
        opacity: 0.8
      },
      offsetY: -10
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: isDark ? 'dark' : 'light',
        type: 'vertical',
        shadeIntensity: 0.4,
        gradientToColors: ['#34d399'],
        inverseColors: false,
        opacityFrom: 0.8,
        opacityTo: 0.2,
        stops: [0, 50, 100]
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    markers: {
      size: 6,
      colors: ['#10b981'],
      strokeColors: isDark ? '#1e293b' : '#fff',
      strokeWidth: 2,
      hover: {
        size: 8
      }
    },
    xaxis: {
      categories: Object.keys(stats.revenueByMonth),
      labels: {
        rotate: -45,
        style: {
          fontSize: '11px',
          fontWeight: 500,
          colors: textSecondary
        }
      },
      title: {
        text: 'Mês/Ano',
        style: {
          fontSize: '14px',
          fontWeight: 600,
          color: textSecondary
        }
      },
      axisBorder: {
        color: gridColor
      },
      axisTicks: {
        color: gridColor
      }
    },
    yaxis: {
      title: {
        text: 'Receita (R$)',
        style: {
          fontSize: '14px',
          fontWeight: 600,
          color: textSecondary
        }
      },
      labels: {
        formatter: function(val: number) {
          return formatCurrencyShort(val * 1000);
        },
        style: {
          colors: textSecondary
        }
      },
      min: 0
    },
    title: {
      text: 'Evolução da Receita Mensal',
      align: 'left',
      style: {
        fontSize: '16px',
        fontWeight: 600,
        color: textColor
      }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: function(val: number) {
          return formatCurrency(val * 1000);
        }
      }
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
      padding: {
        top: 30,
        right: 20,
        bottom: 20,
        left: 20
      }
    }
  };

  const revenueSeries = [{
    name: 'Receita',
    data: Object.values(stats.revenueByMonth).map(v => v / 1000)
  }];

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <MdWarning className={styles.errorIcon} size={48} />
        <h3>Erro ao carregar dashboard</h3>
        <p>{error}</p>
        <button onClick={loadDashboardData} className={styles.retryButton}>
          <FiRefreshCw size={18} />
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <MdDashboard size={32} />
          Dashboard
        </h1>
        <button onClick={loadDashboardData} className={styles.refreshButton}>
          <FiRefreshCw size={16} />
          Atualizar Dados
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <MdEvent size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Total de Eventos</h3>
            <p className={styles.statNumber}>{stats.totalEvents}</p>
            <div className={styles.statBreakdown}>
              <span><MdCheckCircle size={12} /> {stats.confirmedEvents} confirmados</span>
              <span><FiClock size={12} /> {stats.quoteEvents} orçamentos</span>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaMoneyBillWave size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Receita do Mês</h3>
            <p className={`${styles.statNumber} ${styles.revenue}`}>
              {formatCurrency(stats.monthlyRevenue)}
            </p>
            <div className={styles.statSubtext}>
              <MdAttachMoney size={12} />
              Total: {formatCurrency(stats.totalRevenue)}
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FiClock size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Pagamentos</h3>
            <p className={styles.statNumber}>
              <span className={styles.pending}>{stats.pendingPayments}</span>
              <span className={styles.overdue}>/{stats.overduePayments}</span>
            </p>
            <div className={styles.statBreakdown}>
              <span><FiClock size={12} /> {stats.pendingPayments} pendentes</span>
              <span><MdWarning size={12} /> {stats.overduePayments} em atraso</span>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FiCheckCircle size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Concluídos/Cancelados</h3>
            <p className={styles.statNumber}>
              {stats.completedEvents}
              <span className={styles.cancelled}>/{stats.cancelledEvents}</span>
            </p>
            <div className={styles.statBreakdown}>
              <span><FiCheckCircle size={12} /> {stats.completedEvents} concluídos</span>
              <span><MdCancel size={12} /> {stats.cancelledEvents} cancelados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartsRow}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>
                <FiPieChart size={18} />
                Distribuição por Status
              </h3>
            </div>
            {Object.keys(stats.eventsByStatus).length > 0 ? (
              <Chart
                key={`status-${chartKey}`}
                options={statusChartOptions}
                series={statusChartSeries}
                type="bar"
                height={350}
              />
            ) : (
              <div className={styles.noData}>
                <FiBarChart2 size={32} />
                <p>Sem dados de status para exibir</p>
              </div>
            )}
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>
                <FaChartBar size={18} />
                Eventos por Mês
              </h3>
            </div>
            {Object.keys(stats.eventsByMonth).length > 0 ? (
              <Chart
                key={`monthly-${chartKey}`}
                options={monthlyEventsOptions}
                series={monthlyEventsSeries}
                type="bar"
                height={350}
              />
            ) : (
              <div className={styles.noData}>
                <FiBarChart2 size={32} />
                <p>Sem dados mensais para exibir</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.chartsRow}>
          <div className={`${styles.chartCard} ${styles.fullWidth}`}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>
                <FaChartLine size={18} />
                Evolução da Receita Mensal
              </h3>
            </div>
            {Object.keys(stats.revenueByMonth).length > 0 ? (
              <Chart
                key={`revenue-${chartKey}`}
                options={revenueOptions}
                series={revenueSeries}
                type="area"
                height={400}
              />
            ) : (
              <div className={styles.noData}>
                <FiTrendingUp size={32} />
                <p>Sem dados de receita para exibir</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========== FILTROS DE EVENTOS ========== */}
      <div className={styles.eventsFiltersSection}>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={styles.filterToggle}
        >
          <MdFilterList size={18} />
          {showFilters ? 'Ocultar filtros' : 'Filtrar eventos'}
          {hasActiveFilters && (
            <span className={styles.filterCount}>
              {filteredUpcomingEvents.length}/{stats.upcomingEvents.length}
            </span>
          )}
          {showFilters ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        </button>

        {showFilters && (
          <div className={styles.filtersPanel}>
            {/* Barra de busca */}
            <div className={styles.searchBox}>
              <FiSearch size={16} />
              <input
                type="text"
                placeholder="Buscar por título ou cliente..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className={styles.searchInput}
              />
              {filters.searchTerm && (
                <button 
                  onClick={() => handleFilterChange('searchTerm', '')}
                  className={styles.clearSearchButton}
                >
                  <FiX size={14} />
                </button>
              )}
            </div>

            <div className={styles.filtersGrid}>
              {/* Período */}
              <div className={styles.filterGroup}>
                <label><FiCalendar size={14} /> Período</label>
                <select
                  value={filters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="MONTH">Mês atual</option>
                  <option value="QUARTER">Trimestre</option>
                  <option value="YEAR">Ano</option>
                  <option value="CUSTOM">Personalizado</option>
                </select>
              </div>

              {/* Período Personalizado */}
              {filters.period === 'CUSTOM' && (
                <div className={styles.filterGroup}>
                  <label><FiCalendar size={14} /> Intervalo</label>
                  <div className={styles.dateRangeInputs}>
                    <input
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) => handleDateRangeChange('start', e.target.value)}
                      className={styles.dateInput}
                    />
                    <span>até</span>
                    <input
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) => handleDateRangeChange('end', e.target.value)}
                      className={styles.dateInput}
                    />
                  </div>
                </div>
              )}

              {/* Tipo de Evento */}
              <div className={styles.filterGroup}>
                <label><MdEvent size={14} /> Tipo de Evento</label>
                <select
                  value={filters.eventType}
                  onChange={(e) => handleFilterChange('eventType', e.target.value)}
                  className={styles.filterSelect}
                >
                  {EVENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className={styles.filterGroup}>
                <label><FiCheckCircle size={14} /> Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className={styles.filterSelect}
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              {/* Faixa de Valor */}
              <div className={styles.filterGroup}>
                <label><MdAttachMoney size={14} /> Valor do Evento</label>
                <div className={styles.valueRangeInputs}>
                  <input
                    type="number"
                    placeholder="Mínimo"
                    value={filters.minValue}
                    onChange={(e) => handleFilterChange('minValue', e.target.value)}
                    className={styles.valueInput}
                    min="0"
                    step="100"
                  />
                  <span>até</span>
                  <input
                    type="number"
                    placeholder="Máximo"
                    value={filters.maxValue}
                    onChange={(e) => handleFilterChange('maxValue', e.target.value)}
                    className={styles.valueInput}
                    min="0"
                    step="100"
                  />
                </div>
              </div>
            </div>

            {/* Ações dos filtros */}
            <div className={styles.filtersActions}>
              <span className={styles.filterResults}>
                <strong>{filteredUpcomingEvents.length}</strong> evento(s) encontrado(s)
                {hasActiveFilters && ` de ${stats.upcomingEvents.length}`}
              </span>
              {hasActiveFilters && (
                <button 
                  onClick={handleClearFilters}
                  className={styles.clearFiltersButton}
                >
                  <FiX size={14} />
                  Limpar Todos os Filtros
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Próximos Eventos */}
      <div className={styles.upcomingEvents}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <FiCalendar size={20} />
            Próximos Eventos
          </h2>
          <span className={styles.sectionBadge}>
            {filteredUpcomingEvents.length}
          </span>
        </div>

        {filteredUpcomingEvents.length === 0 ? (
          <EmptyState
            icon={<FiCalendar size={48} />}
            title="Nenhum evento próximo"
            description={hasActiveFilters 
              ? "Nenhum evento corresponde aos filtros aplicados."
              : "Não há eventos confirmados para os próximos dias."
            }
            action={hasActiveFilters ? {
              label: 'Limpar Filtros',
              onClick: handleClearFilters,
              icon: <FiX />
            } : undefined}
          />
        ) : (
          <div className={styles.eventsList}>
            {filteredUpcomingEvents.map((event) => (
              <div key={event.id} className={styles.eventCard}>
                <div className={styles.eventDate}>
                  <span className={styles.dateDay}>
                    {new Date(event.eventDate).getDate()}
                  </span>
                  <span className={styles.dateMonth}>
                    {new Date(event.eventDate).toLocaleDateString("pt-BR", { month: "short" })}
                  </span>
                </div>
                <div className={styles.eventInfo}>
                  <h4 className={styles.eventTitle}>{event.title}</h4>
                  <p className={styles.eventDetails}>
                    <FaBoxes size={12} /> {event.guestCount} convidados • {event.eventType}
                  </p>
                  <p className={styles.clientName}>
                    <MdPeople size={12} />
                    <strong>Cliente:</strong> {event.client?.name || "N/A"}
                  </p>
                </div>
                <div className={styles.eventValue}>
                  <span className={styles.valueAmount}>
                    <MdAttachMoney size={14} />
                    {formatCurrency(event.totalValue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};