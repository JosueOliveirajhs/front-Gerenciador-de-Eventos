// src/services/message.ts
import { api } from './api';

export interface Attachment {
  id: number;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  attachments?: Attachment[];
  isEdited?: boolean;
  deletedAt?: string;
}

export interface Participant {
  id: number;
  name: string;
  avatar?: string;
  role: 'CLIENT' | 'OWNER' | 'MANAGER';
  online?: boolean;
}

export interface Conversation {
  id: number;
  eventId?: number;
  eventTitle?: string;
  participants: Participant[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export const messageService = {
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get('/api/messages/conversations');
    return response.data;
  },

  async getMessages(conversationId: number): Promise<Message[]> {
    const response = await api.get(`/api/messages/conversations/${conversationId}`);
    return response.data;
  },

  async sendMessage(conversationId: number, content: string, attachments?: File[]): Promise<Message> {
    const formData = new FormData();
    if (content) formData.append('content', content);
    if (attachments) {
      attachments.forEach(file => formData.append('attachments', file));
    }
    
    const response = await api.post(`/api/messages/conversations/${conversationId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // ✅ EDITAR MENSAGEM
  async editMessage(
    conversationId: number, 
    messageId: string, 
    content: string
  ): Promise<Message> {
    const response = await api.put(
      `/api/messages/conversations/${conversationId}/messages/${messageId}`,
      { content }
    );
    return response.data;
  },

  // ✅ APAGAR MENSAGEM (Soft Delete - só para o remetente)
  async deleteMessage(
    conversationId: number, 
    messageId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(
      `/api/messages/conversations/${conversationId}/messages/${messageId}`
    );
    return response.data;
  },

  // ✅ APAGAR MENSAGEM PARA TODOS (Hard Delete)
  async deleteMessageForEveryone(
    conversationId: number, 
    messageId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(
      `/api/messages/conversations/${conversationId}/messages/${messageId}/everyone`
    );
    return response.data;
  },

  async markAsRead(conversationId: number): Promise<void> {
    await api.post(`/api/messages/conversations/${conversationId}/read`);
  },

  async createConversation(eventId: number): Promise<Conversation> {
    const response = await api.post('/api/messages/conversations', { eventId });
    return response.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get('/api/messages/unread-count');
    return response.data;
  }
};