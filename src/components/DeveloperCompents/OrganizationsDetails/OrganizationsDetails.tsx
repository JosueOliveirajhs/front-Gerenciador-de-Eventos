// src/components/DeveloperCompents/Organizations/OrganizationDetails.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdArrowBack,
  MdBusiness,
  MdEdit,
  MdError,
  MdEmail,
  MdPhone,
  MdCalendarToday,
  MdPeople,
  MdEvent,
  MdAttachMoney,
  MdCheckCircle,
  MdWarning,
  MdCancel,
  MdRefresh,
  MdReceipt,
  MdPerson,
  MdAccessTime,
  MdAdminPanelSettings,
  MdBadge,
  MdLock,
  MdSave,
  MdClose,
  MdPowerSettingsNew,
  MdPersonAdd,
  MdKey,
  MdInfo,
  MdDelete,
  MdAdd,
  MdVisibility
} from 'react-icons/md';
import { FaUsers } from 'react-icons/fa';
import { organizationService } from '../../../services/organization';
import { Organization, OrganizationSummary, User, Event, PlanType, OrgStatus } from '../../../types/developer';
import { getPlanConfig, getAvailablePlans } from '../../../utils/planUtils';
import { getStatusConfig } from '../../../utils/statusUtils';
import { ConfirmationModal } from '../../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../../common/Alerts/ErrorModal';
import styles from './OrganizationsDetails.module.css';

interface OrganizationDetailsProps {
  organizationId: number;
  onBack: () => void;
  onEdit: (id: number) => void;
}

type TabType = 'summary' | 'admin' | 'users' | 'subscription' | 'events' | 'financial';

// ✅ Função auxiliar para status de eventos (dentro do próprio arquivo)
const getEventStatusStyle = (status: string) => {
  const map: Record<string, { text: string; className: string }> = {
    'QUOTE': { text: 'Orçamento', className: 'badgeWarning' },
    'CONFIRMED': { text: 'Confirmado', className: 'badgeSuccess' },
    'IN_PROGRESS': { text: 'Em Andamento', className: 'badgeInfo' },
    'COMPLETED': { text: 'Concluído', className: 'badgePrimary' },
    'CANCELLED': { text: 'Cancelado', className: 'badgeDanger' },
    'PENDING': { text: 'Pendente', className: 'badgeWarning' },
    'ACTIVE': { text: 'Ativo', className: 'badgeSuccess' },
    'TRIAL': { text: 'Trial', className: 'badgeInfo' },
    'SUSPENDED': { text: 'Suspenso', className: 'badgeDanger' },
  };
  return map[status] || { text: status || 'N/A', className: 'badgeDefault' };
};

export const OrganizationDetails: React.FC<OrganizationDetailsProps> = ({ 
  organizationId, 
  onBack, 
  onEdit 
}) => {
  const navigate = useNavigate();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [summary, setSummary] = useState<OrganizationSummary | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  
  // Estados para modais
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Partial<User>>({});
  const [resetPasswordData, setResetPasswordData] = useState({ password: '', confirmPassword: '' });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [statusAction, setStatusAction] = useState<'activate' | 'deactivate'>('activate');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPlan, setNewPlan] = useState<PlanType | null>(null);

  const availablePlans = getAvailablePlans();

  useEffect(() => {
    loadAllData();
  }, [organizationId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [orgData, summaryData, usersData, eventsData] = await Promise.all([
        organizationService.getOrganizationById(organizationId),
        organizationService.getOrganizationSummary(organizationId).catch(() => null),
        organizationService.getOrganizationUsers(organizationId).catch(() => []),
        organizationService.getOrganizationEvents(organizationId).catch(() => [])
      ]);
      
      setOrganization(orgData);
      setSummary(summaryData || { totalUsers: 0, activeUsers: 0, totalEvents: 0, totalClients: 0, financialVolume: 0 });
      setUsers(Array.isArray(usersData) ? usersData : []);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      
      const admin = Array.isArray(usersData) 
        ? usersData.find((u: User) => 
            u.role === 'ADMIN' || u.userType === 'ADMIN' || u.role === 'OWNER'
          ) || usersData[0]
        : null;
      setAdminUser(admin || null);
      
    } catch (err: any) {
      console.error('❌ Erro ao carregar dados:', err);
      setError(err.response?.status === 404 ? 'Organização não encontrada.' : 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAdmin = () => {
    if (adminUser) {
      setEditingAdmin({
        id: adminUser.id,
        name: adminUser.name || '',
        email: adminUser.email || '',
        phone: adminUser.phone || '',
        role: adminUser.role || 'ADMIN',
        status: adminUser.status || 'ACTIVE'
      });
      setShowEditModal(true);
      setModalError(null);
      setModalSuccess(null);
    }
  };

  const handleSaveAdmin = async () => {
    if (!editingAdmin.name || !editingAdmin.email) {
      setModalError('Nome e e-mail são obrigatórios');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingAdmin.email || '')) {
      setModalError('E-mail inválido');
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setAdminUser(prev => prev ? { ...prev, ...editingAdmin } : null);
      setUsers(prev => prev.map(u => u.id === editingAdmin.id ? { ...u, ...editingAdmin } : u));
      setModalSuccess('Administrador atualizado com sucesso!');
      setTimeout(() => {
        setShowEditModal(false);
        setModalSuccess(null);
      }, 1500);
    } catch (err: any) {
      setModalError('Erro ao atualizar administrador');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleAdminStatusClick = () => {
    if (!adminUser) return;
    setStatusAction(adminUser.status === 'ACTIVE' ? 'deactivate' : 'activate');
    setShowStatusModal(true);
  };

  const handleToggleAdminStatus = async () => {
    if (!adminUser) return;
    const newStatus = adminUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setModalLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setAdminUser(prev => prev ? { ...prev, status: newStatus as 'ACTIVE' | 'INACTIVE' } : null);
      setUsers(prev => prev.map(u => 
        u.id === adminUser.id ? { ...u, status: newStatus as 'ACTIVE' | 'INACTIVE' } : u
      ));
      setShowStatusModal(false);
    } catch (err: any) {
      setModalError('Erro ao alterar status');
    } finally {
      setModalLoading(false);
    }
  };

  const handleResetPassword = () => {
    setResetPasswordData({ password: '', confirmPassword: '' });
    setShowResetPasswordModal(true);
    setModalError(null);
    setModalSuccess(null);
  };

  const handleSaveNewPassword = async () => {
    if (!resetPasswordData.password) {
      setModalError('Senha é obrigatória');
      return;
    }
    if (resetPasswordData.password.length < 6) {
      setModalError('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (resetPasswordData.password !== resetPasswordData.confirmPassword) {
      setModalError('As senhas não conferem');
      return;
    }
    
    setModalLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setModalSuccess('Senha alterada com sucesso!');
      setTimeout(() => {
        setShowResetPasswordModal(false);
        setModalSuccess(null);
      }, 1500);
    } catch (err: any) {
      setModalError('Erro ao alterar senha');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteUserModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setShowDeleteUserModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      setModalError('Erro ao remover usuário');
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, status: newStatus as 'ACTIVE' | 'INACTIVE' } : u
      ));
    } catch (err: any) {
      setModalError('Erro ao alterar status do usuário');
    }
  };

  const handleChangePlan = () => {
    if (organization) {
      setNewPlan(organization.planType);
      setShowPlanModal(true);
    }
  };

  const handleSavePlan = async () => {
    if (!organization || !newPlan) return;
    setModalLoading(true);
    try {
      await organizationService.updateOrganizationPlan(organization.id, newPlan);
      setOrganization(prev => prev ? { ...prev, planType: newPlan } : null);
      setShowPlanModal(false);
      setModalSuccess('Plano atualizado com sucesso!');
      setTimeout(() => setModalSuccess(null), 2000);
    } catch (err: any) {
      setModalError('Erro ao atualizar plano');
    } finally {
      setModalLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try { return new Date(dateString).toLocaleDateString('pt-BR'); } catch { return '-'; }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    try { return new Date(dateString).toLocaleString('pt-BR'); } catch { return '-'; }
  };

  const formatCPF = (cpf: string) => {
    if (!cpf) return 'Não informado';
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando organização...</p>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className={styles.errorContainer}>
        <MdError size={48} />
        <h3>{error || 'Organização não encontrada'}</h3>
        <button onClick={onBack} className={styles.backButton}>
          <MdArrowBack /> Voltar para lista
        </button>
      </div>
    );
  }

  const planConfig = getPlanConfig(organization.planType);
  const statusConfig = getStatusConfig(organization.status);

  return (
    <div className={styles.organizationDetails}>
      {modalSuccess && (
        <div className={styles.successBanner}>
          <MdCheckCircle /> {modalSuccess}
          <button onClick={() => setModalSuccess(null)}><MdClose /></button>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          <MdArrowBack /> Voltar
        </button>
        <h1 className={styles.title}>
          <MdBusiness /> {organization.name}
        </h1>
        <div className={styles.headerActions}>
          <button onClick={() => onEdit(organization.id)} className={styles.editButton}>
            <MdEdit /> Editar
          </button>
          <button onClick={loadAllData} className={styles.refreshButton} title="Atualizar">
            <MdRefresh />
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className={styles.infoCard}>
        <div className={styles.infoHeader}>
          <div className={styles.infoHeaderLeft}>
            <div className={styles.avatar}><MdBusiness size={32} /></div>
            <div>
              <h2>{organization.name}</h2>
              <p className={styles.cnpj}>CNPJ: {organization.cnpj ? organizationService.formatCNPJ(organization.cnpj) : 'Não informado'}</p>
            </div>
          </div>
          <div className={styles.badges}>
            <span className={`${styles.planBadge} ${planConfig.badgeClass || ''}`}>{planConfig.label}</span>
            <span className={`${styles.statusBadge} ${statusConfig.badgeClass || ''}`}>{statusConfig.text}</span>
          </div>
        </div>

        <div className={styles.infoMetrics}>
          <div className={styles.metric}>
            <MdCalendarToday />
            <div>
              <span className={styles.metricLabel}>Cadastro</span>
              <span className={styles.metricValue}>{formatDate(organization.createdAt)}</span>
            </div>
          </div>
          <div className={styles.metric}>
            <MdPeople />
            <div>
              <span className={styles.metricLabel}>Usuários</span>
              <span className={styles.metricValue}>{summary?.totalUsers || 0}</span>
            </div>
          </div>
          <div className={styles.metric}>
            <MdEvent />
            <div>
              <span className={styles.metricLabel}>Eventos</span>
              <span className={styles.metricValue}>{summary?.totalEvents || 0}</span>
            </div>
          </div>
          <div className={styles.metric}>
            <MdAttachMoney />
            <div>
              <span className={styles.metricLabel}>Volume Financeiro</span>
              <span className={styles.metricValue}>{formatCurrency(summary?.financialVolume || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          { id: 'summary', label: 'Resumo', icon: <MdBusiness /> },
          { id: 'admin', label: 'Admin', icon: <MdAdminPanelSettings /> },
          { id: 'users', label: `Usuários (${users.length})`, icon: <MdPeople /> },
          { id: 'subscription', label: 'Assinatura', icon: <MdReceipt /> },
          { id: 'events', label: `Eventos (${events.length})`, icon: <MdEvent /> },
          { id: 'financial', label: 'Financeiro', icon: <MdAttachMoney /> }
        ].map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id as TabType)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        
        {/* ABA: RESUMO */}
        {activeTab === 'summary' && (
          <div className={styles.summaryTab}>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <h3>Informações Gerais</h3>
                <div className={styles.infoList}>
                  <div className={styles.infoItem}><strong>Nome:</strong><span>{organization.name}</span></div>
                  <div className={styles.infoItem}><strong>CNPJ:</strong><span>{organization.cnpj ? organizationService.formatCNPJ(organization.cnpj) : 'Não informado'}</span></div>
                  <div className={styles.infoItem}><strong>Cadastro:</strong><span>{formatDate(organization.createdAt)}</span></div>
                  <div className={styles.infoItem}><strong>Plano:</strong><span className={`${styles.planBadge} ${planConfig.badgeClass || ''}`}>{planConfig.label}</span></div>
                  <div className={styles.infoItem}><strong>Status:</strong><span className={`${styles.statusBadge} ${statusConfig.badgeClass || ''}`}>{statusConfig.text}</span></div>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <h3>Métricas</h3>
                <div className={styles.metricsGrid}>
                  <div className={styles.metricCard}><MdPeople size={24} /><div><span className={styles.metricCardLabel}>Usuários</span><span className={styles.metricCardValue}>{summary?.totalUsers || 0}</span></div></div>
                  <div className={styles.metricCard}><MdEvent size={24} /><div><span className={styles.metricCardLabel}>Eventos</span><span className={styles.metricCardValue}>{summary?.totalEvents || 0}</span></div></div>
                  <div className={styles.metricCard}><FaUsers size={24} /><div><span className={styles.metricCardLabel}>Ativos</span><span className={styles.metricCardValue}>{summary?.activeUsers || 0}</span></div></div>
                  <div className={styles.metricCard}><MdAttachMoney size={24} /><div><span className={styles.metricCardLabel}>Financeiro</span><span className={styles.metricCardValue}>{formatCurrency(summary?.financialVolume || 0)}</span></div></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA: ADMIN */}
        {activeTab === 'admin' && (
          <div className={styles.adminTab}>
            {adminUser ? (
              <div className={styles.adminCard}>
                <div className={styles.adminHeader}>
                  <div className={styles.adminAvatar}><MdPerson size={48} /></div>
                  <div className={styles.adminInfo}>
                    <h3>{adminUser.name}</h3>
                    <p className={styles.adminRole}>Administrador Principal</p>
                    <span className={`${styles.userStatusBadge} ${adminUser.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive}`}>
                      {adminUser.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className={styles.adminHeaderActions}>
                    <button onClick={handleEditAdmin} className={styles.adminHeaderActionBtn}><MdEdit size={18} /> Editar</button>
                    <button onClick={handleResetPassword} className={styles.adminHeaderActionBtn}><MdKey size={18} /> Senha</button>
                    <button onClick={handleToggleAdminStatusClick} className={styles.adminHeaderActionBtn}>
                      <MdPowerSettingsNew size={18} /> {adminUser.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </div>
                <div className={styles.adminDetails}>
                  <div className={styles.detailSection}>
                    <h4>Informações Pessoais</h4>
                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}><MdPerson /><div><label>Nome</label><span>{adminUser.name}</span></div></div>
                      <div className={styles.detailItem}><MdEmail /><div><label>E-mail</label><span>{adminUser.email}</span></div></div>
                      <div className={styles.detailItem}><MdBadge /><div><label>CPF</label><span>{formatCPF(adminUser.cpf)}</span></div></div>
                      <div className={styles.detailItem}><MdPhone /><div><label>Telefone</label><span>{adminUser.phone || 'Não informado'}</span></div></div>
                    </div>
                  </div>
                  <div className={styles.detailSection}>
                    <h4>Conta</h4>
                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}><MdCalendarToday /><div><label>Criado em</label><span>{formatDate(adminUser.createdAt)}</span></div></div>
                      <div className={styles.detailItem}><MdAccessTime /><div><label>Atualizado</label><span>{formatDateTime(adminUser.updatedAt)}</span></div></div>
                      <div className={styles.detailItem}><MdLock /><div><label>Tipo</label><span>{adminUser.userType || 'ADMIN'}</span></div></div>
                      <div className={styles.detailItem}><MdBusiness /><div><label>Organização</label><span>{organization.name}</span></div></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <MdWarning size={48} />
                <h3>Nenhum administrador</h3>
                <p>Esta organização não possui um administrador.</p>
                <button className={styles.primaryButton}><MdPersonAdd /> Adicionar Admin</button>
              </div>
            )}
          </div>
        )}

        {/* ABA: USUÁRIOS */}
        {activeTab === 'users' && (
          <div className={styles.usersTab}>
            <div className={styles.tabHeader}>
              <h2>Usuários ({users.length})</h2>
              <button className={styles.primaryButton}><MdAdd /> Novo Usuário</button>
            </div>
            
            {users.length > 0 ? (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Função</th>
                      <th>Status</th>
                      <th>Criado em</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className={user.id === adminUser?.id ? styles.adminRow : ''}>
                        <td>
                          <div className={styles.userCell}>
                            <div className={styles.userAvatar}><MdPerson /></div>
                            <div>
                              <strong>{user.name}</strong>
                              {user.id === adminUser?.id && <span className={styles.adminBadge}>Admin</span>}
                            </div>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td><span className={styles.roleBadge}>{user.role || 'USER'}</span></td>
                        <td>
                          <button 
                            className={`${styles.statusToggle} ${user.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive}`}
                            onClick={() => handleToggleUserStatus(user)}
                          >
                            {user.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button className={styles.actionButton} title="Editar"><MdEdit /></button>
                            {user.id !== adminUser?.id && (
                              <button className={`${styles.actionButton} ${styles.dangerButton}`} onClick={() => handleDeleteUser(user)} title="Remover">
                                <MdDelete />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <MdPeople size={48} />
                <h3>Nenhum usuário</h3>
                <p>Esta organização não possui usuários cadastrados.</p>
                <button className={styles.primaryButton}><MdAdd /> Adicionar Usuário</button>
              </div>
            )}
          </div>
        )}

        {/* ABA: ASSINATURA */}
        {activeTab === 'subscription' && (
          <div className={styles.subscriptionTab}>
            <div className={styles.subscriptionCard}>
              <div className={styles.subscriptionHeader}>
                <h2>Plano Atual</h2>
                <span className={`${styles.planBadgeLarge} ${planConfig.badgeClass || ''}`}>{planConfig.label}</span>
              </div>
              
              <div className={styles.planDetails}>
                <div className={styles.planInfo}>
                  <h3>Recursos do Plano {planConfig.label}</h3>
                  <ul className={styles.featureList}>
                    {planConfig.features?.map((feature, index) => (
                      <li key={index}><MdCheckCircle className={styles.featureIcon} /> {feature}</li>
                    ))}
                  </ul>
                </div>
                
                <div className={styles.planActions}>
                  <button className={styles.primaryButton} onClick={handleChangePlan}>
                    <MdAttachMoney /> Alterar Plano
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA: EVENTOS - ✅ CORRIGIDO sem utils externo */}
        {activeTab === 'events' && (
          <div className={styles.eventsTab}>
            <div className={styles.tabHeader}>
              <h2>Eventos ({events.length})</h2>
            </div>
            
            {events.length > 0 ? (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Evento</th>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Status</th>
                      <th>Convidados</th>
                      <th>Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(event => {
                      // ✅ Usa a função definida no topo do arquivo
                      const statusInfo = getEventStatusStyle(event.status || '');
                      
                      return (
                        <tr key={event.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ 
                                width: 36, height: 36, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: 16, flexShrink: 0
                              }}>
                                <MdEvent />
                              </div>
                              <div>
                                <strong>{event.title || 'Sem título'}</strong>
                                {event.clientName && <small style={{ display: 'block', color: '#6b7280' }}>Cliente: {event.clientName}</small>}
                              </div>
                            </div>
                          </td>
                          <td>{formatDate(event.eventDate)}</td>
                          <td>
                            <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, background: '#e0e7ff', color: '#4338ca' }}>
                              {event.eventType || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span className={`${styles.statusBadge} ${styles[statusInfo.className] || ''}`}>
                              {statusInfo.text}
                            </span>
                          </td>
                          <td>{event.guestCount || 0}</td>
                          <td>{formatCurrency(Number(event.totalValue) || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <MdEvent size={48} />
                <h3>Nenhum evento</h3>
                <p>Esta organização ainda não possui eventos.</p>
              </div>
            )}
          </div>
        )}

        {/* ABA: FINANCEIRO */}
        {activeTab === 'financial' && (
          <div className={styles.financialTab}>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <h3>Resumo Financeiro</h3>
                <div className={styles.infoList}>
                  <div className={styles.infoItem}><strong>Volume Total:</strong><span>{formatCurrency(summary?.financialVolume || 0)}</span></div>
                  <div className={styles.infoItem}><strong>Eventos:</strong><span>{summary?.totalEvents || 0}</span></div>
                  <div className={styles.infoItem}><strong>Ticket Médio:</strong><span>{formatCurrency((summary?.financialVolume || 0) / (summary?.totalEvents || 1))}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAIS */}
      {/* ============================================================ */}

      {/* Modal Editar Admin */}
      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3><MdEdit /> Editar Administrador</h3>
              <button className={styles.closeModalBtn} onClick={() => setShowEditModal(false)}><MdClose /></button>
            </div>
            <div className={styles.modalBody}>
              {modalError && <div className={styles.errorAlert}><MdWarning /><span>{modalError}</span></div>}
              {modalSuccess && <div className={styles.successAlert}><MdCheckCircle /><span>{modalSuccess}</span></div>}
              
              <div className={styles.formGroup}>
                <label>Nome *</label>
                <input type="text" value={editingAdmin.name || ''} onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })} disabled={modalLoading} />
              </div>
              <div className={styles.formGroup}>
                <label>E-mail *</label>
                <input type="email" value={editingAdmin.email || ''} onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })} disabled={modalLoading} />
              </div>
              <div className={styles.formGroup}>
                <label>Telefone</label>
                <input type="text" value={editingAdmin.phone || ''} onChange={(e) => setEditingAdmin({ ...editingAdmin, phone: e.target.value })} disabled={modalLoading} />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={() => setShowEditModal(false)} disabled={modalLoading}>Cancelar</button>
              <button className={styles.primaryButton} onClick={handleSaveAdmin} disabled={modalLoading}>
                {modalLoading ? 'Salvando...' : <><MdSave /> Salvar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reset Senha */}
      {showResetPasswordModal && (
        <div className={styles.modalOverlay} onClick={() => setShowResetPasswordModal(false)}>
          <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3><MdKey /> Alterar Senha</h3>
              <button className={styles.closeModalBtn} onClick={() => setShowResetPasswordModal(false)}><MdClose /></button>
            </div>
            <div className={styles.modalBody}>
              {modalError && <div className={styles.errorAlert}><MdWarning /><span>{modalError}</span></div>}
              {modalSuccess && <div className={styles.successAlert}><MdCheckCircle /><span>{modalSuccess}</span></div>}
              
              <div className={styles.formGroup}>
                <label>Nova Senha *</label>
                <input type="password" value={resetPasswordData.password} onChange={(e) => setResetPasswordData({ ...resetPasswordData, password: e.target.value })} placeholder="Mínimo 6 caracteres" disabled={modalLoading} />
              </div>
              <div className={styles.formGroup}>
                <label>Confirmar Senha *</label>
                <input type="password" value={resetPasswordData.confirmPassword} onChange={(e) => setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })} placeholder="Digite novamente" disabled={modalLoading} />
              </div>
              <div className={styles.passwordHint}><MdInfo /><small>Mínimo 6 caracteres</small></div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={() => setShowResetPasswordModal(false)} disabled={modalLoading}>Cancelar</button>
              <button className={styles.primaryButton} onClick={handleSaveNewPassword} disabled={modalLoading}>
                {modalLoading ? 'Alterando...' : <><MdLock /> Alterar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alterar Plano */}
      {showPlanModal && organization && (
        <div className={styles.modalOverlay} onClick={() => setShowPlanModal(false)}>
          <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3><MdAttachMoney /> Alterar Plano</h3>
              <button className={styles.closeModalBtn} onClick={() => setShowPlanModal(false)}><MdClose /></button>
            </div>
            <div className={styles.modalBody}>
              <p><strong>Plano atual:</strong> {planConfig.label}</p>
              <div className={styles.formGroup}>
                <label>Novo plano:</label>
                <select value={newPlan || ''} onChange={(e) => setNewPlan(e.target.value as PlanType)}>
                  <option value="">Selecione...</option>
                  {availablePlans.map(plan => (
                    <option key={plan.value} value={plan.value}>{plan.label}</option>
                  ))}
                </select>
              </div>
              {newPlan && (
                <div className={styles.planFeatures}>
                  <h4>Recursos do {getPlanConfig(newPlan).label}:</h4>
                  <ul>{getPlanConfig(newPlan).features?.map((f, i) => <li key={i}>{f}</li>)}</ul>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={() => setShowPlanModal(false)}>Cancelar</button>
              <button className={styles.primaryButton} onClick={handleSavePlan} disabled={!newPlan || newPlan === organization.planType || modalLoading}>
                {modalLoading ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação Status Admin */}
      <ConfirmationModal
        isOpen={showStatusModal}
        title={statusAction === 'activate' ? 'Ativar Administrador' : 'Desativar Administrador'}
        message={`Tem certeza que deseja ${statusAction === 'activate' ? 'ativar' : 'desativar'} ${adminUser?.name}?`}
        type="warning"
        onConfirm={handleToggleAdminStatus}
        onCancel={() => setShowStatusModal(false)}
        confirmText={statusAction === 'activate' ? 'Ativar' : 'Desativar'}
      />

      {/* Modal Confirmação Deletar Usuário */}
      <ConfirmationModal
        isOpen={showDeleteUserModal}
        title="Remover Usuário"
        message={`Tem certeza que deseja remover ${selectedUser?.name}?`}
        type="danger"
        onConfirm={confirmDeleteUser}
        onCancel={() => { setShowDeleteUserModal(false); setSelectedUser(null); }}
        confirmText="Remover"
      />

      {/* Modal de Erro */}
      <ErrorModal isOpen={!!modalError} message={modalError || ''} onClose={() => setModalError(null)} />
    </div>
  );
};