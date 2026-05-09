// src/components/admin/clients/components/ClientClassification.tsx

import React, { useState } from 'react';
import { User, ClientInteraction } from '../types';
import styles from './ClientClassification.module.css';

interface ClientClassificationProps {
    client: User;
    onUpdateClassification: (classification: string) => void;
    onAddInteraction: (interaction: Omit<ClientInteraction, 'id' | 'createdAt'>) => void;
}

export const ClientClassification: React.FC<ClientClassificationProps> = ({
    client,
    onUpdateClassification,
    onAddInteraction
}) => {
    const [showInteractionForm, setShowInteractionForm] = useState(false);
    const [interactionData, setInteractionData] = useState({
        type: 'CALL',
        summary: '',
        notes: '',
        nextAction: '',
        nextActionDate: ''
    });

    const getClassificationColor = (classification?: string): string => {
        const colors: Record<string, string> = {
            VIP: '#8b5cf6',
            RECORRENTE: '#10b981',
            CORPORATIVO: '#3b82f6',
            REGULAR: '#6b7280',
            NOVO: '#f59e0b'
        };
        return colors[classification || 'REGULAR'];
    };

    const getClassificationIcon = (classification?: string): string => {
        const icons: Record<string, string> = {
            VIP: '👑',
            RECORRENTE: '🔄',
            CORPORATIVO: '🏢',
            REGULAR: '👤',
            NOVO: '🆕'
        };
        return icons[classification || 'REGULAR'];
    };

    const getClassificationLabel = (classification?: string): string => {
        const labels: Record<string, string> = {
            VIP: 'Cliente VIP',
            RECORRENTE: 'Cliente Recorrente',
            CORPORATIVO: 'Cliente Corporativo',
            REGULAR: 'Cliente Regular',
            NOVO: 'Cliente Novo'
        };
        return labels[classification || 'REGULAR'];
    };

    const handleSubmitInteraction = (e: React.FormEvent) => {
        e.preventDefault();
        onAddInteraction({
            clientId: client.id,
            ...interactionData,
            date: new Date().toISOString()
        });
        setShowInteractionForm(false);
        setInteractionData({
            type: 'CALL',
            summary: '',
            notes: '',
            nextAction: '',
            nextActionDate: ''
        });
    };

    return (
        <div className={styles.container}>
            {/* Cabeçalho com Classificação */}
            <div className={styles.header}>
                <div 
                    className={styles.classificationBadge}
                    style={{ backgroundColor: getClassificationColor(client.classification) }}
                >
                    <span className={styles.classificationIcon}>
                        {getClassificationIcon(client.classification)}
                    </span>
                    <span className={styles.classificationLabel}>
                        {getClassificationLabel(client.classification)}
                    </span>
                </div>

                <select 
                    className={styles.classificationSelect}
                    value={client.classification || 'REGULAR'}
                    onChange={(e) => onUpdateClassification(e.target.value)}
                >
                    <option value="VIP">VIP 👑</option>
                    <option value="RECORRENTE">Recorrente 🔄</option>
                    <option value="CORPORATIVO">Corporativo 🏢</option>
                    <option value="REGULAR">Regular 👤</option>
                    <option value="NOVO">Novo 🆕</option>
                </select>
            </div>

            {/* Estatísticas do Cliente */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>📊</span>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{client.totalEvents || 0}</span>
                        <span className={styles.statLabel}>Eventos</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <span className={styles.statIcon}>💰</span>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>
                            {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                            }).format(client.totalSpent || 0)}
                        </span>
                        <span className={styles.statLabel}>Total Gasto</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <span className={styles.statIcon}>📅</span>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>
                            {client.lastEventDate 
                                ? new Date(client.lastEventDate).toLocaleDateString('pt-BR')
                                : 'N/A'}
                        </span>
                        <span className={styles.statLabel}>Último Evento</span>
                    </div>
                </div>

                {client.preferredEventType && (
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}>🎯</span>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{client.preferredEventType}</span>
                            <span className={styles.statLabel}>Preferência</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Tags */}
            {client.tags && client.tags.length > 0 && (
                <div className={styles.tagsSection}>
                    <h4 className={styles.tagsTitle}>Tags</h4>
                    <div className={styles.tagsList}>
                        {client.tags.map((tag, index) => (
                            <span key={index} className={styles.tag}>
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Botão para Registrar Interação */}
            <button 
                className={styles.interactionButton}
                onClick={() => setShowInteractionForm(!showInteractionForm)}
            >
                <span className={styles.buttonIcon}>📝</span>
                {showInteractionForm ? 'Cancelar' : 'Registrar Interação'}
            </button>

            {/* Formulário de Interação */}
            {showInteractionForm && (
                <form onSubmit={handleSubmitInteraction} className={styles.interactionForm}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Tipo de Interação</label>
                        <select
                            className={styles.formSelect}
                            value={interactionData.type}
                            onChange={(e) => setInteractionData({...interactionData, type: e.target.value})}
                        >
                            <option value="MEETING">Reunião</option>
                            <option value="CALL">Ligação</option>
                            <option value="EMAIL">E-mail</option>
                            <option value="WHATSAPP">WhatsApp</option>
                            <option value="VISIT">Visita</option>
                            <option value="OTHER">Outro</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Resumo</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            value={interactionData.summary}
                            onChange={(e) => setInteractionData({...interactionData, summary: e.target.value})}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Observações</label>
                        <textarea
                            className={styles.formTextarea}
                            value={interactionData.notes}
                            onChange={(e) => setInteractionData({...interactionData, notes: e.target.value})}
                            rows={3}
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Próxima Ação</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                value={interactionData.nextAction}
                                onChange={(e) => setInteractionData({...interactionData, nextAction: e.target.value})}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Data da Próxima Ação</label>
                            <input
                                type="date"
                                className={styles.formInput}
                                value={interactionData.nextActionDate}
                                onChange={(e) => setInteractionData({...interactionData, nextActionDate: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <button type="submit" className={styles.submitButton}>
                            Registrar
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};