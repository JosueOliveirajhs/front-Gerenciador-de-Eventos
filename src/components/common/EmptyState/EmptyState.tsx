// src/components/admin/common/EmptyState.tsx

import React from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    secondaryAction
}) => {
    return (
        <div className={styles.container}>
            <div className={styles.icon}>{icon}</div>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>
            {(action || secondaryAction) && (
                <div className={styles.actions}>
                    {action && (
                        <button 
                            onClick={action.onClick}
                            className={styles.primaryButton}
                        >
                            {action.label}
                        </button>
                    )}
                    {secondaryAction && (
                        <button 
                            onClick={secondaryAction.onClick}
                            className={styles.secondaryButton}
                        >
                            {secondaryAction.label}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};