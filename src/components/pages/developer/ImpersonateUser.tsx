// src/components/developer/ImpersonateUser.tsx

import React, { useState } from 'react';
import {
  MdPerson,
  MdBusiness,
  MdWarning,
  MdCheckCircle,
  MdClose,
  MdSearch,
  MdFilterList,
  MdVisibility,
  MdLogin,
  MdExitToApp,
  MdSecurity,
  MdHistory,
  MdAccessTime
} from 'react-icons/md';
import { FaUserSecret, FaShieldAlt } from 'react-icons/fa';
import styles from './ImpersonateUser.module.css';

interface User {
  id: number;
  name: string;
  email: string;
  companyId: number;
  companyName: string;
  role: string;
  lastLogin?: string;
  avatar?: string;
}

interface ImpersonationSession {
  id: number;
  userId: number;
  userName: string;
  companyId: number;
  companyName: string;
  startedAt: string;
  endedAt?: string;
  reason?: string;
}

export const ImpersonateUser: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<ImpersonationSession | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [reason, setReason] = useState('');

  // Dados simulados
  const companies = [
    { id: 1, name: 'Tech Solutions Ltda' },
    { id: 2, name: 'Construtora Alpha' },
    { id: 3, name: 'Studio Design' },
    { id: 4, name: 'Consultoria Beta' }
  ];

  const users: User[] = [
    {
      id: 101,
      name: 'João Silva',
      email: 'joao@techsolutions.com',
      companyId: 1,
      companyName: 'Tech Solutions Ltda',
      role: 'Administrador',
      lastLogin: '2024-01-15T09:30:00'
    },
    {
      id: 102,
      name: 'Maria Oliveira',
      email: 'maria@alpha.com.br',
      companyId: 2,
      companyName: 'Construtora Alpha',
      role: 'Gerente',
      lastLogin: '2024-01-14T14:20:00'
    },
    {
      id: 103,
      name: 'Pedro Costa',
      email: 'pedro@studiodesign.com',
      companyId: 3,
      companyName: 'Studio Design',
      role: 'Usuário',
      lastLogin: '2024-01-13T11:45:00'
    },
    {
      id: 104,
      name: 'Ana Souza',
      email: 'ana@beta.com.br',
      companyId: 4,
      companyName: 'Consultoria Beta',
      role: 'Financeiro',
      lastLogin: '2024-01-12T16:30:00'
    }
  ];

  const [impersonationHistory, setImpersonationHistory] = useState<ImpersonationSession[]>([
    {
      id: 1,
      userId: 101,
      userName: 'João Silva',
      companyId: 1,
      companyName: 'Tech Solutions Ltda',
      startedAt: '2024-01-10T10:00:00',
      endedAt: '2024-01-10T10:15:00',
      reason: 'Suporte - Problema no relatório'
    },
    {
      id: 2,
      userId: 103,
      userName: 'Pedro Costa',
      companyId: 3,
      companyName: 'Studio Design',
      startedAt: '2024-01-09T14:30:00',
      endedAt: '2024-01-09T14:45:00',
      reason: 'Diagnóstico de erro'
    }
  ]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = selectedCompany === 'all' || user.companyId.toString() === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  const handleImpersonate = (user: User) => {
    setSelectedUser(user);
    setShowConfirmModal(true);
  };

  const confirmImpersonate = () => {
    if (!selectedUser) return;

    // Iniciar sessão de impersonificação
    const newSession: ImpersonationSession = {
      id: Date.now(),
      userId: selectedUser.id,
      userName: selectedUser.name,
      companyId: selectedUser.companyId,
      companyName: selectedUser.companyName,
      startedAt: new Date().toISOString(),
      reason: reason || undefined
    };

    setActiveSession(newSession);
    setImpersonationHistory([newSession, ...impersonationHistory]);
    setShowConfirmModal(false);
    setSelectedUser(null);
    setReason('');

    // Aqui você implementaria a lógica real de impersonificação
    console.log('🔐 Impersonificando usuário:', selectedUser);
    // Redirecionar para o dashboard do usuário
    // window.location.href = `/impersonate/${selectedUser.id}`;
  };

  const stopImpersonation = () => {
    if (activeSession) {
      // Atualizar sessão com horário de término
      const updatedHistory = impersonationHistory.map(session =>
        session.id === activeSession.id
          ? { ...session, endedAt: new Date().toISOString() }
          : session
      );
      setImpersonationHistory(updatedHistory);
      setActiveSession(null);
      
      // Redirecionar de volta para o admin
      console.log('🔚 Finalizando impersonificação');
      // window.location.href = '/admin';
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

  return (
    <div className={styles.impersonate}>
      {/* Active Session Banner */}
      {activeSession && (
        <div className={styles.activeSession}>
          <div className={styles.sessionInfo}>
            <FaUserSecret className={styles.sessionIcon} />
            <div>
              <strong>Sessão ativa como {activeSession.userName}</strong>
              <span>Empresa: {activeSession.companyName}</span>
            </div>
          </div>
          <button
            className={styles.stopButton}
            onClick={stopImpersonation}
          >
            <MdExitToApp />
            Voltar ao Admin
          </button>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <FaUserSecret />
            Login como Usuário
          </h1>
          <div className={styles.warningBadge}>
            <MdWarning />
            Modo de Suporte
          </div>
        </div>

        <button
          className={styles.historyButton}
          onClick={() => setShowHistory(!showHistory)}
        >
          <MdHistory />
          Histórico
        </button>
      </div>

      {/* Search and Filters */}
      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <MdSearch />
          <input
            type="text"
            placeholder="Buscar usuário por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className={styles.filterSelect}
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
        >
          <option value="all">Todas empresas</option>
          {companies.map(company => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className={styles.historyPanel}>
          <h3>Histórico de Acessos</h3>
          <div className={styles.historyList}>
            {impersonationHistory.map(session => (
              <div key={session.id} className={styles.historyItem}>
                <div className={styles.historyIcon}>
                  <FaUserSecret />
                </div>
                <div className={styles.historyDetails}>
                  <strong>{session.userName}</strong>
                  <span>{session.companyName}</span>
                  <div className={styles.historyMeta}>
                    <span>
                      <MdAccessTime />
                      Início: {formatDate(session.startedAt)}
                    </span>
                    {session.endedAt && (
                      <span>
                        <MdAccessTime />
                        Fim: {formatDate(session.endedAt)}
                      </span>
                    )}
                    {session.reason && (
                      <span className={styles.historyReason}>
                        Motivo: {session.reason}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users List */}
      <div className={styles.usersList}>
        {filteredUsers.map(user => (
          <div key={user.id} className={styles.userCard}>
            <div className={styles.userAvatar}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <MdPerson />
              )}
            </div>

            <div className={styles.userInfo}>
              <h3>{user.name}</h3>
              <p>{user.email}</p>
              <div className={styles.userMeta}>
                <span className={styles.userCompany}>
                  <MdBusiness />
                  {user.companyName}
                </span>
                <span className={styles.userRole}>
                  {user.role}
                </span>
              </div>
              {user.lastLogin && (
                <span className={styles.lastLogin}>
                  Último acesso: {formatTimeAgo(user.lastLogin)}
                </span>
              )}
            </div>

            <div className={styles.userActions}>
              <button
                className={styles.impersonateButton}
                onClick={() => handleImpersonate(user)}
                disabled={!!activeSession}
              >
                <MdLogin />
                Acessar como
              </button>
              <button className={styles.viewButton}>
                <MdVisibility />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedUser && (
        <div className={styles.modal} onClick={() => setShowConfirmModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                <FaShieldAlt />
                Confirmar Acesso
              </h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowConfirmModal(false)}
              >
                <MdClose />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.warningBox}>
                <MdWarning />
                <p>
                  Você está prestes a acessar o sistema como{' '}
                  <strong>{selectedUser.name}</strong> da empresa{' '}
                  <strong>{selectedUser.companyName}</strong>.
                </p>
              </div>

              <p className={styles.modalText}>
                Todas as ações realizadas serão registradas para auditoria.
                Use este recurso apenas para suporte e diagnóstico.
              </p>

              <div className={styles.formGroup}>
                <label htmlFor="reason">Motivo do acesso (opcional)</label>
                <input
                  type="text"
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Suporte, diagnóstico, etc."
                />
              </div>

              <div className={styles.userPreview}>
                <MdPerson />
                <div>
                  <strong>{selectedUser.name}</strong>
                  <span>{selectedUser.email}</span>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.confirmButton}
                onClick={confirmImpersonate}
              >
                <MdLogin />
                Acessar como {selectedUser.name}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};