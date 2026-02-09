import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`Requisição ${config.method?.toUpperCase()} para: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Erro no interceptor de request:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`Resposta ${response.status} de: ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('Erro na resposta:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      code: error.code
    });
    
    if (error.response?.status === 403) {
      console.log('Acesso proibido - verifique permissões');
    }
    
    if (error.response?.status === 401) {
      console.log('Token inválido ou expirado, redirecionando para login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    if (error.code === 'ERR_NETWORK') {
      console.error('Problema de conexão com o servidor.');
    }
    
    return Promise.reject(error);
  }
);