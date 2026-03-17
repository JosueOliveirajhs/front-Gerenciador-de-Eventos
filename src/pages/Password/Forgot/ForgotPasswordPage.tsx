import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../../services/auth';
import styles from './ForgotPasswordPage.module.css';
import logoEventosFaceis from '../../../assets/logo-big.png';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authService.requestPasswordReset(email);
      setSuccess('Se o e-mail estiver cadastrado, as instruções foram enviadas.');
      setEmail('');
    } catch (error: any) {
      setError(error.message || 'Erro ao solicitar redefinição de senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.forgotPasswordContainer}>
      <div className={styles.forgotPasswordCard}>
        <div className={styles.logoContainer}>
          <img 
            src={logoEventosFaceis} 
            alt="EventosFáceis" 
            className={styles.logo}
          />
          <h1 className={styles.logoText}>EventosFáceis</h1>
        </div>

        <h2 className={styles.title}>Esqueceu sua senha?</h2>
        <p className={styles.subtitle}>
          Digite seu email cadastrado e enviaremos um link para redefinir sua senha.
        </p>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.formLabel}>
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.formInput}
              required
              disabled={loading || !!success}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !!success}
            className={styles.submitButton}
          >
            {loading ? 'Enviando...' : 'Enviar link de redefinição'}
          </button>
        </form>

        <div className={styles.backToLogin}>
          <Link to="/login" className={styles.backLink}>
            ← Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
};