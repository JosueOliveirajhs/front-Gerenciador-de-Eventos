// src/components/ClientComponents/ClientPayments.tsx
import React, { useState, useEffect } from 'react';
import { Payment } from '../../types/Payment';
import { paymentService } from '../../services/payments';
import { useAuth } from '../../context/AuthContext';
import { 
  FiDollarSign, 
  FiCalendar, 
  FiCheckCircle, 
  FiXCircle,
  FiClock,
  FiEye,
  FiUploadCloud,
  FiAlertCircle,
  FiExternalLink,
  FiCreditCard,
  FiTrendingUp,
  FiAlertTriangle,
  FiArrowRight,
  FiShield,
  FiX
} from 'react-icons/fi';
import { 
  MdReceipt, 
  MdAttachMoney, 
  MdPayment, 
  MdOutlineAccountBalance,
  MdOutlinePix,
  MdOutlineDescription,
  MdOutlineVerified,
  MdOutlinePending,
  MdOutlineWarning,
  MdOutlineFileDownload
} from 'react-icons/md';
import styles from './ClientPayments.module.css';

const API_URL = 'http://localhost:8080';

const getValidUrl = (url: string | undefined | null) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const isImageFile = (url: string | undefined | null): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/) !== null || lowerUrl.includes('cloudinary.com') && !lowerUrl.endsWith('.pdf');
};

export const ClientPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'BOLETO'>('PIX');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [pixInfo, setPixInfo] = useState({
    pixKey: '',
    pixKeyType: 'CNPJ',
    holderName: '',
    bankName: ''
  });
  const [pixLoading, setPixLoading] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      loadPayments();
    } else {
      setError('Usuário não autenticado');
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (payments.length > 0) {
      const paymentWithOrg = payments.find(p => {
        const orgId = (p as any).event?.organizationId || (p as any).organizationId;
        return !!orgId;
      });
      
      if (paymentWithOrg) {
        const orgId = (paymentWithOrg as any).event?.organizationId || (paymentWithOrg as any).organizationId;
        if (orgId) {
          loadPixInfo(orgId);
        }
      }
    }
  }, [payments]);

  useEffect(() => {
    if (selectedPayment) {
      const orgId = (selectedPayment as any).event?.organizationId || (selectedPayment as any).organizationId;
      if (orgId) {
        loadPixInfo(orgId);
      }
    }
  }, [selectedPayment]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await paymentService.getPaymentsByClientId(user!.id);
      setPayments(data);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      setError('Erro ao carregar pagamentos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadPixInfo = async (orgId: number) => {
    if (!orgId) return;
    
    try {
      setPixLoading(true);
      const response = await fetch(`${API_URL}/api/settings/public/pix/${orgId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPixInfo({
          pixKey: data.pixKey || '',
          pixKeyType: data.pixKeyType || 'CNPJ',
          holderName: data.holderName || '',
          bankName: data.bankName || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados PIX:', error);
    } finally {
      setPixLoading(false);
    }
  };

  const handleUploadReceipt = async () => {
    if (!selectedFile || !selectedPayment) return;

    try {
      setUploading(true);
      const updatedPayment = await paymentService.uploadReceipt(selectedPayment.id, selectedFile);
      setPayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
      setShowPaymentModal(false);
      setSelectedFile(null);
      alert('Comprovante enviado com sucesso! Aguarde a aprovação da organização.');
    } catch (err) {
      alert('Erro ao enviar o comprovante. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const formatDate = (date: string | number[] | null) => {
    if (!date) return '--/--/----';
    if (Array.isArray(date)) {
      const [year, month, day] = date;
      return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
    }
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Data inválida';
      return d.toLocaleDateString('pt-BR');
    } catch { return 'Data inválida'; }
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'PAID': return { icon: <MdOutlineVerified size={16} />, text: 'Pago', class: styles.paid };
      case 'WAITING_APPROVAL': return { icon: <MdOutlinePending size={16} />, text: 'Em Análise', class: styles.waiting };
      case 'REJECTED': return { icon: <MdOutlineWarning size={16} />, text: 'Rejeitado', class: styles.rejected };
      case 'OVERDUE': return { icon: <FiAlertTriangle size={16} />, text: 'Atrasado', class: styles.overdue };
      default: return { icon: <FiClock size={16} />, text: 'Pendente', class: styles.pending };
    }
  };

  const hasPixData = () => {
    return pixInfo.pixKey && pixInfo.pixKey.length > 0;
  };

  const getPixKeyTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'CNPJ': 'Chave PIX (CNPJ)',
      'CPF': 'Chave PIX (CPF)',
      'EMAIL': 'Chave PIX (E-mail)',
      'PHONE': 'Chave PIX (Telefone)',
      'RANDOM': 'Chave PIX (Aleatória)'
    };
    return labels[type] || 'Chave PIX';
  };

  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => ['PENDING', 'REJECTED', 'WAITING_APPROVAL'].includes(p.status)).reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === 'OVERDUE').reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando financeiro...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <FiAlertCircle size={48} color="#ef4444" />
        <h3>Erro ao carregar</h3>
        <p>{error}</p>
        <button onClick={loadPayments} className={styles.retryButton}>
          <FiArrowRight size={16} /> Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className={styles.payments}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <MdAttachMoney size={28} />
          </div>
          <div>
            <h2 className={styles.title}>Financeiro</h2>
            <p className={styles.subtitle}>Acompanhe seus pagamentos e boletos</p>
          </div>
        </div>
      </div>
      
      {/* Cards de Resumo */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.paidCard}`}>
          <div className={styles.statIconWrapper}>
            <MdOutlineVerified size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Pago</span>
            <span className={styles.statValue}>{formatCurrency(totalPaid)}</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.pendingCard}`}>
          <div className={styles.statIconWrapper}>
            <MdOutlinePending size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Pendente</span>
            <span className={styles.statValue}>{formatCurrency(totalPending)}</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.overdueCard}`}>
          <div className={styles.statIconWrapper}>
            <MdOutlineWarning size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Em Atraso</span>
            <span className={styles.statValue}>{formatCurrency(totalOverdue)}</span>
          </div>
        </div>
      </div>

      {/* Lista de Pagamentos */}
      <div className={styles.paymentsList}>
        {payments.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <MdOutlineDescription size={56} />
            </div>
            <h3>Nenhum pagamento</h3>
            <p>Você ainda não possui pagamentos registrados</p>
          </div>
        ) : (
          payments.map(payment => {
            const status = getStatusConfig(payment.status);
            return (
              <div key={payment.id} className={styles.paymentCard}>
                {/* Status Badge - Topo */}
                <div className={styles.paymentTop}>
                  <span className={`${styles.statusBadge} ${status.class}`}>
                    {status.icon}
                    {status.text}
                  </span>
                  <span className={styles.paymentValue}>
                    {formatCurrency(payment.amount)}
                  </span>
                </div>

                {/* Informações */}
                <div className={styles.paymentInfo}>
                  <h4 className={styles.eventTitle}>
                    {payment.eventTitle || 'Evento'}
                  </h4>
                  <div className={styles.paymentMeta}>
                    <span><FiCalendar size={13} /> Venc: {formatDate(payment.dueDate || (payment as any).due_date)}</span>
                  </div>
                </div>

                {/* Alerta de Rejeição */}
                {payment.status === 'REJECTED' && payment.rejectionReason && (
                  <div className={styles.rejectionAlert}>
                    <FiAlertTriangle size={14} />
                    <span><strong>Motivo:</strong> {payment.rejectionReason}</span>
                  </div>
                )}

                {/* Boleto Disponível */}
                {payment.invoiceUrl && (
                  <div className={styles.invoiceBanner}>
                    <div className={styles.invoiceIcon}>
                      <MdOutlineFileDownload size={20} />
                    </div>
                    <div className={styles.invoiceInfo}>
                      <span>Boleto disponível para pagamento</span>
                    </div>
                    <a 
                      href={getValidUrl(payment.invoiceUrl)} 
                      target="_blank" 
                      rel="noreferrer"
                      className={styles.invoiceLink}
                    >
                      <FiExternalLink size={14} /> Abrir
                    </a>
                  </div>
                )}

                {/* Ações */}
                <div className={styles.paymentActions}>
                  {['PENDING', 'REJECTED', 'OVERDUE'].includes(payment.status) && (
                    <button 
                      className={styles.payButton}
                      onClick={() => {
                        setSelectedPayment(payment);
                        setSelectedFile(null);
                        setPaymentMethod('PIX');
                        setShowPaymentModal(true);
                      }}
                    >
                      <MdOutlinePix size={18} />
                      Pagar
                    </button>
                  )}
                  
                  {payment.receiptUrl && (
                    <button 
                      className={styles.receiptButton}
                      onClick={() => {
                        setSelectedPayment(payment);
                        setShowReceiptModal(true);
                      }}
                    >
                      <FiEye size={16} /> Comprovante
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL DE PAGAMENTO */}
      {/* ============================================================ */}
      {showPaymentModal && selectedPayment && (
        <div className={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            {/* Header do Modal */}
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderIcon}>
                <MdAttachMoney size={22} />
              </div>
              <div>
                <h3>Realizar Pagamento</h3>
                <p>Escolha a forma de pagamento e anexe o comprovante</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className={styles.modalClose}>
                <FiX size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Valor */}
              <div className={styles.amountDisplay}>
                <span>Valor a pagar</span>
                <strong>{formatCurrency(selectedPayment.amount)}</strong>
              </div>

              {/* Seletor de Método */}
              <div className={styles.methodSelector}>
                <button 
                  className={`${styles.methodOption} ${paymentMethod === 'PIX' ? styles.methodActive : ''}`}
                  onClick={() => setPaymentMethod('PIX')}
                >
                  <MdOutlinePix size={22} />
                  <span>PIX</span>
                </button>
                <button 
                  className={`${styles.methodOption} ${paymentMethod === 'BOLETO' ? styles.methodActive : ''}`}
                  onClick={() => setPaymentMethod('BOLETO')}
                >
                  <MdOutlineDescription size={22} />
                  <span>Boleto</span>
                </button>
              </div>

              {/* Área de Dados */}
              <div className={styles.dataBox}>
                {paymentMethod === 'PIX' ? (
                  <>
                    <div className={styles.dataBoxHeader}>
                      <MdOutlinePix size={18} />
                      <span>Dados para PIX</span>
                    </div>
                    
                    {pixLoading ? (
                      <p className={styles.dataLoading}>Carregando dados PIX...</p>
                    ) : hasPixData() ? (
                      <div className={styles.dataList}>
                        <div className={styles.dataItem}>
                          <span className={styles.dataLabel}>{getPixKeyTypeLabel(pixInfo.pixKeyType)}</span>
                          <span className={styles.dataValue}>{pixInfo.pixKey}</span>
                        </div>
                        <div className={styles.dataItem}>
                          <span className={styles.dataLabel}>Banco</span>
                          <span className={styles.dataValue}>{pixInfo.bankName}</span>
                        </div>
                        <div className={styles.dataItem}>
                          <span className={styles.dataLabel}>Titular</span>
                          <span className={styles.dataValue}>{pixInfo.holderName}</span>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.dataWarning}>
                        <FiAlertCircle size={16} />
                        <span>Dados PIX não configurados pela organização.</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className={styles.dataBoxHeader}>
                      <MdOutlineDescription size={18} />
                      <span>Boleto Bancário</span>
                    </div>
                    {selectedPayment.invoiceUrl ? (
                      <div className={styles.boletoAction}>
                        <p>O boleto já está disponível para download.</p>
                        <a 
                          href={getValidUrl(selectedPayment.invoiceUrl)} 
                          target="_blank" 
                          rel="noreferrer"
                          className={styles.boletoButton}
                        >
                          <FiExternalLink size={16} /> Visualizar Boleto
                        </a>
                      </div>
                    ) : (
                      <div className={styles.dataWarning}>
                        <FiClock size={16} />
                        <span>Boleto sendo gerado pela organização. Aguarde.</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Upload de Comprovante */}
              <div className={styles.uploadSection}>
                <h4>Comprovante de Pagamento</h4>
                <label className={`${styles.uploadArea} ${selectedFile ? styles.uploadDone : ''}`}>
                  <FiUploadCloud size={28} />
                  <span>{selectedFile ? selectedFile.name : 'Clique para anexar (PDF/Imagem)'}</span>
                  <small>{selectedFile ? 'Arquivo selecionado' : 'Formatos: PDF, JPG, PNG'}</small>
                  <input 
                    type="file" 
                    hidden 
                    accept="image/*,application/pdf"
                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  />
                </label>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className={styles.modalFooter}>
              <button onClick={() => setShowPaymentModal(false)} className={styles.btnCancel}>
                Cancelar
              </button>
              <button 
                onClick={handleUploadReceipt} 
                disabled={!selectedFile || uploading}
                className={`${styles.btnConfirm} ${selectedFile && !uploading ? styles.btnConfirmActive : ''}`}
              >
                {uploading ? 'Enviando...' : 'Confirmar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DE COMPROVANTE */}
      {/* ============================================================ */}
      {showReceiptModal && selectedPayment && (
        <div className={styles.modalOverlay} onClick={() => setShowReceiptModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderIcon}>
                <MdOutlineVerified size={22} />
              </div>
              <div>
                <h3>Comprovante</h3>
                <p>{selectedPayment.eventTitle}</p>
              </div>
              <button onClick={() => setShowReceiptModal(false)} className={styles.modalClose}>
                <FiX size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {selectedPayment.receiptUrl ? (
                <div className={styles.receiptPreview}>
                  {isImageFile(selectedPayment.receiptUrl) ? (
                    <img 
                      src={getValidUrl(selectedPayment.receiptUrl)} 
                      alt="Comprovante" 
                      className={styles.receiptImage}
                    />
                  ) : (
                    <div className={styles.receiptPdf}>
                      <MdOutlineDescription size={48} />
                      <p>Documento PDF</p>
                    </div>
                  )}
                  <a 
                    href={getValidUrl(selectedPayment.receiptUrl)} 
                    target="_blank" 
                    rel="noreferrer"
                    className={styles.receiptOpenLink}
                  >
                    <FiExternalLink size={16} /> Abrir em nova aba
                  </a>
                </div>
              ) : (
                <div className={styles.noReceipt}>
                  <MdOutlineDescription size={48} />
                  <p>Nenhum comprovante disponível</p>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setShowReceiptModal(false)} className={styles.btnCancel}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};