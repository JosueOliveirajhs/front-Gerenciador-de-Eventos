// src/components/admin/common/LoadingSpinner.tsx

import React from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
    text?: string;
    size?: 'small' | 'medium' | 'large';
    fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
    text = 'Carregando...', 
    size = 'medium',
    fullScreen = false 
}) => {
    const spinnerClass = `${styles.spinner} ${styles[`spinner${size}`]}`;
    
    if (fullScreen) {
        return (
            <div className={styles.fullScreenContainer}>
                <div className={spinnerClass}></div>
                <p className={styles.text}>{text}</p>
            </div>
        );
    }
    
    return (
        <div className={styles.container}>
            <div className={spinnerClass}></div>
            <p className={styles.text}>{text}</p>
        </div>
    );
};