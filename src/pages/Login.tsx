import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import styles from './Login.module.css';

export const Login: React.FC = () => {
  return (
    <div className={styles.loginPage}>
      {/* Background com gradiente da sidebar */}
      <div className={styles.background}></div>

      <div className={styles.loginContainer}>
        {/* Card de Login */}
        <div className={styles.loginCard}>
          {/* Header */}
          <div className={styles.loginHeader}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>🎪</div>
              <div className={styles.logoText}>
                <span className={styles.logoTitle}>EventosFáceis</span>
                <span className={styles.logoSubtitle}>Sistema de Gestão</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className={styles.loginFormContainer}>
            <h2 className={styles.welcomeTitle}>Acesse sua conta</h2>
            <p className={styles.welcomeSubtitle}>
              Use suas credenciais para entrar no sistema
            </p>
            
            <LoginForm />
          </div>

          {/* Footer Simples */}
          <div className={styles.loginFooter}>
            <p className={styles.footerText}>
              Precisa de ajuda? <a href="#" className={styles.footerLink}>Contate o suporte</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};