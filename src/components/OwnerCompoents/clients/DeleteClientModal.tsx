// src/components/admin/clients/components/DeleteClientModal.tsx

import React, { useEffect } from 'react';
import { 
  FiX, 
  FiAlertTriangle, 
  FiTrash2,
  FiUser,
  FiCheckCircle
} from 'react-icons/fi';
import { 
  MdWarning, 
  MdDangerous,
  MdEvent,
  MdCheckCircle
} from 'react-icons/md';
import { User } from '../types';
import styles from './DeleteClientModal.module.css';

interface DeleteClientModalProps {
  client: User;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  hasEvents?: boolean;
  eventsCount?: number;
  events?: any[];
  hasReceipts?: boolean;
  hasBoletos?: boolean;
  showSuccess?: boolean; // ✅ NOVO
  successMessage?: string; // ✅ NOVO
  onSuccessClose?: () => void; // ✅ NOVO
}

export const DeleteClientModal: React.FC<DeleteClientModalProps> = ({
  client,
  onConfirm,
  onCancel,
  isDeleting = false,
  hasEvents = false,
  eventsCount = 0,
  events = [],
  hasReceipts = false,
  hasBoletos = false,
  showSuccess = false,
  successMessage = 'Cliente excluído com sucesso!',
  onSuccessClose
}) => {
  
  // ✅ Auto-fechar o modal de sucesso após 3 segundos
  useEffect(() => {
    if (showSuccess && onSuccessClose) {
      const timer = setTimeout(() => {
        onSuccessClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, onSuccessClose]);

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data não informada';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  const hasLinkedItems = hasEvents || hasReceipts || hasBoletos;

  // ✅ MODAL DE SUCESSO
  if (showSuccess) {
    return (
      <div className={styles.modalOverlay} onClick={onSuccessClose}>
        <div className={`${styles.modal} ${styles.successModal}`} onClick={e => e.stopPropagation()}>
          <div className={styles.successIconContainer}>
            <MdCheckCircle className={styles.successIcon} size={64} />
          </div>
          <h2 className={styles.successTitle}>Sucesso!</h2>
          <p className={styles.successMessage}>{successMessage}</p>
          <button 
            className={styles.successButton}
            onClick={onSuccessClose}
          >
            <FiCheckCircle size={18} />
            OK
          </button>
        </div>
      </div>
    );
  }

  // ✅ MODAL DE CONFIRMAÇÃO (normal)
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header com ícone de alerta */}
        <div className={styles.modalHeader}>
          <div className={styles.warningIcon}>
            <FiAlertTriangle size={32} />
          </div>
          <button 
            className={styles.closeButton} 
            onClick={onCancel}
            disabled={isDeleting}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className={styles.modalContent}>
          <h2 className={styles.modalTitle}>Excluir Cliente</h2>
          
          <div className={styles.clientInfo}>
            <div className={styles.clientAvatar}>
              {getInitials(client.name)}
            </div>
            <div className={styles.clientDetails}>
              <span className={styles.clientName}>{client.name}</span>
              <span className={styles.clientCpf}>{formatCPF(client.cpf)}</span>
              {client.email && (
                <span className={styles.clientEmail}>{client.email}</span>
              )}
            </div>
          </div>

          <p className={styles.warningText}>
            Tem certeza que deseja excluir este cliente?
          </p>
          
          <p className={styles.warningSubtext}>
            Esta ação é <strong>irreversível</strong> e removerá permanentemente todos os dados do cliente.
          </p>

          {/* Alerta de eventos vinculados */}
          {hasEvents && (
            <div className={styles.linkedItemsAlert}>
              <MdWarning size={20} />
              <div>
                <strong>⚠️ Este cliente possui {eventsCount} evento(s) vinculado(s)!</strong>
                <p className={styles.linkedItemsWarning}>
                  Para excluir o cliente, primeiro exclua os eventos abaixo:
                </p>
                <ul className={styles.eventsList}>
                  {events.map((event, index) => (
                    <li key={index} className={styles.eventItem}>
                      <MdEvent size={16} />
                      <span>
                        <strong>{event.title}</strong> - {new Date(event.eventDate).toLocaleDateString('pt-BR')}
                        <span className={styles.eventStatus}> ({event.status})</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Informações adicionais */}
          <div className={styles.additionalInfo}>
            {client.createdAt && (
              <div className={styles.infoItem}>
                <FiUser size={14} />
                <span>Cliente desde: {formatDate(client.createdAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className={styles.modalActions}>
          <button 
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button 
            className={`${styles.confirmButton} ${isDeleting ? styles.deleting : ''} ${hasEvents ? styles.disabled : ''}`}
            onClick={onConfirm}
            disabled={isDeleting || hasEvents}
          >
            {isDeleting ? (
              <>
                <span className={styles.spinner}></span>
                Excluindo...
              </>
            ) : hasEvents ? (
              <>
                <MdWarning size={18} />
                Não é possível excluir
              </>
            ) : (
              <>
                <FiTrash2 size={18} />
                Sim, Excluir Cliente
              </>
            )}
          </button>
        </div>

        {/* Aviso adicional para casos críticos */}
        {hasEvents && (
          <div className={styles.criticalWarning}>
            <MdDangerous size={16} />
            <span>Exclua primeiro os eventos vinculados para poder excluir o cliente.</span>
          </div>
        )}
      </div>
    </div>
  );
};