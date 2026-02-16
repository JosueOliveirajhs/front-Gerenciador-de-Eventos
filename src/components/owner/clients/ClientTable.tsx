// src/components/admin/clients/components/ClientTable.tsx

import React, { useState, useMemo } from 'react';
import { 
  FiEdit2, 
  FiTrash2, 
  FiPhone, 
  FiMail,
  FiUser,
  FiEye
} from 'react-icons/fi';
import { 
  MdReceipt, 
  MdPayment,
  MdPerson,
  MdCreditCard 
} from 'react-icons/md';
import { User } from '../types';
import { ClientDetailsModal } from './ClientDetailsModal';
import styles from './ClientTable.module.css';

interface ClientTableProps {
    clients: User[];
    onEdit: (client: User) => void;
    onDelete: (client: User) => void; // ✅ AGORA RECEBE CLIENTE INTEIRO, NÃO SÓ O ID
    onViewReceipts: (client: User) => void;
    onViewBoletos: (client: User) => void;
    isLoading?: boolean;
}

type SortField = 'name' | 'cpf' | 'email' | 'phone';
type SortDirection = 'asc' | 'desc';

export const ClientTable: React.FC<ClientTableProps> = ({
    clients,
    onEdit,
    onDelete,
    onViewReceipts,
    onViewBoletos,
    isLoading = false
}) => {
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [selectedClientForDetails, setSelectedClientForDetails] = useState<User | null>(null);

    const sortedClients = useMemo(() => {
        return [...clients].sort((a, b) => {
            const aValue = a[sortField] || '';
            const bValue = b[sortField] || '';
            
            if (sortDirection === 'asc') {
                return aValue.localeCompare(bValue);
            }
            return bValue.localeCompare(aValue);
        });
    }, [clients, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (field === sortField) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const formatCPF = (cpf: string) => {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };

    const formatPhone = (phone: string | null) => {
        if (!phone) return '-';
        const numbers = phone.replace(/\D/g, '');
        if (numbers.length === 11) {
            return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        if (numbers.length === 10) {
            return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return phone;
    };

    const getInitials = (name: string): string => {
        return name
            .split(' ')
            .map(word => word[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Carregando clientes...</p>
            </div>
        );
    }

    if (clients.length === 0) {
        return null;
    }

    return (
        <div className={styles.container}>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead className={styles.thead}>
                        <tr>
                            <th 
                                onClick={() => handleSort('cpf')}
                                className={`${styles.headerCell} ${styles.sortable}`}
                            >
                                <div className={styles.headerContent}>
                                    <MdCreditCard size={14} />
                                    CPF
                                    {sortField === 'cpf' && (
                                        <span className={styles.sortIcon}>
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th 
                                onClick={() => handleSort('name')}
                                className={`${styles.headerCell} ${styles.sortable}`}
                            >
                                <div className={styles.headerContent}>
                                    <MdPerson size={14} />
                                    Nome
                                    {sortField === 'name' && (
                                        <span className={styles.sortIcon}>
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th 
                                onClick={() => handleSort('email')}
                                className={`${styles.headerCell} ${styles.sortable} ${styles.hideMobile}`}
                            >
                                <div className={styles.headerContent}>
                                    <FiMail size={14} />
                                    E-mail
                                    {sortField === 'email' && (
                                        <span className={styles.sortIcon}>
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th 
                                onClick={() => handleSort('phone')}
                                className={`${styles.headerCell} ${styles.sortable} ${styles.hideMobile}`}
                            >
                                <div className={styles.headerContent}>
                                    <FiPhone size={14} />
                                    Telefone
                                    {sortField === 'phone' && (
                                        <span className={styles.sortIcon}>
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th className={styles.headerCell}>
                                Documentos
                            </th>
                            <th className={styles.headerCell}>
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedClients.map((client, index) => (
                            <tr 
                                key={client.id} 
                                className={`${styles.row} ${index % 2 === 0 ? styles.rowEven : ''}`}
                            >
                                <td className={styles.cell}>
                                    <span className={styles.cpf}>
                                        {formatCPF(client.cpf)}
                                    </span>
                                </td>
                                <td className={styles.cell}>
                                    <div 
                                        className={styles.nameCell}
                                        onClick={() => setSelectedClientForDetails(client)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className={styles.clientAvatar}>
                                            {getInitials(client.name)}
                                        </div>
                                        <div className={styles.clientInfo}>
                                            <span className={styles.name}>
                                                {client.name}
                                            </span>
                                            <span className={styles.emailMobile}>
                                                <FiMail size={12} /> {client.email || '-'}
                                            </span>
                                            <span className={styles.phoneMobile}>
                                                <FiPhone size={12} /> {formatPhone(client.phone)}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className={`${styles.cell} ${styles.hideMobile}`}>
                                    {client.email || '-'}
                                </td>
                                <td className={`${styles.cell} ${styles.hideMobile}`}>
                                    {formatPhone(client.phone)}
                                </td>
                                <td className={styles.cell}>
                                    <div className={styles.documentActions}>
                                        <button
                                            onClick={() => onViewBoletos(client)}
                                            className={styles.documentButton}
                                            title="Acessar boletos"
                                        >
                                            <MdPayment size={18} />
                                            <span className={styles.documentLabel}>Boletos</span>
                                        </button>
                                        <button
                                            onClick={() => onViewReceipts(client)}
                                            className={styles.documentButton}
                                            title="Ver comprovantes"
                                        >
                                            <MdReceipt size={18} />
                                            <span className={styles.documentLabel}>Comprovantes</span>
                                        </button>
                                    </div>
                                </td>
                                <td className={styles.cell}>
                                    <div className={styles.actionButtons}>
                                        <button
                                            onClick={() => setSelectedClientForDetails(client)}
                                            className={styles.actionButton}
                                            title="Ver detalhes"
                                        >
                                            <FiEye size={16} />
                                            <span className={styles.actionLabel}>Detalhes</span>
                                        </button>
                                        <button
                                            onClick={() => onEdit(client)}
                                            className={styles.actionButton}
                                            title="Editar cliente"
                                        >
                                            <FiEdit2 size={16} />
                                            <span className={styles.actionLabel}>Editar</span>
                                        </button>
                                        <button
                                            onClick={() => onDelete(client)} // ✅ AGORA PASSA O CLIENTE INTEIRO
                                            className={`${styles.actionButton} ${styles.deleteButton}`}
                                            title="Excluir cliente"
                                        >
                                            <FiTrash2 size={16} />
                                            <span className={styles.actionLabel}>Excluir</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className={styles.footer}>
                <span className={styles.totalCount}>
                    <FiUser size={14} />
                    Total: {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
                </span>
            </div>

            {selectedClientForDetails && (
                <ClientDetailsModal
                    client={selectedClientForDetails}
                    onClose={() => setSelectedClientForDetails(null)}
                    onEdit={(client) => {
                        setSelectedClientForDetails(null);
                        onEdit(client);
                    }}
                    onViewReceipts={(client) => {
                        setSelectedClientForDetails(null);
                        onViewReceipts(client);
                    }}
                    onViewBoletos={(client) => {
                        setSelectedClientForDetails(null);
                        onViewBoletos(client);
                    }}
                />
            )}
        </div>
    );
};