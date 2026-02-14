// src/components/admin/events/components/DeleteConfirmationModal.tsx

import React from 'react';
import { FiX, FiTrash2 } from 'react-icons/fi';
import { MdWarning } from 'react-icons/md';
import { Event } from '../../../types/Event';
import styles from '../EventManagement.module.css';

interface DeleteConfirmationModalProps {
  event: Event;
  onConfirm: () => void;
  onCancel: () => void;
  formatDateForDisplay: (dateString: string) => string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  event,
  onConfirm,
  onCancel,
  formatDateForDisplay
}) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.deleteModal}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Confirmar Exclusão</h3>
          <button onClick={onCancel} className={styles.closeButton}>
            <FiX size={20} />
          </button>
        </div>
        
        <div className={styles.modalContent}>
          <div className={styles.warningIcon}>
            <MdWarning size={48} />
          </div>
          <p className={styles.warningText}>
            Tem certeza que deseja excluir o evento <strong>"{event.title}"</strong>?
          </p>
          <p className={styles.warningSubtext}>
            Data: {formatDateForDisplay(event.eventDate)}<br />
            Cliente: {event.client?.name || 'N/A'}<br />
            Esta ação não pode ser desfeita.
          </p>
        </div>

        <div className={styles.modalActions}>
          <button type="button" onClick={onCancel} className={styles.secondaryButton}>
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} className={styles.dangerButton}>
            <FiTrash2 size={18} />
            Excluir Evento
          </button>
        </div>
      </div>
    </div>
  );
};