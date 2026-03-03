import React, { useState, useEffect } from 'react';
import { Payment } from '../../types/Payment';
import { paymentService } from '../../services/payments';
import { useAuth } from '../../context/AuthContext';
import { 
  FiDollarSign, 
  FiCreditCard, 
  FiCalendar, 
  FiCheckCircle, 
  FiXCircle,
  FiClock,
  FiDownload,
  FiEye,
  FiUpload
} from 'react-icons/fi';
import { MdReceipt, MdPayment, MdAttachMoney } from 'react-icons/md';
import styles from './ClientPayments.module.css';

export const ClientPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    console.log('👤 Usuário no pagamento:', user);
    if (user?.id) {
      loadPayments();
    } else {
      setError('Usuário não autenticado');
      setLoading(false);
    }
  }, [user]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('💰 Carregando pagamentos do cliente:', user?.id);
      
      // Usando a função correta: getPaymentsByClientId
      const data = await paymentService.getPaymentsByClientId(user!.id);
      console.log('✅ Pagamentos carregados:', data);
      setPayments(data);
      
    } catch (error) {
      console.error('❌ Erro ao carregar pagamentos:', error);
      setError('Erro ao carregar pagamentos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'PAID': return <FiCheckCircle color="#10b981" />;
      case 'PENDING': return <FiClock color="#f59e0b" />;
      case 'OVERDUE': return <FiXCircle color="#ef4444" />;
      default: return <FiClock color="#64748b" />;
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'PAID': return 'Pago';
      case 'PENDING': return 'Pendente';
      case 'OVERDUE': return 'Atrasado';
      default: return status || 'Desconhecido';
    }
  };

  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === 'OVERDUE').reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando financeiro...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={loadPayments} className={styles.retryButton}>
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className={styles.payments}>
      <h2 className={styles.title}>💰 Pagamentos e Financeiro</h2>
      
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.paid}`}>
          <span className={styles.statLabel}>Total Pago</span>
          <span className={styles.statValue}>{formatCurrency(totalPaid)}</span>
        </div>
        <div className={`${styles.statCard} ${styles.pending}`}>
          <span className={styles.statLabel}>Total Pendente</span>
          <span className={styles.statValue}>{formatCurrency(totalPending)}</span>
        </div>
        <div className={`${styles.statCard} ${styles.overdue}`}>
          <span className={styles.statLabel}>Total em Atraso</span>
          <span className={styles.statValue}>{formatCurrency(totalOverdue)}</span>
        </div>
        <div className={`${styles.statCard} ${styles.total}`}>
          <span className={styles.statLabel}>Total Geral</span>
          <span className={styles.statValue}>{formatCurrency(totalPaid + totalPending + totalOverdue)}</span>
        </div>
      </div>

      <div className={styles.paymentsList}>
        {payments.length === 0 ? (
          <div className={styles.emptyState}>
            <MdReceipt size={48} />
            <p>Nenhum pagamento encontrado</p>
            <p className={styles.emptySubtext}>
              Quando você fizer uma reserva, os pagamentos aparecerão aqui.
            </p>
          </div>
        ) : (
          payments.map(payment => (
            <div key={payment.id} className={styles.paymentCard}>
              <div className={styles.paymentHeader}>
                <div className={styles.paymentEvent}>
                  <h4>{payment.eventTitle || 'Evento'}</h4>
                  <span className={styles.paymentDate}>
                    <FiCalendar size={14} />
                    {formatDate(payment.paymentDate)}
                  </span>
                </div>
                <span className={`${styles.paymentStatus} ${styles[payment.status?.toLowerCase() || 'pending']}`}>
                  {getStatusIcon(payment.status)}
                  {getStatusText(payment.status)}
                </span>
              </div>

              <div className={styles.paymentAmount}>
                <FiDollarSign size={16} />
                <strong>{formatCurrency(payment.amount)}</strong>
              </div>

              {payment.dueDate && (
                <div className={styles.paymentDue}>
                  <FiCalendar size={14} />
                  Vencimento: {formatDate(payment.dueDate)}
                </div>
              )}

              <div className={styles.paymentActions}>
                {payment.status === 'PENDING' && (
                  <button 
                    className={styles.payButton}
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowPaymentModal(true);
                    }}
                  >
                    <MdAttachMoney size={16} />
                    Pagar Agora
                  </button>
                )}
                
                {payment.receiptUrl ? (
                  <button 
                    className={styles.receiptButton}
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowReceiptModal(true);
                    }}
                  >
                    <FiEye size={16} />
                    Ver Comprovante
                  </button>
                ) : payment.status === 'PAID' ? (
                  <button className={styles.receiptButton}>
                    <FiDownload size={16} />
                    Baixar Comprovante
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Pagamento */}
      {showPaymentModal && selectedPayment && (
        <div className={styles.modal} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>Realizar Pagamento</h3>
            <p><strong>Evento:</strong> {selectedPayment.eventTitle}</p>
            <p><strong>Valor:</strong> {formatCurrency(selectedPayment.amount)}</p>
            <p><strong>Vencimento:</strong> {formatDate(selectedPayment.dueDate)}</p>
            
            <div className={styles.paymentOptions}>
              <button className={styles.paymentOption}>
                <FiCreditCard size={24} />
                <span>Cartão de Crédito</span>
              </button>
              <button className={styles.paymentOption}>
                <MdPayment size={24} />
                <span>PIX</span>
              </button>
              <button className={styles.paymentOption}>
                <MdReceipt size={24} />
                <span>Boleto</span>
              </button>
            </div>

            <div className={styles.modalActions}>
              <button onClick={() => setShowPaymentModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Comprovante */}
      {showReceiptModal && selectedPayment && (
        <div className={styles.modal} onClick={() => setShowReceiptModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>Comprovante de Pagamento</h3>
            <p><strong>Evento:</strong> {selectedPayment.eventTitle}</p>
            <p><strong>Valor:</strong> {formatCurrency(selectedPayment.amount)}</p>
            <p><strong>Data:</strong> {formatDate(selectedPayment.paymentDate)}</p>
            
            {selectedPayment.receiptUrl ? (
              <iframe 
                src={selectedPayment.receiptUrl} 
                className={styles.receiptFrame}
                title="Comprovante"
              />
            ) : (
              <div className={styles.noReceipt}>
                <p>Nenhum comprovante disponível</p>
              </div>
            )}

            <div className={styles.modalActions}>
              <button onClick={() => setShowReceiptModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};