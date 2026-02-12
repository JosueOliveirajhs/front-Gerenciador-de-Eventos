// src/components/admin/clients/ClientManagement.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { User, Filters, Receipt, Boleto } from './types';
import { userService } from '../../services/users';
import { receiptService } from '../../services/receipts';
import { boletoService } from '../../services/boletos';

import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { ClientFilters } from './components/ClientFilters';
import { ClientTable } from './components/ClientTable';
import { ClientForm } from './components/ClientForm';
import { ReceiptModal } from './components/ReceiptModal';
import { BoletoModal } from './components/BoletoModal';

import styles from './ClientManagement.module.css';

export const ClientManagement: React.FC = () => {
    // Estados
    const [clients, setClients] = useState<User[]>([]);
    const [filteredClients, setFilteredClients] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingClient, setEditingClient] = useState<User | null>(null);
    const [showFilters, setShowFilters] = useState(true);
    const [selectedClient, setSelectedClient] = useState<User | null>(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showBoletoModal, setShowBoletoModal] = useState(false);
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [filters, setFilters] = useState<Filters>({
        cpf: '',
        name: '',
        email: '',
        phone: ''
    });

    // Carregar clientes
    const loadClients = useCallback(async () => {
        try {
            setLoading(true);
            const clientsData = await userService.getAllClients();
            setClients(clientsData);
            setFilteredClients(clientsData);
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadClients();
    }, [loadClients]);

    // Aplicar filtros
    useEffect(() => {
        applyFilters();
    }, [filters, clients]);

    const applyFilters = useCallback(() => {
        let result = [...clients];

        if (filters.cpf) {
            const cpfClean = filters.cpf.replace(/\D/g, '');
            result = result.filter(client => 
                client.cpf.includes(cpfClean)
            );
        }

        if (filters.name) {
            result = result.filter(client => 
                client.name.toLowerCase().includes(filters.name.toLowerCase())
            );
        }

        if (filters.email) {
            result = result.filter(client => 
                client.email?.toLowerCase().includes(filters.email.toLowerCase())
            );
        }

        if (filters.phone) {
            const phoneClean = filters.phone.replace(/\D/g, '');
            result = result.filter(client => 
                client.phone?.replace(/\D/g, '').includes(phoneClean)
            );
        }

        setFilteredClients(result);
    }, [filters, clients]);

    // Handlers de filtro
    const handleFilterChange = useCallback((field: keyof Filters, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setFilters({
            cpf: '',
            name: '',
            email: '',
            phone: ''
        });
    }, []);

    // Handlers de cliente
    const handleCreateClient = async (clientData: any) => {
        try {
            await userService.createClient(clientData);
            await loadClients();
            setShowForm(false);
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            throw error;
        }
    };

    const handleUpdateClient = async (id: number, clientData: any) => {
        try {
            await userService.updateClient(id, clientData);
            await loadClients();
            setEditingClient(null);
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
            throw error;
        }
    };

    const handleDeleteClient = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
            try {
                await userService.deleteClient(id);
                await loadClients();
            } catch (error) {
                console.error('Erro ao excluir cliente:', error);
                alert('Erro ao excluir cliente. Verifique se não há eventos vinculados.');
            }
        }
    };

    // Handlers de comprovantes
    const handleViewReceipts = async (client: User) => {
        setSelectedClient(client);
        try {
            const receiptsData = await receiptService.getClientReceipts(client.id);
            setReceipts(receiptsData);
            setShowReceiptModal(true);
        } catch (error) {
            console.error('Erro ao carregar comprovantes:', error);
        }
    };

    const handleUploadReceipt = async (file: File, description: string, value?: number) => {
        if (!selectedClient) return;
        
        try {
            await receiptService.uploadReceipt({
                clientId: selectedClient.id,
                file,
                description,
                value
            });
            // Recarregar comprovantes
            const receiptsData = await receiptService.getClientReceipts(selectedClient.id);
            setReceipts(receiptsData);
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            throw error;
        }
    };

    const handleDeleteReceipt = async (receiptId: number) => {
        if (window.confirm('Tem certeza que deseja excluir este comprovante?')) {
            try {
                await receiptService.deleteReceipt(receiptId);
                if (selectedClient) {
                    const receiptsData = await receiptService.getClientReceipts(selectedClient.id);
                    setReceipts(receiptsData);
                }
            } catch (error) {
                console.error('Erro ao excluir comprovante:', error);
            }
        }
    };

    // Handlers de boletos
    const handleViewBoletos = async (client: User) => {
        setSelectedClient(client);
        setShowBoletoModal(true);
    };

    const handleGenerateBoleto = async (data: any) => {
        if (!selectedClient) return;
        
        try {
            await boletoService.generateBoleto({
                clientId: selectedClient.id,
                ...data
            });
            // Modal será recarregado com os novos boletos
        } catch (error) {
            console.error('Erro ao gerar boleto:', error);
            throw error;
        }
    };

    const handleSendBoletoEmail = async (boletoId: number) => {
        try {
            await boletoService.sendBoletoByEmail(boletoId);
        } catch (error) {
            console.error('Erro ao enviar boleto:', error);
            throw error;
        }
    };

    const handleMarkBoletoAsPaid = async (boletoId: number) => {
        try {
            await boletoService.markAsPaid(boletoId);
            if (selectedClient) {
                // Recarregar boletos
                // await loadBoletos(selectedClient.id);
            }
        } catch (error) {
            console.error('Erro ao marcar boleto como pago:', error);
            throw error;
        }
    };

    if (loading) {
        return <LoadingSpinner text="Carregando clientes..." fullScreen />;
    }

    const hasActiveFilters = Object.values(filters).some(v => v.trim() !== '');
    const showEmptyState = filteredClients.length === 0;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>Gestão de Clientes</h1>
                    {!showEmptyState && (
                        <span className={styles.clientCount}>
                            {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}
                        </span>
                    )}
                </div>
                
                <div className={styles.headerActions}>
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`${styles.filterToggle} ${showFilters ? styles.active : ''}`}
                        aria-label="Alternar filtros"
                    >
                        <span className={styles.filterToggleIcon}>🔍</span>
                        <span className={styles.filterToggleText}>
                            {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                        </span>
                    </button>
                    
                    <button 
                        onClick={() => {
                            setEditingClient(null);
                            setShowForm(true);
                        }}
                        className={styles.primaryButton}
                    >
                        <span className={styles.buttonIcon}>+</span>
                        <span>Novo Cliente</span>
                    </button>
                </div>
            </div>

            {/* Filtros */}
            {showFilters && (
                <ClientFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                    totalResults={filteredClients.length}
                />
            )}

            {/* Formulários */}
            <ClientForm
                client={editingClient || undefined}
                onSubmit={editingClient 
                    ? (data) => handleUpdateClient(editingClient.id, data)
                    : handleCreateClient
                }
                onCancel={() => {
                    setShowForm(false);
                    setEditingClient(null);
                }}
                isOpen={showForm || !!editingClient}
            />

            {/* Modais */}
            {showReceiptModal && selectedClient && (
                <ReceiptModal
                    client={selectedClient}
                    receipts={receipts}
                    onClose={() => {
                        setShowReceiptModal(false);
                        setSelectedClient(null);
                        setReceipts([]);
                    }}
                    onUpload={handleUploadReceipt}
                    onDelete={handleDeleteReceipt}
                />
            )}

            {showBoletoModal && selectedClient && (
                <BoletoModal
                    client={selectedClient}
                    onClose={() => {
                        setShowBoletoModal(false);
                        setSelectedClient(null);
                    }}
                    onGenerate={handleGenerateBoleto}
                    onSendEmail={handleSendBoletoEmail}
                    onMarkAsPaid={handleMarkBoletoAsPaid}
                />
            )}

            {/* Tabela ou Empty State */}
            {showEmptyState ? (
                <div className={styles.emptyStateWrapper}>
                    <EmptyState
                        icon={hasActiveFilters ? '🔍' : '👥'}
                        title={hasActiveFilters 
                            ? 'Nenhum cliente encontrado' 
                            : 'Nenhum cliente cadastrado'
                        }
                        description={hasActiveFilters
                            ? 'Tente ajustar os filtros de busca para encontrar clientes.'
                            : 'Comece cadastrando seu primeiro cliente para começar a gerenciar.'
                        }
                        action={hasActiveFilters ? {
                            label: 'Limpar Filtros',
                            onClick: handleClearFilters
                        } : {
                            label: 'Cadastrar Primeiro Cliente',
                            onClick: () => setShowForm(true)
                        }}
                        secondaryAction={hasActiveFilters ? undefined : undefined}
                    />
                </div>
            ) : (
                <ClientTable
                    clients={filteredClients}
                    onEdit={setEditingClient}
                    onDelete={handleDeleteClient}
                    onViewReceipts={handleViewReceipts}
                    onViewBoletos={handleViewBoletos}
                />
            )}
        </div>
    );
};