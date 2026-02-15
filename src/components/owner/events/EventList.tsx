// src/components/admin/events/components/EventList.tsx

import React from 'react';
import { 
  FiEdit2, 
  FiTrash2, 
  FiUsers,
  FiDollarSign
} from 'react-icons/fi';
import { 
  MdEvent, 
  MdPerson, 
  MdAccessTime,
  MdAttachMoney 
} from 'react-icons/md';
import { Event } from '../../../types/Event';
import styles from '../EventManagement.module.css';

interface EventListProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  onStatusChange: (id: number, status: Event['status']) => void;
  formatDateForDisplay: (date: string) => string;
  formatCurrency: (value: string | number) => string;
  getStatusVariant: (status: Event['status']) => string;
  getStatusIcon: (status: Event['status']) => string;
}

export const EventList: React.FC<EventListProps> = ({
  events,
  onEdit,
  onDelete,
  onStatusChange,
  formatDateForDisplay,
  formatCurrency,
  getStatusVariant,
  getStatusIcon
}) => {
  if (events.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <MdEvent size={64} />
        </div>
        <h3 className={styles.emptyTitle}>Nenhum evento encontrado</h3>
        <p className={styles.emptyText}>
          Tente ajustar os filtros de busca ou crie um novo evento.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.eventsTable}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Status</th>
              <th>Data/Hora</th>
              <th>Evento</th>
              <th>Cliente</th>
              <th>Convidados</th>
              <th>Valor</th>
              <th>Progresso</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => {
              const total = typeof event.totalValue === 'string' ? parseFloat(event.totalValue) : event.totalValue;
              const deposit = typeof event.depositValue === 'string' ? parseFloat(event.depositValue) : event.depositValue;
              const paymentProgress = total > 0 ? (deposit / total) * 100 : 0;
              
              return (
                <tr key={event.id}>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[getStatusVariant(event.status)]}`}>
                      {getStatusIcon(event.status)} {event.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.dateTimeCell}>
                      <strong>{formatDateForDisplay(event.eventDate)}</strong>
                      <span className={styles.timeCell}>
                        <MdAccessTime size={12} />
                        {event.startTime.substring(0,5)} - {event.endTime.substring(0,5)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.eventCell}>
                      <strong className={styles.eventTitle}>{event.title}</strong>
                      <span className={styles.eventType}>{event.eventType}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.clientCell}>
                      <MdPerson size={14} />
                      {event.client?.name || `ID: ${event.clientId}`}
                      {event.client?.phone && (
                        <small>{event.client.phone}</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={styles.guestCell}>
                      <FiUsers size={14} />
                      <strong>{event.guestCount}</strong>
                      <span>pessoas</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.valueCell}>
                      <strong>
                        <MdAttachMoney size={14} />
                        {formatCurrency(event.totalValue)}
                      </strong>
                      {deposit > 0 && (
                        <small className={styles.depositInfo}>
                          Sinal: {formatCurrency(event.depositValue)}
                        </small>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={styles.progressCell}>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill}
                          style={{ width: `${paymentProgress}%` }}
                        />
                      </div>
                      <span className={styles.progressText}>
                        {paymentProgress.toFixed(0)}% pago
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      <button
                        onClick={() => onEdit(event)}
                        className={styles.editButton}
                        title="Editar evento"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      
                      <button
                        onClick={() => onDelete(event)}
                        className={styles.deleteButton}
                        title="Excluir evento"
                      >
                        <FiTrash2 size={16} />
                      </button>

                      <select
                        value={event.status}
                        onChange={(e) => onStatusChange(event.id, e.target.value as Event['status'])}
                        className={styles.statusSelect}
                        title="Alterar status"
                      >
                        <option value="QUOTE">📝 Orçamento</option>
                        <option value="CONFIRMED">✅ Confirmado</option>
                        <option value="COMPLETED">🎉 Realizado</option>
                        <option value="CANCELLED">❌ Cancelado</option>
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};