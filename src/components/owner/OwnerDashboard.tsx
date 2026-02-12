import React, { useState, useEffect } from "react";
import { Event } from "../../types/Event";
import { dashboardService, DashboardStats } from "../../services/dashboard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts";
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

  // Funções auxiliares
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
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
      QUOTE: "#0088FE",
      CONFIRMED: "#00C49F",
      COMPLETED: "#FFBB28",
      CANCELLED: "#FF8042",
    };
    return colors[status] || "#8884d8";
  };

  const formatDate = (dateString: string) => {
    // Corrigir problema de timezone - adicionar timezone do Brasil
    const date = new Date(dateString + "T00:00:00-03:00");
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Função para corrigir datas ao exibir
  const getCorrectedDate = (dateString: string): Date => {
    return new Date(dateString + "T00:00:00-03:00");
  };

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
      console.log("📅 Próximos eventos:", dashboardStats.upcomingEvents);

      setStats(dashboardStats);
    } catch (error) {
      console.error("❌ Erro ao carregar dashboard:", error);
      setError("Erro ao carregar dados do dashboard. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Dados para gráfico de barras HORIZONTAL (Eventos por Status)
  const statusChartData = Object.entries(stats.eventsByStatus)
    .map(([name, value]) => ({
      name: getStatusLabel(name),
      Quantidade: value,
      cor: getStatusColor(name),
    }))
    .sort((a, b) => b.Quantidade - a.Quantidade); // Ordenar do maior para o menor

  // Dados para gráfico de barras VERTICAL (Eventos por Mês)
  const monthlyEventsData = Object.entries(stats.eventsByMonth).map(
    ([name, value]) => ({
      name,
      Eventos: value,
    }),
  );

  // Dados para gráfico de linha (Receita por Mês)
  const monthlyRevenueData = Object.entries(stats.revenueByMonth).map(
    ([name, value]) => ({
      name,
      Receita: typeof value === "number" ? value : 0,
    }),
  );

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
        <div className={styles.errorIcon}>⚠️</div>
        <h3>Erro ao carregar dashboard</h3>
        <p>{error}</p>
        <button onClick={loadDashboardData} className={styles.retryButton}>
          🔄 Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <button onClick={loadDashboardData} className={styles.refreshButton}>
          🔄 Atualizar
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Total de Eventos</h3>
            <p className={styles.statNumber}>{stats.totalEvents}</p>
            <div className={styles.statBreakdown}>
              <span>✅ {stats.confirmedEvents} confirmados</span>
              <span>📝 {stats.quoteEvents} orçamentos</span>
            </div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Receita do Mês</h3>
            <p className={`${styles.statNumber} ${styles.revenue}`}>
              {formatCurrency(stats.monthlyRevenue)}
            </p>
            <div className={styles.statSubtext}>
              Total: {formatCurrency(stats.totalRevenue)}
            </div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statIcon}>⏳</div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Pagamentos</h3>
            <p className={styles.statNumber}>
              <span className={styles.pending}>{stats.pendingPayments}</span>
              <span className={styles.overdue}>/{stats.overduePayments}</span>
            </p>
            <div className={styles.statBreakdown}>
              <span>⏳ {stats.pendingPayments} pendentes</span>
              <span>🚨 {stats.overduePayments} em atraso</span>
            </div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Concluídos/Cancelados</h3>
            <p className={styles.statNumber}>
              {stats.completedEvents}
              <span className={styles.cancelled}>/{stats.cancelledEvents}</span>
            </p>
            <div className={styles.statBreakdown}>
              <span>🎉 {stats.completedEvents} concluídos</span>
              <span>❌ {stats.cancelledEvents} cancelados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className={styles.chartsGrid}>
        {/* NOVO: Gráfico de Barras HORIZONTAL - Eventos por Status */}
        <div className={`${styles.chartCard} ${styles.card}`}>
          <h3 className={styles.chartTitle}>Eventos por Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={statusChartData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => [`${value} eventos`, "Quantidade"]}
                labelFormatter={(label) => `Status: ${label}`}
              />
              <Legend />
              <Bar dataKey="Quantidade" name="Eventos">
                {statusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Barras VERTICAL - Eventos por Mês */}
        <div className={`${styles.chartCard} ${styles.card}`}>
          <h3 className={styles.chartTitle}>
            Eventos por Mês (Últimos 6 meses)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyEventsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${value} eventos`, "Quantidade"]}
              />
              <Legend />
              <Bar dataKey="Eventos" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Linha - Receita por Mês */}
        <div className={`${styles.chartCard} ${styles.card}`}>
          <h3 className={styles.chartTitle}>
            Receita por Mês (Últimos 6 meses)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `R$ ${value / 1000}k`} />
              <Tooltip
                formatter={(value) => [
                  formatCurrency(Number(value)),
                  "Receita",
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Receita"
                stroke="#00C49F"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Próximos Eventos */}
      <div className={`${styles.upcomingEvents} ${styles.card}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Próximos Eventos</h2>
          <span className={styles.sectionBadge}>
            {stats.upcomingEvents.length}
          </span>
        </div>

        {stats.upcomingEvents.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📅</div>
            <h4 className={styles.emptyTitle}>Nenhum evento próximo</h4>
            <p className={styles.emptyText}>
              Não há eventos confirmados para os próximos dias.
              <br />
              Verifique se existem eventos com status "CONFIRMED" e datas
              futuras.
            </p>
            <button onClick={loadDashboardData} className={styles.retryButton}>
              🔄 Verificar Novamente
            </button>
          </div>
        ) : (
          <div className={styles.eventsList}>
            {stats.upcomingEvents.map((event) => (
              <div
                key={event.id}
                className={`${styles.eventCard} ${styles.cardHover}`}
              >
                <div className={styles.eventDate}>
                  <span className={styles.dateDay}>
                    {getCorrectedDate(event.eventDate).getDate()}
                  </span>
                  <span className={styles.dateMonth}>
                    {getCorrectedDate(event.eventDate).toLocaleDateString(
                      "pt-BR",
                      { month: "short" },
                    )}
                  </span>
                  <span className={styles.dateYear}>
                    {getCorrectedDate(event.eventDate).getFullYear()}
                  </span>
                </div>
                <div className={styles.eventInfo}>
                  <h4 className={styles.eventTitle}>{event.title}</h4>
                  <p className={styles.eventDetails}>
                    {event.guestCount} convidados • {event.eventType}
                  </p>
                  <p className={styles.eventDateFull}>
                    📅 {formatDate(event.eventDate)}
                  </p>
                  <p className={styles.clientName}>
                    <strong>Cliente:</strong> {event.client?.name || "N/A"}
                  </p>
                </div>
                <div className={styles.eventValue}>
                  <span className={styles.valueAmount}>
                    {formatCurrency(event.totalValue)}
                  </span>
                  <span
                    className={styles.eventStatus}
                    data-status={event.status.toLowerCase()}
                  >
                    {getStatusLabel(event.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Debug Info (remover em produção) */}
      {/* <div className={styles.debugInfo}>
        <details>
          <summary>🔧 Informações de Debug</summary>
          <div className={styles.debugContent}>
            <p><strong>Total de Eventos:</strong> {stats.totalEvents}</p>
            <p><strong>Confirmados:</strong> {stats.confirmedEvents}</p>
            <p><strong>Próximos Eventos:</strong> {stats.upcomingEvents.length}</p>
            <pre>{JSON.stringify(stats.upcomingEvents, null, 2)}</pre>
          </div>
        </details>
      </div> */}
    </div>
  );
};
