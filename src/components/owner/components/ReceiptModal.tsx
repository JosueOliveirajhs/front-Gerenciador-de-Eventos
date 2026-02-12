// src/components/admin/clients/components/ReceiptModal.tsx

import React, { useState, useEffect } from 'react';
import { User, Receipt, UploadReceiptData } from '../types';
import { receiptService } from '../../../services/receipts';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { EmptyState } from '../../common/EmptyState';
import styles from './ReceiptModal.module.css';

interface ReceiptModalProps {
    client: User;
    receipts: Receipt[];
    onClose: () => void;
    onUpload: (file: File, description: string, value?: number) => Promise<void>;
    onDelete?: (receiptId: number) => Promise<void>;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
    client,
    receipts,
    onClose,
    onUpload,
    onDelete
}) => {
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [value, setValue] = useState('');
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [localReceipts, setLocalReceipts] = useState<Receipt[]>(receipts);

    useEffect(() => {
        setLocalReceipts(receipts);
    }, [receipts]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            alert('Selecione um arquivo para upload');
            return;
        }

        setUploading(true);
        try {
            await onUpload(
                selectedFile, 
                description, 
                value ? parseFloat(value) : undefined
            );
            
            setShowUploadForm(false);
            setSelectedFile(null);
            setDescription('');
            setValue('');
            
            // Recarregar comprovantes
            const updatedReceipts = await receiptService.getClientReceipts(client.id);
            setLocalReceipts(updatedReceipts);
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            alert('Erro ao fazer upload do comprovante');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (receipt: Receipt) => {
        try {
            const blob = await receiptService.downloadReceipt(receipt.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = receipt.fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Erro ao baixar arquivo:', error);
            alert('Erro ao baixar o comprovante');
        }
    };

    const handleDelete = async (receiptId: number) => {
        if (!onDelete) return;
        
        if (!window.confirm('Tem certeza que deseja excluir este comprovante?')) {
            return;
        }

        try {
            await onDelete(receiptId);
            setLocalReceipts(prev => prev.filter(r => r.id !== receiptId));
        } catch (error) {
            console.error('Erro ao excluir comprovante:', error);
            alert('Erro ao excluir comprovante');
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (value?: number) => {
        if (!value) return '';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf': return '📄';
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif': return '🖼️';
            case 'doc':
            case 'docx': return '📝';
            case 'xls':
            case 'xlsx': return '📊';
            default: return '📎';
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div className={styles.headerContent}>
                        <h2 className={styles.modalTitle}>
                            <span className={styles.titleIcon}>🧾</span>
                            Comprovantes - {client.name}
                        </h2>
                        <p className={styles.modalSubtitle}>
                            Gerencie os comprovantes de pagamento do cliente
                        </p>
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {!showUploadForm ? (
                        <button 
                            className={styles.uploadButton}
                            onClick={() => setShowUploadForm(true)}
                        >
                            <span className={styles.uploadIcon}>📤</span>
                            Anexar Novo Comprovante
                        </button>
                    ) : (
                        <div className={styles.uploadContainer}>
                            <h3 className={styles.uploadTitle}>
                                <span className={styles.uploadTitleIcon}>📎</span>
                                Anexar Comprovante
                            </h3>
                            
                            <form onSubmit={handleUpload} className={styles.uploadForm}>
                                <div 
                                    className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''}`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        id="file-upload"
                                        className={styles.fileInput}
                                        onChange={handleFileChange}
                                        accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                                    />
                                    <label htmlFor="file-upload" className={styles.dropZoneLabel}>
                                        {selectedFile ? (
                                            <>
                                                <span className={styles.fileIcon}>
                                                    {getFileIcon(selectedFile.name)}
                                                </span>
                                                <div className={styles.fileInfo}>
                                                    <span className={styles.fileName}>
                                                        {selectedFile.name}
                                                    </span>
                                                    <span className={styles.fileSize}>
                                                        {formatFileSize(selectedFile.size)}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <span className={styles.dropZoneIcon}>📁</span>
                                                <span className={styles.dropZoneText}>
                                                    Arraste e solte ou clique para selecionar
                                                </span>
                                                <span className={styles.dropZoneHint}>
                                                    PDF, JPEG, PNG (max. 10MB)
                                                </span>
                                            </>
                                        )}
                                    </label>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>
                                            Descrição
                                        </label>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="Ex: Pagamento da entrada"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>
                                            Valor (opcional)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className={styles.formInput}
                                            placeholder="0,00"
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className={styles.uploadActions}>
                                    <button 
                                        type="button" 
                                        className={styles.cancelButton}
                                        onClick={() => {
                                            setShowUploadForm(false);
                                            setSelectedFile(null);
                                            setDescription('');
                                            setValue('');
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        className={styles.submitButton}
                                        disabled={!selectedFile || uploading}
                                    >
                                        {uploading ? (
                                            <>
                                                <span className={styles.buttonSpinner}></span>
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <span className={styles.buttonIcon}>📤</span>
                                                Enviar Comprovante
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className={styles.receiptsList}>
                        <h3 className={styles.listTitle}>
                            Comprovantes Anexados
                            <span className={styles.listCount}>{localReceipts.length}</span>
                        </h3>

                        {localReceipts.length === 0 ? (
                            <EmptyState
                                icon="📭"
                                title="Nenhum comprovante"
                                description="Este cliente ainda não possui comprovantes anexados."
                            />
                        ) : (
                            <div className={styles.receiptsGrid}>
                                {localReceipts.map(receipt => (
                                    <div key={receipt.id} className={styles.receiptCard}>
                                        <div className={styles.receiptIcon}>
                                            {getFileIcon(receipt.fileName)}
                                        </div>
                                        
                                        <div className={styles.receiptInfo}>
                                            <div className={styles.receiptHeader}>
                                                <h4 className={styles.receiptName}>
                                                    {receipt.fileName}
                                                </h4>
                                                {receipt.value && (
                                                    <span className={styles.receiptValue}>
                                                        {formatCurrency(receipt.value)}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {receipt.description && (
                                                <p className={styles.receiptDescription}>
                                                    {receipt.description}
                                                </p>
                                            )}
                                            
                                            <div className={styles.receiptMeta}>
                                                <span className={styles.receiptDate}>
                                                    {formatDate(receipt.uploadDate)}
                                                </span>
                                                {receipt.fileSize && (
                                                    <span className={styles.receiptSize}>
                                                        {formatFileSize(receipt.fileSize)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.receiptActions}>
                                            <button
                                                className={styles.receiptAction}
                                                onClick={() => handleDownload(receipt)}
                                                title="Download"
                                            >
                                                <span className={styles.actionIcon}>⬇️</span>
                                            </button>
                                            
                                            {onDelete && (
                                                <button
                                                    className={`${styles.receiptAction} ${styles.deleteAction}`}
                                                    onClick={() => handleDelete(receipt.id)}
                                                    title="Excluir"
                                                >
                                                    <span className={styles.actionIcon}>🗑️</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;