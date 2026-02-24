import React, { useState, useEffect } from 'react';
import { Event } from '../../../types/Event';
import { Checklist, ChecklistTask, CreateChecklistData, TASK_CATEGORIES, TASK_PRIORITIES } from '../../../types/Checklist';
import { eventService } from '../../../services/events'; // Importação real
import { checklistService } from '../../../services/checklist'; // Importação real
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { EmptyState } from '../../common/EmptyState';
import { ConfirmationModal } from '../../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../../common/Alerts/ErrorModal';
import { FiX, FiSave, FiPlus, FiEdit2, FiTrash2, FiCalendar, FiCheckCircle } from 'react-icons/fi';
import { MdCategory, MdPerson } from 'react-icons/md';
import styles from './ChecklistManagement.module.css';

// Mantemos o mock de eventos apenas como fallback caso a API de eventos falhe
const FALLBACK_EVENTS: Event[] = [
  {
    id: 1,
    title: "Casamento João e Maria (MOCK)",
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
    notes: "Fallback data"
  }
];

export const ChecklistManagement: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [checklist, setChecklist] = useState<Checklist | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Modais
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState<ChecklistTask | null>(null);
    
    // Filtros
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // Feedback
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<number | null>(null);

    // Carregar eventos ao iniciar
    useEffect(() => {
        loadEvents();
    }, []);

    // Carregar checklist quando seleciona um evento
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
            // Tenta buscar da API real
            const data = await eventService.getAllEvents();
            setEvents(data);
            
            if (data.length > 0) {
                 // Seleciona o primeiro evento por padrão, se houver
                 // Opcional: remover se preferir que o usuário selecione
                 // setSelectedEventId(data[0].id);
            }
        } catch (error) {
            console.warn('API de eventos falhou, usando fallback:', error);
            setEvents(FALLBACK_EVENTS);
        } finally {
            setLoading(false);
        }
    };

    const loadChecklist = async (eventId: number) => {
        try {
            setLoading(true);
            // Integração real: Busca checklist pelo ID do evento
            const data = await checklistService.getChecklistByEventId(eventId);
            setChecklist(data);
        } catch (error) {
            console.error('Erro ao carregar checklist:', error);
            setErrorMessage('Erro ao carregar checklist do servidor.');
            setShowErrorModal(true);
            setChecklist(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateChecklist = async (data: CreateChecklistData) => {
        try {
            setLoading(true);
            // Integração real: Cria via API
            const newChecklist = await checklistService.createChecklist(data);
            
            setChecklist(newChecklist);
            setShowCreateModal(false);
            setSuccessMessage('Checklist criado e salvo com sucesso!');
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Erro ao criar checklist:', error);
            setErrorMessage('Não foi possível criar o checklist.');
            setShowErrorModal(true);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTaskStatus = async (taskId: number, status: ChecklistTask['status']) => {
        if (!checklist) return;
        
        try {
            // Integração real: Como não temos endpoint de task status, 
            // usamos o método adaptador do service que atualiza o checklist todo
            const updatedData = {
                status,
                completedAt: status === 'COMPLETED' ? new Date().toISOString() : undefined,
                completedBy: status === 'COMPLETED' ? "Usuário Atual" : undefined // Idealmente viria do Contexto de Auth
            };

            const updatedChecklist = await checklistService.updateTask(checklist.id, taskId, updatedData);
            
            setChecklist(updatedChecklist);
            
            setSuccessMessage(status === 'COMPLETED' ? 'Tarefa concluída!' : 'Status atualizado!');
            // Opcional: Não mostrar modal de sucesso para ações rápidas como checkbox
            // setShowSuccessModal(true); 
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            setErrorMessage('Erro ao salvar status da tarefa.');
            setShowErrorModal(true);
        }
    };

    const handleAddTask = async (taskData: any) => {
        if (!checklist) return;
        
        try {
            setLoading(true);
            // Integração real
            const updatedChecklist = await checklistService.addTask(checklist.id, {
                ...taskData,
                status: 'PENDING'
            });
            
            setChecklist(updatedChecklist);
            setShowTaskModal(false);
            setSuccessMessage('Tarefa adicionada com sucesso!');
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Erro ao adicionar tarefa:', error);
            setErrorMessage('Erro ao salvar nova tarefa.');
            setShowErrorModal(true);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTask = async (taskId: number, data: any) => {
        if (!checklist) return;
        
        try {
            setLoading(true);
            // Integração real
            const updatedChecklist = await checklistService.updateTask(checklist.id, taskId, data);
            
            setChecklist(updatedChecklist);
            setEditingTask(null);
            setSuccessMessage('Tarefa atualizada com sucesso!');
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Erro ao atualizar tarefa:', error);
            setErrorMessage('Erro ao salvar alterações da tarefa.');
            setShowErrorModal(true);
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteTask = async () => {
        if (!checklist || !taskToDelete) return;
        
        try {
            setLoading(true);
            // Integração real
            const updatedChecklist = await checklistService.deleteTask(checklist.id, taskToDelete);

            setChecklist(updatedChecklist);
            setSuccessMessage('Tarefa excluída com sucesso!');
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Erro ao excluir tarefa:', error);
            setErrorMessage('Erro ao excluir tarefa.');
            setShowErrorModal(true);
        } finally {
            setShowDeleteConfirm(false);
            setTaskToDelete(null);
            setLoading(false);
        }
    };

    const handleDeleteTask = (taskId: number) => {
        setTaskToDelete(taskId);
        setShowDeleteConfirm(true);
    };

    // --- Funções de UI (Filtros e Cálculos) mantidas iguais ---
    const getFilteredTasks = (): ChecklistTask[] => {
        if (!checklist || !checklist.tasks) return [];
        
        return checklist.tasks
            .filter(task => {
                if (filterStatus !== 'ALL' && task.status !== filterStatus) return false;
                if (filterCategory !== 'ALL' && task.category !== filterCategory) return false;
                if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
                    !task.description?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                return true;
            })
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    };

    const calculateProgress = (): number => {
        if (!checklist || !checklist.tasks || checklist.tasks.length === 0) return 0;
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

    const filteredTasks = getFilteredTasks();
    const progress = calculateProgress();

    // --- Renderização ---
    if (loading && !checklist && events.length === 0) {
        return <LoadingSpinner text="Carregando dados..." fullScreen />;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>Checklists de Eventos</h1>
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

                    {!checklist && selectedEventId && !loading && (
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
                    description="Selecione um evento acima para gerenciar seu checklist."
                />
            ) : !checklist && !loading ? (
                <EmptyState
                    icon={<FiCheckCircle size={48} />}
                    title="Nenhum checklist encontrado"
                    description="Este evento ainda não possui um checklist."
                    action={{
                        label: "Criar Checklist",
                        onClick: () => setShowCreateModal(true)
                    }}
                />
            ) : checklist ? (
                <div className={styles.checklistContainer}>
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
                        </div>
                    </div>

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

                    <div className={styles.tasksContainer}>
                        {filteredTasks.length === 0 ? (
                            <EmptyState
                                icon={<FiCheckCircle size={48} />}
                                title="Nenhuma tarefa encontrada"
                                description="Ajuste os filtros ou crie uma nova tarefa."
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
            ) : null}

            {/* Modais auxiliares */}
            {showCreateModal && selectedEventId && (
                <CreateChecklistModal
                    eventId={selectedEventId}
                    eventTitle={events.find(e => e.id === selectedEventId)?.title || ''}
                    eventType={events.find(e => e.id === selectedEventId)?.eventType || ''}
                    onSubmit={handleCreateChecklist}
                    onClose={() => setShowCreateModal(false)}
                />
            )}

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
                message="Tem certeza que deseja excluir esta tarefa? Esta ação será salva automaticamente."
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

// --- Subcomponentes (CreateChecklistModal e TaskModal) ---
// Precisamos atualizar o CreateChecklistModal para usar o service.getDefaultTasks
// em vez de hardcoded, se possível, ou manter a lógica atual.

const CreateChecklistModal: React.FC<{
    eventId: number;
    eventTitle: string;
    eventType: string;
    onSubmit: (data: CreateChecklistData) => void;
    onClose: () => void;
}> = ({ eventId, eventTitle, eventType, onSubmit, onClose }) => {
    const [title, setTitle] = useState(`Checklist - ${eventTitle}`);
    const [description, setDescription] = useState('');
    const [useDefault, setUseDefault] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let tasks = [];
            // Usa o service para pegar tarefas padrão
            if (useDefault) {
                tasks = checklistService.getDefaultTasks(eventType);
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
                            Usar modelo padrão para {eventType}
                        </label>
                    </div>
                    <div className={styles.modalActions}>
                        <button type="button" className={styles.secondaryButton} onClick={onClose}>Cancelar</button>
                        <button type="submit" className={styles.primaryButton} disabled={loading}>
                            {loading ? 'Criando...' : 'Criar Checklist'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// TaskModal permanece idêntico ao original, pois é apenas um formulário
// que devolve dados para o componente pai.
const TaskModal: React.FC<{
    checklistId: number;
    task?: ChecklistTask | null;
    onSubmit: (data: any) => void;
    onClose: () => void;
}> = ({ checklistId, task, onSubmit, onClose }) => {
    // ... Código do TaskModal idêntico ao original ...
    // Vou omitir aqui para economizar espaço, mas deve ser mantido
    // igual ao código original fornecido.
    
    // Replique o código do TaskModal original aqui
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
                    <h2 className={styles.modalTitle}>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
                    <button className={styles.closeButton} onClick={onClose}><FiX size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.modalForm}>
                     <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Título *</label>
                        <input type="text" className={styles.formInput} value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Descrição</label>
                        <textarea className={styles.formTextarea} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} />
                    </div>
                    <div className={styles.formRow}>
                         <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Categoria</label>
                            <select className={styles.formSelect} value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                                {TASK_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Prioridade</label>
                            <select className={styles.formSelect} value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value as any})}>
                                {TASK_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                    </div>
                     <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Responsável</label>
                            <input type="text" className={styles.formInput} value={formData.responsible} onChange={(e) => setFormData({...formData, responsible: e.target.value})} placeholder="Nome" />
                        </div>
                         <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Data Limite</label>
                            <input type="date" className={styles.formInput} value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} />
                        </div>
                    </div>
                     {task && (
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Status</label>
                            <select className={styles.formSelect} value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})}>
                                <option value="PENDING">Pendente</option>
                                <option value="IN_PROGRESS">Em andamento</option>
                                <option value="COMPLETED">Concluído</option>
                                <option value="CANCELLED">Cancelado</option>
                            </select>
                        </div>
                    )}
                    <div className={styles.modalActions}>
                        <button type="button" className={styles.secondaryButton} onClick={onClose}>Cancelar</button>
                        <button type="submit" className={styles.primaryButton}><FiSave size={16} /> {task ? 'Atualizar' : 'Adicionar'} Tarefa</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChecklistManagement;