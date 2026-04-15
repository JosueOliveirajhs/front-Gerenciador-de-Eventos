// src/services/collab.ts
import { api } from './api';

export interface CollabOpportunity {
  id: string;
  title: string;
  description: string;
  partners: CollabPartner[];
  discount: number;
  requirements: string[];
  benefits: string[];
  imageUrl?: string;
}

export interface CollabPartner {
  id: string;
  name: string;
  type: 'DECORATOR' | 'PHOTOGRAPHER' | 'VENUE' | 'CATERING';
  rating: number;
  portfolio: string[];
}

export interface CollabProject {
  id: string;
  eventId: string;
  partners: CollabPartner[];
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  sharedContent: SharedContent[];
  savings: number;
  createdAt: string;
}

export interface SharedContent {
  id: string;
  type: 'PHOTO' | 'VIDEO' | 'REVIEW';
  url: string;
  description: string;
  uploadedBy: string;
  uploadDate: string;
}

export const collabService = {
  /**
   * Busca oportunidades de collab disponíveis
   */
  getOpportunities: async (): Promise<CollabOpportunity[]> => {
    try {
      const response = await api.get('/collabs/opportunities');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar oportunidades:', error);
      return [];
    }
  },

  /**
   * Cria um projeto de collab
   */
  createCollab: async (eventId: string, partnerIds: string[]): Promise<CollabProject> => {
    const response = await api.post('/collabs/projects', {
      eventId,
      partnerIds
    });
    return response.data;
  },

  /**
   * Busca projetos de collab do cliente
   */
  getMyCollabs: async (): Promise<CollabProject[]> => {
    const response = await api.get('/collabs/my-projects');
    return response.data;
  },

  /**
   * Compartilha conteúdo no collab
   */
  shareContent: async (projectId: string, content: Omit<SharedContent, 'id' | 'uploadDate'>): Promise<SharedContent> => {
    const response = await api.post(`/collabs/projects/${projectId}/content`, content);
    return response.data;
  },

  /**
   * Calcula economia potencial com collab
   */
  calculateSavings: async (eventConfig: any): Promise<{ potentialSavings: number; suggestedPartners: CollabPartner[] }> => {
    const response = await api.post('/collabs/calculate-savings', eventConfig);
    return response.data;
  }
};