import React from 'react';
import { Link } from 'react-router-dom';
import { LoginForm } from '../../components/auth/LoginForm';
import { useTheme } from '../../context/ThemeContext';
import logoCompleta from '../../assets/logo-big.png';
import logoSemFundo from '../../assets/logo-big-sem-fundo.png';
import styles from './Login.module.css';

export const Login: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className={styles.loginPage}>
      <div className={styles.background}></div>
      
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <img 
              src={isDark ? logoSemFundo : logoCompleta} 
              alt="EventosFáceis" 
              className={styles.logoFull}
            />
          </div>
          
          <div className={styles.loginFormContainer}>
            <h1 className={styles.welcomeTitle}>Bem-vindo de volta!</h1>
            <p className={styles.welcomeSubtitle}>
              Faça login para acessar sua conta
            </p>
            
            <LoginForm />
          </div>
          
          <div className={styles.loginFooter}>
            <p className={styles.footerText}>
              Não tem uma conta?{' '}
              <Link to="/registro" className={styles.footerLink}>
                Entre em contato
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;