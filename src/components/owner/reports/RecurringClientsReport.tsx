// src/components/admin/reports/RecurringClientsReport.tsx

import React, { useState, useEffect } from 'react';
import { User } from '../../types/User';
import { userService } from '../../services/users';
import { eventService } from '../../services/events';
import { LoadingSpinner } from '../common/LoadingSpinner';
import styles from './RecurringClientsReport.module.css';

interface RecurringClient extends User {
    eventCount: number;
    totalSpent: number;
    averageTicket: number;
    firstEventDate: string;
    lastEventDate: string;
    preferredEventType: string;
    monthsBetweenEvents: number;
}

export const RecurringClientsReport: React.FC = () => {
    const [clients, setClients] = useState<RecurringClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'recurring' | 'vip'>('all');

    useEffect(() => {
        loadRecurringClients();
    }, []);

    const loadRecurringClients = async () => {
        try {
            setLoading(true);
            
            // Buscar todos os clientes e eventos
            const [allClients, allEvents] = await Promise.all([
                userService.getAllClients(),
                eventService.getAllEvents()
            ]);

            // Calcular estatísticas por cliente
            const clientStats: Record<number, any> = {};
            
            allEvents.forEach(event => {
                if (!clientStats[event.clientId]) {
                    clientStats[event.clientId] = {
                        eventCount: 0,
                        totalSpent: 0,
                        events: []
                    };
                }
                
                clientStats[event.clientId].eventCount++;
                clientStats[event.clientId].totalSpent += event.totalValue;
                clientStats[event.clientId].events.push(event);
            });

            // Transformar em array de clientes recorrentes
            const recurringClients: RecurringClient[] = allClients
                .filter(client => clientStats[client.id]?.eventCount >= 2) // Mínimo 2 eventos
                .map(client => {
                    const stats = clientStats[client.id];
                    const events = stats.events.sort((a: any, b: any) => 
                        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
                    );
                    
                    // Calcular intervalo médio entre eventos
                    let totalDays = 0;
                    for (let i = 1; i < events.length; i++) {
                        const days = (new Date(events[i].eventDate).getTime() - 
                                     new Date(events[i-1].eventDate).getTime()) / 
                                     (1000 * 60 * 60 * 24);
                        totalDays += days;
                    }
                    const avgDays = totalDays / (events.length - 1);
                    
                    // Determinar tipo de evento preferido
                    const eventTypes: Record<string, number> = {};
                    events.forEach((e: any) => {
                        eventTypes[e.eventType] = (eventTypes[e.eventType] || 0) + 1;
                    });
                    const preferredType = Object.entries(eventTypes)
                        .sort((a, b) => (b[1] as number) - (a[1] as number))[0][0];

                    return {
                        ...client,
                        eventCount: stats.eventCount,
                        totalSpent: stats.totalSpent,
                        averageTicket: stats.totalSpent / stats.eventCount,
                        firstEventDate: events[0].eventDate,
                        lastEventDate: events[events.length - 1].eventDate,
                        preferredEventType: preferredType,
                        monthsBetweenEvents: avgDays / 30
                    };
                })
                .sort((a, b) => b.eventCount - a.eventCount);

            setClients(recurringClients);
        } catch (error) {
            console.error('Erro ao carregar clientes recorrentes:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const getLoyaltyLevel = (eventCount: number, avgSpent: number): string => {
        if (eventCount >= 5 && avgSpent >= 5000) return 'VIP ⭐';
        if (eventCount >= 3) return 'Ouro 🏆';
        if (eventCount >= 2) return 'Prata 🥈';
        return 'Bronze 🥉';
    };

    const getLoyaltyColor = (level: string): string => {
        if (level.includes('VIP')) return '#8b5cf6';
        if (level.includes('Ouro')) return '#f59e0b';
        if (level.includes('Prata')) return '#94a3b8';
        return '#b45309';
    };

    const filteredClients = clients.filter(client => {
        if (filter === 'recurring') return client.eventCount >= 2;
        if (filter === 'vip') return client.eventCount >= 3 && client.totalSpent >= 10000;
        return true;
    });

    if (loading) {
        return <LoadingSpinner text="Analisando clientes recorrentes..." fullScreen />;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Clientes Recorrentes</h1>
                    <p className={styles.subtitle}>
                        {clients.length} clientes com 2 ou mais eventos
                    </p>
                </div>

                <div className={styles.filters}>
                    <select 
                        className={styles.filterSelect}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                    >
                        <option value="all">Todos os recorrentes</option>
                        <option value="recurring">Mínimo 2 eventos</option>
                        <option value="vip">VIP (3+ eventos e R$10k+)</option>
                    </select>
                </div>
            </div>

            <div className={styles.statsOverview}>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>👥</span>
                    <div>
                        <span className={styles.statValue}>{clients.length}</span>
                        <span className={styles.statLabel}>Clientes Recorrentes</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>💰</span>
                    <div>
                        <span className={styles.statValue}>
                            {formatCurrency(clients.reduce((sum, c) => sum + c.totalSpent, 0))}
                        </span>
                        <span className={styles.statLabel}>Receita Total</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>📊</span>
                    <div>
                        <span className={styles.statValue}>
                            {(clients.reduce((sum, c) => sum + c.eventCount, 0) / clients.length || 0).toFixed(1)}
                        </span>
                        <span className={styles.statLabel}>Média de Eventos</span>
                    </div>
                </div>
            </div>

            <div className={styles.clientsGrid}>
                {filteredClients.map(client => {
                    const loyaltyLevel = getLoyaltyLevel(client.eventCount, client.averageTicket);
                    
                    return (
                        <div key={client.id} className={styles.clientCard}>
                            <div className={styles.cardHeader}>
                                <div 
                                    className={styles.loyaltyBadge}
                                    style={{ backgroundColor: getLoyaltyColor(loyaltyLevel) }}
                                >
                                    {loyaltyLevel}
                                </div>
                                <button className={styles.moreButton}>⋯</button>
                            </div>

                            <div className={styles.clientInfo}>
                                <h3 className={styles.clientName}>{client.name}</h3>
                                <p className={styles.clientContact}>
                                    {client.email} • {client.phone}
                                </p>
                            </div>

                            <div className={styles.statsGrid}>
                                <div className={styles.stat}>
                                    <span className={styles.statNumber}>{client.eventCount}</span>
                                    <span className={styles.statDesc}>Eventos</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statNumber}>
                                        {formatCurrency(client.totalSpent)}
                                    </span>
                                    <span className={styles.statDesc}>Total Gasto</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statNumber}>
                                        {formatCurrency(client.averageTicket)}
                                    </span>
                                    <span className={styles.statDesc}>Ticket Médio</span>
                                </div>
                            </div>

                            <div className={styles.timeline}>
                                <div className={styles.timelineItem}>
                                    <span className={styles.timelineLabel}>Primeiro evento:</span>
                                    <span className={styles.timelineValue}>
                                        {formatDate(client.firstEventDate)}
                                    </span>
                                </div>
                                <div className={styles.timelineItem}>
                                    <span className={styles.timelineLabel}>Último evento:</span>
                                    <span className={styles.timelineValue}>
                                        {formatDate(client.lastEventDate)}
                                    </span>
                                </div>
                                <div className={styles.timelineItem}>
                                    <span className={styles.timelineLabel}>Frequência:</span>
                                    <span className={styles.timelineValue}>
                                        a cada {client.monthsBetweenEvents.toFixed(1)} meses
                                    </span>
                                </div>
                            </div>

                            <div className={styles.preferences}>
                                <span className={styles.preferenceTag}>
                                    🎯 {client.preferredEventType}
                                </span>
                                {client.classification === 'VIP' && (
                                    <span className={`${styles.preferenceTag} ${styles.vipTag}`}>
                                        👑 VIP
                                    </span>
                                )}
                            </div>

                            <div className={styles.cardFooter}>
                                <button className={styles.viewProfileButton}>
                                    Ver Perfil
                                </button>
                                <button className={styles.contactButton}>
                                    📞 Contatar
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredClients.length === 0 && (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🔄</div>
                    <h3>Nenhum cliente recorrente encontrado</h3>
                    <p>Clientes com 2 ou mais eventos aparecerão aqui.</p>
                </div>
            )}
        </div>
    );
};