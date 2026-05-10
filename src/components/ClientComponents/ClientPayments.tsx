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
  FiExternalLink
} from 'react-icons/fi';
import { MdReceipt, MdAttachMoney, MdPayment } from 'react-icons/md';
import styles from './ClientPayments.module.css';

const getValidUrl = (url: string | undefined | null) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
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
  
  // Modais
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  
  // Estados para o Pagamento
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'BOLETO'>('PIX');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
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
      const data = await paymentService.getPaymentsByClientId(user!.id);
      setPayments(data);
    } catch (error) {
      setError('Erro ao carregar pagamentos. Tente novamente.');
    } finally {
      setLoading(false);
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
    
    // Se for array (Jackson default), converte
    if (Array.isArray(date)) {
        const [year, month, day] = date;
        return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
    }

    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Data inválida';
      return d.toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'PAID': return { icon: <FiCheckCircle />, text: 'Pago', class: styles.paid };
      case 'WAITING_APPROVAL': return { icon: <FiClock />, text: 'Em Análise', class: styles.waiting };
      case 'REJECTED': return { icon: <FiAlertCircle />, text: 'Rejeitado', class: styles.rejected };
      case 'OVERDUE': return { icon: <FiXCircle />, text: 'Atrasado', class: styles.overdue };
      default: return { icon: <FiClock />, text: 'Pendente', class: styles.pending };
    }
  };

  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => ['PENDING', 'REJECTED', 'WAITING_APPROVAL'].includes(p.status)).reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === 'OVERDUE').reduce((sum, p) => sum + p.amount, 0);

  if (loading) return <div className={styles.loading}>Carregando financeiro...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

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
      </div>

      <div className={styles.paymentsList}>
        {payments.length === 0 ? (
          <div className={styles.emptyState}>
            <MdReceipt size={48} />
            <p>Nenhum pagamento encontrado</p>
          </div>
        ) : (
          payments.map(payment => {
            const status = getStatusConfig(payment.status);
            return (
              <div key={payment.id} className={styles.paymentCard}>
                <div className={styles.paymentHeader}>
                  <div className={styles.paymentEvent}>
                    <h4>{payment.eventTitle || 'Evento'}</h4>
                    <span className={styles.paymentDate}>
                      <FiCalendar size={14} /> Vencimento: {formatDate(payment.dueDate || (payment as any).due_date)}
                    </span>
                  </div>
                  <span className={`${styles.paymentStatus} ${status.class}`}>
                    {status.icon} {status.text}
                  </span>
                </div>

                {payment.status === 'REJECTED' && payment.rejectionReason && (
                  <div className={styles.rejectionAlert} style={{ background: '#fee2e2', color: '#991b1b', padding: '8px', borderRadius: '4px', marginTop: '10px', fontSize: '0.9rem' }}>
                    <strong>Motivo da rejeição:</strong> {payment.rejectionReason}
                  </div>
                )}

                <div className={styles.paymentAmount}>
                  <FiDollarSign size={16} />
                  <strong>{formatCurrency(payment.amount)}</strong>
                </div>

                {payment.invoiceUrl && (
                  <div className={styles.invoiceBadge} style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
                    <MdReceipt size={20} color="#2563eb" />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: '#1e40af' }}>Boleto Disponível</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#3b82f6' }}>Acesse para realizar o pagamento</p>
                    </div>
                    <a 
                      href={getValidUrl(payment.invoiceUrl)} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ background: '#2563eb', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 'bold' }}
                    >
                      Ver Boleto
                    </a>
                  </div>
                )}

                <div className={styles.paymentActions}>
                  {['PENDING', 'REJECTED', 'OVERDUE'].includes(payment.status) && (
                    <button 
                      className={styles.payButton}
                      onClick={() => {
                        setSelectedPayment(payment);
                        setSelectedFile(null);
                        setPaymentMethod('PIX'); // Reseta para PIX ao abrir
                        setShowPaymentModal(true);
                      }}
                    >
                      <MdAttachMoney size={16} />
                      Ver Dados e Pagar
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
                      <FiEye size={16} /> Ver Comprovante
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE DADOS DE PAGAMENTO E UPLOAD */}
      {showPaymentModal && selectedPayment && (
        <div className={styles.modal} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>Instruções de Pagamento</h3>
            <p>Selecione a forma de pagamento, efetue o pagamento e anexe o comprovante abaixo.</p>
            
            {/* Abas de Seleção de Método */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', marginBottom: '15px' }}>
              <button 
                onClick={() => setPaymentMethod('PIX')}
                style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '6px', border: paymentMethod === 'PIX' ? '2px solid #2563eb' : '1px solid #cbd5e1', background: paymentMethod === 'PIX' ? '#eff6ff' : '#fff', color: paymentMethod === 'PIX' ? '#1d4ed8' : '#64748b', cursor: 'pointer', fontWeight: 'bold' }}
              >
                <MdPayment size={20} /> PIX
              </button>
              <button 
                onClick={() => setPaymentMethod('BOLETO')}
                style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '6px', border: paymentMethod === 'BOLETO' ? '2px solid #2563eb' : '1px solid #cbd5e1', background: paymentMethod === 'BOLETO' ? '#eff6ff' : '#fff', color: paymentMethod === 'BOLETO' ? '#1d4ed8' : '#64748b', cursor: 'pointer', fontWeight: 'bold' }}
              >
                <MdReceipt size={20} /> Boleto
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', margin: '15px 0', border: '1px solid #e2e8f0', minHeight: '120px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>
                <strong>Valor a pagar:</strong> {formatCurrency(selectedPayment.amount)}
              </p>
              <hr style={{ borderColor: '#e2e8f0', margin: '10px 0' }} />
              
              {paymentMethod === 'PIX' ? (
                <>
                  <h4 style={{ margin: '10px 0 5px 0', color: '#334155' }}>Dados para Transferência / PIX</h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}><strong>Chave PIX (CNPJ):</strong> 00.000.000/0001-00</p>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}><strong>Banco:</strong> Asaas IP S.A.</p>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}><strong>Nome:</strong> Eventos Fáceis Corp</p>
                </>
              ) : (
                <>
                  <h4 style={{ margin: '10px 0 5px 0', color: '#334155' }}>Pagamento via Boleto</h4>
                  {selectedPayment.invoiceUrl ? (
                    <div style={{ marginTop: '15px' }}>
                      <p style={{ margin: '0 0 10px 0', color: '#475569', fontSize: '0.9rem' }}>O boleto já está disponível. Clique abaixo para acessá-lo:</p>
                      <a 
                        href={getValidUrl(selectedPayment.invoiceUrl)} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#2563eb', color: 'white', padding: '8px 12px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem' }}
                      >
                        <FiExternalLink /> Visualizar/Baixar Boleto
                      </a>
                    </div>
                  ) : (
                    <div style={{ marginTop: '15px', padding: '10px', background: '#fef3c7', color: '#92400e', borderRadius: '6px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiClock size={20} />
                      <span>O boleto para este pagamento ainda está sendo gerado pela organização. Volte em breve!</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ÁREA DE UPLOAD (Desabilitada se for Boleto e ainda não existir o arquivo) */}
            <div style={{ marginTop: '20px', opacity: (paymentMethod === 'BOLETO' && !selectedPayment.invoiceUrl) ? 0.5 : 1, pointerEvents: (paymentMethod === 'BOLETO' && !selectedPayment.invoiceUrl) ? 'none' : 'auto' }}>
              <h4 style={{ marginBottom: '10px' }}>Já pagou? Envie seu comprovante:</h4>
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', border: '2px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', background: selectedFile ? '#f0fdf4' : '#fff' }}>
                <FiUploadCloud size={32} color={selectedFile ? '#16a34a' : '#94a3b8'} style={{ marginBottom: '10px' }} />
                <span style={{ color: selectedFile ? '#16a34a' : '#64748b', fontWeight: '500', textAlign: 'center' }}>
                  {selectedFile ? selectedFile.name : 'Clique para selecionar o arquivo (PDF/Imagem)'}
                </span>
                <input 
                  type="file" 
                  hidden 
                  accept="image/*,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                />
              </label>
            </div>

            <div className={styles.modalActions} style={{ marginTop: '25px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowPaymentModal(false)}
                style={{ padding: '10px 15px', border: '1px solid #cbd5e1', background: 'transparent', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleUploadReceipt} 
                disabled={!selectedFile || uploading}
                style={{ padding: '10px 15px', background: (!selectedFile || uploading) ? '#94a3b8' : '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: (!selectedFile || uploading) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
              >
                {uploading ? 'Enviando...' : 'Confirmar Envio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Comprovante (Visualização) */}
      {showReceiptModal && selectedPayment && (
        <div className={styles.modal} onClick={() => setShowReceiptModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>Comprovante de Pagamento</h3>
            <p><strong>Evento:</strong> {selectedPayment.eventTitle}</p>
            
            {selectedPayment.receiptUrl ? (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                {isImageFile(selectedPayment.receiptUrl) ? (
                  <div style={{ marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <img 
                      src={getValidUrl(selectedPayment.receiptUrl)} 
                      alt="Comprovante" 
                      style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} 
                    />
                  </div>
                ) : (
                  <p style={{ margin: '0 0 15px 0', color: '#475569', fontSize: '0.95rem' }}>
                    O arquivo pode estar em formato PDF ou outro tipo. Clique no botão abaixo para abri-lo de forma segura em uma nova aba.
                  </p>
                )}
                <a 
                  href={getValidUrl(selectedPayment.receiptUrl)} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}
                >
                  <FiExternalLink size={18} /> {isImageFile(selectedPayment.receiptUrl) ? 'Ver em Tamanho Cheio' : 'Acessar Comprovante'}
                </a>
              </div>
            ) : (
              <div className={styles.noReceipt}>Nenhum comprovante disponível</div>
            )}

            <div className={styles.modalActions} style={{ marginTop: '15px' }}>
              <button onClick={() => setShowReceiptModal(false)} style={{ padding: '8px 16px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'transparent' }}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};