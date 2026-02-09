import React, { useState } from 'react';
import { LoginData } from '../../types/User';
import { authService } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import styles from './LoginForm.module.css';

export const LoginForm: React.FC = () => {
  const [loginData, setLoginData] = useState<LoginData>({
    cpf: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loginDataToSend = {
        cpf: loginData.cpf.replace(/\D/g, ''),
        password: loginData.password
      };
      
      const response = await authService.login(loginDataToSend);
      login(response.user, response.token);
      
    } catch (error: any) {
      setError(error.response?.data?.message || 'CPF ou senha inválidos. Tente novamente.');
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

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCPF = formatCPF(e.target.value);
    setLoginData({ ...loginData, cpf: formattedCPF });
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
          value={loginData.cpf}
          onChange={handleCPFChange}
          className={styles.formInput}
          required
          disabled={loading}
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
          value={loginData.password}
          onChange={(e) => setLoginData({...loginData, password: e.target.value})}
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
        {loading ? 'Entrando...' : 'Entrar na conta'}
      </button>
    </form>
  );
};