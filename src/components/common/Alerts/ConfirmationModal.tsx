import React from 'react';
import { FiX, FiCheckCircle } from 'react-icons/fi';
import { MdCheckCircle, MdWarning } from 'react-icons/md';
import styles from './ConfirmationModal.module.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error';
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  type,
  onConfirm,
  onCancel,
  confirmText = 'OK'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className={styles.successIcon} size={64} />;
      case 'warning':
        return <MdWarning size={48} color="#f59e0b" />;
      case 'error':
        return <MdWarning size={48} color="#ef4444" />;
      default:
        return <FiCheckCircle className={styles.successIcon} size={64} />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'success':
        return 'transparent'; // O successIcon já tem cor própria
      case 'warning':
        return '#fef3c7';
      case 'error':
        return '#fee2e2';
      default:
        return 'transparent';
    }
  };

  const getModalClass = () => {
    switch (type) {
      case 'success':
        return styles.successModal;
      case 'warning':
        return styles.warningModal;
      case 'error':
        return styles.errorModal;
      default:
        return styles.successModal;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      case 'warning':
        return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'error':
        return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      default:
        return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'success':
        return styles.successButton;
      default:
        return styles.confirmButton;
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div 
        className={`${styles.modal} ${getModalClass()}`} 
        onClick={e => e.stopPropagation()}
      >
        {type === 'success' ? (
          // Layout idêntico ao successModal do EventManagement.module.css
          <>
            <div className={styles.successIconContainer}>
              {getIcon()}
            </div>
            <h2 className={styles.successTitle}>{title}</h2>
            <p className={styles.successMessage}>{message}</p>
            <button 
              className={styles.successButton}
              onClick={onConfirm}
            >
              <FiCheckCircle size={18} />
              {confirmText}
            </button>
          </>
        ) : (
          // Layout original para warning/error
          <>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{title}</h3>
              <button onClick={onCancel} className={styles.closeButton}>
                <FiX size={20} />
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div 
                className={styles.iconContainer}
                style={{ backgroundColor: getIconBg() }}
              >
                {getIcon()}
              </div>
              <p className={styles.message}>{message}</p>
            </div>

            <div className={styles.modalActions}>
              <button 
                type="button" 
                onClick={onConfirm} 
                className={getButtonClass()}
                style={{ background: getButtonColor() }}
              >
                <FiCheckCircle size={18} />
                {confirmText}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};