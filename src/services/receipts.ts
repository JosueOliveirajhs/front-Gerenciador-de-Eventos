// src/services/receipts.ts

import { api } from './api';
import { Receipt, UploadReceiptData, ApiResponse } from '../components/admin/clients/types';

export const receiptService = {
    /**
     * Busca todos os comprovantes de um cliente
     */
    getClientReceipts: async (clientId: number): Promise<Receipt[]> => {
        try {
            const response = await api.get<ApiResponse<Receipt[]>>(`/api/receipts/client/${clientId}`);
            return response.data.data || [];
        } catch (error) {
            console.error('Erro ao buscar comprovantes:', error);
            return []; // Retorna array vazio em caso de erro
        }
    },

    /**
     * Upload de comprovante
     */
    uploadReceipt: async (data: UploadReceiptData): Promise<Receipt> => {
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('clientId', data.clientId.toString());
        
        if (data.description) {
            formData.append('description', data.description);
        }
        
        if (data.value) {
            formData.append('value', data.value.toString());
        }

        try {
            const response = await api.post<ApiResponse<Receipt>>('/api/receipts', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            if (!response.data.data) {
                throw new Error('Resposta inválida do servidor');
            }
            
            return response.data.data;
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            throw error;
        }
    },

    /**
     * Download de comprovante
     */
    downloadReceipt: async (receiptId: number): Promise<Blob> => {
        try {
            const response = await api.get(`/api/receipts/${receiptId}/download`, {
                responseType: 'blob',
            });
            return response.data;
        } catch (error) {
            console.error('Erro ao baixar comprovante:', error);
            throw error;
        }
    },

    /**
     * Deletar comprovante
     */
    deleteReceipt: async (receiptId: number): Promise<void> => {
        try {
            await api.delete(`/api/receipts/${receiptId}`);
        } catch (error) {
            console.error('Erro ao deletar comprovante:', error);
            throw error;
        }
    }
};