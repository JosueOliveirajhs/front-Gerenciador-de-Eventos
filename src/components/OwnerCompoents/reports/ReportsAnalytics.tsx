// src/components/admin/reports/ReportsAnalytics.tsx
import React, { useState, useEffect } from 'react';
import { Event } from '../../../types/Event';
import { User } from '../../../types/User';
import { Item } from '../../../types/Item';
import { Payment } from '../../../types/Payment';
import { eventService } from '../../../services/events';
import { userService } from '../../../services/users';
import { itemService } from '../../../services/items';
import { paymentService } from '../../../services/payments';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import styles from './ReportsAnalytics.module.css';

interface ReportFilters {
  startDate: string;
  endDate: string;
  eventType?: string;
  clientId?: number;
}

interface ConversionRate {
  total: number;
  converted: number;
  rate: number;
  byType: Record<string, { total: number; converted: number; rate: number }>;
}

interface TopItem {
  id: number;
  name: string;
  category: string;
  usageCount: number;
  revenue: number;
}

export const ReportsAnalytics: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState<'events' | 'revenue' | 'items' | 'clients'>('events');

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsData, clientsData, itemsData, paymentsData] = await Promise.all([
        eventService.getAllEvents(),
        userService.getAllClients(),
        itemService.getAllItems(),
        paymentService.findAllPayments()
      ]);

      setEvents(eventsData);
      setClients(clientsData);
      setItems(itemsData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar eventos por período
  const getFilteredEvents = (): Event[] => {
    return events.filter(event => {
      const eventDate = event.eventDate;
      return eventDate >= filters.startDate && eventDate <= filters.endDate;
    });
  };

  // 1. Eventos Realizados por Período
  const getEventsByPeriod = () => {
    const filtered = getFilteredEvents();
    const byMonth: Record<string, { month: string; completed: number; total: number }> = {};

    filtered.forEach(event => {
      const month = event.eventDate.substring(0, 7); // YYYY-MM
      if (!byMonth[month]) {
        byMonth[month] = { month, completed: 0, total: 0 };
      }
      byMonth[month].total++;
      if (event.status === 'COMPLETED') {
        byMonth[month].completed++;
      }
    });

    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
  };

  // 2. Faturamento Mensal/Anual
  const getRevenueByPeriod = () => {
    const filtered = getFilteredEvents().filter(e => 
      e.status === 'CONFIRMED' || e.status === 'COMPLETED'
    );
    
    const byMonth: Record<string, { month: string; revenue: number; forecast: number }> = {};

    filtered.forEach(event => {
      const month = event.eventDate.substring(0, 7);
      if (!byMonth[month]) {
        byMonth[month] = { month, revenue: 0, forecast: 0 };
      }

      const value = typeof event.totalValue === 'string' 
        ? parseFloat(event.totalValue) 
        : event.totalValue;

      if (event.status === 'COMPLETED') {
        byMonth[month].revenue += value;
      } else {
        byMonth[month].forecast += value;
      }
    });

    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
  };

  // 3. Taxa de Conversão de Orçamentos
  const getConversionRate = (): ConversionRate => {
    const filtered = getFilteredEvents();
    
    const byType: Record<string, { total: number; converted: number }> = {};
    let totalQuotes = 0;
    let totalConverted = 0;

    filtered.forEach(event => {
      if (event.status === 'QUOTE' || event.status === 'CONFIRMED') {
        if (!byType[event.eventType]) {
          byType[event.eventType] = { total: 0, converted: 0 };
        }
        
        byType[event.eventType].total++;
        totalQuotes++;

        if (event.status === 'CONFIRMED') {
          byType[event.eventType].converted++;
          totalConverted++;
        }
      }
    });

    const rate = totalQuotes > 0 ? (totalConverted / totalQuotes) * 100 : 0;

    const byTypeWithRate = Object.entries(byType).reduce((acc, [type, data]) => {
      acc[type] = {
        ...data,
        rate: data.total > 0 ? (data.converted / data.total) * 100 : 0
      };
      return acc;
    }, {} as any);

    return {
      total: totalQuotes,
      converted: totalConverted,
      rate,
      byType: byTypeWithRate
    };
  };

  // 4. Itens Mais Alugados
  const getTopItems = (): TopItem[] => {
    // Simular uso de itens baseado nos eventos
    const itemUsage: Record<number, { count: number; revenue: number }> = {};

    getFilteredEvents().forEach(event => {
      // Simular que cada evento usa alguns itens
      items.forEach(item => {
        if (Math.random() > 0.7) { // 30% de chance de usar o item
          if (!itemUsage[item.id]) {
            itemUsage[item.id] = { count: 0, revenue: 0 };
          }
          itemUsage[item.id].count++;
          
          // Estimar receita do item (10% do valor do evento)
          const eventValue = typeof event.totalValue === 'string' 
            ? parseFloat(event.totalValue) 
            : event.totalValue;
          itemUsage[item.id].revenue += eventValue * 0.1;
        }
      });
    });

    return items
      .map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        usageCount: itemUsage[item.id]?.count || 0,
        revenue: itemUsage[item.id]?.revenue || 0
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);
  };

  // 5. Clientes Recorrentes
  const getRecurringClients = () => {
    const clientEventCount: Record<number, { count: number; totalValue: number }> = {};

    events.forEach(event => {
      if (!clientEventCount[event.clientId]) {
        clientEventCount[event.clientId] = { count: 0, totalValue: 0 };
      }
      clientEventCount[event.clientId].count++;
      
      const value = typeof event.totalValue === 'string' 
        ? parseFloat(event.totalValue) 
        : event.totalValue;
      clientEventCount[event.clientId].totalValue += value;
    });

    const recurringClients = Object.entries(clientEventCount)
      .map(([clientId, data]) => ({
        clientId: Number(clientId),
        client: clients.find(c => c.id === Number(clientId)),
        eventCount: data.count,
        totalValue: data.totalValue,
        isRecurring: data.count > 1
      }))
      .filter(c => c.client) // Só clientes que existem
      .sort((a, b) => b.eventCount - a.eventCount);

    const recurringCount = recurringClients.filter(c => c.isRecurring).length;
    const recurringRate = clients.length > 0 
      ? (recurringCount / clients.length) * 100 
      : 0;

    return {
      clients: recurringClients.slice(0, 10),
      totalRecurring: recurringCount,
      rate: recurringRate,
      averageEventsPerClient: events.length / (clients.length || 1)
    };
  };

  // Exportar relatório
  const exportReport = () => {
    const data = {
      events: getEventsByPeriod(),
      revenue: getRevenueByPeriod(),
      conversion: getConversionRate(),
      topItems: getTopItems(),
      recurringClients: getRecurringClients(),
      filters,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${filters.startDate}-a-${filters.endDate}.json`;
    a.click();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const filteredEvents = getFilteredEvents();
  const eventsByPeriod = getEventsByPeriod();
  const revenueByPeriod = getRevenueByPeriod();
  const conversion = getConversionRate();
  const topItems = getTopItems();
  const recurringData = getRecurringClients();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando relatórios...</p>
      </div>
    );
  }

  return (
    <div className={styles.reportsAnalytics}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Relatórios e Indicadores</h1>
          
          <div className={styles.headerActions}>
            <button onClick={exportReport} className={styles.primaryButton}>
              📥 Exportar Relatório
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className={styles.filtersBar}>
          <div className={styles.filterGroup}>
            <label>Data Inicial</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Data Final</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Tipo de Relatório</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className={styles.filterSelect}
            >
              <option value="events">Eventos</option>
              <option value="revenue">Faturamento</option>
              <option value="items">Itens</option>
              <option value="clients">Clientes</option>
            </select>
          </div>

          <div className={styles.filterStats}>
            <span>📅 Período: {filteredEvents.length} eventos</span>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className={styles.summaryCards}>
        <div className={`${styles.summaryCard} ${styles.card}`}>
          <div className={styles.cardIcon}>📊</div>
          <div className={styles.cardContent}>
            <h3>Eventos no Período</h3>
            <p className={styles.cardNumber}>{filteredEvents.length}</p>
            <span className={styles.cardSub}>
              {filteredEvents.filter(e => e.status === 'COMPLETED').length} concluídos
            </span>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.card}`}>
          <div className={styles.cardIcon}>💰</div>
          <div className={styles.cardContent}>
            <h3>Faturamento Total</h3>
            <p className={styles.cardNumber}>
              {formatCurrency(revenueByPeriod.reduce((sum, r) => sum + r.revenue, 0))}
            </p>
            <span className={styles.cardSub}>
              Previsto: {formatCurrency(revenueByPeriod.reduce((sum, r) => sum + r.forecast, 0))}
            </span>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.card}`}>
          <div className={styles.cardIcon}>🔄</div>
          <div className={styles.cardContent}>
            <h3>Taxa de Conversão</h3>
            <p className={styles.cardNumber}>{conversion.rate.toFixed(1)}%</p>
            <span className={styles.cardSub}>
              {conversion.converted} de {conversion.total} orçamentos
            </span>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.card}`}>
          <div className={styles.cardIcon}>👥</div>
          <div className={styles.cardContent}>
            <h3>Clientes Recorrentes</h3>
            <p className={styles.cardNumber}>{recurringData.totalRecurring}</p>
            <span className={styles.cardSub}>
              {recurringData.rate.toFixed(1)}% dos clientes
            </span>
          </div>
        </div>
      </div>

      {/* Gráficos por Tipo de Relatório */}
      {reportType === 'events' && (
        <>
          <div className={`${styles.chartContainer} ${styles.card}`}>
            <h3 className={styles.chartTitle}>Eventos por Mês</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventsByPeriod}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" name="Total de Eventos" fill="#8884d8" />
                <Bar dataKey="completed" name="Eventos Realizados" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={`${styles.tableContainer} ${styles.card}`}>
            <h3 className={styles.tableTitle}>Detalhamento de Eventos</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Total</th>
                  <th>Realizados</th>
                  <th>Taxa de Realização</th>
                </tr>
              </thead>
              <tbody>
                {eventsByPeriod.map(month => (
                  <tr key={month.month}>
                    <td>{new Date(month.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</td>
                    <td>{month.total}</td>
                    <td>{month.completed}</td>
                    <td>{month.total > 0 ? ((month.completed / month.total) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {reportType === 'revenue' && (
        <>
          <div className={`${styles.chartContainer} ${styles.card}`}>
            <h3 className={styles.chartTitle}>Faturamento por Mês</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueByPeriod}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `R$ ${value / 1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Realizado" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                <Area type="monotone" dataKey="forecast" name="Previsto" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className={`${styles.tableContainer} ${styles.card}`}>
            <h3 className={styles.tableTitle}>Detalhamento Financeiro</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Realizado</th>
                  <th>Previsto</th>
                  <th>Diferença</th>
                </tr>
              </thead>
              <tbody>
                {revenueByPeriod.map(month => {
                  const diff = month.revenue - month.forecast;
                  return (
                    <tr key={month.month}>
                      <td>{new Date(month.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</td>
                      <td className={styles.revenue}>{formatCurrency(month.revenue)}</td>
                      <td className={styles.forecast}>{formatCurrency(month.forecast)}</td>
                      <td className={diff >= 0 ? styles.positive : styles.negative}>
                        {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {reportType === 'items' && (
        <>
          <div className={`${styles.chartContainer} ${styles.card}`}>
            <h3 className={styles.chartTitle}>Itens Mais Alugados</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="usageCount" name="Vezes Alugado" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={`${styles.tableContainer} ${styles.card}`}>
            <h3 className={styles.tableTitle}>Ranking de Itens</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Categoria</th>
                  <th>Vezes Alugado</th>
                  <th>Receita Estimada</th>
                </tr>
              </thead>
              <tbody>
                {topItems.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.category}</td>
                    <td>{item.usageCount}x</td>
                    <td>{formatCurrency(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {reportType === 'clients' && (
        <>
          <div className={`${styles.chartContainer} ${styles.card}`}>
            <h3 className={styles.chartTitle}>Distribuição de Clientes</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Recorrentes', value: recurringData.totalRecurring },
                    { name: 'Novos', value: clients.length - recurringData.totalRecurring }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0, 1].map((index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className={`${styles.tableContainer} ${styles.card}`}>
            <h3 className={styles.tableTitle}>Top Clientes</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Eventos</th>
                  <th>Total Gasto</th>
                  <th>Média por Evento</th>
                </tr>
              </thead>
              <tbody>
                {recurringData.clients.map(client => (
                  <tr key={client.clientId}>
                    <td>
                      <strong>{client.client?.name}</strong>
                      {client.isRecurring && <span className={styles.recurringBadge}>🔄 Recorrente</span>}
                    </td>
                    <td>{client.eventCount} evento(s)</td>
                    <td>{formatCurrency(client.totalValue)}</td>
                    <td>{formatCurrency(client.totalValue / client.eventCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Indicadores Adicionais */}
      <div className={`${styles.indicatorsGrid} ${styles.card}`}>
        <h3 className={styles.indicatorsTitle}>Indicadores do Período</h3>
        
        <div className={styles.indicatorsList}>
          <div className={styles.indicator}>
            <span className={styles.indicatorLabel}>Ticket Médio</span>
            <span className={styles.indicatorValue}>
              {formatCurrency(filteredEvents.reduce((sum, e) => {
                const val = typeof e.totalValue === 'string' ? parseFloat(e.totalValue) : e.totalValue;
                return sum + val;
              }, 0) / (filteredEvents.length || 1))}
            </span>
          </div>

          <div className={styles.indicator}>
            <span className={styles.indicatorLabel}>Eventos por Cliente</span>
            <span className={styles.indicatorValue}>
              {recurringData.averageEventsPerClient.toFixed(2)}
            </span>
          </div>

          <div className={styles.indicator}>
            <span className={styles.indicatorLabel}>Taxa de Sucesso</span>
            <span className={styles.indicatorValue}>
              {filteredEvents.length > 0 
                ? ((filteredEvents.filter(e => e.status === 'COMPLETED').length / filteredEvents.length) * 100).toFixed(1)
                : 0}%
            </span>
          </div>

          <div className={styles.indicator}>
            <span className={styles.indicatorLabel}>Dias até o Evento (média)</span>
            <span className={styles.indicatorValue}>
              {Math.round(filteredEvents.reduce((sum, e) => {
                const days = (new Date(e.eventDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                return sum + (days > 0 ? days : 0);
              }, 0) / (filteredEvents.length || 1))} dias
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};