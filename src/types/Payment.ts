export interface Payment {
  id: number;
  eventId: number;
  amount: number;
  paymentDate: string | null;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paymentMethod: string;
  notes: string;
  createdAt: string;
}

export interface CreatePaymentData {
  eventId: number;
  amount: number;
  dueDate: string;
  paymentMethod: string;
  notes?: string;
}