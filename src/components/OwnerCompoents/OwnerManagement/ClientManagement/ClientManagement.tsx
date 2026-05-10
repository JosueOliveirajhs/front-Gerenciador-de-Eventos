// src/components/admin/clients/ClientManagement.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  FiSearch,  
  FiFilter,
  FiX,
  FiUsers,
  FiUserPlus,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import { 
  MdPeople, 
  MdFilterList
} from 'react-icons/md';
import { User, Filters } from '../../types';
import { userService } from '../../../../services/users';
import { receiptService } from '../../../../services/receipts';
import { boletoService } from '../../../../services/boletos';
import { eventService } from '../../../../services/events';
import { paymentService } from '../../../../services/payments';
import { Pagination } from '../../../common/Pagination/Pagination';

import { LoadingSpinner } from '../../../common/Loading/LoadingSpinner';
import { EmptyState } from '../../../common/EmptyState/EmptyState';
import { ClientFilters } from '../../clients/ClientFilters';
import { ClientTable } from '../../clients/ClientTable';
import { ClientForm } from '../../clients/ClientForm';
import { DeleteClientModal } from '../../clients/DeleteClientModal';
import { ConfirmationModal } from '../../../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../../../common/Alerts/ErrorModal';
import { ReceiptModal } from '../../components/ReceiptModal';
import { BoletoModal } from '../../components/BoletoModal';

import styles from './ClientManagement.module.css';

interface AdvancedFilters {
  status: 'ALL' | 'ACTIVE' | 'BLOCKED' | 'TERMINATED';
  hasEvents: 'ALL' | 'YES' | 'NO';
  dateRange: {
    start: string;
    end: string;
  };
}

interface ClientStats {
  total: number;
  active: number;
  blocked: number;
  terminated: number;
  withEvents: number;
  withoutEvents: number;
}

export const ClientManagement: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const hasLoadedRef = useRef(false);
  
  const [clients, setClients] = useState<User[]>([]);
  const [filteredClients, setFilteredClients] = useState<User[]>([]);
  const [clientEventsMap, setClientEventsMap] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<User | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showBoletoModal, setShowBoletoModal] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successType, setSuccessType] = useState<'create' | 'update' | 'delete'>('create');
  
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

  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    status: 'ALL',
    hasEvents: 'ALL',
    dateRange: {
      start: '',
      end: ''
    }
  });

  const [stats, setStats] = useState<ClientStats>({
    total: 0,
    active: 0,
    blocked: 0,
    terminated: 0,
    withEvents: 0,
    withoutEvents: 0
  });

  // ✅ ESTADOS DE PAGINAÇÃO
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ CARREGAMENTO OTIMIZADO - Busca todos os eventos de uma vez
  const loadClients = useCallback(async () => {
    if (!isVisible || hasLoadedRef.current) return;
    
    try {
      setLoading(true);
      console.log('🔍 Carregando clientes e eventos...');
      
      // ✅ Buscar clientes e TODOS os eventos em PARALELO (apenas 2 chamadas)
      const [clientsData, allEvents] = await Promise.all([
        userService.getAllClients(),
        eventService.getAllEvents()
      ]);
      
      console.log(`✅ ${clientsData.length} clientes carregados`);
      console.log(`✅ ${allEvents.length} eventos carregados`);
      
      // ✅ Mapear eventos por cliente (processamento local, sem chamadas adicionais)
      const eventsMap = new Map<number, number>();
      let activeCount = 0;
      let blockedCount = 0;
      let terminatedCount = 0;
      let withEventsCount = 0;
      
      // Contar eventos por cliente
      allEvents.forEach(event => {
        if (event.clientId) {
          const currentCount = eventsMap.get(event.clientId) || 0;
          eventsMap.set(event.clientId, currentCount + 1);
        }
      });
      
      // Processar estatísticas
      clientsData.forEach(client => {
        const eventCount = eventsMap.get(client.id) || 0;
        if (eventCount > 0) withEventsCount++;
        
        if (client.status === 'ACTIVE') activeCount++;
        else if (client.status === 'BLOCKED') blockedCount++;
        else if (client.status === 'TERMINATED') terminatedCount++;
      });
      
      setClientEventsMap(eventsMap);
      setClients(clientsData);
      setFilteredClients(clientsData);
      
      setStats({
        total: clientsData.length,
        active: activeCount,
        blocked: blockedCount,
        terminated: terminatedCount,
        withEvents: withEventsCount,
        withoutEvents: clientsData.length - withEventsCount
      });
      
      hasLoadedRef.current = true;
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error);
      setErrorMessage('Erro ao carregar clientes. Tente novamente.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  }, [isVisible]);

  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

  useEffect(() => {
    if (isVisible && !hasLoadedRef.current) {
      loadClients();
    }
  }, [isVisible, loadClients]);

  // ✅ Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, advancedFilters]);

  // ✅ Recarregar clientes (OTIMIZADO)
  const reloadClients = useCallback(async () => {
    try {
      setLoading(true);
      
      // ✅ Buscar clientes e eventos em paralelo
      const [clientsData, allEvents] = await Promise.all([
        userService.getAllClients(),
        eventService.getAllEvents()
      ]);
      
      // Mapear eventos por cliente
      const eventsMap = new Map<number, number>();
      let activeCount = 0;
      let blockedCount = 0;
      let terminatedCount = 0;
      let withEventsCount = 0;
      
      allEvents.forEach(event => {
        if (event.clientId) {
          const currentCount = eventsMap.get(event.clientId) || 0;
          eventsMap.set(event.clientId, currentCount + 1);
        }
      });
      
      clientsData.forEach(client => {
        const eventCount = eventsMap.get(client.id) || 0;
        if (eventCount > 0) withEventsCount++;
        
        if (client.status === 'ACTIVE') activeCount++;
        else if (client.status === 'BLOCKED') blockedCount++;
        else if (client.status === 'TERMINATED') terminatedCount++;
      });
      
      setClientEventsMap(eventsMap);
      setClients(clientsData);
      setFilteredClients(clientsData);
      
      setStats({
        total: clientsData.length,
        active: activeCount,
        blocked: blockedCount,
        terminated: terminatedCount,
        withEvents: withEventsCount,
        withoutEvents: clientsData.length - withEventsCount
      });
      
      setCurrentPage(1);
    } catch (error) {
      console.error('Erro ao recarregar clientes:', error);
      setErrorMessage('Erro ao carregar clientes. Tente novamente.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Aplicar filtros
  const applyFilters = useCallback(() => {
    if (!clients.length) return;
    
    let result = [...clients];

    // Filtros básicos
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

    // Filtros avançados - Status
    if (advancedFilters.status !== 'ALL') {
      result = result.filter(client => client.status === advancedFilters.status);
    }

    // Filtros avançados - Data de cadastro
    if (advancedFilters.dateRange.start) {
      result = result.filter(client => 
        client.createdAt && new Date(client.createdAt) >= new Date(advancedFilters.dateRange.start)
      );
    }
    
    if (advancedFilters.dateRange.end) {
      result = result.filter(client => 
        client.createdAt && new Date(client.createdAt) <= new Date(advancedFilters.dateRange.end)
      );
    }

    // Filtros avançados - Possui eventos
    if (advancedFilters.hasEvents !== 'ALL') {
      result = result.filter(client => {
        const eventCount = clientEventsMap.get(client.id) || 0;
        return advancedFilters.hasEvents === 'YES' ? eventCount > 0 : eventCount === 0;
      });
    }

    setFilteredClients(result);
  }, [filters, advancedFilters, clients, clientEventsMap]);

  useEffect(() => {
    if (clients.length > 0) {
      applyFilters();
    }
  }, [applyFilters, clients.length]);

  // ✅ Clientes paginados
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredClients.slice(startIndex, endIndex);
  }, [filteredClients, currentPage, itemsPerPage]);

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

  const handleClearAdvancedFilters = useCallback(() => {
    setAdvancedFilters({
      status: 'ALL',
      hasEvents: 'ALL',
      dateRange: {
        start: '',
        end: ''
      }
    });
  }, []);

  const handleClearAllFilters = useCallback(() => {
    handleClearFilters();
    handleClearAdvancedFilters();
  }, [handleClearFilters, handleClearAdvancedFilters]);

  // Handlers de cliente
  const handleCreateClient = async (clientData: any) => {
    try {
      await userService.createClient(clientData);
      await reloadClients();
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
      await reloadClients();
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

  const openDeleteModal = async (client: User) => {
    if (!client || !client.id) {
      setErrorMessage('Erro: Cliente inválido');
      setShowError(true);
      return;
    }
    
    try {
      // ✅ Usar o mapa de eventos que já temos (mais rápido)
      const eventCount = clientEventsMap.get(client.id) || 0;
      const hasEvents = eventCount > 0;
      
      // Se precisar dos detalhes dos eventos, buscar apenas quando necessário
      let clientEvents: any[] = [];
      if (hasEvents) {
        clientEvents = await eventService.getEventsByClientId(client.id);
      }
      
      setLinkedItemsInfo({
        hasEvents,
        eventsCount: eventCount,
        events: clientEvents,
        hasReceipts: false,
        hasBoletos: false
      });
      
    } catch (error) {
      console.error('Erro ao verificar eventos do cliente:', error);
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

  const handleDeleteClient = async () => {
    if (!clientToDelete || !clientToDelete.id) return;
    
    if (linkedItemsInfo.hasEvents) {
      setErrorMessage('Este cliente possui eventos vinculados e não pode ser excluído.');
      setShowError(true);
      return;
    }
    
    setIsDeleting(true);
    
    try {
      await userService.deleteClient(clientToDelete.id);
      
      setClients(prev => prev.filter(c => c.id !== clientToDelete.id));
      setFilteredClients(prev => prev.filter(c => c.id !== clientToDelete.id));
      
      // Atualizar mapa de eventos
      setClientEventsMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(clientToDelete.id);
        return newMap;
      });
      
      setShowDeleteModal(false);
      setSuccessMessage(`Cliente ${clientToDelete.name} excluído com sucesso!`);
      setSuccessType('delete');
      setShowSuccessModal(true);
      
    } catch (error: any) {
      console.error('Erro ao excluir cliente:', error);
      
      let message = 'Erro ao excluir cliente. Verifique se não há eventos vinculados.';
      if (error.message) message = error.message;
      else if (error.response?.data?.message) message = error.response.data.message;
      else if (error.response?.data?.error) message = error.response.data.error;
      
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

  const handleApprovePayment = async (paymentId: number) => {
    if (window.confirm('Tem certeza que deseja aprovar este pagamento?')) {
      try {
        await paymentService.approvePayment(paymentId);
        alert('Pagamento aprovado com sucesso!');
        // Recarregar os comprovantes para atualizar o status
        if (selectedClient) {
          const receiptsData = await receiptService.getClientReceipts(selectedClient.id);
          setReceipts(receiptsData);
        }
      } catch (error) {
        console.error('Erro ao aprovar pagamento:', error);
        setErrorMessage('Erro ao aprovar pagamento.');
        setShowError(true);
      }
    }
  };

  const handleRejectPayment = async (paymentId: number) => {
    const reason = window.prompt('Informe o motivo da rejeição:');
    if (reason === null) return; // Cancelou
    
    if (!reason.trim()) {
      alert('Motivo é obrigatório para rejeitar.');
      return;
    }

    try {
      await paymentService.rejectPayment(paymentId, reason);
      alert('Pagamento rejeitado.');
      // Recarregar os comprovantes para atualizar o status
      if (selectedClient) {
        const receiptsData = await receiptService.getClientReceipts(selectedClient.id);
        setReceipts(receiptsData);
      }
    } catch (error) {
      console.error('Erro ao rejeitar pagamento:', error);
      setErrorMessage('Erro ao rejeitar pagamento.');
      setShowError(true);
    }
  };

  const handleUploadBoleto = async (clientId: number, description: string, value: number, dueDate: Date, file: File) => {
    try {
      await boletoService.uploadBoleto(clientId, description, value, dueDate, file);
      alert('Boleto anexado com sucesso!');
    } catch (error) {
      console.error('Erro ao anexar boleto:', error);
      setErrorMessage('Erro ao anexar boleto.');
      setShowError(true);
      throw error;
    }
  };

  const hasActiveFilters = useMemo(() => {
    const hasBasicFilters = Object.values(filters).some(v => v.trim() !== '');
    const hasAdvancedFilters = advancedFilters.status !== 'ALL' || 
                               advancedFilters.hasEvents !== 'ALL' ||
                               advancedFilters.dateRange.start !== '' ||
                               advancedFilters.dateRange.end !== '';
    return hasBasicFilters || hasAdvancedFilters;
  }, [filters, advancedFilters]);

  const showEmptyState = filteredClients.length === 0;

  if (!isVisible || (loading && !hasLoadedRef.current)) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>
              <MdPeople size={28} />
              Gestão de Clientes
            </h1>
          </div>
        </div>
        <div className={styles.loadingPlaceholder}>
          <LoadingSpinner text="Carregando clientes..." />
        </div>
      </div>
    );
  }

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
          >
            <FiFilter size={18} />
            <span>{showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}</span>
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

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <MdPeople size={16} />
          <span>Total: <strong>{stats.total}</strong></span>
        </div>
        <div className={styles.statItem}>
          <FiCheckCircle size={16} color="#10b981" />
          <span>Ativos: <strong>{stats.active}</strong></span>
        </div>
        <div className={styles.statItem}>
          <FiAlertCircle size={16} color="#f59e0b" />
          <span>Bloqueados: <strong>{stats.blocked}</strong></span>
        </div>
        <div className={styles.statItem}>
          <FiX size={16} color="#ef4444" />
          <span>Inativos: <strong>{stats.terminated}</strong></span>
        </div>
        <div className={styles.statItem}>
          <FiCalendar size={16} color="#3b82f6" />
          <span>Com eventos: <strong>{stats.withEvents}</strong></span>
        </div>
        <div className={styles.statItem}>
          <FiUsers size={16} color="#64748b" />
          <span>Sem eventos: <strong>{stats.withoutEvents}</strong></span>
        </div>
      </div>

      {/* Filtros Básicos */}
      {showFilters && (
        <>
          <ClientFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            totalResults={filteredClients.length}
          />
          
          {/* Toggle Filtros Avançados */}
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={styles.advancedFilterToggle}
          >
            <MdFilterList size={16} />
            {showAdvancedFilters ? 'Ocultar filtros avançados' : 'Mostrar filtros avançados'}
            {showAdvancedFilters ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          </button>

          {/* Painel de Filtros Avançados */}
          {showAdvancedFilters && (
            <div className={styles.advancedFilters}>
              <div className={styles.advancedFiltersGrid}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>
                    <FiCheckCircle size={14} />
                    Status do Cliente
                  </label>
                  <select
                    value={advancedFilters.status}
                    onChange={(e) => setAdvancedFilters(prev => ({ 
                      ...prev, 
                      status: e.target.value as AdvancedFilters['status']
                    }))}
                    className={styles.filterSelect}
                  >
                    <option value="ALL">Todos os status</option>
                    <option value="ACTIVE">Ativos</option>
                    <option value="BLOCKED">Bloqueados</option>
                    <option value="TERMINATED">Inativos</option>
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>
                    <FiCalendar size={14} />
                    Possui Eventos
                  </label>
                  <select
                    value={advancedFilters.hasEvents}
                    onChange={(e) => setAdvancedFilters(prev => ({ 
                      ...prev, 
                      hasEvents: e.target.value as AdvancedFilters['hasEvents']
                    }))}
                    className={styles.filterSelect}
                  >
                    <option value="ALL">Todos</option>
                    <option value="YES">Com eventos</option>
                    <option value="NO">Sem eventos</option>
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>
                    <FiCalendar size={14} />
                    Data de Cadastro
                  </label>
                  <div className={styles.dateRange}>
                    <input
                      type="date"
                      value={advancedFilters.dateRange.start}
                      onChange={(e) => setAdvancedFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }))}
                      className={styles.dateInput}
                      placeholder="De"
                    />
                    <span className={styles.dateSeparator}>até</span>
                    <input
                      type="date"
                      value={advancedFilters.dateRange.end}
                      onChange={(e) => setAdvancedFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: e.target.value }
                      }))}
                      className={styles.dateInput}
                      placeholder="Até"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.advancedFiltersActions}>
                <button 
                  onClick={handleClearAdvancedFilters}
                  className={styles.clearFiltersButton}
                >
                  <FiX size={14} />
                  Limpar Filtros Avançados
                </button>
              </div>
            </div>
          )}
        </>
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

      {/* Modais de Documentos */}
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
          onApprove={handleApprovePayment}
          onReject={handleRejectPayment}
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
          onUpload={handleUploadBoleto}
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
              label: 'Limpar Todos os Filtros',
              onClick: handleClearAllFilters,
              icon: <FiX />
            } : {
              label: 'Cadastrar Primeiro Cliente',
              onClick: () => setShowForm(true),
              icon: <FiUserPlus />
            }}
          />
        </div>
      ) : (
        <>
          <ClientTable
            clients={paginatedClients}
            onEdit={setEditingClient}
            onDelete={openDeleteModal}
            onViewReceipts={handleViewReceipts}
            onViewBoletos={handleViewBoletos}
          />
          
          {/* ✅ PAGINAÇÃO */}
          {filteredClients.length > 0 && (
            <div className={styles.paginationWrapper}>
              <span className={styles.paginationInfo}>
                <FiUsers size={14} />
                Total: {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}
              </span>
              <Pagination 
                currentPage={currentPage}
                totalItems={filteredClients.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClientManagement;