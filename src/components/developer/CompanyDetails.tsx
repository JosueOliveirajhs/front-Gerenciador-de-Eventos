// src/pages/developer/CompanyDetails.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MdArrowBack,
  MdBusiness,
  MdPerson,
  MdEvent,
  MdAttachMoney,
  MdCheckCircle,
  MdWarning,
  MdError,
  MdInfo,
  MdSchedule,
  MdTrendingUp,
  MdTrendingDown,
  MdPeople,
  MdCalendarToday,
  MdReceipt,
  MdAssignment,
  MdEdit,
  MdDelete,
  MdBlock,
  MdPlayArrow,
  MdRefresh,
  MdTerminal,
  MdHeadset,
  MdBarChart,
  MdSettings,
  MdEmail,
  MdPhone,
  MdLocationOn
} from 'react-icons/md';
import { FaChartLine, FaUsers, FaDatabase, FaFileInvoice } from 'react-icons/fa';
import styles from './CompanyDetails.module.css';

interface Company {
  id: number;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED';
  createdAt: string;
  trialEndsAt?: string;
  nextBillingDate: string;
  monthlyValue: number;
  logo?: string;
}

interface CompanyUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastAccess?: string;
}

interface CompanyEvent {
  id: number;
  title: string;
  date: string;
  status: string;
  value: number;
}

export const CompanyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'subscription' | 'usage' | 'events' | 'financial' | 'logs' | 'support'>('overview');
  const [company, setCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [events, setEvents] = useState<CompanyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanyData();
  }, [id]);

  const loadCompanyData = () => {
    // Simulação - substituir por chamada API que busca dados da empresa específica
    setCompany({
      id: Number(id),
      name: 'Tech Solutions Ltda',
      cnpj: '12.345.678/0001-90',
      email: 'contato@techsolutions.com',
      phone: '(11) 3456-7890',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      plan: 'PRO',
      status: 'ACTIVE',
      createdAt: '2023-06-15',
      nextBillingDate: '2024-02-15',
      monthlyValue: 299.90
    });

    setUsers([
      { id: 1, name: 'João Silva', email: 'joao@techsolutions.com', role: 'Admin', status: 'active', lastAccess: '2024-01-15' },
      { id: 2, name: 'Maria Oliveira', email: 'maria@techsolutions.com', role: 'Gerente', status: 'active', lastAccess: '2024-01-14' },
      { id: 3, name: 'Pedro Costa', email: 'pedro@techsolutions.com', role: 'Usuário', status: 'inactive', lastAccess: '2023-12-10' }
    ]);

    setEvents([
      { id: 1, title: 'Festa de Aniversário', date: '2024-02-15', status: 'Agendado', value: 3500 },
      { id: 2, title: 'Casamento Silva', date: '2024-03-10', status: 'Confirmado', value: 15000 },
      { id: 3, title: 'Conferência Anual', date: '2024-01-20', status: 'Realizado', value: 8900 }
    ]);

    setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return styles.statusActive;
      case 'TRIAL': return styles.statusTrial;
      case 'SUSPENDED': return styles.statusSuspended;
      case 'CANCELLED': return styles.statusCancelled;
      default: return '';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Ativa';
      case 'TRIAL': return 'Trial';
      case 'SUSPENDED': return 'Suspensa';
      case 'CANCELLED': return 'Cancelada';
      default: return status;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'BASIC': return styles.planBasic;
      case 'PRO': return styles.planPro;
      case 'ENTERPRISE': return styles.planEnterprise;
      default: return '';
    }
  };

  const handleBack = () => {
    navigate('/developer/companies');
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando empresa...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className={styles.error}>
        <MdError size={48} />
        <h3>Empresa não encontrada</h3>
        <button onClick={handleBack} className={styles.backButton}>
          <MdArrowBack />
          Voltar para lista
        </button>
      </div>
    );
  }

  return (
    <div className={styles.companyDetails}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={handleBack} className={styles.backButton}>
          <MdArrowBack />
          Voltar
        </button>
        <h1 className={styles.title}>
          <MdBusiness />
          {company.name}
        </h1>
        <div className={styles.headerActions}>
          <button className={styles.editButton}>
            <MdEdit />
            Editar
          </button>
          {company.status === 'ACTIVE' ? (
            <button className={styles.suspendButton}>
              <MdBlock />
              Suspender
            </button>
          ) : company.status === 'SUSPENDED' ? (
            <button className={styles.activateButton}>
              <MdPlayArrow />
              Ativar
            </button>
          ) : null}
          <button className={styles.refreshButton} onClick={loadCompanyData}>
            <MdRefresh />
          </button>
        </div>
      </div>

      {/* Company Info Card */}
      <div className={styles.companyCard}>
        <div className={styles.companyHeader}>
          <div className={styles.companyInfo}>
            <div className={styles.companyAvatar}>
              {company.logo ? (
                <img src={company.logo} alt={company.name} />
              ) : (
                <MdBusiness />
              )}
            </div>
            <div className={styles.companyDetails}>
              <h2>{company.name}</h2>
              <p><MdBusiness /> CNPJ: {company.cnpj}</p>
              <p><MdEmail /> {company.email} • <MdPhone /> {company.phone}</p>
              <p><MdLocationOn /> {company.address}, {company.city}/{company.state}</p>
            </div>
          </div>
          <div className={styles.companyStatus}>
            <span className={`${styles.statusBadge} ${getStatusColor(company.status)}`}>
              {getStatusText(company.status)}
            </span>
            <span className={`${styles.planBadge} ${getPlanBadge(company.plan)}`}>
              Plano {company.plan}
            </span>
          </div>
        </div>

        <div className={styles.companyMetrics}>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Cadastro</span>
            <span className={styles.metricValue}>{formatDate(company.createdAt)}</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Próxima Cobrança</span>
            <span className={styles.metricValue}>{formatDate(company.nextBillingDate)}</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Valor Mensal</span>
            <span className={styles.metricValue}>{formatCurrency(company.monthlyValue)}</span>
          </div>
        </div>
      </div>

      {/* Tabs - TODAS AS INFORMAÇÕES DA EMPRESA AQUI DENTRO */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <MdBusiness />
          Visão Geral
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
          <FaFileInvoice />
          Assinatura
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'usage' ? styles.active : ''}`}
          onClick={() => setActiveTab('usage')}
        >
          <MdBarChart />
          Uso
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

      {/* Tab Content - TUDO AQUI DENTRO, sem precisar de outros arquivos */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.overview}>
            <h2>Visão Geral</h2>
            <div className={styles.overviewGrid}>
              <div className={styles.overviewCard}>
                <h3>Métricas Rápidas</h3>
                <div className={styles.overviewMetrics}>
                  <div>
                    <span>Usuários</span>
                    <strong>{users.length}</strong>
                  </div>
                  <div>
                    <span>Eventos</span>
                    <strong>{events.length}</strong>
                  </div>
                  <div>
                    <span>Receita Total</span>
                    <strong>{formatCurrency(events.reduce((acc, e) => acc + e.value, 0))}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className={styles.usersTab}>
            <h2>Usuários da Empresa</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Função</th>
                  <th>Status</th>
                  <th>Último Acesso</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span className={user.status === 'active' ? styles.statusActive : styles.statusInactive}>
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>{user.lastAccess ? formatDate(user.lastAccess) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'events' && (
          <div className={styles.eventsTab}>
            <h2>Eventos da Empresa</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id}>
                    <td>{event.title}</td>
                    <td>{formatDate(event.date)}</td>
                    <td>{event.status}</td>
                    <td>{formatCurrency(event.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Outras abas seguem o mesmo padrão - tudo dentro deste arquivo */}
      </div>
    </div>
  );
};