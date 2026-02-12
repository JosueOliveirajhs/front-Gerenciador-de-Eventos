// src/services/boletos.ts

import { api } from './api';
import { Boleto, GenerateBoletoData, ApiResponse } from '../components/admin/clients/types';

export const boletoService = {
    /**
     * Busca todos os boletos de um cliente
     */
    getClientBoletos: async (clientId: number): Promise<Boleto[]> => {
        try {
            const response = await api.get<ApiResponse<Boleto[]>>(`/api/boletos/client/${clientId}`);
            return response.data.data || [];
        } catch (error) {
            console.error('Erro ao buscar boletos:', error);
            return []; // Retorna array vazio em caso de erro
        }
    },

    /**
     * Gerar novo boleto
     */
    generateBoleto: async (data: GenerateBoletoData): Promise<Boleto> => {
        try {
            const response = await api.post<ApiResponse<Boleto>>('/api/boletos', data);
            if (!response.data.data) {
                throw new Error('Resposta inválida do servidor');
            }
            return response.data.data;
        } catch (error) {
            console.error('Erro ao gerar boleto:', error);
            throw error;
        }
    },

    /**
     * Baixar PDF do boleto
     */
    downloadBoletoPDF: async (boletoId: number): Promise<Blob> => {
        try {
            const response = await api.get(`/api/boletos/${boletoId}/pdf`, {
                responseType: 'blob',
            });
            return response.data;
        } catch (error) {
            console.error('Erro ao baixar PDF:', error);
            throw error;
        }
    },

    /**
     * Enviar boleto por e-mail
     */
    sendBoletoByEmail: async (boletoId: number): Promise<void> => {
        try {
            await api.post(`/api/boletos/${boletoId}/send-email`);
        } catch (error) {
            console.error('Erro ao enviar boleto:', error);
            throw error;
        }
    },

    /**
     * Marcar boleto como pago
     */
    markAsPaid: async (boletoId: number): Promise<Boleto> => {
        try {
            const response = await api.put<ApiResponse<Boleto>>(`/api/boletos/${boletoId}/pay`);
            if (!response.data.data) {
                throw new Error('Resposta inválida do servidor');
            }
            return response.data.data;
        } catch (error) {
            console.error('Erro ao marcar boleto como pago:', error);
            throw error;
        }
    },

    /**
     * Cancelar boleto
     */
    cancelBoleto: async (boletoId: number): Promise<Boleto> => {
        try {
            const response = await api.put<ApiResponse<Boleto>>(`/api/boletos/${boletoId}/cancel`);
            if (!response.data.data) {
                throw new Error('Resposta inválida do servidor');
            }
            return response.data.data;
        } catch (error) {
            console.error('Erro ao cancelar boleto:', error);
            throw error;
        }
    }
};