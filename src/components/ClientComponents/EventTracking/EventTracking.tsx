// src/components/ClientComponents/EventTracking/EventTracking.tsx
import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, 
  FiClock, 
  FiMapPin, 
  FiCheckCircle, 
  FiCircle,
  FiChevronRight,
  FiAlertCircle,
  FiInfo,
  FiMessageCircle
} from 'react-icons/fi';
import { 
  MdEvent, 
  MdLocationOn,
  MdPeople,
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
      
      const events = await eventService.getMyEvents();
      
      if (events && events.length > 0) {
        const activeEvent = events.find(e => e.status === 'CONFIRMED') ||
                           events.find(e => e.status === 'QUOTE') ||
                           events[0];
        
        await loadEventProgress(activeEvent.id);
      } else {
        setProgress(null);
        setLoading(false);
      }
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
      setError('Nao foi possivel carregar seus eventos. Tente novamente.');
      setLoading(false);
    }
  };

  const loadEventProgress = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const eventData = await eventService.getEventById(id);
      
      // Verificar se tem proposta
      let hasProposal = false;
      let proposalId: string | undefined;
      try {
        const proposals = await proposalService.getProposalsByEvent(id);
        hasProposal = proposals && proposals.length > 0;
        if (hasProposal) proposalId = proposals[0].id;
      } catch (err) {
        console.log('Sem propostas para este evento');
      }
      
      // Verificar se tem contrato
      let hasContract = false;
      let contractId: string | undefined;
      try {
        const contracts = await contractService.getContractsByEvent(id);
        hasContract = contracts && contracts.length > 0;
        if (hasContract) contractId = contracts[0].id;
      } catch (err) {
        console.log('Sem contratos para este evento');
      }
      
      const eventProgress: EventProgress = {
        event: {
          id: eventData.id,
          title: eventData.title || 'Evento sem titulo',
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
        proposalId,
        contractId,
        hasProposal,
        hasContract
      };
      
      setProgress(eventProgress);
      
    } catch (err) {
      console.error('Erro ao carregar progresso:', err);
      setError('Nao foi possivel carregar os detalhes do evento.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FORMATAÇÃO
  // ============================================================

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Data nao definida';
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

  const formatTime = (time: string): string => {
    return time?.substring(0, 5) || '';
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getEventTypeLabel = (type: string): string => {
    const types: Record<string, string> = {
      'ANIVERSARIO': 'Aniversario',
      'CASAMENTO': 'Casamento',
      'CORPORATIVO': 'Corporativo',
      'FORMATURA': 'Formatura',
      'CONFRATERNIZACAO': 'Confraternizacao',
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
      'QUOTE': 'Em Cotacao',
      'COMPLETED': 'Realizado',
      'CANCELLED': 'Cancelado'
    };
    return labels[status] || status;
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
        <p>Voce ainda nao tem eventos confirmados ou em cotacao.</p>
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

      {/* Visão Geral */}
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
              <span className={styles.infoLabel}>Horario</span>
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

        {/* Resumo Financeiro */}
        <div className={styles.infoCard}>
          <h3>Resumo Financeiro</h3>
          <div className={styles.financialSummary}>
            <div className={styles.financialCard}>
              <span className={styles.financialLabel}>Valor Total</span>
              <span className={styles.financialValue}>{formatCurrency(event.totalValue)}</span>
            </div>
            {event.depositValue > 0 && (
              <div className={styles.financialCard}>
                <span className={styles.financialLabel}>Sinal Pago</span>
                <span className={styles.financialValue} style={{ color: '#10b981' }}>
                  {formatCurrency(event.depositValue)}
                </span>
              </div>
            )}
            {event.balanceValue > 0 && (
              <div className={styles.financialCard}>
                <span className={styles.financialLabel}>Saldo Pendente</span>
                <span className={styles.financialValue} style={{ color: '#f59e0b' }}>
                  {formatCurrency(event.balanceValue)}
                </span>
              </div>
            )}
          </div>
          {event.balanceDueDate && event.balanceValue > 0 && (
            <div className={styles.balanceDueAlert}>
              <FiCalendar size={16} />
              <span>Saldo a vencer em {formatDate(event.balanceDueDate)}</span>
            </div>
          )}
        </div>

        {/* Observações */}
        {event.importantNotes && (
          <div className={styles.notesCard}>
            <h3>
              <FiInfo size={18} />
              Observacoes Importantes
            </h3>
            <p>{event.importantNotes}</p>
          </div>
        )}

        {/* Ações */}
        <div className={styles.actionsCard}>
          <h3>Acoes Disponiveis</h3>
          <div className={styles.actionButtons}>
            {progress.hasProposal && (
              <button className={styles.actionButton} onClick={handleViewProposal}>
                <MdDescription size={20} />
                <span>Ver Proposta</span>
                <FiChevronRight size={16} />
              </button>
            )}
            {progress.hasContract && (
              <button className={styles.actionButton} onClick={handleViewContract}>
                <MdDescription size={20} />
                <span>Ver Contrato</span>
                <FiChevronRight size={16} />
              </button>
            )}
            <button className={styles.actionButton} onClick={handleViewPayments}>
              <MdPayment size={20} />
              <span>Ver Pagamentos</span>
              <FiChevronRight size={16} />
            </button>
            <button className={styles.actionButton} onClick={handleContactSupport}>
              <FiMessageCircle size={20} />
              <span>Falar com Suporte</span>
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventTracking;