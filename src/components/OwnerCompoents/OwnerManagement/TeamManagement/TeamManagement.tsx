// src/components/DeveloperCompents/TeamManagement/TeamManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiSearch,  
  FiFilter,
  FiX,
  FiUsers,
  FiUserPlus,
  FiEdit2,
  FiTrash2,
  FiPower,
  FiUser
} from 'react-icons/fi';
import { 
  MdPeople, 
  MdPersonAdd,
  MdEdit,
  MdDelete,
  MdPowerSettingsNew
} from 'react-icons/md';
import { teamService, CreateMemberDTO, UpdateMemberDTO } from '../../../../services/teamService';
import { User } from '../../../../types/developer';
import { LoadingSpinner } from '../../../common/Loading/LoadingSpinner';
import { EmptyState } from '../../../common/EmptyState/EmptyState';
import { ConfirmationModal } from '../../../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../../../common/Alerts/ErrorModal';
import styles from './TeamManagement.module.css';

interface TeamManagementProps {
  organizationId: number;
}

interface Filters {
  name: string;
  email: string;
  cpf: string;
  role: string;
  status: string;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ organizationId }) => {
  // Estados principais
  const [members, setMembers] = useState<User[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  
  // Estados para o modal de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estados para modal de ativação/desativação
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [memberToToggle, setMemberToToggle] = useState<User | null>(null);
  const [statusAction, setStatusAction] = useState<'activate' | 'deactivate'>('activate');
  const [isToggling, setIsToggling] = useState(false);
  
  // Estados para modal de sucesso
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successType, setSuccessType] = useState<'create' | 'update' | 'delete' | 'status'>('create');
  
  // Estados para modal de erro
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Estados para formulário
  const [formData, setFormData] = useState<CreateMemberDTO>({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    role: 'MANAGER',
    password: ''
  });
  
  // Filtros
  const [filters, setFilters] = useState<Filters>({
    name: '',
    email: '',
    cpf: '',
    role: '',
    status: ''
  });

  // Roles disponíveis
  const roles = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'DIRECTOR', label: 'Diretor' },
    { value: 'MANAGER', label: 'Gerente' },
    { value: 'ANALYST', label: 'Analista' }
  ];

  // Status disponíveis
  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'ACTIVE', label: 'Ativo' },
    { value: 'INACTIVE', label: 'Inativo' }
  ];

  // Carregar membros
  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await teamService.getTeamMembers();
      setMembers(data);
      setFilteredMembers(data);
      console.log('✅ Membros carregados:', data.length);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      setErrorMessage('Erro ao carregar membros da equipe. Tente novamente.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [filters, members]);

  const applyFilters = useCallback(() => {
    let result = [...members];

    if (filters.name) {
      result = result.filter(member => 
        member.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.email) {
      result = result.filter(member => 
        member.email?.toLowerCase().includes(filters.email.toLowerCase())
      );
    }

    if (filters.cpf) {
      const cpfClean = filters.cpf.replace(/\D/g, '');
      result = result.filter(member => 
        member.cpf.includes(cpfClean)
      );
    }

    if (filters.role) {
      result = result.filter(member => member.role === filters.role);
    }

    if (filters.status) {
      result = result.filter(member => member.status === filters.status);
    }

    setFilteredMembers(result);
  }, [filters, members]);

  // Handlers de filtro
  const handleFilterChange = useCallback((field: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      name: '',
      email: '',
      cpf: '',
      role: '',
      status: ''
    });
  }, []);

  // Handlers de membro
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setErrorMessage('Nome é obrigatório');
      setShowError(true);
      return;
    }
    
    if (!formData.email.trim()) {
      setErrorMessage('E-mail é obrigatório');
      setShowError(true);
      return;
    }
    
    if (!teamService.validateEmail(formData.email)) {
      setErrorMessage('E-mail inválido');
      setShowError(true);
      return;
    }
    
    if (!formData.cpf.trim()) {
      setErrorMessage('CPF é obrigatório');
      setShowError(true);
      return;
    }
    
    if (!teamService.validateCPF(formData.cpf)) {
      setErrorMessage('CPF inválido');
      setShowError(true);
      return;
    }
    
    if (!formData.password || formData.password.length < 6) {
      setErrorMessage('Senha deve ter no mínimo 6 caracteres');
      setShowError(true);
      return;
    }
    
    try {
      await teamService.createTeamMember(formData);
      await loadMembers();
      setSuccessMessage('Membro criado com sucesso!');
      setSuccessType('create');
      setShowSuccessModal(true);
      setShowForm(false);
      resetForm();
    } catch (error: any) {
      console.error('Erro ao criar membro:', error);
      
      let message = 'Erro ao criar membro. Tente novamente.';
      if (error.message) {
        message = error.message;
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      setErrorMessage(message);
      setShowError(true);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMember || !editingMember.id) {
      setErrorMessage('Membro não encontrado');
      setShowError(true);
      return;
    }
    
    if (!formData.name.trim()) {
      setErrorMessage('Nome é obrigatório');
      setShowError(true);
      return;
    }
    
    if (!formData.email.trim()) {
      setErrorMessage('E-mail é obrigatório');
      setShowError(true);
      return;
    }
    
    if (!teamService.validateEmail(formData.email)) {
      setErrorMessage('E-mail inválido');
      setShowError(true);
      return;
    }
    
    try {
      const updateData: UpdateMemberDTO = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role
      };
      
      await teamService.updateTeamMember(editingMember.id, updateData);
      await loadMembers();
      setSuccessMessage('Membro atualizado com sucesso!');
      setSuccessType('update');
      setShowSuccessModal(true);
      setEditingMember(null);
      setShowForm(false);
    } catch (error: any) {
      console.error('Erro ao atualizar membro:', error);
      
      let message = 'Erro ao atualizar membro. Tente novamente.';
      if (error.message) {
        message = error.message;
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      setErrorMessage(message);
      setShowError(true);
    }
  };

  // Função para abrir modal de exclusão
  const openDeleteModal = (member: User) => {
    if (!member || !member.id) {
      setErrorMessage('Membro inválido');
      setShowError(true);
      return;
    }
    
    setMemberToDelete(member);
    setShowDeleteModal(true);
  };

  // Função para excluir membro
  const handleDeleteMember = async () => {
    if (!memberToDelete || !memberToDelete.id) {
      setErrorMessage('Membro não encontrado');
      setShowError(true);
      return;
    }
    
    setIsDeleting(true);
    
    try {
      await teamService.deleteTeamMember(memberToDelete.id);
      await loadMembers();
      
      setShowDeleteModal(false);
      setSuccessMessage(`Membro ${memberToDelete.name} removido com sucesso!`);
      setSuccessType('delete');
      setShowSuccessModal(true);
      
    } catch (error: any) {
      console.error('Erro ao excluir membro:', error);
      
      let message = 'Erro ao excluir membro. Tente novamente.';
      if (error.message) {
        message = error.message;
      }
      
      setErrorMessage(message);
      setShowError(true);
    } finally {
      setIsDeleting(false);
    }
  };

  // Função para abrir modal de ativação/desativação
  const openStatusModal = (member: User) => {
    if (!member || !member.id) {
      setErrorMessage('Membro inválido');
      setShowError(true);
      return;
    }
    
    setMemberToToggle(member);
    setStatusAction(member.status === 'ACTIVE' ? 'deactivate' : 'activate');
    setShowStatusModal(true);
  };

  // Função para alterar status
  const handleToggleStatus = async () => {
    if (!memberToToggle || !memberToToggle.id) {
      setErrorMessage('Membro não encontrado');
      setShowError(true);
      return;
    }
    
    const newStatus = memberToToggle.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    setIsToggling(true);
    
    try {
      await teamService.updateMemberStatus(memberToToggle.id, newStatus);
      await loadMembers();
      
      setShowStatusModal(false);
      setSuccessMessage(`Membro ${newStatus === 'ACTIVE' ? 'ativado' : 'desativado'} com sucesso!`);
      setSuccessType('status');
      setShowSuccessModal(true);
      
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      
      let message = 'Erro ao alterar status do membro. Tente novamente.';
      if (error.message) {
        message = error.message;
      }
      
      setErrorMessage(message);
      setShowError(true);
    } finally {
      setIsToggling(false);
    }
  };

  const handleEditMember = (member: User) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      cpf: member.cpf,
      phone: member.phone || '',
      role: member.role,
      password: ''
    });
    setShowForm(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    if (successType === 'delete') {
      setMemberToDelete(null);
    }
    if (successType === 'status') {
      setMemberToToggle(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      cpf: '',
      phone: '',
      role: 'MANAGER',
      password: ''
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return cleaned.replace(/^(\d{3})(\d)/, '$1.$2');
    if (cleaned.length <= 9) return cleaned.replace(/^(\d{3})(\d{3})(\d)/, '$1.$2.$3');
    return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 6) return cleaned.replace(/^(\d{2})(\d)/, '($1) $2');
    if (cleaned.length <= 10) return cleaned.replace(/^(\d{2})(\d{4})(\d)/, '($1) $2-$3');
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData(prev => ({ ...prev, cpf: formatted }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  // Estatísticas
  const activeCount = members.filter(m => m.status === 'ACTIVE').length;
  const inactiveCount = members.filter(m => m.status !== 'ACTIVE').length;

  if (loading) {
    return <LoadingSpinner text="Carregando membros da equipe..." fullScreen />;
  }

  const hasActiveFilters = Object.values(filters).some(v => v.trim() !== '');
  const showEmptyState = filteredMembers.length === 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <MdPeople size={28} />
            Gestão de Equipe
          </h1>
          {!showEmptyState && (
            <span className={styles.clientCount}>
              <FiUsers size={14} />
              {filteredMembers.length} {filteredMembers.length === 1 ? 'membro' : 'membros'}
            </span>
          )}
        </div>
        
        <div className={styles.headerActions}>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`${styles.filterToggle} ${showFilters ? styles.active : ''}`}
            aria-label="Alternar filtros"
          >
            <FiFilter size={18} />
            <span className={styles.filterToggleText}>
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </span>
          </button>
          
          <button 
            onClick={() => {
              setEditingMember(null);
              resetForm();
              setShowForm(true);
            }}
            className={styles.primaryButton}
          >
            <FiUserPlus size={18} />
            <span>Novo Membro</span>
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#00B4D8' }}>
            <FiUsers size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{members.length}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#10b981' }}>
            <FiPower size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{activeCount}</span>
            <span className={styles.statLabel}>Ativos</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#ef4444' }}>
            <FiX size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{inactiveCount}</span>
            <span className={styles.statLabel}>Inativos</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={filters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar por e-mail..."
              value={filters.email}
              onChange={(e) => handleFilterChange('email', e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar por CPF..."
              value={filters.cpf}
              onChange={(e) => handleFilterChange('cpf', e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">Todas as funções</option>
              {roles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={styles.filterSelect}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Formulário de Criação/Edição */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={() => {
          setShowForm(false);
          setEditingMember(null);
          resetForm();
        }}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                <FiUserPlus size={20} />
                {editingMember ? 'Editar Membro' : 'Novo Membro'}
              </h3>
              <button className={styles.closeButton} onClick={() => {
                setShowForm(false);
                setEditingMember(null);
                resetForm();
              }}>
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={editingMember ? handleUpdateMember : handleCreateMember} className={styles.modalForm}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Nome Completo *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Digite o nome completo"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>E-mail *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="email@empresa.com"
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>CPF *</label>
                    <input
                      type="text"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleCPFChange}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      disabled={!!editingMember}
                      required={!editingMember}
                    />
                    {editingMember && (
                      <small className={styles.formHint}>CPF não pode ser alterado</small>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Telefone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Função *</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleFormChange}
                      required
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>

                  {!editingMember && (
                    <div className={styles.formGroup}>
                      <label>Senha *</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleFormChange}
                        placeholder="Mínimo 6 caracteres"
                        required
                      />
                      <small className={styles.formHint}>Mínimo 6 caracteres</small>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowForm(false);
                    setEditingMember(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.saveButton}>
                  {editingMember ? 'Salvar Alterações' : 'Criar Membro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {showDeleteModal && memberToDelete && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ color: '#ef4444' }}>
                <FiTrash2 size={20} />
                Confirmar Exclusão
              </h3>
              <button className={styles.closeButton} onClick={() => setShowDeleteModal(false)}>
                <FiX size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Tem certeza que deseja excluir o membro <strong>{memberToDelete.name}</strong>?</p>
              <p style={{ color: '#ef4444', marginTop: '8px' }}>Esta ação não poderá ser desfeita.</p>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button 
                className={`${styles.saveButton} ${styles.dangerButton}`}
                onClick={handleDeleteMember}
                disabled={isDeleting}
                style={{ background: '#ef4444' }}
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ativação/Desativação */}
      {showStatusModal && memberToToggle && (
        <div className={styles.modalOverlay} onClick={() => setShowStatusModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ color: statusAction === 'activate' ? '#10b981' : '#f59e0b' }}>
                <FiPower size={20} />
                {statusAction === 'activate' ? 'Ativar Membro' : 'Desativar Membro'}
              </h3>
              <button className={styles.closeButton} onClick={() => setShowStatusModal(false)}>
                <FiX size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>
                Tem certeza que deseja {statusAction === 'activate' ? 'ativar' : 'desativar'} o membro 
                <strong> {memberToToggle.name}</strong>?
              </p>
              {statusAction === 'deactivate' && (
                <p style={{ color: '#f59e0b', marginTop: '8px' }}>
                  O membro não poderá acessar o sistema enquanto estiver desativado.
                </p>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowStatusModal(false)}
                disabled={isToggling}
              >
                Cancelar
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleToggleStatus}
                disabled={isToggling}
                style={{ background: statusAction === 'activate' ? '#10b981' : '#f59e0b' }}
              >
                {isToggling ? 'Processando...' : (statusAction === 'activate' ? 'Sim, Ativar' : 'Sim, Desativar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Sucesso */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        title="Sucesso!"
        message={successMessage}
        type="success"
        onConfirm={handleSuccessClose}
        onCancel={handleSuccessClose}
        confirmText="OK"
      />

      {/* Modal de Erro */}
      <ErrorModal
        isOpen={showError}
        message={errorMessage}
        onClose={() => setShowError(false)}
      />

      {/* Tabela ou Empty State */}
      {showEmptyState ? (
        <div className={styles.emptyStateWrapper}>
          <EmptyState
            icon={hasActiveFilters ? <FiSearch size={48} /> : <MdPeople size={48} />}
            title={hasActiveFilters 
              ? 'Nenhum membro encontrado' 
              : 'Nenhum membro cadastrado'
            }
            description={hasActiveFilters
              ? 'Tente ajustar os filtros de busca para encontrar membros.'
              : 'Comece cadastrando o primeiro membro da sua equipe.'
            }
            action={hasActiveFilters ? {
              label: 'Limpar Filtros',
              onClick: handleClearFilters,
              icon: <FiX />
            } : {
              label: 'Cadastrar Primeiro Membro',
              onClick: () => {
                setEditingMember(null);
                resetForm();
                setShowForm(true);
              },
              icon: <FiUserPlus />
            }}
          />
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>Função</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(member => (
                <tr key={member.id}>
                  <td>
                    <div className={styles.memberName}>
                      <div className={styles.memberAvatar}>
                        <FiUser size={18} />
                      </div>
                      <span>{member.name}</span>
                    </div>
                  </td>
                  <td>{member.email}</td>
                  <td>{teamService.formatCPF(member.cpf)}</td>
                  <td>{teamService.formatPhone(member.phone) || '-'}</td>
                  <td>
                    <span 
                      className={styles.roleBadge}
                      style={{ backgroundColor: teamService.getRoleColor(member.role) }}
                    >
                      {teamService.getRoleLabel(member.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${
                      member.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive
                    }`}>
                      {member.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button 
                        className={styles.actionButton}
                        onClick={() => handleEditMember(member)}
                        title="Editar"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button 
                        className={`${styles.actionButton} ${
                          member.status === 'ACTIVE' ? styles.warningButton : styles.successButton
                        }`}
                        onClick={() => openStatusModal(member)}
                        title={member.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                      >
                        <FiPower size={16} />
                      </button>
                      <button 
                        className={`${styles.actionButton} ${styles.dangerButton}`}
                        onClick={() => openDeleteModal(member)}
                        title="Remover"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};