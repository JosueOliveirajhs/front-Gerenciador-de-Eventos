import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth';
import styles from './ResetPasswordPage.module.css';

// ✅ Importando a logo
import logoEventosFaceis from '../assets/logo-big.png';

export const ResetPasswordPage: React.FC = () => {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [cpf, setCpf] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return numbers.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const cleanCpf = cpf.replace(/\D/g, '');
      await authService.requestPasswordReset(cleanCpf);
      setSuccess('Código de verificação enviado para seu email!');
      setStep('reset');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erro ao solicitar redefinição de senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validar se as senhas conferem
    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem.');
      setLoading(false);
      return;
    }

    // Validar tamanho da senha
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const cleanCpf = cpf.replace(/\D/g, '');
      await authService.resetPassword({
        cpf: cleanCpf,
        code,
        newPassword
      });
      setSuccess('Senha redefinida com sucesso! Redirecionando para o login...');
      
      // Redirecionar para o login após 3 segundos
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erro ao redefinir senha. Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.resetPasswordContainer}>
      <div className={styles.resetPasswordCard}>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <img 
            src={logoEventosFaceis} 
            alt="EventosFáceis" 
            className={styles.logo}
          />
          <h1 className={styles.logoText}>EventosFáceis</h1>
        </div>

        <h2 className={styles.title}>
          {step === 'request' ? 'Redefinir Senha' : 'Criar Nova Senha'}
        </h2>

        <p className={styles.subtitle}>
          {step === 'request' 
            ? 'Digite seu CPF para receber um código de verificação.' 
            : 'Digite o código recebido e sua nova senha.'}
        </p>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.successMessage}>
            {success}
          </div>
        )}

        {step === 'request' ? (
          // Step 1: Solicitar código
          <form onSubmit={handleRequestCode} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="cpf" className={styles.formLabel}>
                CPF
              </label>
              <input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCPFChange}
                className={styles.formInput}
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>
        ) : (
          // Step 2: Redefinir senha
          <form onSubmit={handleResetPassword} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="code" className={styles.formLabel}>
                Código de Verificação
              </label>
              <input
                id="code"
                type="text"
                placeholder="Digite o código recebido"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={styles.formInput}
                required
                disabled={loading}
                maxLength={6}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="newPassword" className={styles.formLabel}>
                Nova Senha
              </label>
              <input
                id="newPassword"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.formInput}
                required
                disabled={loading}
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

            <button 
              type="submit" 
              disabled={loading}
              className={styles.submitButton}
            >
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