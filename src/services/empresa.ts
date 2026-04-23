// src/services/empresa.ts
import api from './api';

export interface EmpresaData {
  id: number;
  nome: string;
  descricao?: string;
  categoria: string;
  localizacao?: string;
  telefone?: string;
  email?: string;
  avaliacao?: number;
  verificado: boolean;
  observacao?: string;
}

export const empresaService = {
  listar: async (busca?: string, categoria?: string): Promise<EmpresaData[]> => {
    const params = new URLSearchParams();
    if (busca) params.append('busca', busca);
    if (categoria) params.append('categoria', categoria);
    const response = await api.get(`/api/empresas?${params.toString()}`);
    return response.data;
  },

  buscarPorId: async (id: number): Promise<EmpresaData> => {
    const response = await api.get(`/api/empresas/${id}`);
    return response.data;
  },

  cadastrar: async (data: {
    nome: string;
    descricao?: string;
    categoria: string;
    localizacao?: string;
    telefone?: string;
    email?: string;
  }): Promise<EmpresaData> => {
    const response = await api.post('/api/empresas', data);
    return response.data;
  },

  atualizar: async (id: number, data: any): Promise<EmpresaData> => {
    const response = await api.put(`/api/empresas/${id}`, data);
    return response.data;
  },

  excluir: async (id: number): Promise<void> => {
    await api.delete(`/api/empresas/${id}`);
  },

  salvarObservacao: async (id: number, texto: string): Promise<EmpresaData> => {
    const response = await api.patch(`/api/empresas/${id}/anotacao`, texto, {
      headers: { 'Content-Type': 'text/plain' }
    });
    return response.data;
  }
};