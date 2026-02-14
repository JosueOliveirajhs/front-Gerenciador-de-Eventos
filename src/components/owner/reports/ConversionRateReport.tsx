// src/components/admin/reports/ConversionRateReport.tsx

import React, { useState, useEffect } from 'react';
import { Event } from '../../types/Event';
import { eventService } from '../../services/events';
import { LoadingSpinner } from '../common/LoadingSpinner';
import styles from './ConversionRateReport.module.css';

interface ConversionData {
    period: string;
    quotes: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    conversionRate: number;
    completionRate: number;
    averageValue: number;
    totalValue: number;
}

export const ConversionRateReport: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
    const [conversionData, setConversionData] = useState<ConversionData[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        calculateConversionRates();
    }, [events, selectedPeriod]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await eventService.getAllEvents();
            setEvents(data);
        } catch (error) {
            console.error('Erro ao carregar eventos:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateConversionRates = () => {
        const groupedData: Record<string, ConversionData> = {};
        
        events.forEach(event => {
            const date = new Date(event.eventDate);
            let periodKey = '';
            
            if (selectedPeriod === 'month') {
                periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            } else if (selectedPeriod === 'quarter') {
                const quarter = Math.floor(date.getMonth() / 3) + 1;
                periodKey = `${date.getFullYear()}-T${quarter}`;
            } else {
                periodKey = `${date.getFullYear()}`;
            }

            if (!groupedData[periodKey]) {
                groupedData[periodKey] = {
                    period: periodKey,
                    quotes: 0,
                    confirmed: 0,
                    completed: 0,
                    cancelled: 0,
                    conversionRate: 0,
                    completionRate: 0,
                    averageValue: 0,
                    totalValue: 0
                };
            }

            groupedData[periodKey].quotes++;
            groupedData[periodKey].totalValue += event.totalValue;

            if (event.status === 'CONFIRMED') {
                groupedData[periodKey].confirmed++;
            } else if (event.status === 'COMPLETED') {
                groupedData[periodKey].completed++;
            } else if (event.status === 'CANCELLED') {
                groupedData[periodKey].cancelled++;
            }
        });

        // Calcular taxas
        Object.values(groupedData).forEach(data => {
            const totalConverted = data.confirmed + data.completed;
            data.conversionRate = data.quotes > 0 
                ? (totalConverted / data.quotes) * 100 
                : 0;
            
            data.completionRate = data.confirmed > 0 
                ? (data.completed / (data.confirmed + data.completed)) * 100 
                : 0;
            
            data.averageValue = data.quotes > 0 
                ? data.totalValue / data.quotes 
                : 0;
        });

        // Ordenar por período
        const sorted = Object.values(groupedData).sort((a, b) => 
            a.period.localeCompare(b.period)
        ).slice(-6); // Últimos 6 períodos

        setConversionData(sorted);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getRateColor = (rate: number): string => {
        if (rate >= 70) return '#10b981';
        if (rate >= 50) return '#f59e0b';
        if (rate >= 30) return '#f97316';
        return '#ef4444';
    };

    if (loading) {
        return <LoadingSpinner text="Calculando taxas de conversão..." fullScreen />;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Taxa de Conversão de Orçamentos</h1>
                    <p className={styles.subtitle}>
                        Acompanhe o desempenho de conversão de orçamentos em eventos confirmados
                    </p>
                </div>

                <div className={styles.periodSelector}>
                    <button
                        className={`${styles.periodButton} ${selectedPeriod === 'month' ? styles.active : ''}`}
                        onClick={() => setSelectedPeriod('month')}
                    >
                        Mensal
                    </button>
                    <button
                        className={`${styles.periodButton} ${selectedPeriod === 'quarter' ? styles.active : ''}`}
                        onClick={() => setSelectedPeriod('quarter')}
                    >
                        Trimestral
                    </button>
                    <button
                        className={`${styles.periodButton} ${selectedPeriod === 'year' ? styles.active : ''}`}
                        onClick={() => setSelectedPeriod('year')}
                    >
                        Anual
                    </button>
                </div>
            </div>

            {/* Card de Resumo Geral */}
            <div className={styles.summaryCard}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Taxa Média de Conversão</span>
                    <span 
                        className={styles.summaryValue}
                        style={{ color: getRateColor(conversionData.reduce((sum, d) => sum + d.conversionRate, 0) / conversionData.length) }}
                    >
                        {(conversionData.reduce((sum, d) => sum + d.conversionRate, 0) / conversionData.length).toFixed(1)}%
                    </span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Total de Orçamentos</span>
                    <span className={styles.summaryValue}>
                        {conversionData.reduce((sum, d) => sum + d.quotes, 0)}
                    </span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Eventos Confirmados</span>
                    <span className={styles.summaryValue}>
                        {conversionData.reduce((sum, d) => sum + d.confirmed + d.completed, 0)}
                    </span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Ticket Médio</span>
                    <span className={styles.summaryValue}>
                        {formatCurrency(conversionData.reduce((sum, d) => sum + d.averageValue, 0) / conversionData.length)}
                    </span>
                </div>
            </div>

            {/* Gráfico de Conversão */}
            <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>Evolução da Taxa de Conversão</h3>
                <div className={styles.chart}>
                    {conversionData.map((data, index) => (
                        <div key={index} className={styles.chartBar}>
                            <div 
                                className={styles.barFill}
                                style={{ 
                                    height: `${data.conversionRate}%`,
                                    backgroundColor: getRateColor(data.conversionRate)
                                }}
                            >
                                <span className={styles.barValue}>{data.conversionRate.toFixed(1)}%</span>
                            </div>
                            <span className={styles.barLabel}>{data.period}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabela de Detalhes */}
            <div className={styles.tableCard}>
                <h3 className={styles.tableTitle}>Detalhamento por Período</h3>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Período</th>
                                <th>Orçamentos</th>
                                <th>Confirmados</th>
                                <th>Realizados</th>
                                <th>Cancelados</th>
                                <th>Taxa de Conversão</th>
                                <th>Taxa de Realização</th>
                                <th>Ticket Médio</th>
                                <th>Receita Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {conversionData.map((data, index) => (
                                <tr key={index}>
                                    <td className={styles.periodCell}>{data.period}</td>
                                    <td>{data.quotes}</td>
                                    <td className={styles.confirmedCell}>{data.confirmed}</td>
                                    <td className={styles.completedCell}>{data.completed}</td>
                                    <td className={styles.cancelledCell}>{data.cancelled}</td>
                                    <td>
                                        <span 
                                            className={styles.rateBadge}
                                            style={{ backgroundColor: getRateColor(data.conversionRate) }}
                                        >
                                            {data.conversionRate.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td>{data.completionRate.toFixed(1)}%</td>
                                    <td>{formatCurrency(data.averageValue)}</td>
                                    <td className={styles.revenueCell}>{formatCurrency(data.totalValue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Insights */}
            <div className={styles.insightsCard}>
                <h3 className={styles.insightsTitle}>📊 Insights</h3>
                <div className={styles.insightsGrid}>
                    <div className={styles.insight}>
                        <span className={styles.insightIcon}>📈</span>
                        <div>
                            <strong>Melhor período de conversão:</strong>
                            <p>
                                {conversionData.reduce((best, current) => 
                                    current.conversionRate > (best?.conversionRate || 0) ? current : best
                                , conversionData[0])?.period}
                            </p>
                        </div>
                    </div>
                    <div className={styles.insight}>
                        <span className={styles.insightIcon}>💰</span>
                        <div>
                            <strong>Maior ticket médio:</strong>
                            <p>
                                {formatCurrency(conversionData.reduce((max, current) => 
                                    current.averageValue > (max?.averageValue || 0) ? current : max
                                , conversionData[0])?.averageValue || 0)}
                            </p>
                        </div>
                    </div>
                    <div className={styles.insight}>
                        <span className={styles.insightIcon}>⚠️</span>
                        <div>
                            <strong>Taxa de cancelamento:</strong>
                            <p>
                                {(conversionData.reduce((sum, d) => sum + d.cancelled, 0) / 
                                  conversionData.reduce((sum, d) => sum + d.quotes, 0) * 100).toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};