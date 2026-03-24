import React, { useState } from 'react';
import { authService } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import styles from './LoginForm.module.css';

export const LoginForm: React.FC = () => {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const cpfClean = cpf.replace(/\D/g, '');
      console.log('🔑 Tentando login com CPF:', cpfClean);
      
      const response = await authService.login({
        cpf: cpfClean,
        password
      });
      
      console.log('✅ Login bem-sucedido, chamando login do contexto');
      login(response.user, response.token);
      
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      setError(error.response?.data?.message || 'CPF ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return numbers.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  return (
    <form onSubmit={handleSubmit} className={styles.loginForm}>
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <div className={styles.formGroup}>
        <label htmlFor="cpf" className={styles.formLabel}>
          CPF
        </label>
        <input
          id="cpf"
          type="text"
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => setCpf(formatCPF(e.target.value))}
          className={styles.formInput}
          required
          disabled={loading}
          maxLength={14}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="password" className={styles.formLabel}>
          Senha
        </label>
        <input
          id="password"
          type="password"
          placeholder="Digite sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.formInput}
          required
          disabled={loading}
        />
      </div>

      <div className={styles.forgotPassword}>
        <Link to="/esqueci-senha" className={styles.forgotPasswordLink}>
          Esqueceu sua senha?
        </Link>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className={styles.submitButton}
      >
        {loading ? 'Entrando...' : 'Entrar na conta'}
      </button>
    </form>
  );
};