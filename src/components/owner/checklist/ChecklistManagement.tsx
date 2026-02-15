// src/components/admin/checklist/ChecklistManagement.tsx

import React, { useState, useEffect } from 'react';
import { Event } from '../../../types/Event';
import { Checklist, ChecklistTask, CreateChecklistData, TASK_CATEGORIES, TASK_PRIORITIES } from '../../../types/Checklist';
import { eventService } from '../../../services/events';
import { checklistService } from '../../../services/checklist';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { EmptyState } from '../../common/EmptyState';
import styles from './ChecklistManagement.module.css';

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

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        if (selectedEventId) {
            loadChecklist(selectedEventId);
        }
    }, [selectedEventId]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const eventsData = await eventService.getAllEvents();
            setEvents(eventsData);
            
            if (eventsData.length > 0) {
                setSelectedEventId(eventsData[0].id);
            }
        } catch (error) {
            console.error('Erro ao carregar eventos:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadChecklist = async (eventId: number) => {
        try {
            setLoading(true);
            const data = await checklistService.getChecklistByEventId(eventId);
            setChecklist(data);
        } catch (error) {
            console.error('Erro ao carregar checklist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateChecklist = async (data: CreateChecklistData) => {
        try {
            await checklistService.createChecklist(data);
            if (selectedEventId) {
                await loadChecklist(selectedEventId);
            }
            setShowCreateModal(false);
        } catch (error) {
            console.error('Erro ao criar checklist:', error);
        }
    };

    const handleUpdateTaskStatus = async (taskId: number, status: ChecklistTask['status']) => {
        try {
            await checklistService.updateTaskStatus(taskId, { status });
            
            // Atualizar lista local
            if (checklist) {
                const updatedTasks = checklist.tasks.map(task => 
                    task.id === taskId ? { ...task, status } : task
                );
                setChecklist({ ...checklist, tasks: updatedTasks });
            }
        } catch (error) {
            console.error('Erro ao atualizar tarefa:', error);
        }
    };

    const handleAddTask = async (taskData: any) => {
        if (!checklist) return;
        
        try {
            const newTask = await checklistService.addTask(checklist.id, taskData);
            setChecklist({
                ...checklist,
                tasks: [...checklist.tasks, newTask]
            });
            setShowTaskModal(false);
        } catch (error) {
            console.error('Erro ao adicionar tarefa:', error);
        }
    };

    const handleUpdateTask = async (taskId: number, data: any) => {
        try {
            const updatedTask = await checklistService.updateTask(taskId, data);
            
            if (checklist) {
                const updatedTasks = checklist.tasks.map(task => 
                    task.id === taskId ? updatedTask : task
                );
                setChecklist({ ...checklist, tasks: updatedTasks });
            }
            setEditingTask(null);
        } catch (error) {
            console.error('Erro ao atualizar tarefa:', error);
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return;
        
        try {
            await checklistService.deleteTask(taskId);
            
            if (checklist) {
                const updatedTasks = checklist.tasks.filter(task => task.id !== taskId);
                setChecklist({ ...checklist, tasks: updatedTasks });
            }
        } catch (error) {
            console.error('Erro ao excluir tarefa:', error);
        }
    };

    const getFilteredTasks = (): ChecklistTask[] => {
        if (!checklist) return [];
        
        return checklist.tasks
            .filter(task => {
                if (filterStatus !== 'ALL' && task.status !== filterStatus) return false;
                if (filterCategory !== 'ALL' && task.category !== filterCategory) return false;
                if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
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

    if (loading && !checklist) {
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
                            <span className={styles.buttonIcon}>➕</span>
                            Criar Checklist
                        </button>
                    )}
                </div>
            </div>

            {!selectedEventId ? (
                <EmptyState
                    icon="📋"
                    title="Nenhum evento selecionado"
                    description="Selecione um evento para visualizar ou criar um checklist."
                />
            ) : !checklist ? (
                <EmptyState
                    icon="📝"
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
                            <span className={styles.buttonIcon}>➕</span>
                            Nova Tarefa
                        </button>
                    </div>

                    {/* Lista de Tarefas */}
                    <div className={styles.tasksContainer}>
                        {filteredTasks.length === 0 ? (
                            <EmptyState
                                icon="📭"
                                title="Nenhuma tarefa encontrada"
                                description="Tente ajustar os filtros ou criar uma nova tarefa."
                            />
                        ) : (
                            <div className={styles.tasksList}>
                                {filteredTasks.map(task => (
                                    <div key={task.id} className={styles.taskCard}>
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
                                                    {task.priority}
                                                </span>
                                            </div>

                                            {task.description && (
                                                <p className={styles.taskDescription}>{task.description}</p>
                                            )}

                                            <div className={styles.taskMeta}>
                                                {task.category && (
                                                    <span className={styles.taskCategory}>
                                                        <span className={styles.metaIcon}>📋</span>
                                                        {task.category}
                                                    </span>
                                                )}
                                                {task.responsible && (
                                                    <span className={styles.taskResponsible}>
                                                        <span className={styles.metaIcon}>👤</span>
                                                        {task.responsible}
                                                    </span>
                                                )}
                                                {task.dueDate && (
                                                    <span className={styles.taskDueDate}>
                                                        <span className={styles.metaIcon}>📅</span>
                                                        {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                                    </span>
                                                )}
                                            </div>

                                            {task.status === 'COMPLETED' && task.completedAt && (
                                                <div className={styles.completedInfo}>
                                                    <span className={styles.completedIcon}>✅</span>
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
                                                ✏️
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.deleteButton}`}
                                                onClick={() => handleDeleteTask(task.id)}
                                                title="Excluir tarefa"
                                            >
                                                🗑️
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
            await onSubmit({
                title,
                description,
                eventId,
                eventType,
                tasks: [] // Será preenchido pelo backend se useDefault=true
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
                    <button className={styles.closeButton} onClick={onClose}>×</button>
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
                        <button type="button" className={styles.cancelButton} onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className={styles.submitButton} disabled={loading}>
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
                    <button className={styles.closeButton} onClick={onClose}>×</button>
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
                        <button type="button" className={styles.cancelButton} onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className={styles.submitButton}>
                            {task ? 'Atualizar' : 'Adicionar'} Tarefa
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChecklistManagement;