import { api } from './api';
import { Checklist, ChecklistTask, CreateChecklistData, UpdateTaskStatusData } from '../types/Checklist';

// DTO estrito que o Java espera receber/enviar
interface ChecklistJavaDTO {
    id?: number;
    idEvento: number;
    titulo: string;
    descricao: string | null;
    categoria: string;
    prioridade: string;
    responsavel: string;
    dataLimite: string;
    concluido?: boolean;
    dataConclusao?: string;
}

// ---------------------------------------------------------
// TRADUTORES DE ENUMS (Frontend <-> Backend Java)
// ---------------------------------------------------------
const priorityToBack: Record<string, string> = { LOW: 'Baixa', MEDIUM: 'Media', HIGH: 'Alta', URGENT: 'Urgente' };
const priorityToFront: Record<string, any> = { Baixa: 'LOW', Media: 'MEDIUM', Alta: 'HIGH', Urgente: 'URGENT' };

const categoryToBack = (cat: string): string => {
    // Remove acentos para bater com o Enum do Java
    const map: Record<string, string> = {
        'Decoração': 'Decoracao',
        'Música': 'Musica',
        'Documentação': 'Documentacao',
        'Cerimonial': 'Cerimonial',
        'Buffet': 'Buffet',
        'Fotografia': 'Fotografia',
        'Convidados': 'Convidados',
        'Pagamento': 'Pagamento',
        'Logística': 'Logistica'
    };
    return map[cat] || 'Outros';
};

const categoryToFront = (cat: string): string => {
    // Devolve os acentos pro Frontend
    const map: Record<string, string> = {
        'Decoracao': 'Decoração',
        'Musica': 'Música',
        'Documentacao': 'Documentação',
        'Logistica': 'Logística'
    };
    return map[cat] || cat;
};

// ---------------------------------------------------------
// TRADUTOR DE OBJETO (Adapter Pattern)
// ---------------------------------------------------------
const mapJavaToFrontendChecklist = (eventId: number, javaItems: ChecklistJavaDTO[]): Checklist | null => {
    if (!javaItems || javaItems.length === 0) return null;

    const completedCount = javaItems.filter(item => item.concluido).length;
    const progress = javaItems.length > 0 ? (completedCount / javaItems.length) * 100 : 0;

    return {
        id: eventId,
        title: "Checklist do Evento",
        description: "Tarefas importadas do backend",
        eventId: eventId,
        isDefault: false,
        eventType: "OUTRO", // Corrigido erro de tipagem ("GERAL" não existia)
        status: progress === 100 ? 'COMPLETED' : 'ACTIVE',
        progress: progress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tasks: javaItems.map((item, index): ChecklistTask => ({
            id: item.id || Date.now() + index,
            checklistId: eventId, // Corrigido: propriedade faltante
            title: item.titulo,
            description: item.descricao || '',
            category: categoryToFront(item.categoria),
            status: item.concluido ? 'COMPLETED' : 'PENDING',
            priority: priorityToFront[item.prioridade] || 'MEDIUM',
            order: index + 1,
            responsible: item.responsavel,
            dueDate: item.dataLimite ? `${item.dataLimite}T00:00:00Z` : undefined,
            completedAt: item.dataConclusao ? `${item.dataConclusao}T00:00:00Z` : undefined,
            createdAt: new Date().toISOString(), // Corrigido: propriedade faltante
            updatedAt: new Date().toISOString()  // Corrigido: propriedade faltante
        }))
    };
};

export const checklistService = {
    getChecklistByEventId: async (eventId: number): Promise<Checklist | null> => {
        try {
            const response = await api.get('/api/checklists'); 
            const allItems: ChecklistJavaDTO[] = response.data;
            const eventItems = allItems.filter(item => item.idEvento === eventId);
            return mapJavaToFrontendChecklist(eventId, eventItems);
        } catch (error) {
            console.error(`Erro ao buscar tarefas do evento ${eventId}:`, error);
            throw error;
        }
    },

    createChecklist: async (data: CreateChecklistData): Promise<Checklist> => {
        try {
            const createdTasks: ChecklistJavaDTO[] = [];

            for (const task of data.tasks || []) {
                const payload: ChecklistJavaDTO = {
                    idEvento: data.eventId,
                    titulo: task.title,
                    descricao: task.description || null,
                    categoria: categoryToBack(task.category || 'Outros'),
                    prioridade: priorityToBack[task.priority || 'MEDIUM'],
                    responsavel: task.responsible || 'A definir',
                    dataLimite: task.dueDate ? task.dueDate.split('T')[0] : new Date().toISOString().split('T')[0]
                };

                const response = await api.post('/api/checklists', payload);
                createdTasks.push(response.data);
            }

            if (!data.tasks || data.tasks.length === 0) {
                 const dummyPayload: ChecklistJavaDTO = {
                    idEvento: data.eventId,
                    titulo: data.title,
                    descricao: data.description || null,
                    categoria: 'Outros',
                    prioridade: 'Baixa',
                    responsavel: 'A definir',
                    dataLimite: new Date().toISOString().split('T')[0]
                };
                const response = await api.post('/api/checklists', dummyPayload);
                createdTasks.push(response.data);
            }

            return mapJavaToFrontendChecklist(data.eventId, createdTasks) as Checklist;
        } catch (error) {
            console.error('Erro ao criar checklist no Java:', error);
            throw error;
        }
    },

    addTask: async (checklistId: number, taskData: any): Promise<Checklist> => {
        try {
            const payload: ChecklistJavaDTO = {
                idEvento: checklistId, 
                titulo: taskData.title,
                descricao: taskData.description || null,
                categoria: categoryToBack(taskData.category || 'Outros'),
                prioridade: priorityToBack[taskData.priority || 'MEDIUM'],
                responsavel: taskData.responsible || 'A definir',
                dataLimite: taskData.dueDate || new Date().toISOString().split('T')[0]
            };

            await api.post('/api/checklists', payload);
            return await checklistService.getChecklistByEventId(checklistId) as Checklist;
        } catch (error) {
            console.error('Erro ao adicionar tarefa:', error);
            throw error;
        }
    },

    updateTask: async (checklistId: number, taskId: number, taskData: any): Promise<Checklist> => {
        try {
            if (taskData.status && Object.keys(taskData).length <= 3) {
                 // Endpoint PATCH do Java para Toggle (status: PENDING/COMPLETED)
                 await api.patch(`/api/checklists/${taskId}/toggle`);
            } else {
                 const payload: ChecklistJavaDTO = {
                    idEvento: checklistId,
                    titulo: taskData.title,
                    descricao: taskData.description || null,
                    categoria: categoryToBack(taskData.category || 'Outros'),
                    prioridade: priorityToBack[taskData.priority || 'MEDIUM'],
                    responsavel: taskData.responsible || 'A definir',
                    dataLimite: taskData.dueDate || new Date().toISOString().split('T')[0]
                };
                await api.put(`/api/checklists/${taskId}`, payload);
            }

            return await checklistService.getChecklistByEventId(checklistId) as Checklist;
        } catch (error) {
            console.error(`Erro ao atualizar tarefa ${taskId}:`, error);
            throw error;
        }
    },

    deleteTask: async (checklistId: number, taskId: number): Promise<Checklist> => {
        try {
            await api.delete(`/api/checklists/${taskId}`);
            return await checklistService.getChecklistByEventId(checklistId) as Checklist;
        } catch (error) {
            console.error(`Erro ao deletar tarefa ${taskId}:`, error);
            throw error;
        }
    },

    // Retorna Mocks para usar como Base na criação
    getDefaultTasks: (eventType: string): any[] => {
        const templates: Record<string, any[]> = {
            CASAMENTO: [
                { title: "Contratar Cerimonialista", category: "Cerimonial", priority: "HIGH" },
                { title: "Escolher Decoração", category: "Decoração", priority: "HIGH" },
                { title: "Contratar Buffet", category: "Buffet", priority: "URGENT" }
            ],
            ANIVERSARIO: [
                { title: "Escolher Tema", category: "Decoração", priority: "HIGH" },
                { title: "Lista de Convidados", category: "Convidados", priority: "URGENT" }
            ]
        };
        return templates[eventType] || [];
    }
};