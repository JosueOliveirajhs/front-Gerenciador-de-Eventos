// src/services/contract.ts

import api from './api';

export interface SignatureInfo {
  signed: boolean;
  signedAt?: string;
  signedBy?: string;
  ipAddress?: string;
  signatureMethod?: string;
}

export interface Contract {
  id: number;
  eventId: number;
  eventTitle: string;
  contractNumber: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  content: string;
  fileUrl: string;
  clientSignature: SignatureInfo;
  companySignature: SignatureInfo;
  validUntil: string;
}

export const contractService = {
  /**
   * Busca todos os contratos
   */
  getAllContracts: async (): Promise<Contract[]> => {
    const response = await api.get('/contracts');
    return response.data;
  },

  /**
   * Busca contrato por ID
   */
  getContract: async (contractId: number): Promise<Contract> => {
    const response = await api.get(`/contracts/${contractId}`);
    return response.data;
  },

  /**
   * Busca contratos por evento
   */
  getContractsByEvent: async (eventId: string | number): Promise<Contract[]> => {
    try {
      const response = await api.get(`/contracts/event/${eventId}`);
      return response.data;
    } catch (error) {
      console.log(`ℹ️ Contratos não encontrados para evento ${eventId}`);
      return [];
    }
  },

  /**
   * Busca contratos do cliente atual
   */
  getMyContracts: async (): Promise<Contract[]> => {
    const response = await api.get('/contracts/my-contracts');
    return response.data;
  },

  /**
   * Busca último contrato
   */
  getLatestContract: async (): Promise<Contract> => {
    const response = await api.get('/contracts/latest');
    return response.data;
  },

  /**
   * Assina um contrato
   */
  signContract: async (contractId: number, agreeTerms: boolean = true): Promise<void> => {
    await api.post(`/contracts/${contractId}/sign`, { agreeTerms });
  },

  /**
   * Baixa PDF do contrato
   */
  downloadContract: async (contractId: number): Promise<Blob> => {
    const response = await api.get(`/contracts/${contractId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Baixa anexo do contrato
   */
  downloadAttachment: async (contractId: number, attachmentId: string): Promise<Blob> => {
    const response = await api.get(`/contracts/${contractId}/attachments/${attachmentId}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};