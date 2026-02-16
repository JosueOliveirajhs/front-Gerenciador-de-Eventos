import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import { MdWarning } from 'react-icons/md';
import styles from './ErrorModal.module.css';

interface ErrorModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  message,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.iconContainer}>
          <MdWarning className={styles.errorIcon} size={48} />
        </div>
        <h2 className={styles.errorTitle}>Erro</h2>
        <p className={styles.errorMessage}>{message}</p>
        <button className={styles.errorButton} onClick={onClose}>
          <FiCheckCircle size={18} />
          OK
        </button>
      </div>
    </div>
  );
};