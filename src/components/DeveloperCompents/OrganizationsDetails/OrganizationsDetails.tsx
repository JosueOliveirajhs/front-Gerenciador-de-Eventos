// src/components/DeveloperCompents/Organizations/OrganizationDetails.tsx
import React, { useState, useEffect } from 'react';
import {
  MdArrowBack,
  MdBusiness,
  MdEdit,
  MdError,
  MdEmail,
  MdPhone,
  MdLocationOn,
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
  MdSchedule,
  MdTrendingUp,
  MdTrendingDown,
  MdPerson,
  MdAccessTime
} from 'react-icons/md';
import { FaChartLine, FaUsers, FaFileInvoice } from 'react-icons/fa';
import { organizationService } from '../../../services/organization';
import { Organization, OrganizationSummary, User, Event } from '../../../types/developer';
import { getPlanConfig, getPlanLabel } from '../../../utils/planUtils';
import { getStatusConfig, getStatusText } from '../../../utils/statusUtils';
import styles from './OrganizationsDetails.module.css';

interface OrganizationDetailsProps {
  organizationId: number;
  onBack: () => void;
  onEdit: () => void;
}

type TabType = 'summary' | 'users' | 'subscription' | 'usage' | 'events' | 'financial' | 'logs' | 'support';

export const OrganizationDetails: React.FC<OrganizationDetailsProps> = ({ 
  organizationId, 
  onBack, 
  onEdit 
}) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [summary, setSummary] = useState<OrganizationSummary | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('summary');

  useEffect(() => {
    loadAllData();
  }, [organizationId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Carrega dados básicos e resumo
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

  const getDaysRemaining = (dateString: string) => {
    const today = new Date();
    const target = new Date(dateString);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
        <button
          className={`${styles.tab} ${activeTab === 'summary' ? styles.active : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <MdBusiness />
          Resumo
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <MdPeople />
          Usuários ({users.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'subscription' ? styles.active : ''}`}
          onClick={() => setActiveTab('subscription')}
        >
          <MdReceipt />
          Assinatura
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'usage' ? styles.active : ''}`}
          onClick={() => setActiveTab('usage')}
        >
          <MdBarChart />
          Uso da Plataforma
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'events' ? styles.active : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <MdEvent />
          Eventos ({events.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'financial' ? styles.active : ''}`}
          onClick={() => setActiveTab('financial')}
        >
          <MdAttachMoney />
          Financeiro
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'logs' ? styles.active : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <MdTerminal />
          Logs
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'support' ? styles.active : ''}`}
          onClick={() => setActiveTab('support')}
        >
          <MdHeadset />
          Suporte
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {/* ABA 1: RESUMO */}
        {activeTab === 'summary' && (
          <div className={styles.summaryTab}>
            <h2>Resumo da Organização</h2>
            
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

              <div className={styles.summaryCard}>
                <h3>Últimos Eventos</h3>
                <div className={styles.recentList}>
                  {summary?.recentEvents && summary.recentEvents.length > 0 ? (
                    summary.recentEvents.map(event => (
                      <div key={event.id} className={styles.recentItem}>
                        <div>
                          <strong>{event.title}</strong>
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <span className={styles.eventStatus}>{event.status}</span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.emptyText}>Nenhum evento recente</p>
                  )}
                </div>
              </div>

              <div className={styles.summaryCard}>
                <h3>Últimos Acessos</h3>
                <div className={styles.recentList}>
                  {summary?.recentUsers && summary.recentUsers.length > 0 ? (
                    summary.recentUsers.map(user => (
                      <div key={user.id} className={styles.recentItem}>
                        <div>
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                        </div>
                        <span className={styles.accessDate}>{formatDateTime(user.lastAccess || '')}</span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.emptyText}>Nenhum acesso recente</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: USUÁRIOS */}
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
                    <tr key={user.id}>
                      <td>{user.name}</td>
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
                        <button className={`${styles.actionButton} ${styles.dangerButton}`} title="Desativar">
                          <MdCancel />
                        </button>
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

        {/* ABA 3: ASSINATURA */}
        {activeTab === 'subscription' && (
          <div className={styles.subscriptionTab}>
            <h2>Detalhes da Assinatura</h2>
            
            <div className={styles.subscriptionGrid}>
              <div className={styles.subscriptionCard}>
                <h3>Plano Atual</h3>
                <div className={styles.planDetails}>
                  <div className={styles.planName}>
                    <span className={`${styles.planBadgeLarge} ${planConfig.badgeClass}`}>
                      {planConfig.label}
                    </span>
                  </div>
                  <div className={styles.planPrice}>
                    <strong>Valor Mensal:</strong>
                    <span>{formatCurrency(planConfig.name === 'ESSENCIAL' ? 99 : 
                                         planConfig.name === 'PROFISSIONAL' ? 299 : 
                                         planConfig.name === 'PREMIUM' ? 599 : 1999)}</span>
                  </div>
                  <div className={styles.planFeatures}>
                    <strong>Recursos inclusos:</strong>
                    <ul>
                      {planConfig.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className={styles.subscriptionCard}>
                <h3>Ciclo de Faturamento</h3>
                <div className={styles.billingInfo}>
                  <div className={styles.billingItem}>
                    <strong>Status:</strong>
                    <span className={`${styles.statusBadge} ${statusConfig.badgeClass}`}>
                      {statusConfig.text}
                    </span>
                  </div>
                  <div className={styles.billingItem}>
                    <strong>Data de Cadastro:</strong>
                    <span>{formatDate(organization.createdAt)}</span>
                  </div>
                  <div className={styles.billingItem}>
                    <strong>Próxima Cobrança:</strong>
                    <span>{formatDate(new Date(new Date(organization.createdAt).setFullYear(new Date().getFullYear() + 1).toString()))}</span>
                  </div>
                  <div className={styles.billingItem}>
                    <strong>Dias Restantes:</strong>
                    <span>{getDaysRemaining(new Date(new Date(organization.createdAt).setFullYear(new Date().getFullYear() + 1).toString()))} dias</span>
                  </div>
                </div>
              </div>

              <div className={styles.subscriptionCard}>
                <h3>Limites do Plano</h3>
                <div className={styles.limitsList}>
                  <div className={styles.limitItem}>
                    <span>Usuários:</span>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ width: `${Math.min((summary?.totalUsers || 0) / (planConfig.limits.users === -1 ? 100 : planConfig.limits.users) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span>{summary?.totalUsers || 0} / {planConfig.limits.users === -1 ? '∞' : planConfig.limits.users}</span>
                  </div>
                  <div className={styles.limitItem}>
                    <span>Eventos/mês:</span>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ width: `${Math.min((summary?.totalEvents || 0) / (planConfig.limits.events === -1 ? 100 : planConfig.limits.events) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span>{summary?.totalEvents || 0} / {planConfig.limits.events === -1 ? '∞' : planConfig.limits.events}</span>
                  </div>
                  <div className={styles.limitItem}>
                    <span>Clientes:</span>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ width: `${Math.min((summary?.totalClients || 0) / (planConfig.limits.clients === -1 ? 100 : planConfig.limits.clients) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span>{summary?.totalClients || 0} / {planConfig.limits.clients === -1 ? '∞' : planConfig.limits.clients}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: USO DA PLATAFORMA */}
        {activeTab === 'usage' && (
          <div className={styles.usageTab}>
            <h2>Uso da Plataforma</h2>
            
            <div className={styles.usageGrid}>
              <div className={styles.usageCard}>
                <h3>Armazenamento</h3>
                <div className={styles.usageMetric}>
                  <span className={styles.usageValue}>2.5 GB / 50 GB</span>
                  <div className={styles.usageProgress}>
                    <div className={styles.progressFill} style={{ width: '5%' }}></div>
                  </div>
                </div>
              </div>

              <div className={styles.usageCard}>
                <h3>Requisições API (mês)</h3>
                <div className={styles.usageMetric}>
                  <span className={styles.usageValue}>1,234 / 10,000</span>
                  <div className={styles.usageProgress}>
                    <div className={styles.progressFill} style={{ width: '12%' }}></div>
                  </div>
                </div>
              </div>

              <div className={styles.usageCard}>
                <h3>Usuários Ativos (últimos 30 dias)</h3>
                <div className={styles.chartPlaceholder}>
                  <FaChartLine size={48} />
                  <p>Gráfico de usuários ativos</p>
                </div>
              </div>

              <div className={styles.usageCard}>
                <h3>Chamadas API por dia</h3>
                <div className={styles.chartPlaceholder}>
                  <MdBarChart size={48} />
                  <p>Gráfico de chamadas API</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 5: EVENTOS */}
        {activeTab === 'events' && (
          <div className={styles.eventsTab}>
            <div className={styles.tabHeader}>
              <h2>Eventos da Organização</h2>
              <button className={styles.primaryButton}>
                <MdEvent />
                Novo Evento
              </button>
            </div>
            
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Clientes</th>
                  <th>Valor</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {events.length > 0 ? (
                  events.map(event => (
                    <tr key={event.id}>
                      <td>{event.title}</td>
                      <td>{event.type}</td>
                      <td>{formatDate(event.date)}</td>
                      <td>
                        <span className={event.status === 'COMPLETED' ? styles.statusCompleted : 
                                        event.status === 'SCHEDULED' ? styles.statusScheduled :
                                        event.status === 'CANCELLED' ? styles.statusCancelled : 
                                        styles.statusProgress}>
                          {event.status === 'COMPLETED' ? 'Concluído' :
                           event.status === 'SCHEDULED' ? 'Agendado' :
                           event.status === 'CANCELLED' ? 'Cancelado' : 'Em Andamento'}
                        </span>
                      </td>
                      <td>{event.clientCount}</td>
                      <td>{formatCurrency(event.value)}</td>
                      <td>
                        <button className={styles.actionButton} title="Visualizar">
                          <MdVisibility />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className={styles.emptyTable}>
                      Nenhum evento encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ABA 6: FINANCEIRO */}
        {activeTab === 'financial' && (
          <div className={styles.financialTab}>
            <h2>Financeiro</h2>
            
            <div className={styles.financialGrid}>
              <div className={styles.financialCard}>
                <h3>Resumo Financeiro</h3>
                <div className={styles.financialMetrics}>
                  <div className={styles.financialMetric}>
                    <MdTrendingUp className={styles.revenueIcon} />
                    <div>
                      <span>Receita Total</span>
                      <strong>{formatCurrency(50000)}</strong>
                    </div>
                  </div>
                  <div className={styles.financialMetric}>
                    <MdTrendingDown className={styles.expenseIcon} />
                    <div>
                      <span>Despesas</span>
                      <strong>{formatCurrency(15000)}</strong>
                    </div>
                  </div>
                  <div className={styles.financialMetric}>
                    <MdAttachMoney className={styles.profitIcon} />
                    <div>
                      <span>Saldo</span>
                      <strong>{formatCurrency(35000)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.financialCard}>
                <h3>Últimas Transações</h3>
                <div className={styles.transactionsList}>
                  <div className={styles.transaction}>
                    <div>
                      <strong>Assinatura Mensal</strong>
                      <span>{formatDate(new Date().toISOString())}</span>
                    </div>
                    <span className={styles.transactionValue}>{formatCurrency(299)}</span>
                  </div>
                  <div className={styles.transaction}>
                    <div>
                      <strong>Evento - Casamento</strong>
                      <span>{formatDate(new Date().toISOString())}</span>
                    </div>
                    <span className={styles.transactionValue}>{formatCurrency(5000)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 7: LOGS */}
        {activeTab === 'logs' && (
          <div className={styles.logsTab}>
            <h2>Logs do Sistema</h2>
            
            <div className={styles.logsList}>
              <div className={styles.logEntry}>
                <MdAccessTime className={styles.logIcon} />
                <div className={styles.logContent}>
                  <strong>Usuário admin fez login</strong>
                  <span>{formatDateTime(new Date().toISOString())}</span>
                  <p>IP: 192.168.1.100</p>
                </div>
              </div>
              <div className={styles.logEntry}>
                <MdEvent className={styles.logIcon} />
                <div className={styles.logContent}>
                  <strong>Novo evento criado</strong>
                  <span>{formatDateTime(new Date().toISOString())}</span>
                  <p>Evento: Casamento Silva</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 8: SUPORTE */}
        {activeTab === 'support' && (
          <div className={styles.supportTab}>
            <h2>Tickets de Suporte</h2>
            
            <div className={styles.ticketsList}>
              <div className={styles.ticket}>
                <div className={styles.ticketHeader}>
                  <strong>Problema com login</strong>
                  <span className={styles.ticketStatus}>Aberto</span>
                </div>
                <p>Usuários não conseguem acessar o sistema</p>
                <div className={styles.ticketFooter}>
                  <span>Aberto por: João Silva</span>
                  <span>{formatDateTime(new Date().toISOString())}</span>
                </div>
              </div>
              <div className={styles.ticket}>
                <div className={styles.ticketHeader}>
                  <strong>Dúvida sobre faturamento</strong>
                  <span className={styles.ticketStatus}>Respondido</span>
                </div>
                <p>Como emitir nota fiscal?</p>
                <div className={styles.ticketFooter}>
                  <span>Aberto por: Maria Oliveira</span>
                  <span>{formatDateTime(new Date().toISOString())}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};