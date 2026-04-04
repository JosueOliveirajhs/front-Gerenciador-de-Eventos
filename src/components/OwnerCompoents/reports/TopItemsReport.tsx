// src/components/admin/reports/TopItemsReport.tsx

import React, { useState, useEffect } from 'react';
import { itemService } from '../../services/items';
import { LoadingSpinner } from '../common/LoadingSpinner';
import styles from './TopItemsReport.module.css';

interface TopItem {
    id: number;
    name: string;
    category: string;
    usageCount: number;
    revenue: number;
    reservationCount: number;
}

export const TopItemsReport: React.FC = () => {
    const [items, setItems] = useState<TopItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'month' | 'year' | 'all'>('month');

    useEffect(() => {
        loadTopItems();
    }, [period]);

    const loadTopItems = async () => {
        try {
            setLoading(true);
            const data = await itemService.getTopItems();
            setItems(data);
        } catch (error) {
            console.error('Erro ao carregar itens mais alugados:', error);
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

    const getCategoryIcon = (category: string): string => {
        const icons: Record<string, string> = {
            DECORATION: '🎨',
            FURNITURE: '🪑',
            UTENSIL: '🍽️',
            OTHER: '📦'
        };
        return icons[category] || '📦';
    };

    if (loading) {
        return <LoadingSpinner text="Carregando relatório..." />;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Itens Mais Alugados</h2>
                <div className={styles.periodSelector}>
                    <button
                        className={`${styles.periodButton} ${period === 'month' ? styles.active : ''}`}
                        onClick={() => setPeriod('month')}
                    >
                        Este Mês
                    </button>
                    <button
                        className={`${styles.periodButton} ${period === 'year' ? styles.active : ''}`}
                        onClick={() => setPeriod('year')}
                    >
                        Este Ano
                    </button>
                    <button
                        className={`${styles.periodButton} ${period === 'all' ? styles.active : ''}`}
                        onClick={() => setPeriod('all')}
                    >
                        Todo Período
                    </button>
                </div>
            </div>

            <div className={styles.rankingList}>
                {items.map((item, index) => (
                    <div key={item.id} className={styles.rankingItem}>
                        <div className={styles.rankingPosition}>
                            <span className={styles.positionNumber}>#{index + 1}</span>
                        </div>
                        
                        <div className={styles.itemIcon}>
                            {getCategoryIcon(item.category)}
                        </div>

                        <div className={styles.itemInfo}>
                            <h3 className={styles.itemName}>{item.name}</h3>
                            <span className={styles.itemCategory}>{item.category}</span>
                        </div>

                        <div className={styles.itemStats}>
                            <div className={styles.stat}>
                                <span className={styles.statValue}>{item.usageCount}</span>
                                <span className={styles.statLabel}>locações</span>
                            </div>
                            <div className={styles.stat}>
                                <span className={styles.statValue}>{formatCurrency(item.revenue)}</span>
                                <span className={styles.statLabel}>receita</span>
                            </div>
                            <div className={styles.stat}>
                                <span className={styles.statValue}>{item.reservationCount}</span>
                                <span className={styles.statLabel}>reservas</span>
                            </div>
                        </div>

                        <div className={styles.progressBar}>
                            <div 
                                className={styles.progressFill}
                                style={{ 
                                    width: `${(item.usageCount / items[0]?.usageCount) * 100}%`,
                                    backgroundColor: index === 0 ? '#f59e0b' : '#3b82f6'
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};