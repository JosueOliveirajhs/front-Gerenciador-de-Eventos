// src/components/admin/clients/components/ClientFilters.tsx

import React, { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiUser, 
  FiMail, 
  FiPhone,
  FiX,
  FiFilter
} from 'react-icons/fi';
import { MdPerson, MdCreditCard } from 'react-icons/md';
import { Filters } from '../types';
import styles from './ClientFilters.module.css';

interface ClientFiltersProps {
    filters: Filters;
    onFilterChange: (field: keyof Filters, value: string) => void;
    onClearFilters: () => void;
    totalResults: number;
}

export const ClientFilters: React.FC<ClientFiltersProps> = ({
    filters,
    onFilterChange,
    onClearFilters,
    totalResults
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [localFilters, setLocalFilters] = useState(filters);

    // Debounce para evitar muitas renderizações
    useEffect(() => {
        const timer = setTimeout(() => {
            Object.entries(localFilters).forEach(([key, value]) => {
                if (value !== filters[key as keyof Filters]) {
                    onFilterChange(key as keyof Filters, value);
                }
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [localFilters, onFilterChange, filters]);

    const handleChange = (field: keyof Filters, value: string) => {
        setLocalFilters(prev => ({ ...prev, [field]: value }));
    };

    const hasActiveFilters = Object.values(filters).some(v => v.trim() !== '');

    return (
        <div className={`${styles.container} ${styles.card}`}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <button 
                        className={styles.toggleButton}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <span className={styles.toggleIcon}>
                            {isExpanded ? '▼' : '▶'}
                        </span>
                        <FiFilter className={styles.filterIcon} />
                        <h3 className={styles.title}>Filtros de Busca</h3>
                    </button>
                    {hasActiveFilters && (
                        <span className={styles.activeBadge}>
                            {Object.values(filters).filter(v => v.trim() !== '').length} ativo(s)
                        </span>
                    )}
                </div>
                <div className={styles.headerRight}>
                    <span className={styles.resultCount}>
                        <FiSearch size={14} />
                        {totalResults} {totalResults === 1 ? 'resultado' : 'resultados'}
                    </span>
                    {hasActiveFilters && (
                        <button 
                            onClick={onClearFilters}
                            className={styles.clearButton}
                        >
                            <FiX size={16} />
                            Limpar filtros
                        </button>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className={styles.filtersGrid}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>
                            <MdCreditCard size={16} />
                            CPF
                        </label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="text"
                                placeholder="000.000.000-00"
                                value={localFilters.cpf}
                                onChange={(e) => handleChange('cpf', e.target.value)}
                                className={styles.filterInput}
                            />
                            {localFilters.cpf && (
                                <button 
                                    className={styles.clearInput}
                                    onClick={() => handleChange('cpf', '')}
                                >
                                    <FiX size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>
                            <MdPerson size={16} />
                            Nome
                        </label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="text"
                                placeholder="Nome do cliente"
                                value={localFilters.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className={styles.filterInput}
                            />
                            {localFilters.name && (
                                <button 
                                    className={styles.clearInput}
                                    onClick={() => handleChange('name', '')}
                                >
                                    <FiX size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>
                            <FiMail size={16} />
                            E-mail
                        </label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="email"
                                placeholder="cliente@email.com"
                                value={localFilters.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className={styles.filterInput}
                            />
                            {localFilters.email && (
                                <button 
                                    className={styles.clearInput}
                                    onClick={() => handleChange('email', '')}
                                >
                                    <FiX size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>
                            <FiPhone size={16} />
                            Telefone
                        </label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="text"
                                placeholder="(11) 99999-9999"
                                value={localFilters.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className={styles.filterInput}
                            />
                            {localFilters.phone && (
                                <button 
                                    className={styles.clearInput}
                                    onClick={() => handleChange('phone', '')}
                                >
                                    <FiX size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};