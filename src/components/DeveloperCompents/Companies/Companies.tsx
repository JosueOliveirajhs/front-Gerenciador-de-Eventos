// src/pages/developer/Companies.tsx

import React, { useState, useEffect } from 'react';
import { 
  MdAdd,
  MdSearch,
  MdFilterList,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdCheckCircle,
  MdCancel,
  MdWarning,
  MdRefresh,
  MdBusiness,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdCalendarToday,
  MdBlock,
  MdPlayArrow
} from 'react-icons/md';
import { FaRegBuilding, FaRegIdCard } from 'react-icons/fa';
import { companyService } from '../../../services/company';
import { Company } from '../../../types/developer';
import { ConfirmationModal } from '../../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../../common/Alerts/ErrorModal';
import styles from './Companies.module.css';

type ViewMode = 'table' | 'grid' | 'cards';
type FilterStatus = 'all' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
type FilterPlan = 'all' | 'BASIC' | 'PRO' | 'ENTERPRISE';

export const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [planFilter, setPlanFilter] = useState<FilterPlan>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkAction, setShowBulkAction] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'plan'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [companies, searchTerm, statusFilter, planFilter, sortBy, sortOrder]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getAllCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('❌ Erro ao carregar empresas:', error);
      setError('Erro ao carregar lista de empresas');
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = () => {
    let filtered = [...companies];

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(company =>
        company.nome.toLowerCase().includes(term) ||
        company.cnpj.includes(term) ||
        company.email.toLowerCase().includes(term) ||
        company.cidade.toLowerCase().includes(term)
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(company => 
        company.status === statusFilter
      );
    }

    // Filtro por plano
    if (planFilter !== 'all') {
      filtered = filtered.filter(company => 
        company.plano === planFilter
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.nome.localeCompare(b.nome);
          break;
        case 'date':
          comparison = new Date(a.dataCadastro).getTime() - new Date(b.dataCadastro).getTime();
          break;
        case 'plan':
          comparison = a.plano.localeCompare(b.plano);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredCompanies(filtered);
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;

    try {
      await companyService.deleteCompany(companyToDelete);
      setCompanies(prev => prev.filter(c => c.id !== companyToDelete));
      setShowDeleteConfirm(false);
      setCompanyToDelete(null);
    } catch (error) {
      console.error('❌ Erro ao deletar empresa:', error);
      setError('Erro ao deletar empresa');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedCompanies.map(id => companyService.deleteCompany(id)));
      setCompanies(prev => prev.filter(c => !selectedCompanies.includes(c.id)));
      setSelectedCompanies([]);
      setShowBulkAction(false);
    } catch (error) {
      console.error('❌ Erro ao deletar empresas:', error);
      setError('Erro ao deletar empresas selecionadas');
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedCompanies(prev =>
      prev.includes(id)
        ? prev.filter(companyId => companyId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedCompanies.length === filteredCompanies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(filteredCompanies.map(c => c.id));
    }
  };

  const handleToggleStatus = async (company: Company) => {
    try {
      const newStatus = company.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const updated = await companyService.toggleCompanyStatus(company.id, newStatus);
      setCompanies(prev => prev.map(c => c.id === company.id ? updated : c));
    } catch (error) {
      console.error('❌ Erro ao alterar status:', error);
      setError('Erro ao alterar status da empresa');
    }
  };

  const handleSuspendCompany = async (id: number) => {
    try {
      const updated = await companyService.toggleCompanyStatus(id, 'SUSPENDED');
      setCompanies(prev => prev.map(c => c.id === id ? updated : c));
    } catch (error) {
      console.error('❌ Erro ao suspender empresa:', error);
      setError('Erro ao suspender empresa');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE': return styles.statusActive;
      case 'INACTIVE': return styles.statusInactive;
      case 'SUSPENDED': return styles.statusSuspended;
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <MdCheckCircle />;
      case 'INACTIVE': return <MdCancel />;
      case 'SUSPENDED': return <MdWarning />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Ativo';
      case 'INACTIVE': return 'Inativo';
      case 'SUSPENDED': return 'Suspenso';
      default: return status;
    }
  };

  const getPlanBadgeClass = (plan: string) => {
    switch (plan) {
      case 'BASIC': return styles.planBasic;
      case 'PRO': return styles.planPro;
      case 'ENTERPRISE': return styles.planEnterprise;
      default: return '';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando empresas...</p>
      </div>
    );
  }

  return (
    <div className={styles.companies}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <MdBusiness />
            Empresas
          </h1>
          <span className={styles.totalCount}>
            Total: {filteredCompanies.length} empresas
          </span>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.primaryButton}>
            <MdAdd />
            Nova Empresa
          </button>
          <button 
            className={`${styles.iconButton} ${showFilters ? styles.active : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <MdFilterList />
          </button>
          <button 
            className={styles.iconButton}
            onClick={loadCompanies}
          >
            <MdRefresh />
          </button>
        </div>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className={styles.searchBar}>
        <div className={styles.searchInput}>
          <MdSearch />
          <input
            type="text"
            placeholder="Buscar por nome, CNPJ, email ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.viewToggle}>
          <button 
            className={`${styles.viewButton} ${viewMode === 'table' ? styles.active : ''}`}
            onClick={() => setViewMode('table')}
          >
            Tabela
          </button>
          <button 
            className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </button>
          <button 
            className={`${styles.viewButton} ${viewMode === 'cards' ? styles.active : ''}`}
            onClick={() => setViewMode('cards')}
          >
            Cards
          </button>
        </div>
      </div>

      {/* Filtros Expandidos */}
      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label>Status:</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            >
              <option value="all">Todos</option>
              <option value="ACTIVE">Ativos</option>
              <option value="INACTIVE">Inativos</option>
              <option value="SUSPENDED">Suspensos</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Plano:</label>
            <select 
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as FilterPlan)}
            >
              <option value="all">Todos</option>
              <option value="BASIC">Basic</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Ordenar por:</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="date">Data de Cadastro</option>
              <option value="name">Nome</option>
              <option value="plan">Plano</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Ordem:</label>
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            >
              <option value="desc">Decrescente</option>
              <option value="asc">Crescente</option>
            </select>
          </div>
        </div>
      )}

      {/* Ações em Massa */}
      {selectedCompanies.length > 0 && (
        <div className={styles.bulkActions}>
          <span>{selectedCompanies.length} empresas selecionadas</span>
          <div className={styles.bulkButtons}>
            <button 
              className={styles.bulkButton}
              onClick={() => setShowBulkAction(true)}
            >
              <MdDelete />
              Excluir Selecionadas
            </button>
            <button 
              className={styles.bulkButton}
              onClick={handleSelectAll}
            >
              Desmarcar Todas
            </button>
          </div>
        </div>
      )}

      {/* Visualização em Tabela */}
      {viewMode === 'table' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={selectedCompanies.length === filteredCompanies.length && filteredCompanies.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Empresa</th>
                <th>CNPJ</th>
                <th>Contato</th>
                <th>Localização</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Vencimento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map(company => (
                <tr key={company.id} className={selectedCompanies.includes(company.id) ? styles.selectedRow : ''}>
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={selectedCompanies.includes(company.id)}
                      onChange={() => handleToggleSelect(company.id)}
                    />
                  </td>
                  <td className={styles.companyCell}>
                    <div className={styles.companyInfo}>
                      <div className={styles.companyAvatar}>
                        {company.logo ? (
                          <img src={company.logo} alt={company.nome} />
                        ) : (
                          <FaRegBuilding />
                        )}
                      </div>
                      <div>
                        <strong>{company.nome}</strong>
                        <small>ID: {company.id}</small>
                      </div>
                    </div>
                  </td>
                  <td>{formatCNPJ(company.cnpj)}</td>
                  <td>
                    <div className={styles.contactInfo}>
                      <span><MdEmail /> {company.email}</span>
                      <span><MdPhone /> {company.telefone}</span>
                    </div>
                  </td>
                  <td>
                    <span><MdLocationOn /> {company.cidade}/{company.estado}</span>
                  </td>
                  <td>
                    <span className={`${styles.planBadge} ${getPlanBadgeClass(company.plano)}`}>
                      {company.plano}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(company.status)}`}>
                      {getStatusIcon(company.status)}
                      {getStatusText(company.status)}
                    </span>
                  </td>
                  <td>
                    <span className={styles.dueDate}>
                      <MdCalendarToday />
                      {formatDate(company.dataVencimento)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button 
                        className={styles.actionButton}
                        title="Visualizar"
                      >
                        <MdVisibility />
                      </button>
                      <button 
                        className={styles.actionButton}
                        title="Editar"
                      >
                        <MdEdit />
                      </button>
                      {company.status === 'ACTIVE' ? (
                        <button 
                          className={`${styles.actionButton} ${styles.warningButton}`}
                          onClick={() => handleToggleStatus(company)}
                          title="Inativar"
                        >
                          <MdCancel />
                        </button>
                      ) : company.status === 'INACTIVE' ? (
                        <button 
                          className={`${styles.actionButton} ${styles.successButton}`}
                          onClick={() => handleToggleStatus(company)}
                          title="Ativar"
                        >
                          <MdPlayArrow />
                        </button>
                      ) : null}
                      <button 
                        className={`${styles.actionButton} ${styles.dangerButton}`}
                        onClick={() => {
                          setCompanyToDelete(company.id);
                          setShowDeleteConfirm(true);
                        }}
                        title="Excluir"
                      >
                        <MdDelete />
                      </button>
                      <button 
                        className={`${styles.actionButton} ${styles.suspendButton}`}
                        onClick={() => handleSuspendCompany(company.id)}
                        title="Suspender"
                      >
                        <MdBlock />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Visualização em Grid */}
      {viewMode === 'grid' && (
        <div className={styles.gridContainer}>
          {filteredCompanies.map(company => (
            <div key={company.id} className={`${styles.gridCard} ${selectedCompanies.includes(company.id) ? styles.selectedCard : ''}`}>
              <div className={styles.gridHeader}>
                <input
                  type="checkbox"
                  checked={selectedCompanies.includes(company.id)}
                  onChange={() => handleToggleSelect(company.id)}
                />
                <span className={`${styles.statusBadge} ${getStatusBadgeClass(company.status)}`}>
                  {getStatusIcon(company.status)}
                  {getStatusText(company.status)}
                </span>
              </div>

              <div className={styles.gridAvatar}>
                {company.logo ? (
                  <img src={company.logo} alt={company.nome} />
                ) : (
                  <FaRegBuilding />
                )}
              </div>

              <h3 className={styles.gridTitle}>{company.nome}</h3>
              
              <div className={styles.gridInfo}>
                <span><FaRegIdCard /> {formatCNPJ(company.cnpj)}</span>
                <span><MdEmail /> {company.email}</span>
                <span><MdPhone /> {company.telefone}</span>
                <span><MdLocationOn /> {company.cidade}, {company.estado}</span>
              </div>

              <div className={styles.gridFooter}>
                <span className={`${styles.planBadge} ${getPlanBadgeClass(company.plano)}`}>
                  {company.plano}
                </span>
                <span className={styles.dueDate}>
                  <MdCalendarToday />
                  {formatDate(company.dataVencimento)}
                </span>
              </div>

              <div className={styles.gridActions}>
                <button className={styles.gridActionButton} title="Visualizar">
                  <MdVisibility />
                </button>
                <button className={styles.gridActionButton} title="Editar">
                  <MdEdit />
                </button>
                {company.status === 'ACTIVE' ? (
                  <button 
                    className={`${styles.gridActionButton} ${styles.warningButton}`}
                    onClick={() => handleToggleStatus(company)}
                    title="Inativar"
                  >
                    <MdCancel />
                  </button>
                ) : company.status === 'INACTIVE' ? (
                  <button 
                    className={`${styles.gridActionButton} ${styles.successButton}`}
                    onClick={() => handleToggleStatus(company)}
                    title="Ativar"
                  >
                    <MdPlayArrow />
                  </button>
                ) : null}
                <button 
                  className={`${styles.gridActionButton} ${styles.dangerButton}`}
                  onClick={() => {
                    setCompanyToDelete(company.id);
                    setShowDeleteConfirm(true);
                  }}
                  title="Excluir"
                >
                  <MdDelete />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visualização em Cards */}
      {viewMode === 'cards' && (
        <div className={styles.cardsContainer}>
          {filteredCompanies.map(company => (
            <div key={company.id} className={styles.businessCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <div className={styles.cardAvatar}>
                    {company.logo ? (
                      <img src={company.logo} alt={company.nome} />
                    ) : (
                      <FaRegBuilding />
                    )}
                  </div>
                  <div>
                    <h3>{company.nome}</h3>
                    <span className={styles.cardId}>ID: {company.id}</span>
                  </div>
                </div>
                <span className={`${styles.statusBadge} ${getStatusBadgeClass(company.status)}`}>
                  {getStatusIcon(company.status)}
                  {getStatusText(company.status)}
                </span>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardRow}>
                  <FaRegIdCard />
                  <span>{formatCNPJ(company.cnpj)}</span>
                </div>
                <div className={styles.cardRow}>
                  <MdEmail />
                  <span>{company.email}</span>
                </div>
                <div className={styles.cardRow}>
                  <MdPhone />
                  <span>{company.telefone}</span>
                </div>
                <div className={styles.cardRow}>
                  <MdLocationOn />
                  <span>{company.endereco}, {company.cidade} - {company.estado}, {company.cep}</span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.cardFooterLeft}>
                  <span className={`${styles.planBadge} ${getPlanBadgeClass(company.plano)}`}>
                    {company.plano}
                  </span>
                  <span className={styles.cardDate}>
                    <MdCalendarToday />
                    Cadastro: {formatDate(company.dataCadastro)}
                  </span>
                </div>
                <span className={styles.cardDueDate}>
                  Vence: {formatDate(company.dataVencimento)}
                </span>
              </div>

              <div className={styles.cardActions}>
                <button className={styles.cardAction} title="Visualizar">
                  <MdVisibility /> Ver Detalhes
                </button>
                <button className={styles.cardAction} title="Editar">
                  <MdEdit /> Editar
                </button>
                {company.status === 'ACTIVE' ? (
                  <button 
                    className={`${styles.cardAction} ${styles.warningButton}`}
                    onClick={() => handleToggleStatus(company)}
                  >
                    <MdCancel /> Inativar
                  </button>
                ) : company.status === 'INACTIVE' ? (
                  <button 
                    className={`${styles.cardAction} ${styles.successButton}`}
                    onClick={() => handleToggleStatus(company)}
                  >
                    <MdPlayArrow /> Ativar
                  </button>
                ) : null}
                <button 
                  className={`${styles.cardAction} ${styles.dangerButton}`}
                  onClick={() => {
                    setCompanyToDelete(company.id);
                    setShowDeleteConfirm(true);
                  }}
                >
                  <MdDelete /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mensagem quando não há resultados */}
      {filteredCompanies.length === 0 && (
        <div className={styles.emptyState}>
          <MdBusiness size={48} />
          <h3>Nenhuma empresa encontrada</h3>
          <p>Tente ajustar seus filtros ou criar uma nova empresa.</p>
          <button className={styles.primaryButton}>
            <MdAdd />
            Nova Empresa
          </button>
        </div>
      )}

      {/* Modais */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos."
        type="danger"
        onConfirm={handleDeleteCompany}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setCompanyToDelete(null);
        }}
        confirmText="Excluir"
        cancelText="Cancelar"
      />

      <ConfirmationModal
        isOpen={showBulkAction}
        title="Excluir Empresas"
        message={`Tem certeza que deseja excluir ${selectedCompanies.length} empresas? Esta ação não pode ser desfeita.`}
        type="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkAction(false)}
        confirmText="Excluir Todas"
        cancelText="Cancelar"
      />

      <ErrorModal
        isOpen={!!error}
        message={error || ''}
        onClose={() => setError(null)}
      />
    </div>
  );
};