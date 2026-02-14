// src/services/checklist.ts

import { api } from './api';
import { Checklist, ChecklistTask, CreateChecklistData, UpdateTaskStatusData } from '../types/Checklist';

export const checklistService = {
    // Buscar todos os checklists
    getAllChecklists: async (): Promise<Checklist[]> => {
        try {
            const response = await api.get('/checklists');
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar checklists:', error);
            return getMockChecklists();
        }
    },

    // Buscar checklist por ID do evento
    getChecklistByEventId: async (eventId: number): Promise<Checklist | null> => {
        try {
            const response = await api.get(`/checklists/event/${eventId}`);
            return response.data;
        } catch (error) {
            console.error(`Erro ao buscar checklist do evento ${eventId}:`, error);
            return getMockChecklistByEventId(eventId);
        }
    },

    // Criar novo checklist
    createChecklist: async (data: CreateChecklistData): Promise<Checklist> => {
        try {
            const response = await api.post('/checklists', data);
            return response.data;
        } catch (error) {
            console.error('Erro ao criar checklist:', error);
            throw error;
        }
    },

    // Atualizar checklist
    updateChecklist: async (id: number, data: Partial<Checklist>): Promise<Checklist> => {
        try {
            const response = await api.put(`/checklists/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Erro ao atualizar checklist ${id}:`, error);
            throw error;
        }
    },

    // Deletar checklist
    deleteChecklist: async (id: number): Promise<void> => {
        try {
            await api.delete(`/checklists/${id}`);
        } catch (error) {
            console.error(`Erro ao deletar checklist ${id}:`, error);
            throw error;
        }
    },

    // Buscar tarefas de um checklist
    getChecklistTasks: async (checklistId: number): Promise<ChecklistTask[]> => {
        try {
            const response = await api.get(`/checklists/${checklistId}/tasks`);
            return response.data;
        } catch (error) {
            console.error(`Erro ao buscar tarefas do checklist ${checklistId}:`, error);
            return [];
        }
    },

    // Adicionar tarefa ao checklist
    addTask: async (checklistId: number, taskData: any): Promise<ChecklistTask> => {
        try {
            const response = await api.post(`/checklists/${checklistId}/tasks`, taskData);
            return response.data;
        } catch (error) {
            console.error('Erro ao adicionar tarefa:', error);
            throw error;
        }
    },

    // Atualizar tarefa
    updateTask: async (taskId: number, data: Partial<ChecklistTask>): Promise<ChecklistTask> => {
        try {
            const response = await api.put(`/checklists/tasks/${taskId}`, data);
            return response.data;
        } catch (error) {
            console.error(`Erro ao atualizar tarefa ${taskId}:`, error);
            throw error;
        }
    },

    // Atualizar status da tarefa
    updateTaskStatus: async (taskId: number, data: UpdateTaskStatusData): Promise<ChecklistTask> => {
        try {
            const response = await api.patch(`/checklists/tasks/${taskId}/status`, data);
            return response.data;
        } catch (error) {
            console.error(`Erro ao atualizar status da tarefa ${taskId}:`, error);
            throw error;
        }
    },

    // Deletar tarefa
    deleteTask: async (taskId: number): Promise<void> => {
        try {
            await api.delete(`/checklists/tasks/${taskId}`);
        } catch (error) {
            console.error(`Erro ao deletar tarefa ${taskId}:`, error);
            throw error;
        }
    },

    // Reordenar tarefas
    reorderTasks: async (checklistId: number, taskOrders: { id: number; order: number }[]): Promise<void> => {
        try {
            await api.post(`/checklists/${checklistId}/tasks/reorder`, { tasks: taskOrders });
        } catch (error) {
            console.error('Erro ao reordenar tarefas:', error);
            throw error;
        }
    },

    // Obter checklists padrão por tipo de evento
    getDefaultChecklists: async (eventType: string): Promise<Checklist[]> => {
        try {
            const response = await api.get(`/checklists/default/${eventType}`);
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar checklists padrão:', error);
            return getMockDefaultChecklists(eventType);
        }
    },

    // Duplicar checklist (para usar como template)
    duplicateChecklist: async (checklistId: number, newEventId: number): Promise<Checklist> => {
        try {
            const response = await api.post(`/checklists/${checklistId}/duplicate`, { eventId: newEventId });
            return response.data;
        } catch (error) {
            console.error('Erro ao duplicar checklist:', error);
            throw error;
        }
    }
};

// DADOS MOCKADOS PARA TESTE
const getMockChecklists = (): Checklist[] => {
    return [
        {
            id: 1,
            title: 'Checklist Casamento',
            description: 'Lista completa para casamento',
            eventId: 1,
            eventTitle: 'Casamento João e Maria',
            isDefault: true,
            eventType: 'CASAMENTO',
            status: 'ACTIVE',
            progress: 65,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tasks: getMockTasks(1)
        },
        {
            id: 2,
            title: 'Checklist Aniversário',
            description: 'Organização de festa de aniversário',
            eventId: 2,
            eventTitle: 'Aniversário Pedro',
            isDefault: true,
            eventType: 'ANIVERSARIO',
            status: 'ACTIVE',
            progress: 30,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tasks: getMockTasks(2)
        }
    ];
};

const getMockTasks = (checklistId: number): ChecklistTask[] => {
    return [
        {
            id: 1,
            checklistId,
            title: 'Contratar buffet',
            description: 'Pesquisar e contratar serviço de buffet',
            category: 'Buffet',
            responsible: 'Noiva',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'COMPLETED',
            priority: 'HIGH',
            order: 1,
            completedAt: new Date().toISOString(),
            completedBy: 'Maria Silva',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 2,
            checklistId,
            title: 'Escolher decoração',
            description: 'Definir tema e cores da decoração',
            category: 'Decoração',
            responsible: 'Noivo',
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            order: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 3,
            checklistId,
            title: 'Contratar fotógrafo',
            description: 'Pesquisar e fechar contrato com fotógrafo',
            category: 'Fotografia',
            responsible: 'Cerimonialista',
            dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'PENDING',
            priority: 'URGENT',
            order: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
};

const getMockChecklistByEventId = (eventId: number): Checklist | null => {
    const checklists = getMockChecklists();
    return checklists.find(c => c.eventId === eventId) || null;
};

const getMockDefaultChecklists = (eventType: string): Checklist[] => {
    const templates: Record<string, Checklist[]> = {
        CASAMENTO: [{
            id: 999,
            title: 'Checklist Padrão - Casamento',
            description: 'Checklist automático para eventos de casamento',
            eventId: 0,
            isDefault: true,
            eventType: 'CASAMENTO',
            status: 'ACTIVE',
            progress: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tasks: [
                { id: 1, checklistId: 999, title: 'Escolher local', category: 'Local', priority: 'URGENT', order: 1, status: 'PENDING', createdAt: '', updatedAt: '' },
                { id: 2, checklistId: 999, title: 'Contratar buffet', category: 'Buffet', priority: 'HIGH', order: 2, status: 'PENDING', createdAt: '', updatedAt: '' },
                { id: 3, checklistId: 999, title: 'Escolher decoração', category: 'Decoração', priority: 'HIGH', order: 3, status: 'PENDING', createdAt: '', updatedAt: '' },
                { id: 4, checklistId: 999, title: 'Contratar fotógrafo', category: 'Fotografia', priority: 'MEDIUM', order: 4, status: 'PENDING', createdAt: '', updatedAt: '' }
            ]
        }],
        ANIVERSARIO: [{
            id: 998,
            title: 'Checklist Padrão - Aniversário',
            description: 'Checklist automático para festas de aniversário',
            eventId: 0,
            isDefault: true,
            eventType: 'ANIVERSARIO',
            status: 'ACTIVE',
            progress: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tasks: [
                { id: 1, checklistId: 998, title: 'Definir lista de convidados', category: 'Convidados', priority: 'URGENT', order: 1, status: 'PENDING', createdAt: '', updatedAt: '' },
                { id: 2, checklistId: 998, title: 'Encomendar bolo', category: 'Buffet', priority: 'HIGH', order: 2, status: 'PENDING', createdAt: '', updatedAt: '' },
                { id: 3, checklistId: 998, title: 'Comprar decoração', category: 'Decoração', priority: 'MEDIUM', order: 3, status: 'PENDING', createdAt: '', updatedAt: '' }
            ]
        }]
    };
    
    return templates[eventType] || [];
};