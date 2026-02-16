import React, { useState, useEffect } from 'react';
import { Event } from '../../../types/Event';
import { Checklist, ChecklistTask, CreateChecklistData, TASK_CATEGORIES, TASK_PRIORITIES } from '../../../types/Checklist';
import { eventService } from '../../../services/events';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { EmptyState } from '../../common/EmptyState';
import { ConfirmationModal } from '../../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../../common/Alerts/ErrorModal';
import { FiX, FiSave, FiPlus, FiEdit2, FiTrash2, FiCalendar, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { MdEvent, MdDescription, MdCategory, MdPerson, MdWarning } from 'react-icons/md';
import styles from './ChecklistManagement.module.css';

// Dados mocados de eventos
const MOCK_EVENTS: Event[] = [
  {
    id: 1,
    title: "Casamento João e Maria",
    eventDate: "2026-03-15",
    startTime: "18:00",
    endTime: "23:00",
    guestCount: 150,
    eventType: "CASAMENTO",
    status: "CONFIRMED",
    clientId: 1,
    client: { id: 1, name: "João Silva", cpf: "123.456.789-00" },
    totalValue: 15000,
    depositValue: 5000,
    notes: "Casamento na igreja e festa no salão"
  },
  {
    id: 2,
    title: "Aniversário de 15 anos - Sofia",
    eventDate: "2026-03-20",
    startTime: "19:00",
    endTime: "23:00",
    guestCount: 200,
    eventType: "ANIVERSARIO",
    status: "CONFIRMED",
    clientId: 2,
    client: { id: 2, name: "Sofia Oliveira", cpf: "987.654.321-00" },
    totalValue: 8000,
    depositValue: 3000,
    notes: "Tema: Paris"
  },
  {
    id: 3,
    title: "Formatura Direito",
    eventDate: "2026-04-05",
    startTime: "20:00",
    endTime: "02:00",
    guestCount: 300,
    eventType: "FORMATURA",
    status: "QUOTE",
    clientId: 3,
    client: { id: 3, name: "Turma de Direito", cpf: "111.222.333-44" },
    totalValue: 25000,
    depositValue: 5000,
    notes: "Formatura na faculdade"
  },
  {
    id: 4,
    title: "Evento Corporativo - Empresa X",
    eventDate: "2026-03-25",
    startTime: "09:00",
    endTime: "18:00",
    guestCount: 100,
    eventType: "CORPORATIVO",
    status: "CONFIRMED",
    clientId: 4,
    client: { id: 4, name: "Empresa X", cpf: "555.666.777-88" },
    totalValue: 5000,
    depositValue: 2000,
    notes: "Workshop de inovação"
  },
  {
    id: 5,
    title: "Casamento Pedro & Ana",
    eventDate: "2026-04-10",
    startTime: "17:00",
    endTime: "23:00",
    guestCount: 180,
    eventType: "CASAMENTO",
    status: "CONFIRMED",
    clientId: 5,
    client: { id: 5, name: "Pedro Santos", cpf: "999.888.777-66" },
    totalValue: 18000,
    depositValue: 6000,
    notes: "Cerimônia ao ar livre"
  }
];

// Dados mocados de checklists
const MOCK_CHECKLISTS: { [key: number]: Checklist } = {
  1: {
    id: 1,
    title: "Checklist - Casamento João e Maria",
    description: "Checklist completo para casamento",
    eventId: 1,
    eventType: "CASAMENTO",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-15T14:30:00Z",
    tasks: [
      {
        id: 101,
        title: "Contratar Cerimonialista",
        description: "Pesquisar e contratar cerimonialista para o dia do evento",
        category: "CONTRATOS",
        status: "COMPLETED",
        priority: "HIGH",
        order: 1,
        responsible: "Noiva",
        dueDate: "2026-02-10",
        completedAt: "2026-02-08T15:00:00Z",
        completedBy: "Maria"
      },
      {
        id: 102,
        title: "Escolher Decoração",
        description: "Definir cores, flores e estilo da decoração",
        category: "DECORACAO",
        status: "COMPLETED",
        priority: "HIGH",
        order: 2,
        responsible: "Noiva",
        dueDate: "2026-02-15",
        completedAt: "2026-02-12T10:30:00Z",
        completedBy: "Maria"
      },
      {
        id: 103,
        title: "Contratar Buffet",
        description: "Fechar contrato com buffet e definir cardápio",
        category: "ALIMENTACAO",
        status: "IN_PROGRESS",
        priority: "URGENT",
        order: 3,
        responsible: "João",
        dueDate: "2026-02-20"
      },
      {
        id: 104,
        title: "Enviar Convites",
        description: "Imprimir e enviar convites para os convidados",
        category: "COMUNICACAO",
        status: "PENDING",
        priority: "MEDIUM",
        order: 4,
        responsible: "Ambos",
        dueDate: "2026-03-01"
      },
      {
        id: 105,
        title: "Prova de Vestido",
        description: "Última prova do vestido de noiva",
        category: "VESTUARIO",
        status: "PENDING",
        priority: "HIGH",
        order: 5,
        responsible: "Noiva",
        dueDate: "2026-03-05"
      },
      {
        id: 106,
        title: "Reunião com Fotógrafo",
        description: "Definir cronograma de fotos e locais",
        category: "CONTRATOS",
        status: "PENDING",
        priority: "MEDIUM",
        order: 6,
        responsible: "João",
        dueDate: "2026-03-08"
      },
      {
        id: 107,
        title: "Organizar Lista de Músicas",
        description: "Selecionar músicas para cerimônia e festa",
        category: "MUSICA",
        status: "PENDING",
        priority: "LOW",
        order: 7,
        responsible: "Ambos",
        dueDate: "2026-03-10"
      }
    ]
  },
  2: {
    id: 2,
    title: "Checklist - Aniversário Sofia",
    description: "Preparativos para festa de 15 anos",
    eventId: 2,
    eventType: "ANIVERSARIO",
    createdAt: "2026-02-05T09:00:00Z",
    updatedAt: "2026-02-14T11:20:00Z",
    tasks: [
      {
        id: 201,
        title: "Escolher Tema da Festa",
        description: "Definir tema e cores da decoração",
        category: "DECORACAO",
        status: "COMPLETED",
        priority: "HIGH",
        order: 1,
        responsible: "Sofia",
        dueDate: "2026-02-10",
        completedAt: "2026-02-08T16:00:00Z",
        completedBy: "Sofia"
      },
      {
        id: 202,
        title: "Contratar Buffet",
        description: "Fechar buffet e definir cardápio",
        category: "ALIMENTACAO",
        status: "COMPLETED",
        priority: "HIGH",
        order: 2,
        responsible: "Mãe",
        dueDate: "2026-02-15",
        completedAt: "2026-02-12T14:30:00Z",
        completedBy: "Mãe"
      },
      {
        id: 203,
        title: "Escolher Vestido",
        description: "Provas e escolha do vestido de debutante",
        category: "VESTUARIO",
        status: "IN_PROGRESS",
        priority: "URGENT",
        order: 3,
        responsible: "Sofia",
        dueDate: "2026-02-25"
      },
      {
        id: 204,
        title: "Contratar Banda/DJ",
        description: "Pesquisar e contratar música ao vivo",
        category: "MUSICA",
        status: "PENDING",
        priority: "HIGH",
        order: 4,
        responsible: "Pai",
        dueDate: "2026-03-01"
      },
      {
        id: 205,
        title: "Enviar Convites",
        description: "Lista de convidados e envio de convites",
        category: "COMUNICACAO",
        status: "PENDING",
        priority: "MEDIUM",
        order: 5,
        responsible: "Mãe",
        dueDate: "2026-03-05"
      }
    ]
  },
  4: {
    id: 4,
    title: "Checklist - Evento Corporativo",
    description: "Organização para workshop da empresa",
    eventId: 4,
    eventType: "CORPORATIVO",
    createdAt: "2026-02-10T08:30:00Z",
    updatedAt: "2026-02-13T09:45:00Z",
    tasks: [
      {
        id: 401,
        title: "Reservar Sala",
        description: "Confirmar reserva do espaço",
        category: "LOGISTICA",
        status: "COMPLETED",
        priority: "HIGH",
        order: 1,
        responsible: "RH",
        dueDate: "2026-02-12",
        completedAt: "2026-02-11T11:00:00Z",
        completedBy: "RH"
      },
      {
        id: 402,
        title: "Coffee Break",
        description: "Contratar serviço de coffee break",
        category: "ALIMENTACAO",
        status: "COMPLETED",
        priority: "MEDIUM",
        order: 2,
        responsible: "RH",
        dueDate: "2026-02-15",
        completedAt: "2026-02-13T10:15:00Z",
        completedBy: "RH"
      },
      {
        id: 403,
        title: "Material dos Participantes",
        description: "Preparar pastas e brindes",
        category: "MATERIAL",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        order: 3,
        responsible: "Marketing",
        dueDate: "2026-03-01"
      },
      {
        id: 404,
        title: "Confirmar Palestrantes",
        description: "Última confirmação com os palestrantes",
        category: "PESSOAL",
        status: "PENDING",
        priority: "URGENT",
        order: 4,
        responsible: "Eventos",
        dueDate: "2026-03-10"
      }
    ]
  }
};

export const ChecklistManagement: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [checklist, setChecklist] = useState<Checklist | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState<ChecklistTask | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // Estados para modais
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<number | null>(null);

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        if (selectedEventId) {
            loadChecklist(selectedEventId);
        } else {
            setChecklist(null);
        }
    }, [selectedEventId]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            // Usar dados mocados em vez da API
            setTimeout(() => {
                setEvents(MOCK_EVENTS);
                if (MOCK_EVENTS.length > 0) {
                    setSelectedEventId(MOCK_EVENTS[0].id);
                }
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error('Erro ao carregar eventos:', error);
            setErrorMessage('Erro ao carregar eventos. Tente novamente.');
            setShowErrorModal(true);
            setLoading(false);
        }
    };

    const loadChecklist = async (eventId: number) => {
        try {
            setLoading(true);
            // Usar dados mocados em vez da API
            setTimeout(() => {
                const mockChecklist = MOCK_CHECKLISTS[eventId] || null;
                setChecklist(mockChecklist);
                setLoading(false);
            }, 300);
        } catch (error) {
            console.error('Erro ao carregar checklist:', error);
            setErrorMessage('Erro ao carregar checklist. Tente novamente.');
            setShowErrorModal(true);
            setLoading(false);
        }
    };

    const handleCreateChecklist = async (data: CreateChecklistData) => {
        try {
            setLoading(true);
            
            // Simular criação de checklist
            const newChecklist: Checklist = {
                id: Date.now(),
                title: data.title,
                description: data.description || '',
                eventId: data.eventId,
                eventType: data.eventType,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                tasks: data.tasks || []
            };
            
            // Adicionar ao mock (apenas para simular)
            MOCK_CHECKLISTS[data.eventId] = newChecklist;
            
            setChecklist(newChecklist);
            setShowCreateModal(false);
            setSuccessMessage('Checklist criado com sucesso!');
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Erro ao criar checklist:', error);
            setErrorMessage('Erro ao criar checklist. Tente novamente.');
            setShowErrorModal(true);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTaskStatus = async (taskId: number, status: ChecklistTask['status']) => {
        if (!checklist) return;
        
        try {
            const updatedTasks = checklist.tasks.map(task => {
                if (task.id === taskId) {
                    return {
                        ...task,
                        status,
                        ...(status === 'COMPLETED' ? {
                            completedAt: new Date().toISOString(),
                            completedBy: "Usuário"
                        } : {})
                    };
                }
                return task;
            });
            
            setChecklist({
                ...checklist,
                tasks: updatedTasks,
                updatedAt: new Date().toISOString()
            });
            
            setSuccessMessage(status === 'COMPLETED' 
                ? 'Tarefa marcada como concluída!' 
                : 'Status da tarefa atualizado!'
            );
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Erro ao atualizar tarefa:', error);
            setErrorMessage('Erro ao atualizar status da tarefa. Tente novamente.');
            setShowErrorModal(true);
        }
    };

    const handleAddTask = async (taskData: any) => {
        if (!checklist) return;
        
        try {
            const newTask: ChecklistTask = {
                id: Date.now(),
                title: taskData.title,
                description: taskData.description || '',
                category: taskData.category,
                status: taskData.status || 'PENDING',
                priority: taskData.priority,
                order: checklist.tasks.length + 1,
                responsible: taskData.responsible || '',
                dueDate: taskData.dueDate || ''
            };
            
            setChecklist({
                ...checklist,
                tasks: [...checklist.tasks, newTask],
                updatedAt: new Date().toISOString()
            });
            setShowTaskModal(false);
            setSuccessMessage('Tarefa adicionada com sucesso!');
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Erro ao adicionar tarefa:', error);
            setErrorMessage('Erro ao adicionar tarefa. Tente novamente.');
            setShowErrorModal(true);
        }
    };

    const handleUpdateTask = async (taskId: number, data: any) => {
        if (!checklist) return;
        
        try {
            const updatedTasks = checklist.tasks.map(task => 
                task.id === taskId ? { ...task, ...data } : task
            );
            
            setChecklist({
                ...checklist,
                tasks: updatedTasks,
                updatedAt: new Date().toISOString()
            });
            setEditingTask(null);
            setSuccessMessage('Tarefa atualizada com sucesso!');
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Erro ao atualizar tarefa:', error);
            setErrorMessage('Erro ao atualizar tarefa. Tente novamente.');
            setShowErrorModal(true);
        }
    };

    const handleDeleteTask = (taskId: number) => {
        setTaskToDelete(taskId);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteTask = async () => {
        if (!checklist || !taskToDelete) return;
        
        try {
            const updatedTasks = checklist.tasks.filter(task => task.id !== taskToDelete);
            setChecklist({
                ...checklist,
                tasks: updatedTasks,
                updatedAt: new Date().toISOString()
            });
            setSuccessMessage('Tarefa excluída com sucesso!');
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Erro ao excluir tarefa:', error);
            setErrorMessage('Erro ao excluir tarefa. Tente novamente.');
            setShowErrorModal(true);
        } finally {
            setShowDeleteConfirm(false);
            setTaskToDelete(null);
        }
    };

    const getFilteredTasks = (): ChecklistTask[] => {
        if (!checklist) return [];
        
        return checklist.tasks
            .filter(task => {
                if (filterStatus !== 'ALL' && task.status !== filterStatus) return false;
                if (filterCategory !== 'ALL' && task.category !== filterCategory) return false;
                if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
                    !task.description?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                return true;
            })
            .sort((a, b) => a.order - b.order);
    };

    const calculateProgress = (): number => {
        if (!checklist || checklist.tasks.length === 0) return 0;
        const completed = checklist.tasks.filter(t => t.status === 'COMPLETED').length;
        return Math.round((completed / checklist.tasks.length) * 100);
    };

    const getPriorityColor = (priority: string): string => {
        const priorityColors: Record<string, string> = {
            LOW: '#6b7280',
            MEDIUM: '#3b82f6',
            HIGH: '#f59e0b',
            URGENT: '#ef4444'
        };
        return priorityColors[priority] || '#6b7280';
    };

    const getStatusIcon = (status: string): string => {
        const icons: Record<string, string> = {
            PENDING: '⏳',
            IN_PROGRESS: '🔄',
            COMPLETED: '✅',
            CANCELLED: '❌'
        };
        return icons[status] || '📋';
    };

    const filteredTasks = getFilteredTasks();
    const progress = calculateProgress();

    if (loading && !checklist && events.length === 0) {
        return <LoadingSpinner text="Carregando checklists..." fullScreen />;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>Checklists de Eventos</h1>
                    {selectedEventId && (
                        <span className={styles.eventBadge}>
                            {events.find(e => e.id === selectedEventId)?.title}
                        </span>
                    )}
                </div>

                <div className={styles.headerActions}>
                    <select 
                        className={styles.eventSelect}
                        value={selectedEventId || ''}
                        onChange={(e) => setSelectedEventId(Number(e.target.value))}
                    >
                        <option value="">Selecione um evento</option>
                        {events.map(event => (
                            <option key={event.id} value={event.id}>
                                {event.title} - {new Date(event.eventDate).toLocaleDateString('pt-BR')}
                            </option>
                        ))}
                    </select>

                    {!checklist && selectedEventId && (
                        <button 
                            className={styles.primaryButton}
                            onClick={() => setShowCreateModal(true)}
                        >
                            <FiPlus size={18} />
                            Criar Checklist
                        </button>
                    )}
                </div>
            </div>

            {!selectedEventId ? (
                <EmptyState
                    icon={<FiCalendar size={48} />}
                    title="Nenhum evento selecionado"
                    description="Selecione um evento para visualizar ou criar um checklist."
                />
            ) : !checklist ? (
                <EmptyState
                    icon={<FiCheckCircle size={48} />}
                    title="Nenhum checklist encontrado"
                    description="Este evento ainda não possui um checklist. Crie um novo checklist para começar a organizar as tarefas."
                    action={{
                        label: "Criar Checklist",
                        onClick: () => setShowCreateModal(true)
                    }}
                />
            ) : (
                <div className={styles.checklistContainer}>
                    {/* Cabeçalho do Checklist */}
                    <div className={styles.checklistHeader}>
                        <div className={styles.checklistInfo}>
                            <h2 className={styles.checklistTitle}>{checklist.title}</h2>
                            {checklist.description && (
                                <p className={styles.checklistDescription}>{checklist.description}</p>
                            )}
                        </div>

                        <div className={styles.progressContainer}>
                            <div className={styles.progressHeader}>
                                <span className={styles.progressLabel}>Progresso</span>
                                <span className={styles.progressValue}>{progress}%</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div 
                                    className={styles.progressFill}
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <div className={styles.tasksCount}>
                                {checklist.tasks.filter(t => t.status === 'COMPLETED').length} de {checklist.tasks.length} tarefas concluídas
                            </div>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className={styles.filtersSection}>
                        <div className={styles.filtersLeft}>
                            <div className={styles.searchBox}>
                                <span className={styles.searchIcon}>🔍</span>
                                <input
                                    type="text"
                                    placeholder="Buscar tarefas..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={styles.searchInput}
                                />
                            </div>

                            <select 
                                className={styles.filterSelect}
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="ALL">Todos os status</option>
                                <option value="PENDING">Pendente</option>
                                <option value="IN_PROGRESS">Em andamento</option>
                                <option value="COMPLETED">Concluído</option>
                                <option value="CANCELLED">Cancelado</option>
                            </select>

                            <select 
                                className={styles.filterSelect}
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="ALL">Todas categorias</option>
                                {TASK_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <button 
                            className={styles.addButton}
                            onClick={() => setShowTaskModal(true)}
                        >
                            <FiPlus size={18} />
                            Nova Tarefa
                        </button>
                    </div>

                    {/* Lista de Tarefas */}
                    <div className={styles.tasksContainer}>
                        {filteredTasks.length === 0 ? (
                            <EmptyState
                                icon={<FiCheckCircle size={48} />}
                                title="Nenhuma tarefa encontrada"
                                description="Tente ajustar os filtros ou criar uma nova tarefa."
                            />
                        ) : (
                            <div className={styles.tasksList}>
                                {filteredTasks.map(task => (
                                    <div key={task.id} className={`${styles.taskCard} ${styles[task.status.toLowerCase()]}`}>
                                        <div className={styles.taskCheckbox}>
                                            <input
                                                type="checkbox"
                                                checked={task.status === 'COMPLETED'}
                                                onChange={(e) => handleUpdateTaskStatus(
                                                    task.id, 
                                                    e.target.checked ? 'COMPLETED' : 'PENDING'
                                                )}
                                                className={styles.checkbox}
                                            />
                                        </div>

                                        <div className={styles.taskContent}>
                                            <div className={styles.taskHeader}>
                                                <h3 className={`${styles.taskTitle} ${task.status === 'COMPLETED' ? styles.taskCompleted : ''}`}>
                                                    {task.title}
                                                </h3>
                                                <span 
                                                    className={styles.priorityBadge}
                                                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                                                >
                                                    {task.priority === 'LOW' && 'Baixa'}
                                                    {task.priority === 'MEDIUM' && 'Média'}
                                                    {task.priority === 'HIGH' && 'Alta'}
                                                    {task.priority === 'URGENT' && 'Urgente'}
                                                </span>
                                            </div>

                                            {task.description && (
                                                <p className={styles.taskDescription}>{task.description}</p>
                                            )}

                                            <div className={styles.taskMeta}>
                                                {task.category && (
                                                    <span className={styles.taskCategory}>
                                                        <MdCategory size={12} />
                                                        {task.category}
                                                    </span>
                                                )}
                                                {task.responsible && (
                                                    <span className={styles.taskResponsible}>
                                                        <MdPerson size={12} />
                                                        {task.responsible}
                                                    </span>
                                                )}
                                                {task.dueDate && (
                                                    <span className={styles.taskDueDate}>
                                                        <FiCalendar size={12} />
                                                        {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                                    </span>
                                                )}
                                            </div>

                                            {task.status === 'COMPLETED' && task.completedAt && (
                                                <div className={styles.completedInfo}>
                                                    <FiCheckCircle size={12} />
                                                    Concluído em {new Date(task.completedAt).toLocaleDateString('pt-BR')}
                                                    {task.completedBy && ` por ${task.completedBy}`}
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.taskActions}>
                                            <button
                                                className={styles.actionButton}
                                                onClick={() => {
                                                    setEditingTask(task);
                                                    setShowTaskModal(true);
                                                }}
                                                title="Editar tarefa"
                                            >
                                                <FiEdit2 size={16} />
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.deleteButton}`}
                                                onClick={() => handleDeleteTask(task.id)}
                                                title="Excluir tarefa"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de Criação de Checklist */}
            {showCreateModal && selectedEventId && (
                <CreateChecklistModal
                    eventId={selectedEventId}
                    eventTitle={events.find(e => e.id === selectedEventId)?.title || ''}
                    eventType={events.find(e => e.id === selectedEventId)?.eventType || ''}
                    onSubmit={handleCreateChecklist}
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {/* Modal de Tarefa */}
            {showTaskModal && checklist && (
                <TaskModal
                    checklistId={checklist.id}
                    task={editingTask}
                    onSubmit={editingTask 
                        ? (data) => handleUpdateTask(editingTask.id, data)
                        : (data) => handleAddTask(data)
                    }
                    onClose={() => {
                        setShowTaskModal(false);
                        setEditingTask(null);
                    }}
                />
            )}

            {/* Modais de Feedback */}
            <ConfirmationModal
                isOpen={showSuccessModal}
                title="Sucesso!"
                message={successMessage}
                type="success"
                onConfirm={() => setShowSuccessModal(false)}
                onCancel={() => setShowSuccessModal(false)}
                confirmText="OK"
            />

            <ErrorModal
                isOpen={showErrorModal}
                message={errorMessage}
                onClose={() => setShowErrorModal(false)}
            />

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita."
                type="warning"
                onConfirm={confirmDeleteTask}
                onCancel={() => {
                    setShowDeleteConfirm(false);
                    setTaskToDelete(null);
                }}
                confirmText="Excluir"
            />
        </div>
    );
};

// Componente Modal de Criação de Checklist
interface CreateChecklistModalProps {
    eventId: number;
    eventTitle: string;
    eventType: string;
    onSubmit: (data: CreateChecklistData) => void;
    onClose: () => void;
}

const CreateChecklistModal: React.FC<CreateChecklistModalProps> = ({
    eventId,
    eventTitle,
    eventType,
    onSubmit,
    onClose
}) => {
    const [title, setTitle] = useState(`Checklist - ${eventTitle}`);
    const [description, setDescription] = useState('');
    const [useDefault, setUseDefault] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            let tasks = [];
            
            // Tarefas padrão baseadas no tipo de evento
            if (useDefault) {
                if (eventType === 'CASAMENTO') {
                    tasks = [
                        { title: "Contratar Cerimonialista", category: "CONTRATOS", priority: "HIGH" },
                        { title: "Escolher Decoração", category: "DECORACAO", priority: "HIGH" },
                        { title: "Contratar Buffet", category: "ALIMENTACAO", priority: "URGENT" },
                        { title: "Enviar Convites", category: "COMUNICACAO", priority: "MEDIUM" },
                        { title: "Prova de Vestido", category: "VESTUARIO", priority: "HIGH" },
                        { title: "Reunião com Fotógrafo", category: "CONTRATOS", priority: "MEDIUM" },
                        { title: "Organizar Lista de Músicas", category: "MUSICA", priority: "LOW" }
                    ];
                } else if (eventType === 'ANIVERSARIO') {
                    tasks = [
                        { title: "Escolher Tema da Festa", category: "DECORACAO", priority: "HIGH" },
                        { title: "Contratar Buffet", category: "ALIMENTACAO", priority: "HIGH" },
                        { title: "Escolher Vestido", category: "VESTUARIO", priority: "URGENT" },
                        { title: "Contratar Banda/DJ", category: "MUSICA", priority: "HIGH" },
                        { title: "Enviar Convites", category: "COMUNICACAO", priority: "MEDIUM" }
                    ];
                } else if (eventType === 'CORPORATIVO') {
                    tasks = [
                        { title: "Reservar Sala", category: "LOGISTICA", priority: "HIGH" },
                        { title: "Coffee Break", category: "ALIMENTACAO", priority: "MEDIUM" },
                        { title: "Material dos Participantes", category: "MATERIAL", priority: "MEDIUM" },
                        { title: "Confirmar Palestrantes", category: "PESSOAL", priority: "URGENT" }
                    ];
                } else if (eventType === 'FORMATURA') {
                    tasks = [
                        { title: "Reservar Local", category: "LOGISTICA", priority: "HIGH" },
                        { title: "Contratar Banda/DJ", category: "MUSICA", priority: "HIGH" },
                        { title: "Venda de Convites", category: "COMERCIAL", priority: "URGENT" },
                        { title: "Contratar Fotógrafo", category: "CONTRATOS", priority: "MEDIUM" },
                        { title: "Preparar Becas", category: "VESTUARIO", priority: "HIGH" }
                    ];
                }
            }
            
            await onSubmit({
                title,
                description,
                eventId,
                eventType,
                tasks
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Criar Novo Checklist</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <FiX size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Título</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Descrição (opcional)</label>
                        <textarea
                            className={styles.formTextarea}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={useDefault}
                                onChange={(e) => setUseDefault(e.target.checked)}
                            />
                            Usar checklist padrão para {eventType}
                        </label>
                        <p className={styles.checkboxHint}>
                            O checklist será pré-preenchido com tarefas comuns para este tipo de evento.
                        </p>
                    </div>

                    <div className={styles.modalActions}>
                        <button type="button" className={styles.secondaryButton} onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className={styles.primaryButton} disabled={loading}>
                            {loading ? 'Criando...' : 'Criar Checklist'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Componente Modal de Tarefa
interface TaskModalProps {
    checklistId: number;
    task?: ChecklistTask | null;
    onSubmit: (data: any) => void;
    onClose: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({
    checklistId,
    task,
    onSubmit,
    onClose
}) => {
    const [formData, setFormData] = useState({
        title: task?.title || '',
        description: task?.description || '',
        category: task?.category || TASK_CATEGORIES[0],
        responsible: task?.responsible || '',
        dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
        priority: task?.priority || 'MEDIUM',
        status: task?.status || 'PENDING'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>
                        {task ? 'Editar Tarefa' : 'Nova Tarefa'}
                    </h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <FiX size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Título *</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Descrição</label>
                        <textarea
                            className={styles.formTextarea}
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows={3}
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Categoria</label>
                            <select
                                className={styles.formSelect}
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                            >
                                {TASK_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Prioridade</label>
                            <select
                                className={styles.formSelect}
                                value={formData.priority}
                                onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                            >
                                {TASK_PRIORITIES.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Responsável</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                value={formData.responsible}
                                onChange={(e) => setFormData({...formData, responsible: e.target.value})}
                                placeholder="Nome da pessoa"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Data Limite</label>
                            <input
                                type="date"
                                className={styles.formInput}
                                value={formData.dueDate}
                                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                            />
                        </div>
                    </div>

                    {task && (
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Status</label>
                            <select
                                className={styles.formSelect}
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                            >
                                <option value="PENDING">Pendente</option>
                                <option value="IN_PROGRESS">Em andamento</option>
                                <option value="COMPLETED">Concluído</option>
                                <option value="CANCELLED">Cancelado</option>
                            </select>
                        </div>
                    )}

                    <div className={styles.modalActions}>
                        <button type="button" className={styles.secondaryButton} onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className={styles.primaryButton}>
                            <FiSave size={16} />
                            {task ? 'Atualizar' : 'Adicionar'} Tarefa
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChecklistManagement;