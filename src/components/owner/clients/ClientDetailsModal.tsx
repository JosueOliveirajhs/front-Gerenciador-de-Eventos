// src/components/admin/clients/components/ClientDetailsModal.tsx

import React, { useState, useEffect } from 'react';
import {
  FiX,
  FiMail,
  FiPhone,
  FiCalendar,
  FiEdit2,
  FiFileText,
  FiDollarSign,
  FiStar,
  FiAward,
  FiTrendingUp,
  FiClock,
  FiPieChart,
  FiBarChart2
} from 'react-icons/fi';
import {
  MdPerson,
  MdCreditCard,
  MdEvent,
  MdReceipt,
  MdPayment,
  MdCheckCircle,
  MdWarning,
  MdAttachMoney,
  MdDateRange,
  MdInfo,
  MdError
} from 'react-icons/md';
import { User } from '../types';
import { Event } from '../../../types/Event';
import { Payment } from '../../../types/Payment';
import { useClientData } from '../hooks/useClientData';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import styles from './ClientDetailsModal.module.css';

interface ClientDetailsModalProps {
  client: User;
  onClose: () => void;
  onEdit: (client: User) => void;
  onViewReceipts: (client: User) => void;
  onViewBoletos: (client: User) => void;
}

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  client,
  onClose,
  onEdit,
  onViewReceipts,
  onViewBoletos
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'events' | 'stats' | 'payments'>('info');
  
  // Usar o hook para buscar dados reais
  const { 
    events, 
    payments, 
    stats, 
    loading, 
    error,
    refreshData 
  } = useClientData(client.id);

  useEffect(() => {
    refreshData();
  }, [client.id]);

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return 'Não informado';
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Não informado';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'CONFIRMED': return <MdCheckCircle style={{ color: '#10b981' }} />;
      case 'COMPLETED': return <FiAward style={{ color: '#f59e0b' }} />;
      case 'CANCELLED': return <FiX style={{ color: '#ef4444' }} />;
      default: return <FiClock style={{ color: '#6b7280' }} />;
    }
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      QUOTE: 'Orçamento',
      CONFIRMED: 'Confirmado',
      COMPLETED: 'Realizado',
      CANCELLED: 'Cancelado'
    };
    return texts[status] || status;
  };

  const getPaymentStatusIcon = (status: string) => {
    switch(status) {
      case 'PAID': return <MdCheckCircle style={{ color: '#10b981' }} />;
      case 'PENDING': return <FiClock style={{ color: '#f59e0b' }} />;
      case 'OVERDUE': return <MdError style={{ color: '#ef4444' }} />;
      default: return <MdInfo style={{ color: '#6b7280' }} />;
    }
  };

  const getPaymentStatusText = (status: string) => {
    const texts: Record<string, string> = {
      PAID: 'Pago',
      PENDING: 'Pendente',
      OVERDUE: 'Vencido'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.loadingContainer}>
            <LoadingSpinner text="Carregando dados do cliente..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.errorContainer}>
            <MdError size={48} color="#ef4444" />
            <h3>Erro ao carregar dados</h3>
            <p>{error}</p>
            <button onClick={refreshData} className={styles.retryButton}>
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <div className={styles.clientAvatar}>
              {getInitials(client.name)}
            </div>
            <div className={styles.clientTitle}>
              <h2 className={styles.clientName}>{client.name}</h2>
              <p className={styles.clientSubtitle}>
                Cliente desde {formatDate(client.createdAt).split(' ')[0]}
              </p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'info' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <MdPerson size={16} />
            Informações
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'events' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <MdEvent size={16} />
            Eventos ({events.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'payments' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <MdPayment size={16} />
            Pagamentos ({payments.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'stats' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <FiTrendingUp size={16} />
            Estatísticas
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {activeTab === 'info' && (
            <div className={styles.infoTab}>
              <div className={styles.infoGrid}>
                <div className={styles.infoCard}>
                  <div className={styles.infoIcon}>
                    <MdCreditCard />
                  </div>
                  <div className={styles.infoDetails}>
                    <span className={styles.infoLabel}>CPF</span>
                    <span className={styles.infoValue}>{formatCPF(client.cpf)}</span>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoIcon}>
                    <FiMail />
                  </div>
                  <div className={styles.infoDetails}>
                    <span className={styles.infoLabel}>E-mail</span>
                    <span className={styles.infoValue}>
                      {client.email || 'Não informado'}
                    </span>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoIcon}>
                    <FiPhone />
                  </div>
                  <div className={styles.infoDetails}>
                    <span className={styles.infoLabel}>Telefone</span>
                    <span className={styles.infoValue}>
                      {formatPhone(client.phone)}
                    </span>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoIcon}>
                    <FiCalendar />
                  </div>
                  <div className={styles.infoDetails}>
                    <span className={styles.infoLabel}>Cliente desde</span>
                    <span className={styles.infoValue}>
                      {formatDate(client.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.quickActions}>
                <h3 className={styles.sectionTitle}>Ações Rápidas</h3>
                <div className={styles.actionButtons}>
                  <button
                    onClick={() => {
                      onEdit(client);
                      onClose();
                    }}
                    className={styles.actionButton}
                  >
                    <FiEdit2 size={16} />
                    Editar Dados
                  </button>
                  <button
                    onClick={() => {
                      onViewReceipts(client);
                      onClose();
                    }}
                    className={styles.actionButton}
                  >
                    <MdReceipt size={16} />
                    Comprovantes
                  </button>
                  <button
                    onClick={() => {
                      onViewBoletos(client);
                      onClose();
                    }}
                    className={styles.actionButton}
                  >
                    <MdPayment size={16} />
                    Boletos
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className={styles.eventsTab}>
              {events.length === 0 ? (
                <div className={styles.noData}>
                  <MdEvent size={48} />
                  <p>Nenhum evento encontrado para este cliente</p>
                </div>
              ) : (
                <div className={styles.eventsList}>
                  {events.map(event => (
                    <div key={event.id} className={styles.eventItem}>
                      <div className={styles.eventStatus}>
                        {getStatusIcon(event.status)}
                      </div>
                      <div className={styles.eventInfo}>
                        <h4 className={styles.eventTitle}>{event.title}</h4>
                        <div className={styles.eventMeta}>
                          <span className={styles.eventDate}>
                            <MdDateRange size={12} />
                            {new Date(event.eventDate).toLocaleDateString('pt-BR')}
                          </span>
                          <span className={styles.eventGuests}>
                            <MdPerson size={12} />
                            {event.guestCount} convidados
                          </span>
                          <span className={`${styles.eventStatusBadge} ${styles[event.status?.toLowerCase()]}`}>
                            {getStatusText(event.status)}
                          </span>
                        </div>
                      </div>
                      <div className={styles.eventValue}>
                        <MdAttachMoney size={14} />
                        {formatCurrency(event.totalValue || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className={styles.paymentsTab}>
              {payments.length === 0 ? (
                <div className={styles.noData}>
                  <MdPayment size={48} />
                  <p>Nenhum pagamento encontrado</p>
                </div>
              ) : (
                <div className={styles.paymentsList}>
                  {payments.map(payment => {
                    const isOverdue = payment.status === 'PENDING' && 
                      new Date(payment.dueDate) < new Date();
                    
                    return (
                      <div 
                        key={payment.id} 
                        className={`${styles.paymentItem} ${isOverdue ? styles.overdue : ''}`}
                      >
                        <div className={styles.paymentStatus}>
                          {getPaymentStatusIcon(isOverdue ? 'OVERDUE' : payment.status)}
                        </div>
                        <div className={styles.paymentInfo}>
                          <h4 className={styles.paymentTitle}>
                            {payment.description || `Pagamento #${payment.id}`}
                          </h4>
                          <div className={styles.paymentMeta}>
                            <span className={styles.paymentDate}>
                              <MdDateRange size={12} />
                              Vencimento: {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                            </span>
                            {payment.paymentDate && (
                              <span className={styles.paymentDate}>
                                <MdCheckCircle size={12} />
                                Pago em: {new Date(payment.paymentDate).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={styles.paymentValue}>
                          <MdAttachMoney size={14} />
                          {formatCurrency(payment.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className={styles.statsTab}>
              {/* Cards de estatísticas principais */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <MdEvent />
                  </div>
                  <div className={styles.statContent}>
                    <span className={styles.statValue}>{stats.totalEvents}</span>
                    <span className={styles.statLabel}>Total de Eventos</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ backgroundColor: '#dbeafe', color: '#2563eb' }}>
                    <MdCheckCircle />
                  </div>
                  <div className={styles.statContent}>
                    <span className={styles.statValue}>{stats.confirmedEvents}</span>
                    <span className={styles.statLabel}>Confirmados</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                    <FiAward />
                  </div>
                  <div className={styles.statContent}>
                    <span className={styles.statValue}>{stats.completedEvents}</span>
                    <span className={styles.statLabel}>Realizados</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                    <FiX />
                  </div>
                  <div className={styles.statContent}>
                    <span className={styles.statValue}>{stats.cancelledEvents}</span>
                    <span className={styles.statLabel}>Cancelados</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}>
                    <FiPieChart />
                  </div>
                  <div className={styles.statContent}>
                    <span className={styles.statValue}>{stats.quoteEvents}</span>
                    <span className={styles.statLabel}>Orçamentos</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
                    <FiBarChart2 />
                  </div>
                  <div className={styles.statContent}>
                    <span className={styles.statValue}>{stats.monthlyAverage.toFixed(1)}</span>
                    <span className={styles.statLabel}>Eventos/mês</span>
                  </div>
                </div>
              </div>

              {/* Estatísticas financeiras */}
              <div className={styles.financialStats}>
                <h3 className={styles.sectionTitle}>
                  <MdAttachMoney size={18} />
                  Financeiro
                </h3>
                <div className={styles.financialGrid}>
                  <div className={styles.financialCard}>
                    <span className={styles.financialLabel}>Total Gasto</span>
                    <span className={styles.financialValue}>
                      {formatCurrency(stats.totalSpent)}
                    </span>
                  </div>
                  <div className={styles.financialCard}>
                    <span className={styles.financialLabel}>Ticket Médio</span>
                    <span className={styles.financialValue}>
                      {formatCurrency(stats.averageTicket)}
                    </span>
                  </div>
                  <div className={styles.financialCard}>
                    <span className={styles.financialLabel}>Pagamentos Pendentes</span>
                    <span className={`${styles.financialValue} ${styles.pending}`}>
                      {stats.pendingPayments}
                    </span>
                  </div>
                  <div className={styles.financialCard}>
                    <span className={styles.financialLabel}>Pagamentos em Atraso</span>
                    <span className={`${styles.financialValue} ${styles.overdue}`}>
                      {stats.overduePayments}
                    </span>
                  </div>
                  <div className={styles.financialCard}>
                    <span className={styles.financialLabel}>Taxa de Pagamento</span>
                    <span className={styles.financialValue}>
                      {stats.paymentRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className={styles.financialCard}>
                    <span className={styles.financialLabel}>Pagamentos Realizados</span>
                    <span className={styles.financialValue}>
                      {stats.paidPayments}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linha do tempo e preferências */}
              <div className={styles.timelineStats}>
                <h3 className={styles.sectionTitle}>
                  <FiTrendingUp size={18} />
                  Linha do Tempo
                </h3>
                <div className={styles.timelineInfo}>
                  {stats.firstEventDate && (
                    <div className={styles.timelineItem}>
                      <FiCalendar />
                      <span>
                        <strong>Primeiro evento:</strong>{' '}
                        {new Date(stats.firstEventDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  {stats.lastEventDate && (
                    <div className={styles.timelineItem}>
                      <FiClock />
                      <span>
                        <strong>Último evento:</strong>{' '}
                        {new Date(stats.lastEventDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  {stats.favoriteEventType && (
                    <div className={styles.timelineItem}>
                      <FiStar />
                      <span>
                        <strong>Evento favorito:</strong> {stats.favoriteEventType}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tipos de evento */}
              {Object.keys(stats.eventsByType).length > 0 && (
                <div className={styles.eventTypes}>
                  <h3 className={styles.sectionTitle}>
                    <FiPieChart size={18} />
                    Tipos de Evento
                  </h3>
                  <div className={styles.eventTypesList}>
                    {Object.entries(stats.eventsByType).map(([type, count]) => (
                      <div key={type} className={styles.eventTypeItem}>
                        <span className={styles.eventTypeName}>{type}</span>
                        <span className={styles.eventTypeCount}>{count}</span>
                        <div className={styles.eventTypeBar}>
                          <div 
                            className={styles.eventTypeBarFill}
                            style={{ 
                              width: `${(count / stats.totalEvents) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};