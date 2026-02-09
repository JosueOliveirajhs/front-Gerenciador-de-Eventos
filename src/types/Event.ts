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
  totalValue: number;    // Mudei para number
  depositValue: number;  // Mudei para number
  balanceValue: number;  // Mudei para number
  balanceDueDate: string;
  notes: string;
  createdAt: string;
  client?: {
    id: number;
    name: string;
    cpf: string;
    phone?: string;
    email?: string;
  };
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