import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Event } from '../../../types/Event';
import { Checklist, ChecklistTask, CreateChecklistData, TASK_CATEGORIES, TASK_PRIORITIES } from '../../../types/Checklist';
import { eventService } from '../../../services/events';
import { checklistService } from '../../../services/checklist';
import { LoadingSpinner } from '../../common/Loading/LoadingSpinner';
import { EmptyState } from '../../common/EmptyState/EmptyState';
import { ConfirmationModal } from '../../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../../common/Alerts/ErrorModal';
import { 
  FiX, FiSave, FiPlus, FiEdit2, FiTrash2, FiCalendar, FiCheckCircle, 
  FiSearch, FiFilter, FiClock, FiList, FiTarget, FiUser, FiTag
} from 'react-icons/fi';
import { MdEvent, MdChecklist, MdSearch } from 'react-icons/md';
import styles from './ChecklistManagement.module.css';

export const ChecklistManagement: React.FC = () => {
  // ✅ Flags de visibilidade
  const [isVisible, setIsVisible] = useState(false);
  const hasLoadedRef = useRef(false);
  
  // Estados de dados
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  
  // Estados de UI
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<ChecklistTask | null>(null);
  const [eventSearchTerm, setEventSearchTerm] = useState('');
  
  // Estados de filtros
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');

  // Estados de modais
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);

  // ✅ Visibilidade
  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

  // ✅ Carregar eventos
  const loadEvents = useCallback(async () => {
    if (!isVisible || hasLoadedRef.current) return;
    
    try {
      setEventsLoading(true);
      const data = await eventService.getAllEvents();
      setEvents(data);
      hasLoadedRef.current = true;
    } catch (error) {
      console.warn('API de eventos falhou:', error);
      setEvents([]);
      hasLoadedRef.current = true;
    } finally {
      setEventsLoading(false);
      setLoading(false);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && !hasLoadedRef.current) {
      loadEvents();
    }
  }, [isVisible, loadEvents]);

  // ✅ Carregar checklist
  const loadChecklist = useCallback(async (eventId: number) => {
    try {
      setLoading(true);
      const data = await checklistService.getChecklistByEventId(eventId);
      setChecklist(data);
    } catch (error) {
      setChecklist(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadChecklist(selectedEvent.id);
    } else {
      setChecklist(null);
    }
  }, [selectedEvent, loadChecklist]);

  // ✅ Eventos filtrados
  const filteredEvents = useMemo(() => {
    if (!eventSearchTerm) return events;
    return events.filter(event =>
      event.title.toLowerCase().includes(eventSearchTerm.toLowerCase()) ||
      event.client?.name?.toLowerCase().includes(eventSearchTerm.toLowerCase())
    );
  }, [events, eventSearchTerm]);

  // ✅ Agrupar eventos por mês
  const groupedEvents = useMemo(() => {
    const groups: Record<string, Event[]> = {};
    filteredEvents.forEach(event => {
      const date = new Date(event.eventDate);
      const monthYear = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(event);
    });
    return groups;
  }, [filteredEvents]);

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowEventSelector(false);
    setEventSearchTerm('');
  };

  const handleCreateChecklist = async (data: CreateChecklistData) => {
    try {
      setLoading(true);
      const newChecklist = await checklistService.createChecklist(data);
      setChecklist(newChecklist);
      setShowCreateModal(false);
      setSuccessMessage('Checklist criado com sucesso!');
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMessage('Não foi possível criar o checklist.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, status: ChecklistTask['status']) => {
    if (!checklist) return;
    
    try {
      const updatedData = {
        status,
        completedAt: status === 'COMPLETED' ? new Date().toISOString() : undefined,
      };
      const updatedChecklist = await checklistService.updateTask(checklist.id, taskId, updatedData);
      setChecklist(updatedChecklist);
    } catch (error) {
      setErrorMessage('Erro ao atualizar status.');
      setShowErrorModal(true);
    }
  };

  const handleAddTask = async (taskData: any) => {
    if (!checklist) return;
    
    try {
      setLoading(true);
      const updatedChecklist = await checklistService.addTask(checklist.id, {
        ...taskData,
        status: 'PENDING'
      });
      setChecklist(updatedChecklist);
      setShowTaskModal(false);
      setSuccessMessage('Tarefa adicionada!');
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMessage('Erro ao adicionar tarefa.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskId: number, data: any) => {
    if (!checklist) return;
    
    try {
      setLoading(true);
      const updatedChecklist = await checklistService.updateTask(checklist.id, taskId, data);
      setChecklist(updatedChecklist);
      setEditingTask(null);
      setSuccessMessage('Tarefa atualizada!');
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMessage('Erro ao atualizar tarefa.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteTask = async () => {
    if (!checklist || !taskToDelete) return;
    
    try {
      setLoading(true);
      const updatedChecklist = await checklistService.deleteTask(checklist.id, taskToDelete);
      setChecklist(updatedChecklist);
      setSuccessMessage('Tarefa excluída!');
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMessage('Erro ao excluir tarefa.');
      setShowErrorModal(true);
    } finally {
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      LOW: 'var(--gray-500)',
      MEDIUM: 'var(--primary-500)',
      HIGH: 'var(--warning-500)',
      URGENT: 'var(--error-500)'
    };
    return colors[priority] || 'var(--gray-500)';
  };

  const getPriorityLabel = (priority: string): string => {
    const labels: Record<string, string> = {
      LOW: 'Baixa',
      MEDIUM: 'Média',
      HIGH: 'Alta',
      URGENT: 'Urgente'
    };
    return labels[priority] || priority;
  };

  // ✅ Tarefas filtradas
  const filteredTasks = useMemo(() => {
    if (!checklist?.tasks) return [];
    
    let tasks = [...checklist.tasks];
    
    // Tab filter
    if (activeTab === 'pending') {
      tasks = tasks.filter(t => t.status !== 'COMPLETED');
    } else if (activeTab === 'completed') {
      tasks = tasks.filter(t => t.status === 'COMPLETED');
    }
    
    // Status filter
    if (filterStatus !== 'ALL') {
      tasks = tasks.filter(t => t.status === filterStatus);
    }
    
    // Category filter
    if (filterCategory !== 'ALL') {
      tasks = tasks.filter(t => t.category === filterCategory);
    }
    
    // Search
    if (searchTerm) {
      tasks = tasks.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [checklist, activeTab, filterStatus, filterCategory, searchTerm]);

  // ✅ Estatísticas
  const stats = useMemo(() => {
    if (!checklist?.tasks) return { total: 0, completed: 0, pending: 0, progress: 0 };
    const total = checklist.tasks.length;
    const completed = checklist.tasks.filter(t => t.status === 'COMPLETED').length;
    const pending = total - completed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, progress };
  }, [checklist]);

  // ✅ Loading
  if (!isVisible || (loading && !hasLoadedRef.current)) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Carregando..." />
      </div>
    );
  }

  // ✅ Tela de seleção de evento (quando nenhum está selecionado)
  if (!selectedEvent) {
    return (
      <div className={styles.container}>
        <div className={styles.eventSelectorContainer}>
          <div className={styles.eventSelectorCard}>
            <div className={styles.eventSelectorIcon}>
              <MdChecklist size={48} />
            </div>
            <h1 className={styles.eventSelectorTitle}>Checklists de Eventos</h1>
            <p className={styles.eventSelectorDescription}>
              Selecione um evento para gerenciar seu checklist
            </p>

            <div className={styles.eventSelectorSearch}>
              <MdSearch size={20} />
              <input
                type="text"
                placeholder="Buscar evento por nome ou cliente..."
                value={eventSearchTerm}
                onChange={(e) => setEventSearchTerm(e.target.value)}
                className={styles.eventSelectorInput}
              />
            </div>

            <div className={styles.eventSelectorList}>
              {eventsLoading ? (
                <div className={styles.eventSelectorLoading}>
                  <LoadingSpinner text="Carregando eventos..." />
                </div>
              ) : Object.keys(groupedEvents).length === 0 ? (
                <div className={styles.eventSelectorEmpty}>
                  <MdEvent size={32} />
                  <p>Nenhum evento encontrado</p>
                </div>
              ) : (
                Object.entries(groupedEvents).map(([month, monthEvents]) => (
                  <div key={month} className={styles.eventGroup}>
                    <h3 className={styles.eventGroupTitle}>{month}</h3>
                    <div className={styles.eventGroupList}>
                      {monthEvents.map(event => (
                        <button
                          key={event.id}
                          className={styles.eventItem}
                          onClick={() => handleSelectEvent(event)}
                        >
                          <div className={styles.eventItemIcon}>
                            <MdEvent size={20} />
                          </div>
                          <div className={styles.eventItemInfo}>
                            <span className={styles.eventItemTitle}>{event.title}</span>
                            <span className={styles.eventItemMeta}>
                              {new Date(event.eventDate).toLocaleDateString('pt-BR')}
                              {event.client?.name && ` • ${event.client.name}`}
                            </span>
                          </div>
                          <span className={`${styles.eventItemStatus} ${styles[event.status?.toLowerCase() || 'confirmed']}`}>
                            {event.status === 'CONFIRMED' ? 'Confirmado' : 
                             event.status === 'QUOTE' ? 'Orçamento' : 
                             event.status === 'COMPLETED' ? 'Concluído' : event.status}
                          </span>
                          <FiChevronRight className={styles.eventItemArrow} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Tela de checklist (quando evento selecionado)
  return (
    <div className={styles.container}>
      {/* Header com Evento Selecionado */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            className={styles.backButton}
            onClick={() => setSelectedEvent(null)}
          >
            ← Voltar
          </button>
          <div className={styles.eventBadge}>
            <MdEvent size={16} />
            <span>{selectedEvent.title}</span>
          </div>
        </div>

        <div className={styles.headerActions}>
          {!checklist ? (
            <button 
              className={styles.primaryButton}
              onClick={() => setShowCreateModal(true)}
            >
              <FiPlus size={18} />
              Criar Checklist
            </button>
          ) : (
            <button 
              className={styles.primaryButton}
              onClick={() => setShowTaskModal(true)}
            >
              <FiPlus size={18} />
              Nova Tarefa
            </button>
          )}
        </div>
      </div>

      {!checklist ? (
        <EmptyState
          icon={<FiList size={48} />}
          title="Nenhum checklist encontrado"
          description="Este evento ainda não possui um checklist. Crie um agora mesmo!"
          action={{
            label: "Criar Checklist",
            onClick: () => setShowCreateModal(true)
          }}
        />
      ) : (
        <>
          {/* Card de Progresso */}
          <div className={styles.progressCard}>
            <div className={styles.progressInfo}>
              <h2 className={styles.checklistTitle}>{checklist.title}</h2>
              {checklist.description && (
                <p className={styles.checklistDescription}>{checklist.description}</p>
              )}
            </div>
            <div className={styles.progressStats}>
              <div className={styles.progressCircle}>
  <svg viewBox="0 0 36 36">
    {/* Círculo de fundo */}
    <path
      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
      fill="none"
      stroke="var(--border-color)"
      strokeWidth="3"
    />
    {/* Círculo de progresso - CORRIGIDO com strokeDashoffset */}
    <path
      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
      fill="none"
      stroke="var(--success-500)"
      strokeWidth="3"
      strokeDasharray="100"
      strokeDashoffset={100 - stats.progress}
      strokeLinecap="round"
    />
  </svg>
  <span className={styles.progressPercent}>{stats.progress}%</span>
</div>
              <div className={styles.progressNumbers}>
                <div className={styles.progressNumber}>
                  <span className={styles.progressNumberValue}>{stats.total}</span>
                  <span className={styles.progressNumberLabel}>Total</span>
                </div>
                <div className={styles.progressNumber}>
                  <span className={styles.progressNumberValue}>{stats.completed}</span>
                  <span className={styles.progressNumberLabel}>Concluídas</span>
                </div>
                <div className={styles.progressNumber}>
                  <span className={styles.progressNumberValue}>{stats.pending}</span>
                  <span className={styles.progressNumberLabel}>Pendentes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <FiList size={16} />
              Todas ({stats.total})
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'pending' ? styles.active : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <FiClock size={16} />
              Pendentes ({stats.pending})
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'completed' ? styles.active : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              <FiCheckCircle size={16} />
              Concluídas ({stats.completed})
            </button>
          </div>

          {/* Filtros */}
          <div className={styles.filtersBar}>
            <div className={styles.searchWrapper}>
              <FiSearch size={16} />
              <input
                type="text"
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.filterButtons}>
              <select 
                className={styles.filterSelect}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">Todos status</option>
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
          </div>

          {/* Lista de Tarefas */}
          <div className={styles.tasksContainer}>
            {filteredTasks.length === 0 ? (
              <EmptyState
                icon={<FiCheckCircle size={40} />}
                title="Nenhuma tarefa encontrada"
                description="Ajuste os filtros ou adicione uma nova tarefa."
              />
            ) : (
              <div className={styles.tasksList}>
                {filteredTasks.map(task => (
                  <div key={task.id} className={`${styles.taskCard} ${task.status === 'COMPLETED' ? styles.completed : ''}`}>
                    <button
                      className={`${styles.taskCheckButton} ${task.status === 'COMPLETED' ? styles.checked : ''}`}
                      onClick={() => handleUpdateTaskStatus(
                        task.id, 
                        task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
                      )}
                    >
                      {task.status === 'COMPLETED' && <FiCheckCircle size={20} />}
                    </button>

                    <div className={styles.taskContent}>
                      <div className={styles.taskHeader}>
                        <h3 className={styles.taskTitle}>{task.title}</h3>
                        <span 
                          className={styles.priorityBadge}
                          style={{ backgroundColor: getPriorityColor(task.priority) }}
                        >
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>

                      {task.description && (
                        <p className={styles.taskDescription}>{task.description}</p>
                      )}

                      <div className={styles.taskFooter}>
                        <div className={styles.taskTags}>
                          {task.category && (
                            <span className={styles.taskTag}>
                              <FiTag size={12} />
                              {task.category}
                            </span>
                          )}
                          {task.responsible && (
                            <span className={styles.taskTag}>
                              <FiUser size={12} />
                              {task.responsible}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className={`${styles.taskTag} ${new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' ? styles.overdue : ''}`}>
                              <FiCalendar size={12} />
                              {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.taskActions}>
                      <button
                        className={styles.actionButton}
                        onClick={() => {
                          setEditingTask(task);
                          setShowTaskModal(true);
                        }}
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={() => {
                          setTaskToDelete(task.id);
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modais */}
      {showCreateModal && selectedEvent && (
        <CreateChecklistModal
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
          eventType={selectedEvent.eventType}
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
        title="Excluir Tarefa"
        message="Tem certeza que deseja excluir esta tarefa?"
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

// Subcomponentes
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
      if (useDefault) {
        tasks = checklistService.getDefaultTasks(eventType);
      }
      await onSubmit({ title, description, eventId, eventType, tasks });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Criar Checklist</h2>
          <button className={styles.closeButton} onClick={onClose}><FiX size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Título</label>
              <input type="text" className={styles.formInput} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Descrição</label>
              <textarea className={styles.formTextarea} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={useDefault} onChange={(e) => setUseDefault(e.target.checked)} />
                Usar modelo padrão para {eventType}
              </label>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.primaryButton} disabled={loading}>
              {loading ? 'Criando...' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TaskModal: React.FC<{
  checklistId: number;
  task?: ChecklistTask | null;
  onSubmit: (data: any) => void;
  onClose: () => void;
}> = ({ task, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    category: task?.category || TASK_CATEGORIES[0],
    responsible: task?.responsible || '',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    priority: task?.priority || 'MEDIUM',
    status: task?.status || 'PENDING'
  });

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
          <button className={styles.closeButton} onClick={onClose}><FiX size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
          <div className={styles.modalBody}>
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
                <select className={styles.formSelect} value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}>
                  {TASK_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Responsável</label>
                <input type="text" className={styles.formInput} value={formData.responsible} onChange={(e) => setFormData({...formData, responsible: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Data Limite</label>
                <input type="date" className={styles.formInput} value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} />
              </div>
            </div>
            {task && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Status</label>
                <select className={styles.formSelect} value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option value="PENDING">Pendente</option>
                  <option value="IN_PROGRESS">Em andamento</option>
                  <option value="COMPLETED">Concluído</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>
            )}
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.primaryButton}><FiSave size={16} /> {task ? 'Atualizar' : 'Adicionar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Adicione FiChevronRight aos imports
import { FiChevronRight } from 'react-icons/fi';

export default ChecklistManagement;