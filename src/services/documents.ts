// src/services/documents.ts

import { api } from './api';

export interface Document {
  id: number;
  nome: string;
  tipo: string;
  tamanhoFormatado?: string;
  dataFormatada?: string;
  contexto?: string;
}

export const documentService = {
  getAllDocuments: async (): Promise<Document[]> => {
    console.log('📄 Buscando documentos...');
    const response = await api.get('/api/documentos');
    console.log('✅ Documentos carregados:', response.data.length);
    return response.data;
  },

  uploadDocument: async (file: File, contexto: string = 'cliente'): Promise<Document> => {
    console.log('📤 Fazendo upload:', file.name, '| Tamanho:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contexto', contexto);
    
    const response = await api.post('/api/documentos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 minutos para arquivos grandes
    });
    
    console.log('✅ Documento enviado:', response.data);
    return response.data;
  },

  downloadDocument: async (documentId: number, fileName: string): Promise<void> => {
    console.log(`📥 Baixando documento ${documentId}...`);
    const response = await api.get(`/api/documentos/${documentId}/download`, {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'documento';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log('✅ Download concluído:', fileName);
  },

  viewDocument: (documentId: number): string => {
    const token = localStorage.getItem('token');
    return `http://localhost:8080/api/documentos/${documentId}/view?token=${token}`;
  },

  deleteDocument: async (documentId: number): Promise<void> => {
    console.log(`🗑️ Deletando documento ${documentId}...`);
    await api.delete(`/api/documentos/${documentId}`);
    console.log('✅ Documento deletado');
  }
};