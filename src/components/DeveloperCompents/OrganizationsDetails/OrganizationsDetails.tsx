// src/components/DeveloperCompents/Organizations/OrganizationDetails.tsx
import React, { useState, useEffect } from 'react';
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
  MdBarChart,
  MdTerminal,
  MdHeadset,
  MdCheckCircle,
  MdWarning,
  MdCancel,
  MdRefresh,
  MdReceipt,
  MdTrendingUp,
  MdTrendingDown,
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
  MdInfo
} from 'react-icons/md';
import { FaChartLine, FaUsers, FaFileInvoice } from 'react-icons/fa';
import { organizationService } from '../../../services/organization';
import { Organization, OrganizationSummary, User, Event, UpdateUserDTO } from '../../../types/developer';
import { getPlanConfig } from '../../../utils/planUtils';
import { getStatusConfig } from '../../../utils/statusUtils';
import { ConfirmationModal } from '../../Common/Alerts/ConfirmationModal';
import { ErrorModal } from '../../Common/Alerts/ErrorModal';
import styles from './OrganizationsDetails.module.css';

interface OrganizationDetailsProps {
  organizationId: number;
  onBack: () => void;
  onEdit: () => void;
}

type TabType = 'summary' | 'admin' | 'users' | 'subscription' | 'usage' | 'events' | 'financial' | 'logs' | 'support';

export const OrganizationDetails: React.FC<OrganizationDetailsProps> = ({ 
  organizationId, 
  onBack, 
  onEdit 
}) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [summary, setSummary] = useState<OrganizationSummary | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  
  // Estados para modais e edição
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Partial<User>>({});
  const [resetPasswordData, setResetPasswordData] = useState({ password: '', confirmPassword: '' });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [statusAction, setStatusAction] = useState<'activate' | 'deactivate'>('activate');

  useEffect(() => {
    loadAllData();
  }, [organizationId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [orgData, summaryData, usersData, eventsData] = await Promise.all([
        organizationService.getOrganizationById(organizationId),
        organizationService.getOrganizationSummary(organizationId),
        organizationService.getOrganizationUsers(organizationId),
        organizationService.getOrganizationEvents(organizationId)
      ]);
      
      setOrganization(orgData);
      setSummary(summaryData);
      setUsers(usersData);
      setEvents(eventsData);
      
      const admin = usersData.find(u => u.role === 'ADMIN' || u.userType === 'ADMIN') || usersData[0];
      setAdminUser(admin || null);
      
    } catch (err: any) {
      console.error('❌ Erro ao carregar dados da organização:', err);
      if (err.response?.status === 404) {
        setError('Organização não encontrada.');
      } else {
        setError('Erro ao carregar dados da organização.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para editar admin
  const handleEditAdmin = () => {
    if (adminUser) {
      setEditingAdmin({
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        phone: adminUser.phone || '',
        role: adminUser.role,
        status: adminUser.status
      });
      setShowEditModal(true);
      setModalError(null);
      setModalSuccess(null);
    }
  };

  // Função para salvar edição do admin
  const handleSaveAdmin = async () => {
    if (!editingAdmin.id || !editingAdmin.name || !editingAdmin.email) {
      setModalError('Nome e e-mail são obrigatórios');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingAdmin.email)) {
      setModalError('E-mail inválido');
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      const updateData: UpdateUserDTO = {
        name: editingAdmin.name,
        email: editingAdmin.email,
        phone: editingAdmin.phone,
        role: editingAdmin.role,
        status: editingAdmin.status
      };

      // TODO: Substituir pela chamada real da API quando disponível
      // const updatedUser = await userService.updateUser(editingAdmin.id, updateData);
      console.log('Atualizando admin:', editingAdmin.id, updateData);
      
      // Simulação de atualização
      setTimeout(() => {
        // Atualizar estado local
        setAdminUser(prev => prev ? {
          ...prev,
          name: updateData.name || prev.name,
          email: updateData.email || prev.email,
          phone: updateData.phone || prev.phone,
          role: updateData.role || prev.role,
          status: updateData.status || prev.status
        } : null);
        
        setUsers(prev => prev.map(u => 
          u.id === editingAdmin.id ? { 
            ...u, 
            name: updateData.name || u.name,
            email: updateData.email || u.email,
            phone: updateData.phone || u.phone,
            role: updateData.role || u.role,
            status: updateData.status || u.status
          } : u
        ));
        
        setModalSuccess('Administrador atualizado com sucesso!');
        
        setTimeout(() => {
          setShowEditModal(false);
          setModalSuccess(null);
        }, 1500);
      }, 500);
      
    } catch (err: any) {
      console.error('Erro ao atualizar admin:', err);
      setModalError(err.response?.data?.message || 'Erro ao atualizar administrador');
    } finally {
      setModalLoading(false);
    }
  };

  // Função para abrir modal de confirmação de status
  const handleToggleAdminStatusClick = () => {
    if (!adminUser) return;
    setStatusAction(adminUser.status === 'ACTIVE' ? 'deactivate' : 'activate');
    setShowStatusModal(true);
  };

  // Função para ativar/desativar admin
  const handleToggleAdminStatus = async () => {
    if (!adminUser) return;
    
    const newStatus = adminUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    setModalLoading(true);
    
    try {
      // TODO: Substituir pela chamada real da API quando disponível
      // await userService.updateUserStatus(adminUser.id, newStatus);
      console.log(`Alterando status do admin ${adminUser.id} para ${newStatus}`);
      
      // Simulação
      setTimeout(() => {
        // Atualizar estado local
        setAdminUser(prev => prev ? { ...prev, status: newStatus as 'ACTIVE' | 'INACTIVE' } : null);
        setUsers(prev => prev.map(u => 
          u.id === adminUser.id ? { ...u, status: newStatus as 'ACTIVE' | 'INACTIVE' } : u
        ));
        
        setShowStatusModal(false);
        setModalLoading(false);
      }, 500);
      
    } catch (err: any) {
      console.error('Erro ao alterar status:', err);
      setModalError(err.response?.data?.message || 'Erro ao alterar status do administrador');
      setModalLoading(false);
    }
  };

  // Função para resetar senha
  const handleResetPassword = () => {
    setResetPasswordData({ password: '', confirmPassword: '' });
    setShowResetPasswordModal(true);
    setModalError(null);
    setModalSuccess(null);
  };

  // Função para salvar nova senha
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
    setModalError(null);
    
    try {
      // TODO: Substituir pela chamada real da API quando disponível
      // await userService.resetPassword(adminUser!.id, resetPasswordData.password);
      console.log(`Resetando senha do admin ${adminUser?.id}`);
      
      setModalSuccess('Senha alterada com sucesso!');
      
      setTimeout(() => {
        setShowResetPasswordModal(false);
        setModalSuccess(null);
        setResetPasswordData({ password: '', confirmPassword: '' });
      }, 1500);
      
    } catch (err: any) {
      console.error('Erro ao resetar senha:', err);
      setModalError(err.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setModalLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
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
          <MdArrowBack />
          Voltar para lista
        </button>
      </div>
    );
  }

  const planConfig = getPlanConfig(organization.planType);
  const statusConfig = getStatusConfig(organization.status);

  return (
    <div className={styles.organizationDetails}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          <MdArrowBack />
          Voltar
        </button>
        <h1 className={styles.title}>
          <MdBusiness />
          {organization.name}
        </h1>
        <button onClick={onEdit} className={styles.editButton}>
          <MdEdit />
          Editar
        </button>
        <button onClick={loadAllData} className={styles.refreshButton} title="Atualizar">
          <MdRefresh />
        </button>
      </div>

      {/* Organization Info Card */}
      <div className={styles.infoCard}>
        <div className={styles.infoHeader}>
          <div className={styles.infoHeaderLeft}>
            <div className={styles.avatar}>
              <MdBusiness size={32} />
            </div>
            <div>
              <h2>{organization.name}</h2>
              <p className={styles.cnpj}>CNPJ: {organization.cnpj ? organizationService.formatCNPJ(organization.cnpj) : 'Não informado'}</p>
            </div>
          </div>
          <div className={styles.badges}>
            <span className={`${styles.planBadge} ${planConfig.badgeClass}`}>
              {planConfig.label}
            </span>
            <span className={`${styles.statusBadge} ${statusConfig.badgeClass}`}>
              {statusConfig.text}
            </span>
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
        <button className={`${styles.tab} ${activeTab === 'summary' ? styles.active : ''}`} onClick={() => setActiveTab('summary')}>
          <MdBusiness /> Resumo
        </button>
        <button className={`${styles.tab} ${activeTab === 'admin' ? styles.active : ''}`} onClick={() => setActiveTab('admin')}>
          <MdAdminPanelSettings /> Admin
        </button>
        <button className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`} onClick={() => setActiveTab('users')}>
          <MdPeople /> Usuários ({users.length})
        </button>
        <button className={`${styles.tab} ${activeTab === 'subscription' ? styles.active : ''}`} onClick={() => setActiveTab('subscription')}>
          <MdReceipt /> Assinatura
        </button>
        <button className={`${styles.tab} ${activeTab === 'usage' ? styles.active : ''}`} onClick={() => setActiveTab('usage')}>
          <MdBarChart /> Uso
        </button>
        <button className={`${styles.tab} ${activeTab === 'events' ? styles.active : ''}`} onClick={() => setActiveTab('events')}>
          <MdEvent /> Eventos ({events.length})
        </button>
        <button className={`${styles.tab} ${activeTab === 'financial' ? styles.active : ''}`} onClick={() => setActiveTab('financial')}>
          <MdAttachMoney /> Financeiro
        </button>
        <button className={`${styles.tab} ${activeTab === 'logs' ? styles.active : ''}`} onClick={() => setActiveTab('logs')}>
          <MdTerminal /> Logs
        </button>
        <button className={`${styles.tab} ${activeTab === 'support' ? styles.active : ''}`} onClick={() => setActiveTab('support')}>
          <MdHeadset /> Suporte
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {/* ABA 1: RESUMO */}
        {activeTab === 'summary' && (
          <div className={styles.summaryTab}>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <h3>Informações Gerais</h3>
                <div className={styles.infoList}>
                  <div className={styles.infoItem}>
                    <strong>Nome:</strong>
                    <span>{organization.name}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <strong>CNPJ:</strong>
                    <span>{organization.cnpj ? organizationService.formatCNPJ(organization.cnpj) : 'Não informado'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <strong>Data de Cadastro:</strong>
                    <span>{formatDate(organization.createdAt)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <strong>Plano:</strong>
                    <span className={`${styles.planBadge} ${planConfig.badgeClass}`}>
                      {planConfig.label}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <strong>Status:</strong>
                    <span className={`${styles.statusBadge} ${statusConfig.badgeClass}`}>
                      {statusConfig.text}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <h3>Métricas</h3>
                <div className={styles.metricsGrid}>
                  <div className={styles.metricCard}>
                    <MdPeople size={24} />
                    <div>
                      <span className={styles.metricCardLabel}>Usuários</span>
                      <span className={styles.metricCardValue}>{summary?.totalUsers || 0}</span>
                    </div>
                  </div>
                  <div className={styles.metricCard}>
                    <MdEvent size={24} />
                    <div>
                      <span className={styles.metricCardLabel}>Eventos Criados</span>
                      <span className={styles.metricCardValue}>{summary?.totalEvents || 0}</span>
                    </div>
                  </div>
                  <div className={styles.metricCard}>
                    <FaUsers size={24} />
                    <div>
                      <span className={styles.metricCardLabel}>Clientes</span>
                      <span className={styles.metricCardValue}>{summary?.totalClients || 0}</span>
                    </div>
                  </div>
                  <div className={styles.metricCard}>
                    <MdAttachMoney size={24} />
                    <div>
                      <span className={styles.metricCardLabel}>Volume Financeiro</span>
                      <span className={styles.metricCardValue}>{formatCurrency(summary?.financialVolume || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: ADMIN */}
        {activeTab === 'admin' && (
          <div className={styles.adminTab}>
            {adminUser ? (
              <div className={styles.adminCard}>
                <div className={styles.adminHeader}>
                  <div className={styles.adminAvatar}>
                    <MdPerson size={48} />
                  </div>
                  <div className={styles.adminInfo}>
                    <h3>{adminUser.name}</h3>
                    <p className={styles.adminRole}>Administrador Principal</p>
                    <span className={`${styles.userStatusBadge} ${adminUser.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive}`}>
                      {adminUser.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className={styles.adminHeaderActions}>
                    <button onClick={handleEditAdmin} className={styles.adminHeaderActionBtn} title="Editar">
                      <MdEdit size={18} /> Editar
                    </button>
                    <button onClick={handleResetPassword} className={styles.adminHeaderActionBtn} title="Resetar Senha">
                      <MdKey size={18} /> Senha
                    </button>
                    <button onClick={handleToggleAdminStatusClick} className={styles.adminHeaderActionBtn} title={adminUser.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}>
                      <MdPowerSettingsNew size={18} /> {adminUser.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </div>

                <div className={styles.adminDetails}>
                  <div className={styles.detailSection}>
                    <h4>Informações Pessoais</h4>
                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}>
                        <MdPerson />
                        <div>
                          <label>Nome Completo</label>
                          <span>{adminUser.name}</span>
                        </div>
                      </div>
                      <div className={styles.detailItem}>
                        <MdEmail />
                        <div>
                          <label>E-mail</label>
                          <span>{adminUser.email}</span>
                        </div>
                      </div>
                      <div className={styles.detailItem}>
                        <MdBadge />
                        <div>
                          <label>CPF</label>
                          <span>{formatCPF(adminUser.cpf)}</span>
                        </div>
                      </div>
                      <div className={styles.detailItem}>
                        <MdPhone />
                        <div>
                          <label>Telefone</label>
                          <span>{adminUser.phone || 'Não informado'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.detailSection}>
                    <h4>Informações da Conta</h4>
                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}>
                        <MdCalendarToday />
                        <div>
                          <label>Data de Criação</label>
                          <span>{formatDate(adminUser.createdAt)}</span>
                        </div>
                      </div>
                      <div className={styles.detailItem}>
                        <MdAccessTime />
                        <div>
                          <label>Última Atualização</label>
                          <span>{formatDateTime(adminUser.updatedAt)}</span>
                        </div>
                      </div>
                      <div className={styles.detailItem}>
                        <MdLock />
                        <div>
                          <label>Tipo de Usuário</label>
                          <span>{adminUser.userType || 'ADMIN'}</span>
                        </div>
                      </div>
                      <div className={styles.detailItem}>
                        <MdBusiness />
                        <div>
                          <label>Organização</label>
                          <span>{organization.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.detailSection}>
                    <h4>Permissões</h4>
                    <div className={styles.permissionsList}>
                      <div className={styles.permissionItem}>
                        <MdCheckCircle className={styles.permissionIcon} />
                        <span>Gerenciar Organização</span>
                      </div>
                      <div className={styles.permissionItem}>
                        <MdCheckCircle className={styles.permissionIcon} />
                        <span>Gerenciar Usuários</span>
                      </div>
                      <div className={styles.permissionItem}>
                        <MdCheckCircle className={styles.permissionIcon} />
                        <span>Gerenciar Eventos</span>
                      </div>
                      <div className={styles.permissionItem}>
                        <MdCheckCircle className={styles.permissionIcon} />
                        <span>Visualizar Relatórios</span>
                      </div>
                      <div className={styles.permissionItem}>
                        <MdCheckCircle className={styles.permissionIcon} />
                        <span>Configurar Plano</span>
                      </div>
                      <div className={styles.permissionItem}>
                        <MdCheckCircle className={styles.permissionIcon} />
                        <span>Gerenciar Financeiro</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.emptyAdminState}>
                <MdWarning size={48} />
                <h3>Nenhum administrador encontrado</h3>
                <p>Esta organização não possui um administrador cadastrado.</p>
                <button className={styles.adminPrimaryButton}>
                  <MdPersonAdd />
                  Adicionar Administrador
                </button>
              </div>
            )}
          </div>
        )}

        {/* ABA 3: USUÁRIOS */}
        {activeTab === 'users' && (
          <div className={styles.usersTab}>
            <div className={styles.tabHeader}>
              <h2>Usuários da Organização</h2>
              <button className={styles.primaryButton}>
                <MdPerson />
                Novo Usuário
              </button>
            </div>
            
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Função</th>
                  <th>Status</th>
                  <th>Último Acesso</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map(user => (
                    <tr key={user.id} className={user.id === adminUser?.id ? styles.adminRow : ''}>
                      <td>
                        {user.name}
                        {user.id === adminUser?.id && (
                          <span className={styles.adminBadge}>Admin</span>
                        )}
                      </td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>
                        <span className={user.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive}>
                          {user.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>{user.lastAccess ? formatDateTime(user.lastAccess) : '-'}</td>
                      <td>
                        <button className={styles.actionButton} title="Editar">
                          <MdEdit />
                        </button>
                        {user.id !== adminUser?.id && (
                          <button className={`${styles.actionButton} ${styles.dangerButton}`} title="Desativar">
                            <MdCancel />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={styles.emptyTable}>
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Outras abas com placeholder */}
        {activeTab === 'subscription' && (
          <div className={styles.subscriptionTab}>
            <h2>Detalhes da Assinatura</h2>
            <p>Conteúdo em desenvolvimento...</p>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className={styles.usageTab}>
            <h2>Uso da Plataforma</h2>
            <p>Conteúdo em desenvolvimento...</p>
          </div>
        )}

        {activeTab === 'events' && (
          <div className={styles.eventsTab}>
            <h2>Eventos da Organização</h2>
            <p>Conteúdo em desenvolvimento...</p>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className={styles.financialTab}>
            <h2>Financeiro</h2>
            <p>Conteúdo em desenvolvimento...</p>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className={styles.logsTab}>
            <h2>Logs do Sistema</h2>
            <p>Conteúdo em desenvolvimento...</p>
          </div>
        )}

        {activeTab === 'support' && (
          <div className={styles.supportTab}>
            <h2>Suporte</h2>
            <p>Conteúdo em desenvolvimento...</p>
          </div>
        )}
      </div>

      {/* Modal de Edição do Admin */}
      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                <MdEdit />
                Editar Administrador
              </h3>
              <button className={styles.closeModalBtn} onClick={() => setShowEditModal(false)}>
                <MdClose />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {modalError && (
                <div className={styles.errorAlert}>
                  <MdWarning />
                  <span>{modalError}</span>
                </div>
              )}
              {modalSuccess && (
                <div className={styles.successAlert}>
                  <MdCheckCircle />
                  <span>{modalSuccess}</span>
                </div>
              )}
              
              <div className={styles.formGroup}>
                <label>Nome Completo *</label>
                <input
                  type="text"
                  value={editingAdmin.name || ''}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                  placeholder="Nome do administrador"
                  disabled={modalLoading}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>E-mail *</label>
                <input
                  type="email"
                  value={editingAdmin.email || ''}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                  placeholder="admin@empresa.com"
                  disabled={modalLoading}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Telefone</label>
                <input
                  type="text"
                  value={editingAdmin.phone || ''}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  disabled={modalLoading}
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Função</label>
                  <select
                    value={editingAdmin.role || 'ADMIN'}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, role: e.target.value })}
                    disabled={modalLoading}
                  >
                    <option value="ADMIN">Administrador</option>
                    <option value="MANAGER">Gerente</option>
                    <option value="USER">Usuário</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Status</label>
                  <select
                    value={editingAdmin.status || 'ACTIVE'}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                    disabled={modalLoading}
                  >
                    <option value="ACTIVE">Ativo</option>
                    <option value="INACTIVE">Inativo</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button className={styles.adminSecondaryButton} onClick={() => setShowEditModal(false)} disabled={modalLoading}>
                Cancelar
              </button>
              <button className={styles.adminPrimaryButton} onClick={handleSaveAdmin} disabled={modalLoading}>
                {modalLoading ? 'Salvando...' : <><MdSave /> Salvar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reset de Senha */}
      {showResetPasswordModal && (
        <div className={styles.modalOverlay} onClick={() => setShowResetPasswordModal(false)}>
          <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                <MdKey />
                Alterar Senha
              </h3>
              <button className={styles.closeModalBtn} onClick={() => setShowResetPasswordModal(false)}>
                <MdClose />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {modalError && (
                <div className={styles.errorAlert}>
                  <MdWarning />
                  <span>{modalError}</span>
                </div>
              )}
              {modalSuccess && (
                <div className={styles.successAlert}>
                  <MdCheckCircle />
                  <span>{modalSuccess}</span>
                </div>
              )}
              
              <div className={styles.formGroup}>
                <label>Nova Senha *</label>
                <input
                  type="password"
                  value={resetPasswordData.password}
                  onChange={(e) => setResetPasswordData({ ...resetPasswordData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  disabled={modalLoading}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Confirmar Nova Senha *</label>
                <input
                  type="password"
                  value={resetPasswordData.confirmPassword}
                  onChange={(e) => setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })}
                  placeholder="Digite a senha novamente"
                  disabled={modalLoading}
                />
              </div>
              
              <div className={styles.passwordHint}>
                <MdInfo />
                <small>Recomendado usar letras maiúsculas, minúsculas, números e símbolos</small>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button className={styles.adminSecondaryButton} onClick={() => setShowResetPasswordModal(false)} disabled={modalLoading}>
                Cancelar
              </button>
              <button className={styles.adminPrimaryButton} onClick={handleSaveNewPassword} disabled={modalLoading}>
                {modalLoading ? 'Alterando...' : <><MdLock /> Alterar Senha</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Status usando o ConfirmationModal existente */}
      <ConfirmationModal
        isOpen={showStatusModal}
        title={statusAction === 'activate' ? 'Ativar Administrador' : 'Desativar Administrador'}
        message={`Tem certeza que deseja ${statusAction === 'activate' ? 'ativar' : 'desativar'} o administrador ${adminUser?.name}?`}
        type="warning"
        onConfirm={handleToggleAdminStatus}
        onCancel={() => setShowStatusModal(false)}
        confirmText={statusAction === 'activate' ? 'Sim, Ativar' : 'Sim, Desativar'}
      />
    </div>
  );
};