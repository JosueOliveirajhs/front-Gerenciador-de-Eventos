// src/types/Checklist.ts

export interface Checklist {
    id: number;
    title: string;
    description?: string;
    eventId: number;
    eventTitle?: string;
    isDefault: boolean;
    eventType?: 'ANIVERSARIO' | 'CASAMENTO' | 'CORPORATIVO' | 'FORMATURA' | 'OUTRO';
    status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
    progress: number;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    tasks: ChecklistTask[];
}

export interface ChecklistTask {
    id: number;
    checklistId: number;
    title: string;
    description?: string;
    category?: string;
    responsible?: string;
    dueDate?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    order: number;
    completedAt?: string;
    completedBy?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateChecklistData {
    title: string;
    description?: string;
    eventId: number;
    isDefault?: boolean;
    eventType?: string;
    tasks: CreateTaskData[];
}

export interface CreateTaskData {
    title: string;
    description?: string;
    category?: string;
    responsible?: string;
    dueDate?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    order?: number;
}

export interface UpdateTaskStatusData {
    status: ChecklistTask['status'];
    notes?: string;
}

export const TASK_CATEGORIES = [
    'Decoração',
    'Buffet',
    'Música',
    'Fotografia',
    'Cerimonial',
    'Convidados',
    'Documentação',
    'Pagamento',
    'Logística',
    'Outros'
];

export const TASK_PRIORITIES = [
    { value: 'LOW', label: 'Baixa', color: '#6b7280' },
    { value: 'MEDIUM', label: 'Média', color: '#3b82f6' },
    { value: 'HIGH', label: 'Alta', color: '#f59e0b' },
    { value: 'URGENT', label: 'Urgente', color: '#ef4444' }
];