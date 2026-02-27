// src/components/admin/clients/types.ts

export interface User {
    id: number;
    cpf: string;
    name: string;
    email: string | null;
    phone: string | null;
    password?: string;
    createdAt?: Date;
}

export interface Filters {
    cpf: string;
    name: string;
    email: string;
    phone: string;
}

export interface Receipt {
    id: number;
    clientId: number;
    clientName: string;
    fileName: string;
    fileUrl: string;
    uploadDate: Date;
    value?: number;
    description?: string;
    mimeType?: string;
    fileSize?: number;
}

export interface Boleto {
    id: number;
    clientId: number;
    clientName: string;
    description: string;
    dueDate: Date;
    value: number;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    barcode?: string;
    nossoNumero?: string;
    pdfUrl?: string;
    createdAt: Date;
    paidAt?: Date;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

export interface UploadReceiptData {
    clientId: number;
    file: File;
    description?: string;
    value?: number;
}

export interface GenerateBoletoData {
    clientId: number;
    description: string;
    value: number;
    dueDate: Date;
}
