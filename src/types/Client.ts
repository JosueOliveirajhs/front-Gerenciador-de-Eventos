// src/types/Client.ts (atualizado)

export interface User {
    id: number;
    cpf: string;
    name: string;
    email: string | null;
    phone: string | null;
    password?: string;
    userType: string;
    createdAt: string;
    
    // Novos campos para classificação
    classification?: 'VIP' | 'RECORRENTE' | 'CORPORATIVO' | 'REGULAR' | 'NOVO';
    totalEvents?: number;
    totalSpent?: number;
    lastEventDate?: string;
    preferredEventType?: string;
    birthday?: string;
    socialMedia?: {
        instagram?: string;
        facebook?: string;
        whatsapp?: string;
    };
    tags?: string[];
    notes?: string;
}

export interface ClientInteraction {
    id: number;
    clientId: number;
    type: 'MEETING' | 'CALL' | 'EMAIL' | 'WHATSAPP' | 'VISIT' | 'OTHER';
    date: string;
    summary: string;
    notes?: string;
    outcome?: string;
    nextAction?: string;
    nextActionDate?: string;
    createdBy?: string;
    createdAt: string;
}

export interface ClientStatistics {
    totalEvents: number;
    totalSpent: number;
    averageTicket: number;
    eventsByType: Record<string, number>;
    monthlyAverage: number;
    lastEventDate?: string;
    firstEventDate?: string;
    cancellationRate: number;
    paymentRate: number;
}