// src/services/proposal.ts

import api from './api';

export interface ServiceItem {
  id: number;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ProposalVersion {
  id: number;
  version: number;
  createdAt: string;
  totalValue: number;
  status: string;
  changes: string;
}

export interface Proposal {
  id: number;
  eventId: number;
  eventTitle: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  proposalNumber: string;
  createdAt: string;
  validUntil: string;
  status: string;
  subtotal: number;
  discount: number;
  totalValue: number;
  services: ServiceItem[];
  paymentTerms: {
    installments: number;
    firstPaymentDate: string;
    installmentValue: number;
  };
  notes: string;
  termsAndConditions: string;
  versions: ProposalVersion[];
}

export const proposalService = {
  /**
   * Busca todas as propostas
   */
  getAllProposals: async (): Promise<Proposal[]> => {
    const response = await api.get('/proposals');
    return response.data;
  },

  /**
   * Busca proposta por ID
   */
  getProposal: async (proposalId: number): Promise<Proposal> => {
    const response = await api.get(`/proposals/${proposalId}`);
    return response.data;
  },

  /**
   * Busca propostas por evento
   */
  getProposalsByEvent: async (eventId: string | number): Promise<Proposal[]> => {
    try {
      const response = await api.get(`/proposals/event/${eventId}`);
      return response.data;
    } catch (error) {
      console.log(`ℹ️ Propostas não encontradas para evento ${eventId}`);
      return [];
    }
  },

  /**
   * Busca propostas do cliente atual
   */
  getMyProposals: async (): Promise<Proposal[]> => {
    const response = await api.get('/proposals/my-proposals');
    return response.data;
  },

  /**
   * Busca última proposta
   */
  getLatestProposal: async (): Promise<Proposal> => {
    const response = await api.get('/proposals/latest');
    return response.data;
  },

  /**
   * Aprova uma proposta
   */
  approveProposal: async (proposalId: number): Promise<void> => {
    await api.post(`/proposals/${proposalId}/approve`);
  },

  /**
   * Recusa uma proposta
   */
  rejectProposal: async (proposalId: number, reason: string): Promise<void> => {
    await api.post(`/proposals/${proposalId}/reject`, { reason });
  },

  /**
   * Baixa PDF da proposta
   */
  downloadProposalPDF: async (proposalId: number): Promise<Blob> => {
    const response = await api.get(`/proposals/${proposalId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Solicita alterações na proposta
   */
  requestChanges: async (proposalId: number, message: string): Promise<void> => {
    await api.post(`/proposals/${proposalId}/request-changes`, { message });
  }
};