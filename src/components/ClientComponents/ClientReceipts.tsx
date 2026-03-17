import React, { useState, useEffect } from 'react';
import { Payment } from '../../types/Payment';
import { paymentService } from '../../services/payments';
import { useAuth } from '../../context/AuthContext';
import { FiDownload, FiEye, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { MdReceipt } from 'react-icons/md';
import styles from './ClientReceipts.module.css';

export const ClientReceipts: React.FC = () => {
  const [receipts, setReceipts] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getClientPayments(user!.id);
      setReceipts(data.filter(p => p.status === 'PAID' || p.receiptUrl));
    } catch (error) {
      console.error('Erro ao carregar comprovantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando comprovantes...</p>
      </div>
    );
  }

  return (
    <div className={styles.receipts}>
      <h2 className={styles.title}>📄 Meus Comprovantes</h2>

      {receipts.length === 0 ? (
        <div className={styles.emptyState}>
          <MdReceipt size={48} />
          <p>Nenhum comprovante disponível</p>
        </div>
      ) : (
        <div className={styles.receiptsGrid}>
          {receipts.map(receipt => (
            <div key={receipt.id} className={styles.receiptCard}>
              <div className={styles.receiptHeader}>
                <MdReceipt size={24} />
                <h3>{receipt.eventTitle}</h3>
              </div>

              <div className={styles.receiptDetails}>
                <div className={styles.receiptDetail}>
                  <FiCalendar size={14} />
                  <span>{formatDate(receipt.paymentDate)}</span>
                </div>
                <div className={styles.receiptDetail}>
                  <FiDollarSign size={14} />
                  <span>{formatCurrency(receipt.amount)}</span>
                </div>
              </div>

              <div className={styles.receiptActions}>
                <button 
                  className={styles.receiptBtn}
                  onClick={() => setSelectedReceipt(receipt)}
                >
                  <FiEye size={16} />
                  Visualizar
                </button>
                <button 
                  className={styles.receiptBtn}
                  onClick={() => window.open(receipt.receiptUrl, '_blank')}
                >
                  <FiDownload size={16} />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReceipt && (
        <div className={styles.modal} onClick={() => setSelectedReceipt(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>Comprovante - {selectedReceipt.eventTitle}</h3>
            {selectedReceipt.receiptUrl ? (
              <iframe 
                src={selectedReceipt.receiptUrl} 
                className={styles.receiptFrame}
              />
            ) : (
              <div className={styles.noReceipt}>
                <p>Comprovante não disponível</p>
              </div>
            )}
            <button onClick={() => setSelectedReceipt(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};