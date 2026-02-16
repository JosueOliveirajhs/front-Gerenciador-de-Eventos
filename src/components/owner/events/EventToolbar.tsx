// src/components/admin/events/components/EventToolbar.tsx

import React from 'react';
import { 
  FiList, 
  FiCalendar, 
  FiSearch, 
  FiPlus 
} from 'react-icons/fi';
import { 
  MdOutlineFormatListBulleted, 
  MdViewAgenda,
  MdFilterList,
  MdPeople 
} from 'react-icons/md';
import { User } from '../../../types/User';
import styles from '../EventManagement.module.css';

interface EventToolbarProps {
  viewMode: 'list' | 'calendar';
  onViewChange: (mode: 'list' | 'calendar') => void;
  filterStatus: string;
  onFilterStatusChange: (status: string) => void;
  filterClient: number | 'ALL';
  onFilterClientChange: (clientId: number | 'ALL') => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  clients: User[];
  onNewEvent: () => void;
}

export const EventToolbar: React.FC<EventToolbarProps> = ({
  viewMode,
  onViewChange,
  filterStatus,
  onFilterStatusChange,
  filterClient,
  onFilterClientChange,
  searchTerm,
  onSearchChange,
  clients,
  onNewEvent
}) => {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewButton} ${viewMode === 'list' ? styles.activeView : ''}`}
            onClick={() => onViewChange('list')}
          >
            <FiList size={18} />
            Lista
          </button>
          <button
            className={`${styles.viewButton} ${viewMode === 'calendar' ? styles.activeView : ''}`}
            onClick={() => onViewChange('calendar')}
          >
            <FiCalendar size={18} />
            Calendário
          </button>
        </div>

        <div className={styles.filters}>
          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value)}
          >
            <option value="ALL">Todos os status</option>
            <option value="QUOTE">Orçamento</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="COMPLETED">Realizado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>

          <select
            className={styles.filterSelect}
            value={filterClient}
            onChange={(e) => onFilterClientChange(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
          >
            <option value="ALL">
              <MdPeople /> Todos os clientes
            </option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>

          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} size={16} />
            <input
              type="text"
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
      </div>

      <button onClick={onNewEvent} className={styles.primaryButton}>
        <FiPlus size={18} />
        Novo Evento
      </button>
    </div>
  );
};