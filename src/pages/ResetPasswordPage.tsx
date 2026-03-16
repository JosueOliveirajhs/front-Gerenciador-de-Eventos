import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth';
import styles from './ResetPasswordPage.module.css';
import logoEventosFaceis from '../assets/logo-big.png';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      await authService.resetPassword(token!, password);
      setSuccess('Senha redefinida com sucesso!');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.resetPasswordContainer}>
        <div className={styles.resetPasswordCard}>
          <div className={styles.logoContainer}>
            <img src={logoEventosFaceis} alt="EventosFáceis" className={styles.logo} />
            <h1 className={styles.logoText}>Easy Event Management System</h1>
          </div>
          <div className={styles.invalidToken}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2>Link inválido</h2>
            <p>Este link de redefinição de senha é inválido ou já expirou.</p>
            <Link to="/esqueci-senha" className={styles.newRequestLink}>
              Solicitar novo link
            </Link>
          </div>
          <div className={styles.backToLogin}>
            <Link to="/login" className={styles.backLink}>
              ← Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.resetPasswordContainer}>
      <div className={styles.resetPasswordCard}>
        <div className={styles.logoContainer}>
          <img src={logoEventosFaceis} alt="EventosFáceis" className={styles.logo} />
          <h1 className={styles.logoText}>EventosFáceis</h1>
        </div>

        <h2 className={styles.title}>Criar nova senha</h2>
        <p className={styles.subtitle}>Digite sua nova senha abaixo.</p>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        {!success && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.formLabel}>
                Nova Senha
              </label>
              <input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.formInput}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.formLabel}>
                Confirmar Nova Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.formInput}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? 'Redefinindo...' : 'Redefinir senha'}
            </button>
          </form>
        )}

        <div className={styles.backToLogin}>
          <Link to="/login" className={styles.backLink}>
            ← Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
};