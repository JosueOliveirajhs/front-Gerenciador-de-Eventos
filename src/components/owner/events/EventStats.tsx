// src/components/admin/events/components/EventStats.tsx

import React from 'react';
import { 
  MdEvent, 
  MdAttachMoney, 
  MdCheckCircle, 
  MdPendingActions 
} from 'react-icons/md';
import { FiCalendar } from 'react-icons/fi';
import styles from '../EventManagement.module.css';

interface EventStatsProps {
  stats: {
    monthEvents: number;
    monthRevenue: number;
    confirmedEvents: number;
    pendingPayments: number;
    totalEvents: number;
    completedEvents: number;
    cancelledEvents: number;
    quoteEvents: number;
  };
  selectedMonth: string;
  formatCurrency: (value: number) => string;
}

export const EventStats: React.FC<EventStatsProps> = ({ 
  stats, 
  selectedMonth, 
  formatCurrency 
}) => {
  const statsCards = [
    {
      icon: <FiCalendar size={28} />,
      value: stats.monthEvents,
      label: 'Eventos no mês',
      color: 'blue'
    },
    {
      icon: <MdAttachMoney size={28} />,
      value: formatCurrency(stats.monthRevenue),
      label: 'Receita do mês',
      color: 'green'
    },
    {
      icon: <MdCheckCircle size={28} />,
      value: stats.confirmedEvents,
      label: 'Eventos confirmados',
      color: 'emerald'
    },
    {
      icon: <MdPendingActions size={28} />,
      value: stats.pendingPayments,
      label: 'Pagamentos pendentes',
      color: 'yellow'
    }
  ];

  return (
    <div className={styles.statsHeader}>
      {statsCards.map((card, index) => (
        <div key={index} className={`${styles.statCard} ${styles[card.color]}`}>
          <div className={styles.statIcon}>{card.icon}</div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{card.value}</span>
            <span className={styles.statLabel}>{card.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};