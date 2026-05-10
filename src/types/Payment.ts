export interface Payment {
  id: number;
  eventId: number;
  amount: number;
  paymentDate: string | null;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'WAITING_APPROVAL' | 'REJECTED' | 'CANCELLED';
  paymentMethod: string;
  description: string;
  notes: string;
  createdAt: string;
  updatedAt?: string;

  // Campos do Asaas
  asaasPaymentId?: string;
  billingType?: string;
  paymentUrl?: string;
  invoiceUrl?: string;

  // Controle de Comprovantes
  receiptUrl?: string;
  rejectionReason?: string;
  uploadedAt?: string;

  // Dados do evento associado
  eventTitle?: string;
  event?: {
    id: number;
    title: string;
    eventDate: string;
    clientId: number;
    clientName: string;
  };
}

export interface CreatePaymentData {
  eventId: number;
  amount: number;
  dueDate: string;
  paymentMethod: string;
  description?: string;
  notes?: string;
}