// src/pages/developer/GlobalSupport.tsx

import React, { useState } from 'react';
import {
  MdSearch,
  MdFilterList,
  MdRefresh,
  MdAdd,
  MdReply,
  MdCheckCircle,
  MdWarning,
  MdError,
  MdInfo,
  MdPerson,
  MdBusiness,
  MdSchedule,
  MdAttachFile,
  MdSend,
  MdClose,
  MdMoreVert,
  MdAssignment,
  MdPriorityHigh,
  MdAccessTime
} from 'react-icons/md';
import { FaTicketAlt, FaUsers, FaChartLine } from 'react-icons/fa';
import styles from './GlobalSupport.module.css';

interface Ticket {
  id: number;
  companyId: number;
  companyName: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'technical' | 'billing' | 'feature' | 'bug' | 'other';
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  sla?: string;
  tags: string[];
  attachments?: { name: string; url: string }[];
}

interface Message {
  id: number;
  ticketId: number;
  userId: number;
  userName: string;
  userType: 'agent' | 'client';
  message: string;
  attachments?: { name: string; url: string }[];
  createdAt: string;
}

export const GlobalSupport: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 1,
      companyId: 101,
      companyName: 'Tech Solutions Ltda',
      subject: 'Erro ao gerar relatório financeiro',
      description: 'Ao tentar gerar o relatório mensal, o sistema retorna erro 500.',
      status: 'open',
      priority: 'high',
      category: 'bug',
      createdBy: 'João Silva',
      createdAt: '2024-01-15T09:30:00',
      updatedAt: '2024-01-15T09:30:00',
      sla: '4h',
      tags: ['relatório', 'erro']
    },
    {
      id: 2,
      companyId: 102,
      companyName: 'Construtora Alpha',
      subject: 'Dúvida sobre plano Enterprise',
      description: 'Gostaria de saber mais detalhes sobre o plano Enterprise e migração.',
      status: 'in_progress',
      priority: 'medium',
      category: 'feature',
      createdBy: 'Maria Oliveira',
      assignedTo: 'Carlos Santos',
      createdAt: '2024-01-14T14:20:00',
      updatedAt: '2024-01-15T10:15:00',
      sla: '24h',
      tags: ['plano', 'vendas']
    },
    {
      id: 3,
      companyId: 103,
      companyName: 'Studio Design',
      subject: 'Cobrança duplicada',
      description: 'Fatura do mês de janeiro foi cobrada duas vezes.',
      status: 'waiting',
      priority: 'critical',
      category: 'billing',
      createdBy: 'Pedro Costa',
      assignedTo: 'Ana Paula',
      createdAt: '2024-01-13T11:45:00',
      updatedAt: '2024-01-14T16:30:00',
      sla: '2h',
      tags: ['financeiro', 'cobrança']
    }
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      ticketId: 2,
      userId: 1,
      userName: 'Carlos Santos',
      userType: 'agent',
      message: 'Olá Maria, poderia me informar qual o volume de eventos mensal da sua empresa?',
      createdAt: '2024-01-15T10:15:00'
    },
    {
      id: 2,
      ticketId: 2,
      userId: 102,
      userName: 'Maria Oliveira',
      userType: 'client',
      message: 'Cerca de 50 eventos por mês. Estamos crescendo bastante!',
      createdAt: '2024-01-15T10:30:00'
    }
  ]);

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [newMessage, setNewMessage] = useState('');

  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    waiting: tickets.filter(t => t.status === 'waiting').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    critical: tickets.filter(t => t.priority === 'critical').length,
    avgResponse: '2.5h'
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return styles.priorityLow;
      case 'medium': return styles.priorityMedium;
      case 'high': return styles.priorityHigh;
      case 'critical': return styles.priorityCritical;
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return styles.statusOpen;
      case 'in_progress': return styles.statusProgress;
      case 'waiting': return styles.statusWaiting;
      case 'resolved': return styles.statusResolved;
      case 'closed': return styles.statusClosed;
      default: return '';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <MdError className={styles.priorityCritical} />;
      case 'high':
        return <MdPriorityHigh className={styles.priorityHigh} />;
      case 'medium':
        return <MdWarning className={styles.priorityMedium} />;
      case 'low':
        return <MdInfo className={styles.priorityLow} />;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <MdAccessTime />;
      case 'in_progress':
        return <MdAssignment />;
      case 'waiting':
        return <MdSchedule />;
      case 'resolved':
        return <MdCheckCircle />;
      case 'closed':
        return <MdClose />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}min atrás`;
    return 'agora';
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const ticketMessages = messages.filter(m => m.ticketId === selectedTicket?.id);

  return (
    <div className={styles.support}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <FaTicketAlt />
            Suporte Global
          </h1>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.primaryButton}>
            <MdAdd />
            Novo Ticket
          </button>
          <button className={styles.refreshButton}>
            <MdRefresh />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#dbeafe', color: '#2563eb' }}>
            <FaTicketAlt />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Abertos</span>
            <span className={styles.statValue}>{stats.open}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
            <MdAssignment />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Em Andamento</span>
            <span className={styles.statValue}>{stats.inProgress}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fee2e2', color: '#dc2626' }}>
            <MdPriorityHigh />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Críticos</span>
            <span className={styles.statValue}>{stats.critical}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#d1fae5', color: '#059669' }}>
            <MdCheckCircle />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Resolvidos</span>
            <span className={styles.statValue}>{stats.resolved}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#f3e8ff', color: '#7c3aed' }}>
            <MdAccessTime />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Tempo Médio</span>
            <span className={styles.statValue}>{stats.avgResponse}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <MdSearch />
          <input
            type="text"
            placeholder="Buscar tickets por assunto, empresa ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.filters}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Todos os status</option>
            <option value="open">Abertos</option>
            <option value="in_progress">Em Andamento</option>
            <option value="waiting">Aguardando</option>
            <option value="resolved">Resolvidos</option>
            <option value="closed">Fechados</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Todas prioridades</option>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="critical">Crítica</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className={styles.ticketsList}>
        {filteredTickets.map(ticket => (
          <div
            key={ticket.id}
            className={styles.ticketCard}
            onClick={() => setSelectedTicket(ticket)}
          >
            <div className={styles.ticketHeader}>
              <div className={styles.ticketCompany}>
                <MdBusiness />
                <span>{ticket.companyName}</span>
              </div>
              <div className={styles.ticketPriority}>
                {getPriorityIcon(ticket.priority)}
                <span className={getPriorityColor(ticket.priority)}>
                  {ticket.priority === 'critical' ? 'Crítica' :
                   ticket.priority === 'high' ? 'Alta' :
                   ticket.priority === 'medium' ? 'Média' : 'Baixa'}
                </span>
              </div>
            </div>

            <h3 className={styles.ticketSubject}>{ticket.subject}</h3>
            <p className={styles.ticketDescription}>{ticket.description}</p>

            <div className={styles.ticketFooter}>
              <div className={styles.ticketMeta}>
                <span className={`${styles.ticketStatus} ${getStatusColor(ticket.status)}`}>
                  {getStatusIcon(ticket.status)}
                  {ticket.status === 'open' ? 'Aberto' :
                   ticket.status === 'in_progress' ? 'Em Andamento' :
                   ticket.status === 'waiting' ? 'Aguardando' :
                   ticket.status === 'resolved' ? 'Resolvido' : 'Fechado'}
                </span>
                <span className={styles.ticketSla}>
                  SLA: {ticket.sla}
                </span>
              </div>

              <div className={styles.ticketTime}>
                <MdSchedule />
                <span>{formatTimeAgo(ticket.updatedAt)}</span>
              </div>
            </div>

            {ticket.assignedTo && (
              <div className={styles.ticketAssigned}>
                <MdPerson />
                <span>Atribuído para: {ticket.assignedTo}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className={styles.modal} onClick={() => setSelectedTicket(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>{selectedTicket.subject}</h2>
                <span className={`${styles.ticketStatus} ${getStatusColor(selectedTicket.status)}`}>
                  {getStatusIcon(selectedTicket.status)}
                  {selectedTicket.status === 'open' ? 'Aberto' :
                   selectedTicket.status === 'in_progress' ? 'Em Andamento' :
                   selectedTicket.status === 'waiting' ? 'Aguardando' :
                   selectedTicket.status === 'resolved' ? 'Resolvido' : 'Fechado'}
                </span>
              </div>
              <button className={styles.closeButton} onClick={() => setSelectedTicket(null)}>
                <MdClose />
              </button>
            </div>

            <div className={styles.ticketInfo}>
              <div className={styles.infoRow}>
                <MdBusiness />
                <span>Empresa: {selectedTicket.companyName}</span>
              </div>
              <div className={styles.infoRow}>
                <MdPerson />
                <span>Criado por: {selectedTicket.createdBy}</span>
              </div>
              <div className={styles.infoRow}>
                <MdSchedule />
                <span>Criado em: {formatDate(selectedTicket.createdAt)}</span>
              </div>
              <div className={styles.infoRow}>
                {getPriorityIcon(selectedTicket.priority)}
                <span>Prioridade: </span>
                <span className={getPriorityColor(selectedTicket.priority)}>
                  {selectedTicket.priority === 'critical' ? 'Crítica' :
                   selectedTicket.priority === 'high' ? 'Alta' :
                   selectedTicket.priority === 'medium' ? 'Média' : 'Baixa'}
                </span>
              </div>
            </div>

            <div className={styles.ticketDescription}>
              <h3>Descrição</h3>
              <p>{selectedTicket.description}</p>
            </div>

            <div className={styles.ticketMessages}>
              <h3>Conversa</h3>
              <div className={styles.messagesList}>
                {ticketMessages.map(message => (
                  <div
                    key={message.id}
                    className={`${styles.message} ${message.userType === 'agent' ? styles.agentMessage : styles.clientMessage}`}
                  >
                    <div className={styles.messageHeader}>
                      <strong>{message.userName}</strong>
                      <span>{formatTimeAgo(message.createdAt)}</span>
                    </div>
                    <p>{message.message}</p>
                  </div>
                ))}
              </div>

              <div className={styles.messageInput}>
                <textarea
                  placeholder="Digite sua resposta..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button className={styles.sendButton}>
                  <MdSend />
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};