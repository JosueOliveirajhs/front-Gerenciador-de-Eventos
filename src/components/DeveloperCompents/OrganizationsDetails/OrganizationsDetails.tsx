// src/components/DeveloperCompents/Organizations/OrganizationDetails.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdArrowBack, MdBusiness, MdEdit, MdError, MdEmail, MdPhone,
  MdCalendarToday, MdPeople, MdEvent, MdAttachMoney, MdCheckCircle,
  MdWarning, MdCancel, MdRefresh, MdReceipt, MdPerson, MdAccessTime,
  MdAdminPanelSettings, MdBadge, MdLock, MdSave, MdClose,
  MdPowerSettingsNew, MdPersonAdd, MdKey, MdInfo, MdDelete, MdAdd, MdVisibility
} from 'react-icons/md';
import { FaUsers } from 'react-icons/fa';
import { organizationService } from '../../../services/organization';
import { userService } from '../../../services/users';
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

const getEventStatusStyle = (status: string) => {
  const map: Record<string, { text: string; className: string }> = {
    'QUOTE': { text: 'Orçamento', className: 'badgeWarning' },
    'CONFIRMED': { text: 'Confirmado', className: 'badgeSuccess' },
    'IN_PROGRESS': { text: 'Em Andamento', className: 'badgeInfo' },
    'COMPLETED': { text: 'Concluído', className: 'badgePrimary' },
    'CANCELLED': { text: 'Cancelado', className: 'badgeDanger' },
    'PENDING': { text: 'Pendente', className: 'badgeWarning' },
  };
  return map[status] || { text: status || 'N/A', className: 'badgeDefault' };
};

export const OrganizationDetails: React.FC<OrganizationDetailsProps> = ({ organizationId, onBack, onEdit }) => {
  const navigate = useNavigate();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [summary, setSummary] = useState<OrganizationSummary | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Partial<User>>({});
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [statusAction, setStatusAction] = useState<'activate' | 'deactivate'>('activate');
  const [newPlan, setNewPlan] = useState<PlanType | null>(null);

  const availablePlans = getAvailablePlans();

  useEffect(() => { loadAllData(); }, [organizationId]);

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
        ? usersData.find((u: User) => u.role === 'ADMIN' || u.userType === 'ADMIN' || u.role === 'OWNER') || usersData[0]
        : null;
      setAdminUser(admin || null);
      
    } catch (err: any) {
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
      await userService.updateClient(editingAdmin.id!, {
        name: editingAdmin.name,
        email: editingAdmin.email,
        phone: editingAdmin.phone,
        role: editingAdmin.role,
        status: editingAdmin.status
      });
      
      await loadAllData();
      setShowEditModal(false);
      setModalSuccess('Administrador atualizado com sucesso!');
      setTimeout(() => setModalSuccess(null), 2000);
    } catch (err: any) {
      setModalError(err.message || 'Erro ao atualizar administrador');
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
      await userService.updateClient(adminUser.id, { status: newStatus as 'ACTIVE' | 'INACTIVE' });
      await loadAllData();
      setShowStatusModal(false);
    } catch (err: any) {
      setModalError(err.message || 'Erro ao alterar status');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await userService.updateClient(user.id, { status: newStatus as 'ACTIVE' | 'INACTIVE' });
      await loadAllData();
    } catch (err: any) {
      setModalError(err.message || 'Erro ao alterar status do usuário');
      setTimeout(() => setModalError(null), 3000);
    }
  };

  // ✅ Visualizar detalhes do cliente
  const handleViewUser = (user: User) => {
    console.log('👤 Visualizar usuário:', user.id);
    // Navegar para a página de detalhes do cliente no owner
    navigate(`/owner/clients/${user.id}`);
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
      await loadAllData();
      setShowPlanModal(false);
      setModalSuccess('Plano atualizado com sucesso!');
      setTimeout(() => setModalSuccess(null), 2000);
    } catch (err: any) {
      setModalError(err.message || 'Erro ao atualizar plano');
    } finally {
      setModalLoading(false);
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try { return new Date(dateString).toLocaleDateString('pt-BR'); } catch { return '-'; }
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
        <button onClick={onBack} className={styles.backButton}><MdArrowBack /> Voltar para lista</button>
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
        <button onClick={onBack} className={styles.backButton}><MdArrowBack /> Voltar</button>
        <h1 className={styles.title}><MdBusiness /> {organization.name}</h1>
        <div className={styles.headerActions}>
          <button onClick={() => onEdit(organization.id)} className={styles.editButton}><MdEdit /> Editar</button>
          <button onClick={loadAllData} className={styles.refreshButton} title="Atualizar"><MdRefresh /></button>
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
          <div className={styles.metric}><MdCalendarToday /><div><span className={styles.metricLabel}>Cadastro</span><span className={styles.metricValue}>{formatDate(organization.createdAt)}</span></div></div>
          <div className={styles.metric}><MdPeople /><div><span className={styles.metricLabel}>Usuários</span><span className={styles.metricValue}>{summary?.totalUsers || 0}</span></div></div>
          <div className={styles.metric}><MdEvent /><div><span className={styles.metricLabel}>Eventos</span><span className={styles.metricValue}>{summary?.totalEvents || 0}</span></div></div>
          <div className={styles.metric}><MdAttachMoney /><div><span className={styles.metricLabel}>Financeiro</span><span className={styles.metricValue}>{formatCurrency(summary?.financialVolume || 0)}</span></div></div>
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
          <button key={tab.id} className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`} onClick={() => setActiveTab(tab.id as TabType)}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
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
                  <div className={styles.metricCard}><MdPeople size={24} /><div><span>Usuários</span><span>{summary?.totalUsers || 0}</span></div></div>
                  <div className={styles.metricCard}><MdEvent size={24} /><div><span>Eventos</span><span>{summary?.totalEvents || 0}</span></div></div>
                  <div className={styles.metricCard}><FaUsers size={24} /><div><span>Ativos</span><span>{summary?.activeUsers || 0}</span></div></div>
                  <div className={styles.metricCard}><MdAttachMoney size={24} /><div><span>Financeiro</span><span>{formatCurrency(summary?.financialVolume || 0)}</span></div></div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}><MdWarning size={48} /><h3>Nenhum administrador</h3></div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
  <div className={styles.usersTab}>
    <div className={styles.tabHeader}><h2>Usuários ({users.length})</h2></div>
    {users.length > 0 ? (
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead><tr><th>Nome</th><th>Email</th><th>Função</th><th>Status</th><th>Criado em</th></tr></thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14 }}><MdPerson /></div>
                    <div>
                      <strong>{user.name}</strong>
                      {user.id === adminUser?.id && <span className={styles.adminBadge}>Admin</span>}
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td><span className={styles.roleBadge}>{user.role || 'USER'}</span></td>
                <td>
                  <button className={`${styles.statusToggle} ${user.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive}`} onClick={() => handleToggleUserStatus(user)}>
                    {user.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td>{formatDate(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className={styles.emptyState}><MdPeople size={48} /><h3>Nenhum usuário</h3></div>
    )}
  </div>
)}

        {activeTab === 'subscription' && (
          <div className={styles.subscriptionTab}>
            <div className={styles.subscriptionCard}>
              <div className={styles.subscriptionHeader}><h2>Plano Atual</h2><span className={`${styles.planBadgeLarge} ${planConfig.badgeClass || ''}`}>{planConfig.label}</span></div>
              <div className={styles.planDetails}>
                <div className={styles.planInfo}>
                  <h3>Recursos do Plano {planConfig.label}</h3>
                  <ul className={styles.featureList}>{planConfig.features?.map((f, i) => <li key={i}><MdCheckCircle /> {f}</li>)}</ul>
                </div>
                <div className={styles.planActions}>
                  <button className={styles.primaryButton} onClick={handleChangePlan}><MdAttachMoney /> Alterar Plano</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className={styles.eventsTab}>
            <div className={styles.tabHeader}><h2>Eventos ({events.length})</h2></div>
            {events.length > 0 ? (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead><tr><th>Evento</th><th>Data</th><th>Tipo</th><th>Status</th><th>Convidados</th><th>Valor</th></tr></thead>
                  <tbody>
                    {events.map(event => {
                      const s = getEventStatusStyle(event.status || '');
                      return (
                        <tr key={event.id}>
                          <td><strong>{event.title || 'Sem título'}</strong></td>
                          <td>{formatDate(event.eventDate)}</td>
                          <td><span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, background: '#e0e7ff', color: '#4338ca' }}>{event.eventType || 'N/A'}</span></td>
                          <td><span className={`${styles.statusBadge} ${styles[s.className] || ''}`}>{s.text}</span></td>
                          <td>{event.guestCount || 0}</td>
                          <td>{formatCurrency(Number(event.totalValue) || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.emptyState}><MdEvent size={48} /><h3>Nenhum evento</h3></div>
            )}
          </div>
        )}

        {activeTab === 'financial' && (
          <div className={styles.financialTab}>
            <div className={styles.summaryCard}>
              <h3>Resumo Financeiro</h3>
              <div className={styles.infoList}>
                <div className={styles.infoItem}><strong>Volume Total:</strong><span>{formatCurrency(summary?.financialVolume || 0)}</span></div>
                <div className={styles.infoItem}><strong>Eventos:</strong><span>{summary?.totalEvents || 0}</span></div>
                <div className={styles.infoItem}><strong>Ticket Médio:</strong><span>{formatCurrency((summary?.financialVolume || 0) / (summary?.totalEvents || 1))}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}><h3><MdEdit /> Editar Administrador</h3><button onClick={() => setShowEditModal(false)}><MdClose /></button></div>
            <div className={styles.modalBody}>
              {modalError && <div className={styles.errorAlert}><MdWarning /> {modalError}</div>}
              <div className={styles.formGroup}><label>Nome *</label><input type="text" value={editingAdmin.name || ''} onChange={e => setEditingAdmin({...editingAdmin, name: e.target.value})} disabled={modalLoading} /></div>
              <div className={styles.formGroup}><label>E-mail *</label><input type="email" value={editingAdmin.email || ''} onChange={e => setEditingAdmin({...editingAdmin, email: e.target.value})} disabled={modalLoading} /></div>
              <div className={styles.formGroup}><label>Telefone</label><input type="text" value={editingAdmin.phone || ''} onChange={e => setEditingAdmin({...editingAdmin, phone: e.target.value})} disabled={modalLoading} /></div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={() => setShowEditModal(false)}>Cancelar</button>
              <button className={styles.primaryButton} onClick={handleSaveAdmin} disabled={modalLoading}>{modalLoading ? 'Salvando...' : <><MdSave /> Salvar</>}</button>
            </div>
          </div>
        </div>
      )}

      {showPlanModal && organization && (
        <div className={styles.modalOverlay} onClick={() => setShowPlanModal(false)}>
          <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}><h3><MdAttachMoney /> Alterar Plano</h3><button onClick={() => setShowPlanModal(false)}><MdClose /></button></div>
            <div className={styles.modalBody}>
              <p><strong>Plano atual:</strong> {planConfig.label}</p>
              <div className={styles.formGroup}>
                <label>Novo plano:</label>
                <select value={newPlan || ''} onChange={e => setNewPlan(e.target.value as PlanType)}>
                  <option value="">Selecione...</option>
                  {availablePlans.map(plan => <option key={plan.value} value={plan.value}>{plan.label}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={() => setShowPlanModal(false)}>Cancelar</button>
              <button className={styles.primaryButton} onClick={handleSavePlan} disabled={!newPlan || newPlan === organization.planType || modalLoading}>{modalLoading ? 'Salvando...' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal isOpen={showStatusModal} title={statusAction === 'activate' ? 'Ativar Administrador' : 'Desativar Administrador'} message={`Deseja ${statusAction === 'activate' ? 'ativar' : 'desativar'} ${adminUser?.name}?`} type="warning" onConfirm={handleToggleAdminStatus} onCancel={() => setShowStatusModal(false)} confirmText={statusAction === 'activate' ? 'Ativar' : 'Desativar'} />
      <ErrorModal isOpen={!!modalError} message={modalError || ''} onClose={() => setModalError(null)} />
    </div>
  );
};