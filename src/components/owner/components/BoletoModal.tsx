// src/components/admin/clients/components/BoletoModal.tsx

import React, { useState, useEffect } from 'react';
import { User, Boleto, GenerateBoletoData } from '../types';
import { boletoService } from '../../../services/boletos';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { EmptyState } from '../../common/EmptyState';
import styles from './BoletoModal.module.css';

interface BoletoModalProps {
    client: User;
    onClose: () => void;
    onGenerate: (data: GenerateBoletoData) => Promise<void>;
    onSendEmail?: (boletoId: number) => Promise<void>;
    onMarkAsPaid?: (boletoId: number) => Promise<void>;
}

export const BoletoModal: React.FC<BoletoModalProps> = ({
    client,
    onClose,
    onGenerate,
    onSendEmail,
    onMarkAsPaid
}) => {
    const [boletos, setBoletos] = useState<Boleto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showGenerateForm, setShowGenerateForm] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        value: '',
        dueDate: ''
    });
    const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadBoletos();
    }, [client.id]);

    const loadBoletos = async () => {
        try {
            setLoading(true);
            const data = await boletoService.getClientBoletos(client.id);
            setBoletos(data);
        } catch (error) {
            console.error('Erro ao carregar boletos:', error);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const errors: {[key: string]: string} = {};

        if (!formData.description.trim()) {
            errors.description = 'Descrição é obrigatória';
        }

        if (!formData.value) {
            errors.value = 'Valor é obrigatório';
        } else {
            const value = parseFloat(formData.value);
            if (isNaN(value) || value <= 0) {
                errors.value = 'Valor deve ser maior que zero';
            }
        }

        if (!formData.dueDate) {
            errors.dueDate = 'Data de vencimento é obrigatória';
        } else {
            const dueDate = new Date(formData.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (dueDate < today) {
                errors.dueDate = 'Data de vencimento deve ser futura';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            await onGenerate({
                clientId: client.id,
                description: formData.description,
                value: parseFloat(formData.value),
                dueDate: new Date(formData.dueDate)
            });
            
            setShowGenerateForm(false);
            setFormData({ description: '', value: '', dueDate: '' });
            await loadBoletos();
        } catch (error) {
            console.error('Erro ao gerar boleto:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownloadPDF = async (boletoId: number) => {
        try {
            const blob = await boletoService.downloadBoletoPDF(boletoId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `boleto-${boletoId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Erro ao baixar PDF:', error);
            alert('Erro ao baixar o PDF do boleto');
        }
    };

    const handleSendEmail = async (boletoId: number) => {
        if (!onSendEmail) return;
        
        try {
            await onSendEmail(boletoId);
            alert('Boleto enviado por e-mail com sucesso!');
        } catch (error) {
            console.error('Erro ao enviar e-mail:', error);
            alert('Erro ao enviar boleto por e-mail');
        }
    };

    const handleMarkAsPaid = async (boletoId: number) => {
        if (!onMarkAsPaid) return;
        
        if (!window.confirm('Confirmar que este boleto foi pago?')) return;
        
        try {
            await onMarkAsPaid(boletoId);
            await loadBoletos();
        } catch (error) {
            console.error('Erro ao marcar boleto como pago:', error);
            alert('Erro ao marcar boleto como pago');
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'paid': return styles.statusPaid;
            case 'pending': return styles.statusPending;
            case 'overdue': return styles.statusOverdue;
            case 'cancelled': return styles.statusCancelled;
            default: return '';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'paid': return 'Pago';
            case 'pending': return 'Pendente';
            case 'overdue': return 'Vencido';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div className={styles.headerContent}>
                        <h2 className={styles.modalTitle}>
                            <span className={styles.titleIcon}>📄</span>
                            Boletos - {client.name}
                        </h2>
                        <p className={styles.modalSubtitle}>
                            Gerencie os boletos bancários do cliente
                        </p>
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {!showGenerateForm ? (
                        <button 
                            className={styles.generateButton}
                            onClick={() => setShowGenerateForm(true)}
                        >
                            <span className={styles.buttonIcon}>➕</span>
                            Gerar Novo Boleto
                        </button>
                    ) : (
                        <div className={styles.formContainer}>
                            <h3 className={styles.formTitle}>Gerar Novo Boleto</h3>
                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>
                                        Descrição <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={`${styles.formInput} ${formErrors.description ? styles.inputError : ''}`}
                                        placeholder="Ex: Evento de Formatura"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    />
                                    {formErrors.description && (
                                        <span className={styles.errorMessage}>{formErrors.description}</span>
                                    )}
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>
                                            Valor <span className={styles.required}>*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            className={`${styles.formInput} ${formErrors.value ? styles.inputError : ''}`}
                                            placeholder="0,00"
                                            value={formData.value}
                                            onChange={(e) => setFormData({...formData, value: e.target.value})}
                                        />
                                        {formErrors.value && (
                                            <span className={styles.errorMessage}>{formErrors.value}</span>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>
                                            Vencimento <span className={styles.required}>*</span>
                                        </label>
                                        <input
                                            type="date"
                                            className={`${styles.formInput} ${formErrors.dueDate ? styles.inputError : ''}`}
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                                        />
                                        {formErrors.dueDate && (
                                            <span className={styles.errorMessage}>{formErrors.dueDate}</span>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.formActions}>
                                    <button 
                                        type="button" 
                                        className={styles.cancelButton}
                                        onClick={() => setShowGenerateForm(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        className={styles.submitButton}
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Gerando...' : 'Gerar Boleto'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className={styles.boletosList}>
                        <h3 className={styles.listTitle}>
                            Boletos Gerados
                            <span className={styles.listCount}>{boletos.length}</span>
                        </h3>

                        {loading ? (
                            <LoadingSpinner text="Carregando boletos..." />
                        ) : boletos.length === 0 ? (
                            <EmptyState
                                icon="📭"
                                title="Nenhum boleto gerado"
                                description="Este cliente ainda não possui boletos cadastrados."
                            />
                        ) : (
                            <div className={styles.boletosGrid}>
                                {boletos.map(boleto => (
                                    <div key={boleto.id} className={styles.boletoCard}>
                                        <div className={styles.boletoHeader}>
                                            <div>
                                                <h4 className={styles.boletoDescription}>
                                                    {boleto.description}
                                                </h4>
                                                <span className={`${styles.boletoStatus} ${getStatusClass(boleto.status)}`}>
                                                    {getStatusText(boleto.status)}
                                                </span>
                                            </div>
                                            <span className={styles.boletoValue}>
                                                {formatCurrency(boleto.value)}
                                            </span>
                                        </div>

                                        <div className={styles.boletoInfo}>
                                            <div className={styles.infoRow}>
                                                <span className={styles.infoLabel}>Vencimento:</span>
                                                <span className={styles.infoValue}>
                                                    {formatDate(boleto.dueDate)}
                                                </span>
                                            </div>
                                            {boleto.nossoNumero && (
                                                <div className={styles.infoRow}>
                                                    <span className={styles.infoLabel}>Nosso Número:</span>
                                                    <span className={styles.infoValue}>
                                                        {boleto.nossoNumero}
                                                    </span>
                                                </div>
                                            )}
                                            {boleto.paidAt && (
                                                <div className={styles.infoRow}>
                                                    <span className={styles.infoLabel}>Data de Pagamento:</span>
                                                    <span className={styles.infoValue}>
                                                        {formatDate(boleto.paidAt)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {boleto.barcode && (
                                            <div className={styles.barcodeSection}>
                                                <span className={styles.barcodeLabel}>Código de Barras:</span>
                                                <code className={styles.barcodeCode}>
                                                    {boleto.barcode}
                                                </code>
                                            </div>
                                        )}

                                        <div className={styles.boletoActions}>
                                            <button
                                                className={styles.actionButton}
                                                onClick={() => handleDownloadPDF(boleto.id)}
                                                title="Baixar PDF"
                                            >
                                                <span className={styles.actionIcon}>📥</span>
                                                <span>PDF</span>
                                            </button>
                                            
                                            <button
                                                className={styles.actionButton}
                                                onClick={() => handleSendEmail(boleto.id)}
                                                title="Enviar por E-mail"
                                                disabled={!onSendEmail}
                                            >
                                                <span className={styles.actionIcon}>📧</span>
                                                <span>E-mail</span>
                                            </button>
                                            
                                            {boleto.status === 'pending' && (
                                                <button
                                                    className={`${styles.actionButton} ${styles.paidButton}`}
                                                    onClick={() => handleMarkAsPaid(boleto.id)}
                                                    title="Marcar como Pago"
                                                    disabled={!onMarkAsPaid}
                                                >
                                                    <span className={styles.actionIcon}>💰</span>
                                                    <span>Pagar</span>
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

export default BoletoModal;