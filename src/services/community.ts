// src/services/community.ts
import api from './api';

export interface PostData {
  id: number; autorId: number; autorNome: string; conteudo: string;
  tipoEvento: string; imagens?: string[]; curtidas: number;
  comentarios: number; compartilhamentos?: number; dataCriacao: string;
}

export interface CommentData {
  id: number; postId: number; autorId: number; autorNome: string;
  conteudo: string; dataCriacao: string;
}

export const communityService = {
  getFeed: async (): Promise<PostData[]> => {
    const r = await api.get('/api/posts');
    return r.data.map((p: any) => ({ ...p, imagens: p.imagens || [], compartilhamentos: p.compartilhamentos || 0 }));
  },
  createPost: async (d: { autorId: number; conteudo: string; tipoEvento: string; imagens?: string[] }): Promise<PostData> => {
    const r = await api.post('/api/posts', d);
    return { ...r.data, imagens: d.imagens || [] };
  },
  updatePost: async (id: number, d: { autorId: number; conteudo: string; tipoEvento: string }): Promise<PostData> => {
    const r = await api.put(`/api/posts/${id}`, d); return r.data;
  },
  uploadImages: async (f: FormData): Promise<{ urls: string[] }> => {
    const r = await api.post('/api/upload/posts', f, { headers: { 'Content-Type': 'multipart/form-data' } });
    return r.data;
  },
  likePost: async (postId: number, u: number): Promise<{ curtidas: number; curtiu: boolean }> => {
    const r = await api.patch(`/api/posts/${postId}/curtir?usuarioId=${u}`); return r.data;
  },
  sharePost: async (postId: number): Promise<{ compartilhamentos: number }> => {
    const r = await api.post(`/api/posts/${postId}/share`); return r.data;
  },
  getComments: async (postId: number): Promise<CommentData[]> => {
    const r = await api.get(`/api/posts/${postId}/comments`); return r.data;
  },
  addComment: async (postId: number, d: { autorId: number; conteudo: string }): Promise<CommentData> => {
    const r = await api.post(`/api/posts/${postId}/comments`, d); return r.data;
  },
  updateComment: async (postId: number, cid: number, d: { autorId: number; conteudo: string }): Promise<CommentData> => {
    const r = await api.put(`/api/posts/${postId}/comments/${cid}`, d); return r.data;
  },
  deletePost: async (postId: number, u: number): Promise<void> => {
    await api.delete(`/api/posts/${postId}?autorId=${u}`);
  },
  deleteComment: async (postId: number, cid: number, u: number): Promise<void> => {
    await api.delete(`/api/posts/${postId}/comments/${cid}?autorId=${u}`);
  },
};