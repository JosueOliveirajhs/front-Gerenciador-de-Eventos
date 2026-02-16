import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiSearch, 
  FiPlus, 
  FiFilter,
  FiX,
  FiUsers,
  FiUserPlus
} from 'react-icons/fi';
import { 
  MdPeople, 
  MdPerson, 
  MdReceipt, 
  MdPayment,
  MdWarning
} from 'react-icons/md';
import { User, Filters, Receipt, Boleto } from './types';
import { userService } from '../../services/users';
import { receiptService } from '../../services/receipts';
import { boletoService } from '../../services/boletos';
import { eventService } from '../../services/events';

import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { ClientFilters } from './clients/ClientFilters';
import { ClientTable } from './clients/ClientTable';
import { ClientForm } from './clients/ClientForm';
import { DeleteClientModal } from './clients/DeleteClientModal';
import { ConfirmationModal } from '../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../common/Alerts/ErrorModal';
import { ReceiptModal } from './components/ReceiptModal';
import { BoletoModal } from './components/BoletoModal';

import styles from './ClientManagement.module.css';

export const ClientManagement: React.FC = () => {
    // Estados principais
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
    
    // Estados para o modal de exclusão
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Estados para modal de sucesso
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [successType, setSuccessType] = useState<'create' | 'update' | 'delete'>('create');
    
    // Estados para modal de erro
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    const [linkedItemsInfo, setLinkedItemsInfo] = useState({
        hasEvents: false,
        eventsCount: 0,
        events: [] as any[],
        hasReceipts: false,
        hasBoletos: false
    });
    
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
            setErrorMessage('Erro ao carregar clientes. Tente novamente.');
            setShowError(true);
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
            setSuccessMessage('Cliente cadastrado com sucesso!');
            setSuccessType('create');
            setShowSuccessModal(true);
            setShowForm(false);
        } catch (error: any) {
            console.error('Erro ao criar cliente:', error);
            
            let message = 'Erro ao criar cliente. Tente novamente.';
            if (error.message) {
                message = error.message;
            } else if (error.response?.data?.message) {
                message = error.response.data.message;
            } else if (error.response?.data?.error) {
                message = error.response.data.error;
            }
            
            setErrorMessage(message);
            setShowError(true);
            throw error;
        }
    };

    const handleUpdateClient = async (id: number, clientData: any) => {
        try {
            await userService.updateClient(id, clientData);
            await loadClients();
            setSuccessMessage('Cliente atualizado com sucesso!');
            setSuccessType('update');
            setShowSuccessModal(true);
            setEditingClient(null);
        } catch (error: any) {
            console.error('Erro ao atualizar cliente:', error);
            
            let message = 'Erro ao atualizar cliente. Tente novamente.';
            if (error.message) {
                message = error.message;
            } else if (error.response?.data?.message) {
                message = error.response.data.message;
            } else if (error.response?.data?.error) {
                message = error.response.data.error;
            }
            
            setErrorMessage(message);
            setShowError(true);
            throw error;
        }
    };

    // Função para abrir modal de exclusão com verificação de eventos
    const openDeleteModal = async (client: User) => {
        console.log('🔍 Cliente recebido para exclusão:', client);
        
        if (!client || !client.id) {
            console.error('❌ Cliente inválido:', client);
            setErrorMessage('Erro: Cliente inválido');
            setShowError(true);
            return;
        }
        
        // Verificar se tem eventos vinculados usando o eventService
        try {
            const clientEvents = await eventService.getEventsByClientId(client.id);
            const hasEvents = clientEvents.length > 0;
            
            console.log(`📊 Cliente ${client.name} tem ${clientEvents.length} eventos:`, clientEvents);
            
            setLinkedItemsInfo({
                hasEvents,
                eventsCount: clientEvents.length,
                events: clientEvents,
                hasReceipts: false,
                hasBoletos: false
            });
            
        } catch (error) {
            console.error('❌ Erro ao verificar eventos do cliente:', error);
            setLinkedItemsInfo({
                hasEvents: false,
                eventsCount: 0,
                events: [],
                hasReceipts: false,
                hasBoletos: false
            });
        }
        
        setClientToDelete(client);
        setShowDeleteModal(true);
    };

    // Função para excluir cliente com modal de sucesso
    const handleDeleteClient = async () => {
        if (!clientToDelete) {
            console.error('❌ Nenhum cliente selecionado para exclusão');
            return;
        }
        
        if (!clientToDelete.id) {
            console.error('❌ Cliente sem ID:', clientToDelete);
            setErrorMessage('Erro: Cliente sem ID');
            setShowError(true);
            setShowDeleteModal(false);
            setClientToDelete(null);
            return;
        }
        
        // Se tiver eventos, não permite excluir
        if (linkedItemsInfo.hasEvents) {
            setErrorMessage('Este cliente possui eventos vinculados e não pode ser excluído.');
            setShowError(true);
            return;
        }
        
        console.log('🗑️ Excluindo cliente:', clientToDelete.id, clientToDelete.name);
        
        setIsDeleting(true);
        
        try {
            await userService.deleteClient(clientToDelete.id);
            
            // Atualizar lista
            setClients(prev => prev.filter(c => c.id !== clientToDelete.id));
            setFilteredClients(prev => prev.filter(c => c.id !== clientToDelete.id));
            
            console.log('✅ Cliente excluído com sucesso');
            
            // Fechar modal de confirmação e abrir modal de sucesso
            setShowDeleteModal(false);
            setSuccessMessage(`Cliente ${clientToDelete.name} excluído com sucesso!`);
            setSuccessType('delete');
            setShowSuccessModal(true);
            
        } catch (error: any) {
            console.error('❌ Erro ao excluir cliente:', error);
            
            let message = 'Erro ao excluir cliente. Verifique se não há eventos vinculados.';
            if (error.message) {
                message = error.message;
            } else if (error.response?.data?.message) {
                message = error.response.data.message;
            } else if (error.response?.data?.error) {
                message = error.response.data.error;
            }
            
            setErrorMessage(message);
            setShowError(true);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        if (successType === 'delete') {
            setClientToDelete(null);
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
            setErrorMessage('Erro ao carregar comprovantes. Tente novamente.');
            setShowError(true);
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
            const receiptsData = await receiptService.getClientReceipts(selectedClient.id);
            setReceipts(receiptsData);
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            setErrorMessage('Erro ao fazer upload do comprovante. Tente novamente.');
            setShowError(true);
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
                setErrorMessage('Erro ao excluir comprovante. Tente novamente.');
                setShowError(true);
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
        } catch (error) {
            console.error('Erro ao gerar boleto:', error);
            setErrorMessage('Erro ao gerar boleto. Tente novamente.');
            setShowError(true);
            throw error;
        }
    };

    const handleSendBoletoEmail = async (boletoId: number) => {
        try {
            await boletoService.sendBoletoByEmail(boletoId);
        } catch (error) {
            console.error('Erro ao enviar boleto:', error);
            setErrorMessage('Erro ao enviar boleto por email. Tente novamente.');
            setShowError(true);
            throw error;
        }
    };

    const handleMarkBoletoAsPaid = async (boletoId: number) => {
        try {
            await boletoService.markAsPaid(boletoId);
        } catch (error) {
            console.error('Erro ao marcar boleto como pago:', error);
            setErrorMessage('Erro ao marcar boleto como pago. Tente novamente.');
            setShowError(true);
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
                    <h1 className={styles.title}>
                        <MdPeople size={28} />
                        Gestão de Clientes
                    </h1>
                    {!showEmptyState && (
                        <span className={styles.clientCount}>
                            <FiUsers size={14} />
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
                        <FiFilter size={18} />
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
                        <FiUserPlus size={18} />
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

            {/* Modal de Exclusão */}
            {showDeleteModal && clientToDelete && (
                <DeleteClientModal
                    client={clientToDelete}
                    onConfirm={handleDeleteClient}
                    onCancel={() => {
                        setShowDeleteModal(false);
                        setClientToDelete(null);
                    }}
                    isDeleting={isDeleting}
                    hasEvents={linkedItemsInfo.hasEvents}
                    eventsCount={linkedItemsInfo.eventsCount}
                    events={linkedItemsInfo.events}
                    hasReceipts={linkedItemsInfo.hasReceipts}
                    hasBoletos={linkedItemsInfo.hasBoletos}
                />
            )}

            {/* Modal de Sucesso */}
            <ConfirmationModal
                isOpen={showSuccessModal}
                title="Sucesso!"
                message={successMessage}
                type="success"
                onConfirm={handleSuccessClose}
                onCancel={handleSuccessClose}
                confirmText="OK"
            />

            {/* Modal de Erro */}
            <ErrorModal
                isOpen={showError}
                message={errorMessage}
                onClose={() => setShowError(false)}
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
                        icon={hasActiveFilters ? <FiSearch size={48} /> : <MdPeople size={48} />}
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
                            onClick: handleClearFilters,
                            icon: <FiX />
                        } : {
                            label: 'Cadastrar Primeiro Cliente',
                            onClick: () => setShowForm(true),
                            icon: <FiUserPlus />
                        }}
                    />
                </div>
            ) : (
                <ClientTable
                    clients={filteredClients}
                    onEdit={setEditingClient}
                    onDelete={openDeleteModal}
                    onViewReceipts={handleViewReceipts}
                    onViewBoletos={handleViewBoletos}
                />
            )}
        </div>
    );
};