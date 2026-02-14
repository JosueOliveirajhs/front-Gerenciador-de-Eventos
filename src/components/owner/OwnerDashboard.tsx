// src/components/admin/dashboard/OwnerDashboard.tsx

import React, { useState, useEffect } from "react";
import { 
  FiRefreshCw, 
  FiCalendar, 
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiBarChart2,
  FiPieChart
} from 'react-icons/fi';
import { 
  MdEvent, 
  MdAttachMoney, 
  MdWarning,
  MdCheckCircle,
  MdCancel,
  MdPeople,
  MdAssessment,
  MdDashboard
} from 'react-icons/md';
import { 
  FaMoneyBillWave, 
  FaChartLine, 
  FaChartBar,
  FaCalendarCheck,
  FaBoxes
} from 'react-icons/fa';
import { dashboardService, DashboardStats } from "../../services/dashboard";
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import styles from "./OwnerDashboard.module.css";

export const OwnerDashboard: React.FC = () => {
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
  const [chartKey, setChartKey] = useState(0); // Forçar recriação dos gráficos

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Carregando dados do dashboard...");

      const dashboardStats = await dashboardService.getDashboardStats();
      console.log("✅ Dados recebidos:", dashboardStats);

      setStats(dashboardStats);
      setChartKey(prev => prev + 1); // Forçar recriação dos gráficos
    } catch (error) {
      console.error("❌ Erro ao carregar dashboard:", error);
      setError("Erro ao carregar dados do dashboard. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: JSX.Element } = {
      QUOTE: <FiClock size={16} />,
      CONFIRMED: <MdCheckCircle size={16} />,
      COMPLETED: <FiCheckCircle size={16} />,
      CANCELLED: <MdCancel size={16} />,
    };
    return icons[status] || <MdEvent size={16} />;
  };

  // ✅ GRÁFICO 1: Eventos por Status (Barras Horizontais)
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
      background: 'transparent'
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
          fontWeight: 500
        }
      },
      title: {
        text: 'Quantidade de Eventos',
        style: {
          fontSize: '14px',
          fontWeight: 600
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
          fontWeight: 500
        }
      }
    },
    title: {
      text: 'Distribuição de Eventos por Status',
      align: 'left',
      style: {
        fontSize: '16px',
        fontWeight: 600,
        color: '#263238'
      }
    },
    tooltip: {
      theme: 'dark',
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
      borderColor: '#e0e0e0',
      strokeDashArray: 4
    }
  };

  const statusChartSeries = [{
    name: 'Eventos',
    data: Object.values(stats.eventsByStatus)
  }];

  // ✅ GRÁFICO 2: Eventos por Mês (Barras Verticais)
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
      stacked: false,
      sparkline: {
        enabled: false
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        horizontal: false,
        columnWidth: '55%',
        distributed: false,
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
        colors: ['#3b82f6']
      }
    },
    xaxis: {
      categories: Object.keys(stats.eventsByMonth),
      labels: {
        rotate: -45,
        rotateAlways: false,
        style: {
          fontSize: '11px',
          fontWeight: 500
        }
      },
      title: {
        text: 'Mês/Ano',
        style: {
          fontSize: '14px',
          fontWeight: 600
        }
      }
    },
    yaxis: {
      title: {
        text: 'Quantidade de Eventos',
        style: {
          fontSize: '14px',
          fontWeight: 600
        }
      },
      labels: {
        formatter: function(val: number) {
          return Math.floor(val).toString();
        }
      },
      min: 0,
      forceNiceScale: true
    },
    title: {
      text: 'Eventos Realizados por Mês',
      align: 'left',
      style: {
        fontSize: '16px',
        fontWeight: 600,
        color: '#263238'
      }
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: function(val: number) {
          return val + ' eventos';
        }
      }
    },
    grid: {
      borderColor: '#e0e0e0',
      strokeDashArray: 4,
      padding: {
        top: 30,
        right: 20,
        bottom: 20,
        left: 20
      }
    },
    markers: {
      size: 0
    }
  };

  const monthlyEventsSeries = [{
    name: 'Eventos',
    data: Object.values(stats.eventsByMonth)
  }];

  // ✅ GRÁFICO 3: Receita por Mês (Área com gradiente)
  const revenueOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 350,
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
        shade: 'light',
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
      width: 3,
      lineCap: 'round'
    },
    markers: {
      size: 6,
      colors: ['#10b981'],
      strokeColors: '#fff',
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
          fontWeight: 500
        }
      },
      title: {
        text: 'Mês/Ano',
        style: {
          fontSize: '14px',
          fontWeight: 600
        }
      },
      axisBorder: {
        show: true,
        color: '#e0e0e0'
      }
    },
    yaxis: {
      title: {
        text: 'Receita (R$)',
        style: {
          fontSize: '14px',
          fontWeight: 600
        }
      },
      labels: {
        formatter: function(val: number) {
          return formatCurrencyShort(val * 1000);
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
        color: '#263238'
      }
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: function(val: number) {
          return formatCurrency(val * 1000);
        }
      }
    },
    grid: {
      borderColor: '#e0e0e0',
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
    data: Object.values(stats.revenueByMonth).map(v => v / 1000) // Em milhares
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
        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statIcon}>
            <MdEvent size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Total de Eventos</h3>
            <p className={styles.statNumber}>{stats.totalEvents}</p>
            <div className={styles.statBreakdown}>
              <span>
                <MdCheckCircle size={12} /> {stats.confirmedEvents} confirmados
              </span>
              <span>
                <FiClock size={12} /> {stats.quoteEvents} orçamentos
              </span>
            </div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.card}`}>
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

        <div className={`${styles.statCard} ${styles.card}`}>
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
              <span>
                <FiClock size={12} /> {stats.pendingPayments} pendentes
              </span>
              <span>
                <MdWarning size={12} /> {stats.overduePayments} em atraso
              </span>
            </div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.card}`}>
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
              <span>
                <FiCheckCircle size={12} /> {stats.completedEvents} concluídos
              </span>
              <span>
                <MdCancel size={12} /> {stats.cancelledEvents} cancelados
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos com ApexCharts */}
      <div className={styles.chartsGrid}>
        {/* Linha 1: Status (esquerda) e Eventos Mensais (direita) */}
        <div className={styles.chartsRow}>
          <div className={`${styles.chartCard} ${styles.card}`}>
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

          <div className={`${styles.chartCard} ${styles.card}`}>
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

        {/* Linha 2: Receita (largura total) */}
        <div className={styles.chartsRow}>
          <div className={`${styles.chartCard} ${styles.card} ${styles.fullWidth}`}>
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

      {/* Próximos Eventos */}
      <div className={`${styles.upcomingEvents} ${styles.card}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <FiCalendar size={20} />
            Próximos Eventos
          </h2>
          <span className={styles.sectionBadge}>
            {stats.upcomingEvents.length}
          </span>
        </div>

        {stats.upcomingEvents.length === 0 ? (
          <EmptyState
            icon={<FiCalendar size={48} />}
            title="Nenhum evento próximo"
            description="Não há eventos confirmados para os próximos dias."
          />
        ) : (
          <div className={styles.eventsList}>
            {stats.upcomingEvents.map((event) => (
              <div key={event.id} className={`${styles.eventCard} ${styles.cardHover}`}>
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