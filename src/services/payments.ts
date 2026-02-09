import { Payment, CreatePaymentData } from '../types/Payment';
import { api } from './api';

export const paymentService = {
  getEventPayments: async (eventId: number): Promise<Payment[]> => {
    const response = await api.get(`/payments/event/${eventId}`);
    return response.data;
  },

  createPayment: async (paymentData: CreatePaymentData): Promise<Payment> => {
    const response = await api.post('/payments', paymentData);
    return response.data;
  },

  updatePaymentStatus: async (id: number, status: Payment['status']): Promise<Payment> => {
    const response = await api.patch(`/payments/${id}/status`, { status });
    return response.data;
  },

  processPayment: async (id: number, paymentMethod: string): Promise<Payment> => {
    const response = await api.post(`/payments/${id}/process`, { paymentMethod });
    return response.data;
  }
};