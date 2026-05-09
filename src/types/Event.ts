// src/types/Event.ts

export interface Event {
  id: number;
  title: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  eventType: string;
  status: 'QUOTE' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  clientId: number;
  client?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };
  totalValue: number;
  depositValue: number;
  balanceValue: number;
  balanceDueDate?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateEventData {
  title: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  eventType: string;
  clientId: number;
  totalValue: string;
  depositValue: string;
  notes?: string;
}