// src/components/OwnerCompoents/Team/TeamManagement.tsx
import React, { useState, useEffect } from 'react';
import {
  MdAdd,
  MdSearch,
  MdEdit,
  MdDelete,
  MdBlock,
  MdCheckCircle,
  MdClose,
  MdPerson,
  MdEmail,
  MdBadge,
  MdPhone,
  MdLock,
  MdInfo,
  MdRefresh,
  MdSend
} from 'react-icons/md';
import { teamService } from '../../../../services/teamService';
import { TeamMember, UserRole, UserStatus, TeamStats } from '../../../../types/team';
import { ConfirmationModal } from '../../../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../../../common/Alerts/ErrorModal';
import styles from './TeamManagement.module.css';

export const TeamManagement: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [newStatus, setNewStatus] = useState<UserStatus | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    password: '',
    role: UserRole.ANALYST
  });
  
  const [inviteData, setInviteData] = useState({
    email: '',
    role: UserRole.ANALYST,
    message: ''
  });

  const roleOptions = [
    { value: UserRole.ADMIN, label: 'Administrador', description: 'Acesso total ao sistema' },
    { value: UserRole.DIRECTOR, label: 'Diretor', description: 'Acesso a relatórios e gestão' },
    { value: UserRole.MANAGER, label: 'Gerente', description: 'Gerencia eventos e equipe' },
    { value: UserRole.ANALYST, label: 'Analista', description: 'Operacional, cria e gerencia eventos' }
  ];

  useEffect(() => {
    loadTeamData();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [members, searchTerm, roleFilter, statusFilter]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const [membersData, statsData] = await Promise.all([
        teamService.getTeamMembers(),
        teamService.getTeamStats()
      ]);
      setMembers(membersData);
      setFilteredMembers(membersData);
      setStats(statsData);
    } catch (error) {
      console.error('❌ Erro ao carregar dados da equipe:', error);
      setError('Erro ao carregar membros da equipe');
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = [...members];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.cpf.includes(term)
      );
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(m => m.role === roleFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === statusFilter);
    }
    
    setFilteredMembers(filtered);
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📝 Dados do formulário:', {
        name: formData.name,
        email: formData.email,
        cpf: formData.cpf,
        password: formData.password,
        role: formData.role,
        phone: formData.phone
      });
      
      await teamService.createTeamMember({
        name: formData.name,
        email: formData.email,
        cpf: formData.cpf.replace(/\D/g, ''),
        password: formData.password,
        role: formData.role,
        phone: formData.phone
      });
      
      await loadTeamData();
      setShowCreateModal(false);
      resetForm();
      setSuccessMessage('Membro criado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error: any) {
      console.error('❌ Erro ao criar membro:', error);
      setError(error.message || 'Erro ao criar membro');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    
    try {
      setLoading(true);
      await teamService.updateTeamMember(selectedMember.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role
      });
      
      await loadTeamData();
      setShowEditModal(false);
      setSelectedMember(null);
      resetForm();
      setSuccessMessage('Membro atualizado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error: any) {
      console.error('❌ Erro ao atualizar membro:', error);
      setError(error.message || 'Erro ao atualizar membro');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    
    try {
      setLoading(true);
      await teamService.deleteTeamMember(selectedMember.id);
      await loadTeamData();
      setShowDeleteConfirm(false);
      setSelectedMember(null);
      setSuccessMessage('Membro removido com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('❌ Erro ao remover membro:', error);
      setError('Erro ao remover membro');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedMember || !newStatus) return;
    
    try {
      setLoading(true);
      await teamService.updateMemberStatus(selectedMember.id, newStatus);
      await loadTeamData();
      setShowStatusConfirm(false);
      setSelectedMember(null);
      setNewStatus(null);
      setSuccessMessage(`Status alterado para ${newStatus === UserStatus.ACTIVE ? 'Ativo' : 'Inativo'}!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('❌ Erro ao alterar status:', error);
      setError('Erro ao alterar status do membro');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await teamService.inviteTeamMember({
        email: inviteData.email,
        role: inviteData.role,
        message: inviteData.message
      });
      
      setShowInviteModal(false);
      setInviteData({ email: '', role: UserRole.ANALYST, message: '' });
      setSuccessMessage('Convite enviado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error: any) {
      console.error('❌ Erro ao enviar convite:', error);
      setError(error.message || 'Erro ao enviar convite');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      cpf: '',
      phone: '',
      password: '',
      role: UserRole.ANALYST
    });
  };

  const openEditModal = (member: TeamMember) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      cpf: member.cpf,
      phone: member.phone || '',
      password: '',
      role: member.role
    });
    setShowEditModal(true);
  };

  const openStatusModal = (member: TeamMember, status: UserStatus) => {
    setSelectedMember(member);
    setNewStatus(status);
    setShowStatusConfirm(true);
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
    if (cleaned.length <= 7) return cleaned.replace(/^(\d{2})(\d)/, '($1) $2');
    if (cleaned.length <= 11) return cleaned.replace(/^(\d{2})(\d{5})(\d)/, '($1) $2-$3');
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  };

  const getStatusBadgeClass = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return styles.statusActive;
      case UserStatus.INACTIVE:
        return styles.statusInactive;
      case UserStatus.BLOCKED:
        return styles.statusBlocked;
      default:
        return styles.statusInactive;
    }
  };

  const getStatusLabel = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'Ativo';
      case UserStatus.INACTIVE:
        return 'Inativo';
      case UserStatus.BLOCKED:
        return 'Bloqueado';
      default:
        return status;
    }
  };

  if (loading && members.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando equipe...</p>
      </div>
    );
  }

  return (
    <div className={styles.teamManagement}>
      {successMessage && (
        <div className={styles.successMessage}>
          <MdCheckCircle size={20} />
          {successMessage}
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <MdPerson />
            Gerenciar Equipe
          </h1>
          {stats && (
            <div className={styles.statsBadges}>
              <span className={styles.statBadge}>
                Total: {stats.totalMembers}
              </span>
              <span className={`${styles.statBadge} ${styles.activeBadge}`}>
                Ativos: {stats.activeMembers}
              </span>
              <span className={`${styles.statBadge} ${styles.inactiveBadge}`}>
                Inativos: {stats.inactiveMembers}
              </span>
            </div>
          )}
        </div>

        <div className={styles.headerActions}>
          <button className={styles.primaryButton} onClick={() => setShowCreateModal(true)}>
            <MdAdd />
            Novo Funcionário
          </button>
          <button className={styles.secondaryButton} onClick={() => setShowInviteModal(true)}>
            <MdSend />
            Convidar por E-mail
          </button>
          <button className={styles.iconButton} onClick={loadTeamData} title="Atualizar">
            <MdRefresh />
          </button>
        </div>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.searchInput}>
          <MdSearch />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className={styles.clearButton}>
              <MdClose />
            </button>
          )}
        </div>

        <select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
          className={styles.filterSelect}
        >
          <option value="all">Todas as funções</option>
          {roleOptions.map(role => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
          className={styles.filterSelect}
        >
          <option value="all">Todos os status</option>
          <option value={UserStatus.ACTIVE}>Ativos</option>
          <option value={UserStatus.INACTIVE}>Inativos</option>
          <option value={UserStatus.BLOCKED}>Bloqueados</option>
        </select>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Funcionário</th>
              <th>CPF</th>
              <th>Função</th>
              <th>Status</th>
              <th>Último Acesso</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map(member => (
              <tr key={member.id}>
                <td className={styles.memberCell}>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberAvatar}>
                      <MdPerson />
                    </div>
                    <div>
                      <strong>{member.name}</strong>
                      <small>{member.email}</small>
                      {member.phone && <small>{teamService.formatPhone(member.phone)}</small>}
                    </div>
                  </div>
                </td>
                <td>{teamService.formatCPF(member.cpf)}</td>
                <td>
                  <span 
                    className={styles.roleBadge}
                    style={{ backgroundColor: teamService.getRoleColor(member.role) + '20', color: teamService.getRoleColor(member.role) }}
                  >
                    {teamService.getRoleLabel(member.role)}
                  </span>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${getStatusBadgeClass(member.status)}`}>
                    {getStatusLabel(member.status)}
                  </span>
                </td>
                <td>{member.lastAccess ? new Date(member.lastAccess).toLocaleDateString('pt-BR') : '-'}</td>
                <td>
                  <div className={styles.actionButtons}>
                    <button className={styles.actionButton} onClick={() => openEditModal(member)} title="Editar">
                      <MdEdit />
                    </button>
                    {member.status === UserStatus.ACTIVE ? (
                      <button 
                        className={`${styles.actionButton} ${styles.warningButton}`}
                        onClick={() => openStatusModal(member, UserStatus.INACTIVE)}
                        title="Desativar"
                      >
                        <MdBlock />
                      </button>
                    ) : (
                      <button 
                        className={`${styles.actionButton} ${styles.successButton}`}
                        onClick={() => openStatusModal(member, UserStatus.ACTIVE)}
                        title="Ativar"
                      >
                        <MdCheckCircle />
                      </button>
                    )}
                    <button 
                      className={`${styles.actionButton} ${styles.dangerButton}`}
                      onClick={() => {
                        setSelectedMember(member);
                        setShowDeleteConfirm(true);
                      }}
                      title="Remover"
                    >
                      <MdDelete />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredMembers.length === 0 && (
          <div className={styles.emptyState}>
            <MdPerson size={48} />
            <h3>Nenhum funcionário encontrado</h3>
            <p>
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Tente ajustar os filtros para encontrar funcionários.'
                : 'Comece cadastrando os funcionários da sua equipe.'}
            </p>
            <button className={styles.primaryButton} onClick={() => setShowCreateModal(true)}>
              <MdAdd />
              Novo Funcionário
            </button>
          </div>
        )}
      </div>

      {/* Modal de Criação */}
      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2><MdPerson /> Novo Funcionário</h2>
              <button onClick={() => setShowCreateModal(false)} className={styles.closeButton}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleCreateMember} className={styles.form}>
              <div className={styles.formGroup}>
                <label><MdPerson /> Nome Completo *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label><MdEmail /> E-mail *</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label><MdPhone /> Telefone</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: formatPhone(e.target.value)})} 
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label><MdBadge /> CPF *</label>
                  <input 
                    type="text" 
                    value={formData.cpf} 
                    onChange={(e) => setFormData({...formData, cpf: formatCPF(e.target.value)})} 
                    maxLength={14} 
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label><MdPerson /> Função *</label>
                  <select 
                    value={formData.role} 
                    onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})} 
                    required
                  >
                    {roleOptions.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label><MdLock /> Senha *</label>
                <input 
                  type="password" 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  placeholder="Mínimo 6 caracteres" 
                  required 
                  minLength={6} 
                />
                <small>A senha deverá ser alterada no primeiro acesso.</small>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowCreateModal(false)} className={styles.cancelButton}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className={styles.saveButton}>
                  {loading ? 'Criando...' : 'Criar Funcionário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {showEditModal && selectedMember && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2><MdEdit /> Editar Funcionário</h2>
              <button onClick={() => setShowEditModal(false)} className={styles.closeButton}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleUpdateMember} className={styles.form}>
              <div className={styles.formGroup}>
                <label><MdPerson /> Nome Completo *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label><MdEmail /> E-mail *</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label><MdPhone /> Telefone</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: formatPhone(e.target.value)})} 
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label><MdPerson /> Função *</label>
                <select 
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})} 
                  required
                >
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowEditModal(false)} className={styles.cancelButton}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className={styles.saveButton}>
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Convite */}
      {showInviteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2><MdSend /> Convidar por E-mail</h2>
              <button onClick={() => setShowInviteModal(false)} className={styles.closeButton}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleInviteMember} className={styles.form}>
              <div className={styles.formGroup}>
                <label><MdEmail /> E-mail *</label>
                <input 
                  type="email" 
                  value={inviteData.email} 
                  onChange={(e) => setInviteData({...inviteData, email: e.target.value})} 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label><MdPerson /> Função *</label>
                <select 
                  value={inviteData.role} 
                  onChange={(e) => setInviteData({...inviteData, role: e.target.value as UserRole})} 
                  required
                >
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label><MdInfo /> Mensagem (opcional)</label>
                <textarea 
                  value={inviteData.message} 
                  onChange={(e) => setInviteData({...inviteData, message: e.target.value})} 
                  rows={4} 
                  placeholder="Escreva uma mensagem personalizada para o convite..."
                />
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowInviteModal(false)} className={styles.cancelButton}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className={styles.saveButton}>
                  {loading ? 'Enviando...' : 'Enviar Convite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modais de Confirmação */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Remover Funcionário"
        message={`Tem certeza que deseja remover ${selectedMember?.name} da equipe?`}
        type="danger"
        onConfirm={handleDeleteMember}
        onCancel={() => { setShowDeleteConfirm(false); setSelectedMember(null); }}
        confirmText="Remover"
        cancelText="Cancelar"
      />

      <ConfirmationModal
        isOpen={showStatusConfirm}
        title={newStatus === UserStatus.ACTIVE ? "Ativar Funcionário" : "Desativar Funcionário"}
        message={newStatus === UserStatus.ACTIVE ? `Ativar ${selectedMember?.name}?` : `Desativar ${selectedMember?.name}?`}
        type={newStatus === UserStatus.ACTIVE ? "success" : "warning"}
        onConfirm={handleStatusChange}
        onCancel={() => { setShowStatusConfirm(false); setSelectedMember(null); setNewStatus(null); }}
        confirmText={newStatus === UserStatus.ACTIVE ? "Ativar" : "Desativar"}
        cancelText="Cancelar"
      />

      <ErrorModal isOpen={!!error} message={error || ''} onClose={() => setError(null)} />
    </div>
  );
};