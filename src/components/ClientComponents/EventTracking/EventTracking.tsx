// src/components/ClientComponents/EventTracking/EventTracking.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiCalendar, 
  FiClock, 
  FiMapPin, 
  FiCheckCircle, 
  FiCircle,
  FiChevronRight,
  FiAlertCircle,
  FiDownload,
  FiUsers,
  FiPackage,
  FiDollarSign,
  FiInfo,
  FiExternalLink,
  FiMessageCircle
} from 'react-icons/fi';
import { 
  MdEvent, 
  MdChecklist, 
  MdLocationOn,
  MdPeople,
  MdAttachMoney,
  MdDescription,
  MdPayment
} from 'react-icons/md';
import { useAuth } from '../../../context/AuthContext';
import { eventService } from '../../../services/events';
import { proposalService } from '../../../services/proposal';
import { contractService } from '../../../services/contract';
import { paymentService } from '../../../services/payments';
import styles from './EventTracking.module.css';

// ============================================================
// INTERFACES
// ============================================================

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate?: string;
  category: 'PRE_EVENT' | 'EVENT_DAY' | 'POST_EVENT';
  order: number;
  responsiblePerson?: string;
  notes?: string;
}

interface ContractedService {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  provider?: string;
  providerContact?: string;
}

interface Payment {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  paidAt?: string;
  receiptUrl?: string;
  installmentNumber?: number;
  totalInstallments?: number;
}

interface EventDetails {
  id: string;
  title: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  address: string;
  status: string;
  guestCount: number;
  importantNotes?: string;
  totalValue: number;
  depositValue: number;
  balanceValue: number;
  balanceDueDate?: string;
  createdAt: string;
  clientId?: string;
  clientName?: string;
}

interface EventProgress {
  event: EventDetails;
  checklist: ChecklistItem[];
  completedSteps: number;
  totalSteps: number;
  contractedServices: ContractedService[];
  payments: Payment[];
  nextDeadline?: {
    title: string;
    date: string;
    type: 'CHECKLIST' | 'PAYMENT' | 'MEETING';
  };
  proposalId?: string;
  contractId?: string;
  hasProposal: boolean;
  hasContract: boolean;
}

interface EventTrackingProps {
  eventId?: string;
  onBack?: () => void;
  onViewChange?: (view: string, params?: any) => void;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export const EventTracking: React.FC<EventTrackingProps> = ({ 
  eventId, 
  onBack, 
  onViewChange 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<EventProgress | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'services' | 'financial'>('overview');
  const [activeCategory, setActiveCategory] = useState<'PRE_EVENT' | 'EVENT_DAY' | 'POST_EVENT'>('PRE_EVENT');
  const [updating, setUpdating] = useState(false);

  // ============================================================
  // CARREGAMENTO DE DADOS
  // ============================================================

  useEffect(() => {
    if (eventId) {
      loadEventProgress(eventId);
    } else {
      loadLatestEvent();
    }
  }, [eventId]);

  const loadLatestEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📅 Buscando eventos do cliente...');
      const events = await eventService.getMyEvents();
      
      if (events && events.length > 0) {
        // Priorizar eventos CONFIRMED, depois QUOTE
        const activeEvent = events.find(e => e.status === 'CONFIRMED') ||
                           events.find(e => e.status === 'QUOTE') ||
                           events[0];
        
        console.log('✅ Evento selecionado:', activeEvent.id, activeEvent.title);
        await loadEventProgress(activeEvent.id);
      } else {
        console.log('ℹ️ Nenhum evento encontrado');
        setProgress(null);
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar eventos:', err);
      setError('Não foi possível carregar seus eventos. Tente novamente.');
      setLoading(false);
    }
  };

  const loadEventProgress = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📅 Carregando detalhes do evento:', id);
      
      // Buscar detalhes do evento
      const eventData = await eventService.getEventById(id);
      console.log('✅ Evento carregado:', eventData.title);
      
      // Buscar checklist do evento
      const checklistData = await loadEventChecklist(id);
      
      // Buscar serviços contratados
      const servicesData = await loadEventServices(id);
      
      // Buscar pagamentos
      const paymentsData = await loadEventPayments(id);
      
      // Verificar se tem proposta
      let hasProposal = false;
      let proposalId: string | undefined;
      try {
        const proposals = await proposalService.getProposalsByEvent(id);
        hasProposal = proposals && proposals.length > 0;
        if (hasProposal) {
          proposalId = proposals[0].id;
        }
      } catch (err) {
        console.log('ℹ️ Sem propostas para este evento');
      }
      
      // Verificar se tem contrato
      let hasContract = false;
      let contractId: string | undefined;
      try {
        const contracts = await contractService.getContractsByEvent(id);
        hasContract = contracts && contracts.length > 0;
        if (hasContract) {
          contractId = contracts[0].id;
        }
      } catch (err) {
        console.log('ℹ️ Sem contratos para este evento');
      }
      
      // Calcular progresso
      const completedSteps = checklistData.filter(i => i.completed).length;
      const totalSteps = checklistData.length;
      
      // Encontrar próximo prazo
      const nextDeadline = findNextDeadline(checklistData, paymentsData);
      
      // Construir objeto de progresso
      const eventProgress: EventProgress = {
        event: {
          id: eventData.id,
          title: eventData.title || 'Evento sem título',
          eventType: eventData.eventType || 'OUTRO',
          eventDate: eventData.eventDate,
          startTime: eventData.startTime || '00:00',
          endTime: eventData.endTime || '23:59',
          location: eventData.location || 'A definir',
          address: eventData.address || '',
          status: eventData.status || 'QUOTE',
          guestCount: eventData.guestCount || 0,
          importantNotes: eventData.notes,
          totalValue: parseFloat(eventData.totalValue) || 0,
          depositValue: parseFloat(eventData.depositValue) || 0,
          balanceValue: parseFloat(eventData.balanceValue) || 0,
          balanceDueDate: eventData.balanceDueDate,
          createdAt: eventData.createdAt,
          clientId: eventData.clientId,
          clientName: eventData.client?.name
        },
        checklist: checklistData,
        completedSteps,
        totalSteps,
        contractedServices: servicesData,
        payments: paymentsData,
        nextDeadline,
        proposalId,
        contractId,
        hasProposal,
        hasContract
      };
      
      setProgress(eventProgress);
      console.log('✅ Progresso carregado com sucesso');
      
    } catch (err) {
      console.error('❌ Erro ao carregar progresso:', err);
      setError('Não foi possível carregar os detalhes do evento.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CARREGAMENTO DE DADOS ESPECÍFICOS
  // ============================================================

  const loadEventChecklist = async (eventId: string): Promise<ChecklistItem[]> => {
    try {
      // Tentar buscar checklist da API
      const response = await eventService.getEventChecklist(eventId);
      if (response && response.length > 0) {
        return response;
      }
    } catch (err) {
      console.log('ℹ️ Checklist não encontrado, criando padrão...');
    }
    
    // Criar checklist padrão baseado no tipo de evento
    return generateDefaultChecklist(eventId);
  };

  const loadEventServices = async (eventId: string): Promise<ContractedService[]> => {
    try {
      const response = await eventService.getEventServices(eventId);
      return response || [];
    } catch (err) {
      console.log('ℹ️ Serviços não encontrados');
      return [];
    }
  };

  const loadEventPayments = async (eventId: string): Promise<Payment[]> => {
    try {
      const response = await paymentService.getPaymentsByEventId(eventId);
      return response || [];
    } catch (err) {
      console.log('ℹ️ Pagamentos não encontrados');
      return [];
    }
  };

  // ============================================================
  // ATUALIZAÇÃO DE CHECKLIST
  // ============================================================

  const handleToggleChecklistItem = async (itemId: string, completed: boolean) => {
    if (!progress || updating) return;
    
    try {
      setUpdating(true);
      
      await eventService.updateChecklistItem(progress.event.id, itemId, !completed);
      
      // Atualizar estado local
      setProgress(prev => {
        if (!prev) return prev;
        
        const updatedChecklist = prev.checklist.map(item =>
          item.id === itemId ? { ...item, completed: !completed } : item
        );
        
        const completedSteps = updatedChecklist.filter(i => i.completed).length;
        
        return {
          ...prev,
          checklist: updatedChecklist,
          completedSteps,
          nextDeadline: findNextDeadline(updatedChecklist, prev.payments)
        };
      });
      
    } catch (err) {
      console.error('❌ Erro ao atualizar item:', err);
      alert('Não foi possível atualizar o item. Tente novamente.');
    } finally {
      setUpdating(false);
    }
  };

  // ============================================================
  // FUNÇÕES AUXILIARES
  // ============================================================

  const generateDefaultChecklist = (eventId: string): ChecklistItem[] => {
    // Checklist padrão para qualquer evento
    return [
      {
        id: `${eventId}-1`,
        title: 'Definir lista de convidados',
        description: 'Criar lista completa com nomes para confirmação de presença',
        completed: false,
        category: 'PRE_EVENT',
        order: 1
      },
      {
        id: `${eventId}-2`,
        title: 'Confirmar detalhes com o local',
        description: 'Verificar horários, acessos e necessidades especiais',
        completed: false,
        category: 'PRE_EVENT',
        order: 2
      },
      {
        id: `${eventId}-3`,
        title: 'Enviar convites',
        description: 'Enviar convites aos convidados',
        completed: false,
        category: 'PRE_EVENT',
        order: 3
      },
      {
        id: `${eventId}-4`,
        title: 'Confirmar presenças',
        description: 'Coletar confirmações dos convidados',
        completed: false,
        category: 'PRE_EVENT',
        order: 4
      },
      {
        id: `${eventId}-5`,
        title: 'Check-in no dia do evento',
        description: 'Chegar com antecedência para verificar preparativos',
        completed: false,
        category: 'EVENT_DAY',
        order: 5
      },
      {
        id: `${eventId}-6`,
        title: 'Agradecimento pós-evento',
        description: 'Enviar mensagens de agradecimento aos convidados',
        completed: false,
        category: 'POST_EVENT',
        order: 6
      }
    ];
  };

  const findNextDeadline = (checklist: ChecklistItem[], payments: Payment[]) => {
    const today = new Date();
    let nextDeadline: { title: string; date: string; type: 'CHECKLIST' | 'PAYMENT' | 'MEETING' } | undefined;
    
    // Verificar próximos itens da checklist
    const pendingChecklist = checklist
      .filter(item => !item.completed && item.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    
    if (pendingChecklist.length > 0) {
      const first = pendingChecklist[0];
      const dueDate = new Date(first.dueDate!);
      if (dueDate >= today) {
        nextDeadline = {
          title: first.title,
          date: first.dueDate!,
          type: 'CHECKLIST'
        };
      }
    }
    
    // Verificar próximos pagamentos
    const pendingPayments = payments
      .filter(p => p.status === 'PENDING')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    if (pendingPayments.length > 0) {
      const first = pendingPayments[0];
      const dueDate = new Date(first.dueDate);
      
      if (!nextDeadline || dueDate < new Date(nextDeadline.date)) {
        nextDeadline = {
          title: `Pagamento - ${first.description}`,
          date: first.dueDate,
          type: 'PAYMENT'
        };
      }
    }
    
    return nextDeadline;
  };

  // ============================================================
  // FORMATAÇÃO
  // ============================================================

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Data não definida';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatShortDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const formatTime = (time: string): string => {
    return time?.substring(0, 5) || '';
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const calculateProgress = (): number => {
    if (!progress || progress.totalSteps === 0) return 0;
    return Math.round((progress.completedSteps / progress.totalSteps) * 100);
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      'PRE_EVENT': 'Pré-Evento',
      'EVENT_DAY': 'Dia do Evento',
      'POST_EVENT': 'Pós-Evento'
    };
    return labels[category] || category;
  };

  const getEventTypeLabel = (type: string): string => {
    const types: Record<string, string> = {
      'ANIVERSARIO': 'Aniversário',
      'CASAMENTO': 'Casamento',
      'CORPORATIVO': 'Corporativo',
      'FORMATURA': 'Formatura',
      'CONFRATERNIZACAO': 'Confraternização',
      'OUTRO': 'Outro'
    };
    return types[type] || type;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'CONFIRMED': '#10b981',
      'QUOTE': '#f59e0b',
      'COMPLETED': '#64748b',
      'CANCELLED': '#ef4444'
    };
    return colors[status] || '#64748b';
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      'CONFIRMED': 'Confirmado',
      'QUOTE': 'Em Cotação',
      'COMPLETED': 'Realizado',
      'CANCELLED': 'Cancelado'
    };
    return labels[status] || status;
  };

  const getPaymentStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      'PAID': 'Pago',
      'PENDING': 'Pendente',
      'OVERDUE': 'Atrasado'
    };
    return labels[status] || status;
  };

  const getPaymentStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'PAID': '#10b981',
      'PENDING': '#f59e0b',
      'OVERDUE': '#ef4444'
    };
    return colors[status] || '#64748b';
  };

  // ============================================================
  // NAVEGAÇÃO
  // ============================================================

  const handleViewProposal = () => {
    if (progress?.proposalId && onViewChange) {
      onViewChange('proposal', { proposalId: progress.proposalId });
    }
  };

  const handleViewContract = () => {
    if (progress?.contractId && onViewChange) {
      onViewChange('contract', { contractId: progress.contractId });
    }
  };

  const handleViewPayments = () => {
    if (onViewChange) {
      onViewChange('payments');
    }
  };

  const handleContactSupport = () => {
    if (onViewChange) {
      onViewChange('messages');
    }
  };

  // ============================================================
  // RENDERIZAÇÃO
  // ============================================================

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando acompanhamento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <FiAlertCircle size={48} color="#ef4444" />
        <h3>Erro ao carregar</h3>
        <p>{error}</p>
        <button className={styles.retryButton} onClick={() => eventId ? loadEventProgress(eventId) : loadLatestEvent()}>
          Tentar novamente
        </button>
        {onBack && (
          <button className={styles.backButton} onClick={onBack}>
            Voltar
          </button>
        )}
      </div>
    );
  }

  if (!progress) {
    return (
      <div className={styles.emptyState}>
        <MdEvent size={64} />
        <h3>Nenhum evento em andamento</h3>
        <p>Você ainda não tem eventos confirmados ou em cotação.</p>
        {onBack && (
          <button className={styles.backButton} onClick={onBack}>
            Voltar para Meus Eventos
          </button>
        )}
      </div>
    );
  }

  const { event } = progress;

  return (
    <div className={styles.eventTracking}>
      {/* Header do Evento */}
      <div className={styles.eventHeader}>
        <div className={styles.eventHeaderContent}>
          <div className={styles.eventTitleSection}>
            <h1 className={styles.eventTitle}>
              <MdEvent size={28} />
              {event.title}
            </h1>
            <span 
              className={styles.eventStatus}
              style={{ background: `${getStatusColor(event.status)}20`, color: getStatusColor(event.status) }}
            >
              {getStatusLabel(event.status)}
            </span>
          </div>
          
          <div className={styles.eventMeta}>
            <div className={styles.metaItem}>
              <FiCalendar size={18} />
              <span>{formatDate(event.eventDate)}</span>
            </div>
            <div className={styles.metaItem}>
              <FiClock size={18} />
              <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
            </div>
            <div className={styles.metaItem}>
              <MdLocationOn size={18} />
              <span>{event.location}</span>
            </div>
            <div className={styles.metaItem}>
              <MdPeople size={18} />
              <span>{event.guestCount} convidados</span>
            </div>
          </div>
          
          {event.address && <p className={styles.eventAddress}>{event.address}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FiInfo size={16} />
          Visão Geral
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'checklist' ? styles.active : ''}`}
          onClick={() => setActiveTab('checklist')}
        >
          <MdChecklist size={16} />
          Checklist ({progress.completedSteps}/{progress.totalSteps})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'services' ? styles.active : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <FiPackage size={16} />
          Serviços {progress.contractedServices.length > 0 && `(${progress.contractedServices.length})`}
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'financial' ? styles.active : ''}`}
          onClick={() => setActiveTab('financial')}
        >
          <FiDollarSign size={16} />
          Financeiro
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      <div className={styles.tabContent}>
        {/* ============================================================ */}
        {/* VISÃO GERAL */}
        {/* ============================================================ */}
        {activeTab === 'overview' && (
          <div className={styles.overviewTab}>
            {/* Dados do Evento */}
            <div className={styles.infoCard}>
              <h3>Dados do Evento</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tipo de Evento</span>
                  <span className={styles.infoValue}>{getEventTypeLabel(event.eventType)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Data</span>
                  <span className={styles.infoValue}>{formatDate(event.eventDate)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Horário</span>
                  <span className={styles.infoValue}>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Local</span>
                  <span className={styles.infoValue}>{event.location}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Convidados</span>
                  <span className={styles.infoValue}>{event.guestCount} pessoas</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Status</span>
                  <span className={styles.infoValue} style={{ color: getStatusColor(event.status) }}>
                    {getStatusLabel(event.status)}
                  </span>
                </div>
                {event.createdAt && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Solicitado em</span>
                    <span className={styles.infoValue}>{formatDate(event.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Observações */}
            {event.importantNotes && (
              <div className={styles.notesCard}>
                <h3>Observações Importantes</h3>
                <p>{event.importantNotes}</p>
              </div>
            )}

            {/* Progresso */}
            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <h3>Progresso Geral</h3>
                <span className={styles.progressPercentage}>{calculateProgress()}%</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>
              <p className={styles.progressText}>
                {progress.completedSteps} de {progress.totalSteps} etapas concluídas
              </p>
            </div>

            {/* Próximo Prazo */}
            {progress.nextDeadline && (
              <div className={styles.nextDeadline}>
                <FiAlertCircle size={16} />
                <span>
                  Próximo prazo: <strong>{progress.nextDeadline.title}</strong> - {formatDate(progress.nextDeadline.date)}
                </span>
              </div>
            )}

            {/* Checklist Resumido */}
            <div className={styles.checklistPreview}>
              <div className={styles.previewHeader}>
                <h3>Checklist Resumido</h3>
                <button onClick={() => setActiveTab('checklist')}>
                  Ver completo <FiChevronRight size={14} />
                </button>
              </div>
              <div className={styles.previewList}>
                {progress.checklist.slice(0, 5).map(item => (
                  <div key={item.id} className={styles.previewItem}>
                    {item.completed ? (
                      <FiCheckCircle size={18} color="#10b981" />
                    ) : (
                      <FiCircle size={18} color="#cbd5e1" />
                    )}
                    <span className={item.completed ? styles.completedText : ''}>
                      {item.title}
                    </span>
                  </div>
                ))}
                {progress.checklist.length > 5 && (
                  <div className={styles.moreItems}>
                    +{progress.checklist.length - 5} itens
                  </div>
                )}
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className={styles.quickActions}>
              <h3>Ações</h3>
              <div className={styles.actionButtons}>
                {progress.hasProposal && (
                  <button className={styles.actionButton} onClick={handleViewProposal}>
                    <MdDescription size={18} />
                    Ver Proposta
                  </button>
                )}
                {progress.hasContract && (
                  <button className={styles.actionButton} onClick={handleViewContract}>
                    <MdDescription size={18} />
                    Ver Contrato
                  </button>
                )}
                <button className={styles.actionButton} onClick={handleViewPayments}>
                  <MdPayment size={18} />
                  Ver Pagamentos
                </button>
                <button className={styles.actionButton} onClick={handleContactSupport}>
                  <FiMessageCircle size={18} />
                  Falar com Suporte
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CHECKLIST */}
        {/* ============================================================ */}
        {activeTab === 'checklist' && (
          <div className={styles.checklistTab}>
            <div className={styles.categoryTabs}>
              {(['PRE_EVENT', 'EVENT_DAY', 'POST_EVENT'] as const).map(category => {
                const categoryItems = progress.checklist.filter(i => i.category === category);
                const completedCount = categoryItems.filter(i => i.completed).length;
                
                return (
                  <button
                    key={category}
                    className={`${styles.categoryTab} ${activeCategory === category ? styles.active : ''}`}
                    onClick={() => setActiveCategory(category)}
                  >
                    <span className={styles.categoryLabel}>{getCategoryLabel(category)}</span>
                    <span className={styles.categoryCount}>
                      {completedCount}/{categoryItems.length}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={styles.checklistSection}>
              <div className={styles.checklist}>
                {progress.checklist
                  .filter(item => item.category === activeCategory)
                  .sort((a, b) => a.order - b.order)
                  .map(item => (
                    <div 
                      key={item.id} 
                      className={`${styles.checklistItem} ${item.completed ? styles.completed : ''}`}
                    >
                      <div className={styles.checklistItemHeader}>
                        <button 
                          className={styles.checkboxButton}
                          onClick={() => handleToggleChecklistItem(item.id, item.completed)}
                          disabled={updating}
                        >
                          {item.completed ? (
                            <FiCheckCircle size={24} color="#10b981" />
                          ) : (
                            <FiCircle size={24} color="#cbd5e1" />
                          )}
                        </button>
                        
                        <div className={styles.itemContent}>
                          <h4 className={styles.itemTitle}>{item.title}</h4>
                          <div className={styles.itemMeta}>
                            {item.dueDate && (
                              <span className={styles.itemDueDate}>
                                <FiCalendar size={12} />
                                Prazo: {formatDate(item.dueDate)}
                              </span>
                            )}
                            {item.responsiblePerson && (
                              <span className={styles.itemResponsible}>
                                <FiUsers size={12} />
                                {item.responsiblePerson}
                              </span>
                            )}
                          </div>
                          <p className={styles.itemDescription}>{item.description}</p>
                          {item.notes && (
                            <p className={styles.itemNotes}>
                              <FiInfo size={12} /> {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                {progress.checklist.filter(i => i.category === activeCategory).length === 0 && (
                  <div className={styles.emptyCategory}>
                    <p>Nenhum item nesta categoria.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SERVIÇOS */}
        {/* ============================================================ */}
        {activeTab === 'services' && (
          <div className={styles.servicesTab}>
            <h3>Serviços Contratados</h3>
            
            {progress.contractedServices.length === 0 ? (
              <div className={styles.emptyServices}>
                <FiPackage size={48} />
                <p>Nenhum serviço contratado ainda.</p>
                <button className={styles.contactButton} onClick={handleContactSupport}>
                  Solicitar Orçamento
                </button>
              </div>
            ) : (
              <>
                <div className={styles.servicesSummary}>
                  <div className={styles.summaryCard}>
                    <span>Total de Serviços</span>
                    <strong>{progress.contractedServices.length}</strong>
                  </div>
                  <div className={styles.summaryCard}>
                    <span>Valor Total</span>
                    <strong>
                      {formatCurrency(progress.contractedServices.reduce((sum, s) => sum + s.totalPrice, 0))}
                    </strong>
                  </div>
                </div>
                
                <div className={styles.servicesList}>
                  {progress.contractedServices.map(service => (
                    <div key={service.id} className={styles.serviceCard}>
                      <div className={styles.serviceHeader}>
                        <h4>{service.name}</h4>
                        <span 
                          className={styles.serviceStatus}
                          style={{ 
                            background: service.status === 'CONFIRMED' ? '#d1fae5' : 
                                       service.status === 'PENDING' ? '#fef3c7' : '#fee2e2',
                            color: service.status === 'CONFIRMED' ? '#065f46' : 
                                  service.status === 'PENDING' ? '#92400e' : '#991b1b'
                          }}
                        >
                          {service.status === 'CONFIRMED' ? 'Confirmado' : 
                           service.status === 'PENDING' ? 'Pendente' : 'Cancelado'}
                        </span>
                      </div>
                      <p className={styles.serviceDescription}>{service.description}</p>
                      <div className={styles.serviceDetails}>
                        <span>Quantidade: {service.quantity}</span>
                        <span>Valor Unit.: {formatCurrency(service.unitPrice)}</span>
                        <strong>Total: {formatCurrency(service.totalPrice)}</strong>
                      </div>
                      {service.provider && (
                        <div className={styles.serviceProvider}>
                          <FiUsers size={14} />
                          <span>{service.provider}</span>
                          {service.providerContact && <span> • {service.providerContact}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* FINANCEIRO */}
        {/* ============================================================ */}
        {activeTab === 'financial' && (
          <div className={styles.financialTab}>
            <h3>Resumo Financeiro</h3>
            
            <div className={styles.financialSummary}>
              <div className={styles.financialCard}>
                <MdAttachMoney size={24} />
                <div>
                  <span>Valor Total</span>
                  <strong>{formatCurrency(event.totalValue)}</strong>
                </div>
              </div>
              <div className={styles.financialCard}>
                <FiCheckCircle size={24} color="#10b981" />
                <div>
                  <span>Total Pago</span>
                  <strong style={{ color: '#10b981' }}>
                    {formatCurrency(event.depositValue + progress.payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0))}
                  </strong>
                </div>
              </div>
              <div className={styles.financialCard}>
                <FiAlertCircle size={24} color="#f59e0b" />
                <div>
                  <span>Saldo Pendente</span>
                  <strong style={{ color: '#f59e0b' }}>
                    {formatCurrency(event.balanceValue)}
                  </strong>
                </div>
              </div>
            </div>
            
            {event.balanceDueDate && event.balanceValue > 0 && (
              <div className={styles.balanceDueAlert}>
                <FiCalendar size={18} />
                <span>Saldo a vencer em {formatDate(event.balanceDueDate)}</span>
              </div>
            )}
            
            {progress.payments.length > 0 && (
              <div className={styles.paymentsList}>
                <h4>Parcelas</h4>
                {progress.payments.map(payment => (
                  <div key={payment.id} className={styles.paymentItem}>
                    <div className={styles.paymentInfo}>
                      <span className={styles.paymentDescription}>{payment.description}</span>
                      <span className={styles.paymentDueDate}>
                        Vencimento: {formatDate(payment.dueDate)}
                      </span>
                    </div>
                    <div className={styles.paymentAmount}>
                      <strong>{formatCurrency(payment.amount)}</strong>
                      <span 
                        className={styles.paymentStatus}
                        style={{ color: getPaymentStatusColor(payment.status) }}
                      >
                        {getPaymentStatusLabel(payment.status)}
                      </span>
                    </div>
                    {payment.receiptUrl && (
                      <a 
                        href={payment.receiptUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.receiptLink}
                      >
                        <FiExternalLink size={14} />
                        Comprovante
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <button className={styles.viewAllPaymentsButton} onClick={handleViewPayments}>
              Ver todos os pagamentos
              <FiChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventTracking;