import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import styles from './Login.module.css';

// ✅ Importando a logo completa
import logoCompleta from '../assets/logo-big.png';

export const Login: React.FC = () => {
  return (
    <div className={styles.loginPage}>
      {/* Background com gradiente da sidebar */}
      <div className={styles.background}></div>

      <div className={styles.loginContainer}>
        {/* Card de Login */}
        <div className={styles.loginCard}>
          {/* Header - AGORA É SÓ A LOGO COMPLETA */}
          <div className={styles.loginHeader}>
            <img 
              src={logoCompleta} 
              alt="EventosFáceis - Sistema de Gestão de Eventos" 
              className={styles.logoFull}
            />
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