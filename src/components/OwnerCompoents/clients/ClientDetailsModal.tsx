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
  FiBarChart2,
  FiUpload
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
  MdError,
  MdAdd,
  MdCancel
} from 'react-icons/md';
import { User } from '../types';
import { Event } from '../../../types/Event';
import { Payment } from '../../../types/Payment';
import { useClientData } from '../hooks/useClientData';
import { LoadingSpinner } from '../../common/Loading/LoadingSpinner';
import { paymentService } from '../../../services/payments';
import { api } from '../../../services/api';
import styles from './ClientDetailsModal.module.css';

const getValidUrl = (url: string | undefined | null) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
};

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
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [newPaymentData, setNewPaymentData] = useState({
    description: '',
    amount: '',
    dueDate: ''
  });
  
  // Usar o hook para buscar dados reais
  const { 
    events, 
    payments, 
    stats, 
    loading, 
    error,
    refreshData 
  } = useClientData(client.id);

  // Estados para ações de pagamento
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal de Rejeição
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  
  // Modal de Upload de Boleto
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const formatDate = (date?: string | number[] | null) => {
    if (!date) return 'Não informado';
    
    // Se for array (legado ou erro de Jackson), tenta converter
    if (Array.isArray(date)) {
        const [year, month, day, hour = 0, minute = 0] = date;
        return new Date(year, month - 1, day, hour, minute).toLocaleDateString('pt-BR');
    }

    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Data inválida';
        
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return 'Data inválida';
    }
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
      OVERDUE: 'Vencido',
      WAITING_APPROVAL: 'Aguardando Aprovação',
      REJECTED: 'Rejeitado'
    };
    return texts[status] || status;
  };

  const handleApprovePayment = async (paymentId: number) => {
    if (window.confirm('Tem certeza que deseja aprovar este pagamento? O saldo do evento será atualizado.')) {
      try {
        setActionLoading(true);
        await paymentService.approvePayment(paymentId);
        alert('Pagamento aprovado com sucesso!');
        refreshData();
      } catch (err: any) {
        alert('Erro ao aprovar pagamento: ' + err.message);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPayment || !rejectReason.trim()) {
      alert('Por favor, informe o motivo da rejeição.');
      return;
    }
    try {
      setActionLoading(true);
      await paymentService.rejectPayment(selectedPayment.id, rejectReason);
      alert('Pagamento rejeitado com sucesso.');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedPayment(null);
      refreshData();
    } catch (err: any) {
      alert('Erro ao rejeitar pagamento: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadInvoice = async () => {
    if (!selectedPayment || !selectedFile) {
      alert('Selecione um arquivo primeiro.');
      return;
    }
    try {
      setActionLoading(true);
      await paymentService.uploadInvoice(selectedPayment.id, selectedFile);
      alert('Boleto enviado com sucesso!');
      setShowUploadModal(false);
      setSelectedFile(null);
      setSelectedPayment(null);
      refreshData();
    } catch (err: any) {
      alert('Erro ao enviar boleto: ' + err.message);
    } finally {
      setActionLoading(false);
    }
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
                Cliente desde {formatDate(client.createdAt)}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className={styles.sectionTitle}>Pagamentos do Cliente</h3>
                {!showNewPaymentForm && (
                  <button 
                    onClick={() => setShowNewPaymentForm(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      background: '#00B4D8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <MdAdd size={20} /> Novo Pagamento
                  </button>
                )}
              </div>

              {showNewPaymentForm && (
                <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MdAdd size={20} color="#00B4D8" /> Cadastrar Novo Pagamento
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-muted)' }}>Descrição</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Parcela 1"
                        value={newPaymentData.description}
                        onChange={e => setNewPaymentData({...newPaymentData, description: e.target.value})}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-muted)' }}>Valor (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        value={newPaymentData.amount}
                        onChange={e => setNewPaymentData({...newPaymentData, amount: e.target.value})}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-muted)' }}>Vencimento</label>
                      <input 
                        type="date" 
                        value={newPaymentData.dueDate}
                        onChange={e => setNewPaymentData({...newPaymentData, dueDate: e.target.value})}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                    <button 
                      onClick={() => setShowNewPaymentForm(false)}
                      style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={async () => {
                        if (!newPaymentData.description || !newPaymentData.amount || !newPaymentData.dueDate) {
                          alert('Preencha todos os campos.');
                          return;
                        }
                        
                        const eventId = events.length > 0 ? events[0].id : null;
                        if (!eventId) {
                          alert('O cliente precisa ter pelo menos um evento vinculado.');
                          return;
                        }

                        try {
                          await paymentService.createPayment({
                            eventId: eventId,
                            amount: parseFloat(newPaymentData.amount),
                            dueDate: newPaymentData.dueDate,
                            description: newPaymentData.description,
                            status: 'PENDING'
                          });
                          alert('Pagamento criado!');
                          setShowNewPaymentForm(false);
                          setNewPaymentData({ description: '', amount: '', dueDate: '' });
                          window.location.reload();
                        } catch (err) {
                          alert('Erro ao criar pagamento.');
                        }
                      }}
                      style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#00B4D8', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Criar Pagamento
                    </button>
                  </div>
                </div>
              )}

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
                              Vencimento: {formatDate(payment.dueDate || (payment as any).due_date)}
                            </span>
                            {payment.paymentDate && (
                              <span className={styles.paymentDate}>
                                <MdCheckCircle size={12} />
                                Pago em: {formatDate(payment.paymentDate)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={styles.paymentValue}>
                          <MdAttachMoney size={14} />
                          {formatCurrency(payment.amount)}
                        </div>
                        
                        {/* Ações do Pagamento */}
                        <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {/* Removido botões de Aprovar/Rejeitar e Anexar Boleto daqui, agora estão nos respectivos modais */}
                          
                          {payment.receiptUrl && (
                            <a 
                              href={getValidUrl(payment.receiptUrl)} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ padding: '6px 10px', fontSize: '12px', background: '#64748b', color: 'white', border: 'none', borderRadius: '4px', textDecoration: 'none', display: 'inline-block' }}
                            >
                              <MdReceipt size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }}/> Ver Comprovante
                            </a>
                          )}
                          
                          {payment.invoiceUrl && (
                            <a 
                              href={getValidUrl(payment.invoiceUrl)} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ padding: '6px 10px', fontSize: '12px', background: '#64748b', color: 'white', border: 'none', borderRadius: '4px', textDecoration: 'none', display: 'inline-block' }}
                            >
                              <FiFileText size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }}/> Ver Boleto
                            </a>
                          )}

                          <button 
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'application/pdf';
                              input.onchange = async (e: any) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                try {
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  
                                  const response = await api.post(`/payments/${payment.id}/upload-invoice`, formData, {
                                    headers: {
                                      'Content-Type': 'multipart/form-data'
                                    }
                                  });
                                  
                                  if (response.status === 200) {
                                    alert('Boleto anexado com sucesso!');
                                    // Recarregar os dados do cliente para mostrar o novo boleto
                                    window.location.reload();
                                  } else {
                                    alert('Erro ao anexar boleto.');
                                  }
                                } catch (error: any) {
                                  console.error(error);
                                  alert('Erro ao enviar arquivo: ' + (error.response?.data?.message || error.message));
                                }
                              };
                              input.click();
                            }}
                            style={{ padding: '6px 10px', fontSize: '12px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <FiUpload size={14} /> {payment.invoiceUrl ? 'Substituir Boleto' : 'Anexar Boleto'}
                          </button>
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
      
      {/* Modal Rejeitar */}
      {showRejectModal && selectedPayment && (
        <div className={styles.modalOverlay} style={{ zIndex: 1100 }}>
          <div className={styles.modal} style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Rejeitar Comprovante</h3>
              <button className={styles.closeButton} onClick={() => { setShowRejectModal(false); setSelectedPayment(null); }}><FiX size={20} /></button>
            </div>
            <div className={styles.modalContent} style={{ padding: '20px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#475569' }}>
                Informe o motivo da rejeição do comprovante. Este motivo será enviado ao cliente.
              </p>
              <textarea 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Comprovante ilegível, valor incorreto..."
                style={{ width: '100%', minHeight: '100px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '15px', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => { setShowRejectModal(false); setSelectedPayment(null); }}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleRejectPayment}
                  disabled={actionLoading || !rejectReason.trim()}
                  style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: actionLoading || !rejectReason.trim() ? 'not-allowed' : 'pointer' }}
                >
                  {actionLoading ? 'Rejeitando...' : 'Rejeitar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};