// src/components/admin/clients/components/ReceiptModal.tsx

import React, { useState, useEffect } from 'react';
import { 
  FiX, 
  FiUpload, 
  FiDownload, 
  FiTrash2,
  FiFile,
  FiFileText,
  FiImage,
  FiExternalLink,
  FiEye,
  FiCheck,
  FiXCircle,
  FiClock
} from 'react-icons/fi';
import { 
  MdReceipt, 
  MdAttachMoney,
  MdDescription,
  MdDateRange,
  MdInfo,
  MdCheckCircle,
  MdError
} from 'react-icons/md';
import { User, Receipt, UploadReceiptData } from '../types';
import { receiptService } from '../../../services/receipts';
import { LoadingSpinner } from '../../common/Loading/LoadingSpinner';
import { EmptyState } from '../../common/EmptyState/EmptyState';
import styles from './ReceiptModal.module.css';

interface ReceiptModalProps {
    client: User;
    receipts: Receipt[];
    onClose: () => void;
    onUpload: (file: File, description: string, value?: number) => Promise<void>;
    onDelete?: (receiptId: number) => Promise<void>;
    onApprove?: (paymentId: number) => Promise<void>;
    onReject?: (paymentId: number) => Promise<void>;
}

/**
 * Retorna a URL válida para exibição. Se for URL do Cloudinary (https://), 
 * retorna como está. Senão, monta URL absoluta para o backend.
 */
const getValidUrl = (url: string | undefined | null): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
};

/**
 * Verifica se o arquivo é uma imagem pelo mimeType ou extensão
 */
const isImageFile = (fileName: string, mimeType?: string): boolean => {
    if (mimeType && mimeType.startsWith('image/')) return true;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '');
};

/**
 * Verifica se o arquivo é um PDF
 */
const isPdfFile = (fileName: string, mimeType?: string): boolean => {
    if (mimeType === 'application/pdf') return true;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext === 'pdf';
};

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
    client,
    receipts,
    onClose,
    onUpload,
    onDelete,
    onApprove,
    onReject
}) => {
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [value, setValue] = useState('');
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [localReceipts, setLocalReceipts] = useState<Receipt[]>(receipts);
    const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);

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

    const handleOpenFile = (receipt: Receipt) => {
        const url = getValidUrl(receipt.fileUrl);
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const handleDownload = async (receipt: Receipt) => {
        const url = getValidUrl(receipt.fileUrl);
        
        // Se é URL do Cloudinary, abrir em nova aba
        if (url && url.startsWith('http')) {
            window.open(url, '_blank', 'noopener,noreferrer');
            return;
        }

        // Fallback: download via API (para arquivos BLOB legados)
        try {
            const blob = await receiptService.downloadReceipt(receipt.id);
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = receipt.fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
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
            if (previewReceipt?.id === receiptId) {
                setPreviewReceipt(null);
            }
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
            case 'pdf': return <FiFileText size={24} />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif': return <FiImage size={24} />;
            case 'doc':
            case 'docx': return <FiFileText size={24} />;
            case 'xls':
            case 'xlsx': return <FiFileText size={24} />;
            default: return <FiFile size={24} />;
        }
    };

    const getPaymentStatusBadge = (status?: string) => {
        if (!status) return null;
        switch (status) {
            case 'WAITING_APPROVAL':
            case 'PENDING':
                return (
                    <div className={`${styles.statusBadge} ${styles.statusWaiting}`}>
                        <FiClock size={12} /> Aguardando Aprovação
                    </div>
                );
            case 'PAID':
                return (
                    <div className={`${styles.statusBadge} ${styles.statusPaid}`}>
                        <MdCheckCircle size={12} /> Pago
                    </div>
                );
            case 'REJECTED':
                return (
                    <div className={`${styles.statusBadge} ${styles.statusRejected}`}>
                        <MdError size={12} /> Rejeitado
                    </div>
                );
            default:
                return (
                    <div className={styles.statusBadge}>
                        <MdInfo size={12} /> {status}
                    </div>
                );
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div className={styles.headerContent}>
                        <h2 className={styles.modalTitle}>
                            <MdReceipt className={styles.titleIcon} />
                            Comprovantes - {client.name}
                        </h2>
                        <p className={styles.modalSubtitle}>
                            Gerencie os comprovantes de pagamento do cliente
                        </p>
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        <FiX size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {!showUploadForm ? (
                        <button 
                            className={styles.uploadButton}
                            onClick={() => setShowUploadForm(true)}
                        >
                            <FiUpload className={styles.uploadIcon} />
                            Anexar Novo Comprovante
                        </button>
                    ) : (
                        <div className={styles.uploadContainer}>
                            <h3 className={styles.uploadTitle}>
                                <FiUpload className={styles.uploadTitleIcon} />
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
                                                <FiUpload className={styles.dropZoneIcon} />
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
                                            <MdDescription size={16} />
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
                                            <MdAttachMoney size={16} />
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
                                                <FiUpload className={styles.buttonIcon} />
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
                            <MdReceipt size={18} />
                            Comprovantes Anexados
                            <span className={styles.listCount}>{localReceipts.length}</span>
                        </h3>

                        {localReceipts.length === 0 ? (
                            <EmptyState
                                icon={<MdReceipt size={48} />}
                                title="Nenhum comprovante"
                                description="Este cliente ainda não possui comprovantes anexados."
                            />
                        ) : (
                            <div className={styles.receiptsGrid}>
                                {localReceipts.map(receipt => {
                                    const receiptUrl = getValidUrl(receipt.fileUrl);
                                    const isImage = isImageFile(receipt.fileName, receipt.mimeType);
                                    const isPdf = isPdfFile(receipt.fileName, receipt.mimeType);
                                    
                                    return (
                                        <div key={receipt.id} className={styles.receiptCard}>
                                            {/* Preview de Imagem (se for imagem e tiver URL válida) */}
                                            {isImage && receiptUrl && (
                                                <div 
                                                    className={styles.receiptPreview}
                                                    onClick={() => setPreviewReceipt(receipt)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <img 
                                                        src={receiptUrl} 
                                                        alt={receipt.description || receipt.fileName}
                                                        style={{
                                                            width: '100%',
                                                            height: '120px',
                                                            objectFit: 'cover',
                                                            borderRadius: '8px 8px 0 0',
                                                            display: 'block'
                                                        }}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            
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
                                                        <MdDateRange size={12} />
                                                        {formatDate(receipt.uploadDate)}
                                                    </span>
                                                    {receipt.fileSize && (
                                                        <span className={styles.receiptSize}>
                                                            {formatFileSize(receipt.fileSize)}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {getPaymentStatusBadge(receipt.paymentStatus || (receipt.paymentId ? 'PENDING' : undefined))}
                                            </div>

                                            {receipt.paymentId && receipt.paymentStatus !== 'PAID' && onApprove && onReject && (
                                                <div className={styles.approvalActions}>
                                                    <button 
                                                        className={styles.approveButton}
                                                        onClick={() => onApprove(receipt.paymentId!)}
                                                    >
                                                        <FiCheck size={14} /> Aprovar
                                                    </button>
                                                    <button 
                                                        className={styles.rejectButton}
                                                        onClick={() => onReject(receipt.paymentId!)}
                                                    >
                                                        <FiXCircle size={14} /> Rejeitar
                                                    </button>
                                                </div>
                                            )}

                                            <div className={styles.receiptActions}>
                                                {/* Botão Visualizar (abre em nova aba) */}
                                                {receiptUrl && (
                                                    <button
                                                        className={styles.receiptAction}
                                                        onClick={() => {
                                                            if (isImage) {
                                                                setPreviewReceipt(receipt);
                                                            } else {
                                                                handleOpenFile(receipt);
                                                            }
                                                        }}
                                                        title="Visualizar"
                                                    >
                                                        <FiEye size={18} />
                                                    </button>
                                                )}
                                                
                                                {/* Botão Abrir/Download */}
                                                <button
                                                    className={styles.receiptAction}
                                                    onClick={() => handleDownload(receipt)}
                                                    title={receiptUrl?.startsWith('http') ? "Abrir arquivo" : "Download"}
                                                >
                                                    {receiptUrl?.startsWith('http') 
                                                        ? <FiExternalLink size={18} /> 
                                                        : <FiDownload size={18} />
                                                    }
                                                </button>
                                                
                                                {onDelete && (
                                                    <button
                                                        className={`${styles.receiptAction} ${styles.deleteAction}`}
                                                        onClick={() => handleDelete(receipt.id)}
                                                        title="Excluir"
                                                    >
                                                        <FiTrash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Preview de Imagem */}
            {previewReceipt && (
                <div 
                    className={styles.modalOverlay} 
                    onClick={() => setPreviewReceipt(null)}
                    style={{ zIndex: 10001 }}
                >
                    <div 
                        onClick={e => e.stopPropagation()}
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            background: '#fff',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            position: 'relative',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            borderBottom: '1px solid #e2e8f0',
                            background: '#f8fafc'
                        }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#334155' }}>
                                {previewReceipt.description || previewReceipt.fileName}
                            </h4>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => handleOpenFile(previewReceipt)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        padding: '6px 10px', border: '1px solid #cbd5e1',
                                        borderRadius: '6px', background: '#fff', cursor: 'pointer',
                                        fontSize: '0.85rem', color: '#475569'
                                    }}
                                    title="Abrir em nova aba"
                                >
                                    <FiExternalLink size={14} /> Abrir
                                </button>
                                <button
                                    onClick={() => setPreviewReceipt(null)}
                                    style={{
                                        display: 'flex', alignItems: 'center',
                                        padding: '6px', border: '1px solid #cbd5e1',
                                        borderRadius: '6px', background: '#fff', cursor: 'pointer'
                                    }}
                                >
                                    <FiX size={18} />
                                </button>
                            </div>
                        </div>
                        <div style={{ padding: '16px', textAlign: 'center', maxHeight: '80vh', overflow: 'auto' }}>
                            {isImageFile(previewReceipt.fileName, previewReceipt.mimeType) ? (
                                <img 
                                    src={getValidUrl(previewReceipt.fileUrl)} 
                                    alt={previewReceipt.description || previewReceipt.fileName}
                                    style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '70vh', 
                                        objectFit: 'contain',
                                        borderRadius: '8px' 
                                    }}
                                />
                            ) : isPdfFile(previewReceipt.fileName, previewReceipt.mimeType) ? (
                                <iframe 
                                    src={getValidUrl(previewReceipt.fileUrl)}
                                    title="Preview PDF"
                                    style={{ 
                                        width: '100%', 
                                        height: '70vh', 
                                        border: 'none',
                                        borderRadius: '8px'
                                    }}
                                />
                            ) : (
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    padding: '40px',
                                    color: '#64748b'
                                }}>
                                    <FiAlertCircle size={48} />
                                    <p style={{ marginTop: '16px' }}>Visualização não disponível para este arquivo.</p>
                                    <a 
                                        href={getValidUrl(previewReceipt.fileUrl)} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        style={{ 
                                            marginTop: '12px',
                                            color: '#2563eb',
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        Clique aqui para abrir em uma nova aba
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Approval actions inside preview */}
                        {previewReceipt.paymentId && previewReceipt.paymentStatus === 'WAITING_APPROVAL' && onApprove && onReject && (
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                padding: '16px',
                                borderTop: '1px solid #e2e8f0',
                                background: '#f8fafc',
                                justifyContent: 'center'
                            }}>
                                <button
                                    onClick={() => {
                                        onApprove(previewReceipt.paymentId!);
                                        setPreviewReceipt(null);
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 24px', background: '#10b981',
                                        color: '#fff', border: 'none', borderRadius: '8px',
                                        cursor: 'pointer', fontWeight: 'bold'
                                    }}
                                >
                                    <FiCheck size={18} /> Aprovar Pagamento
                                </button>
                                <button
                                    onClick={() => {
                                        onReject(previewReceipt.paymentId!);
                                        setPreviewReceipt(null);
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 24px', background: '#ef4444',
                                        color: '#fff', border: 'none', borderRadius: '8px',
                                        cursor: 'pointer', fontWeight: 'bold'
                                    }}
                                >
                                    <FiXCircle size={18} /> Rejeitar Pagamento
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceiptModal;