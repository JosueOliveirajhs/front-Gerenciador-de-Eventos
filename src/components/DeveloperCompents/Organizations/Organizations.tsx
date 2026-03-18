// src/components/DeveloperCompents/Organizations/Organizations.tsx
import React, { useState, useEffect } from 'react';
import { 
  MdAdd,
  MdSearch,
  MdFilterList,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdBusiness,
  MdAttachMoney,
  MdCalendarToday,
  MdRefresh,
  MdBlock,
  MdPlayArrow,
  MdCancel,
  MdClose,
  MdCheckCircle,
  MdWarning,
  MdMoreVert,
  MdDownload
} from 'react-icons/md';
import { organizationService } from '../../../services/organization';
import { Organization, PlanType, OrgStatus } from '../../../types/developer';
import { getPlanConfig, getAvailablePlans } from '../../../utils/planUtils';
import { getStatusConfig, getNextStatusOptions } from '../../../utils/statusUtils';
import { ConfirmationModal } from '../../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../../common/Alerts/ErrorModal';
import styles from './Organizations.module.css';

interface OrganizationsProps {
  onNavigate: (tab: string, view: string, id?: number) => void;
}

type ViewMode = 'table' | 'grid' | 'cards';

export const Organizations: React.FC<OrganizationsProps> = ({ onNavigate }) => {
  // Estados principais
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  
  // Estados de UI
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedOrganizations, setSelectedOrganizations] = useState<number[]>([]);
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    busca: '',
    status: undefined as OrgStatus | undefined,
    plan: undefined as PlanType | undefined
  });
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrganizations, setTotalOrganizations] = useState(0);
  
  // Estados de modais
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [statusMotivo, setStatusMotivo] = useState('');
  const [newStatus, setNewStatus] = useState<OrgStatus | null>(null);
  const [newPlan, setNewPlan] = useState<PlanType | null>(null);

  // Planos disponíveis
  const availablePlans = getAvailablePlans();

  useEffect(() => {
    loadOrganizations();
    loadStats();
  }, []);

  useEffect(() => {
    filterOrganizations();
  }, [organizations, filters]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const response = await organizationService.getAllOrganizations(
        { busca: filters.busca, status: filters.status, plan: filters.plan },
        currentPage
      );
      setOrganizations(response.organizations);
      setTotalPages(response.pages);
      setTotalOrganizations(response.total);
    } catch (error) {
      console.error('❌ Erro ao carregar organizações:', error);
      setError('Erro ao carregar lista de organizações');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await organizationService.getOrganizationStats();
      setStats(data);
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
    }
  };

  const filterOrganizations = () => {
    let filtered = [...organizations];

    if (filters.busca) {
      const term = filters.busca.toLowerCase();
      filtered = filtered.filter(org =>
        org.name.toLowerCase().includes(term) ||
        org.cnpj?.includes(term)
      );
    }

    setFilteredOrganizations(filtered);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadOrganizations();
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      busca: '',
      status: undefined,
      plan: undefined
    });
    setCurrentPage(1);
    loadOrganizations();
  };

  const handleViewOrganization = (id: number) => {
    onNavigate('organizations', 'details', id);
  };

  const handleEditOrganization = (id: number) => {
    onNavigate('organizations', 'form', id);
  };

  const handleNewOrganization = () => {
    onNavigate('organizations', 'form');
  };

  const handleDeleteOrganization = async () => {
    if (!selectedOrganization) return;

    try {
      await organizationService.deleteOrganization(selectedOrganization.id);
      await loadOrganizations();
      await loadStats();
      setShowDeleteConfirm(false);
      setSelectedOrganization(null);
    } catch (error) {
      console.error('❌ Erro ao deletar organização:', error);
      setError('Erro ao deletar organização');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedOrganizations.map(id => organizationService.deleteOrganization(id)));
      await loadOrganizations();
      await loadStats();
      setShowBulkDeleteConfirm(false);
      setSelectedOrganizations([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('❌ Erro ao deletar organizações:', error);
      setError('Erro ao deletar organizações selecionadas');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrganization || !newStatus) return;

    try {
      await organizationService.updateOrganizationStatus(selectedOrganization.id, newStatus, statusMotivo);
      await loadOrganizations();
      await loadStats();
      setShowStatusModal(false);
      setSelectedOrganization(null);
      setNewStatus(null);
      setStatusMotivo('');
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      setError('Erro ao atualizar status da organização');
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedOrganization || !newPlan) return;

    try {
      await organizationService.updateOrganizationPlan(selectedOrganization.id, newPlan);
      await loadOrganizations();
      setShowPlanModal(false);
      setSelectedOrganization(null);
      setNewPlan(null);
    } catch (error) {
      console.error('❌ Erro ao atualizar plano:', error);
      setError('Erro ao atualizar plano da organização');
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedOrganizations(prev =>
      prev.includes(id) ? prev.filter(orgId => orgId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrganizations.length === filteredOrganizations.length) {
      setSelectedOrganizations([]);
      setShowBulkActions(false);
    } else {
      setSelectedOrganizations(filteredOrganizations.map(c => c.id));
      setShowBulkActions(true);
    }
  };

  const handleExportData = () => {
    const data = filteredOrganizations.map(org => ({
      'ID': org.id,
      'Empresa': org.name,
      'CNPJ': org.cnpj || '-',
      'Plano': getPlanConfig(org.planType).label,
      'Status': getStatusConfig(org.status).text,
      'Cadastro': organizationService.formatDate(org.createdAt)
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `organizacoes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadgeClass = (status: OrgStatus) => {
    return getStatusConfig(status).badgeClass;
  };

  const getPlanBadgeClass = (plan: PlanType) => {
    return getPlanConfig(plan).badgeClass;
  };

  if (loading && organizations.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando organizações...</p>
      </div>
    );
  }

  return (
    <div className={styles.organizations}>
      {/* Header com estatísticas */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <MdBusiness />
            Organizações
          </h1>
          {stats && (
            <div className={styles.statsBadges}>
              <span className={styles.statBadge}>
                Total: {stats.total}
              </span>
              <span className={`${styles.statBadge} ${styles.activeBadge}`}>
                Ativas: {stats.active}
              </span>
              <span className={`${styles.statBadge} ${styles.trialBadge}`}>
                Trial: {stats.trial}
              </span>
              <span className={`${styles.statBadge} ${styles.suspendedBadge}`}>
                Suspensas: {stats.suspended}
              </span>
              <span className={`${styles.statBadge} ${styles.cancelledBadge}`}>
                Canceladas: {stats.cancelled}
              </span>
            </div>
          )}
        </div>

        <div className={styles.headerActions}>
          <button 
            className={styles.primaryButton}
            onClick={handleNewOrganization}
          >
            <MdAdd />
            Nova Organização
          </button>
          <button 
            className={`${styles.iconButton} ${showFilters ? styles.active : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Filtros"
          >
            <MdFilterList />
          </button>
          <button 
            className={styles.iconButton}
            onClick={loadOrganizations}
            title="Atualizar"
          >
            <MdRefresh />
          </button>
          <button 
            className={styles.iconButton}
            onClick={handleExportData}
            title="Exportar CSV"
          >
            <MdDownload />
          </button>
        </div>
      </div>

      {/* Barra de busca e visualização */}
      <div className={styles.searchBar}>
        <div className={styles.searchInput}>
          <MdSearch />
          <input
            type="text"
            placeholder="Buscar por nome ou CNPJ..."
            value={filters.busca}
            onChange={(e) => handleFilterChange('busca', e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
          />
          {filters.busca && (
            <button 
              className={styles.clearButton}
              onClick={() => handleFilterChange('busca', '')}
            >
              <MdClose />
            </button>
          )}
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

      {/* Painel de filtros */}
      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label>Status:</label>
            <select 
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            >
              <option value="">Todos</option>
              <option value="ACTIVE">Ativas</option>
              <option value="TRIAL">Trial</option>
              <option value="SUSPENDED">Suspensas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Plano:</label>
            <select 
              value={filters.plan || ''}
              onChange={(e) => handleFilterChange('plan', e.target.value || undefined)}
            >
              <option value="">Todos</option>
              {availablePlans.map(plan => (
                <option key={plan.value} value={plan.value}>
                  {plan.label}
                </option>
              ))}
            </select>
          </div>

          {(filters.status || filters.plan) && (
            <button 
              className={styles.clearFiltersButton}
              onClick={handleClearFilters}
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Ações em massa */}
      {selectedOrganizations.length > 0 && showBulkActions && (
        <div className={styles.bulkActions}>
          <span>{selectedOrganizations.length} organizações selecionadas</span>
          <div className={styles.bulkButtons}>
            <button 
              className={styles.bulkButton}
              onClick={() => setShowBulkDeleteConfirm(true)}
            >
              <MdDelete />
              Excluir
            </button>
            <button 
              className={styles.bulkButton}
              onClick={handleSelectAll}
            >
              Desmarcar todas
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
                    checked={selectedOrganizations.length === filteredOrganizations.length && filteredOrganizations.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Organização</th>
                <th>CNPJ</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrganizations.map(org => {
                const statusConfig = getStatusConfig(org.status);
                const planConfig = getPlanConfig(org.planType);
                
                return (
                  <tr key={org.id} className={selectedOrganizations.includes(org.id) ? styles.selectedRow : ''}>
                    <td className={styles.checkboxCell}>
                      <input
                        type="checkbox"
                        checked={selectedOrganizations.includes(org.id)}
                        onChange={() => handleToggleSelect(org.id)}
                      />
                    </td>
                    <td className={styles.companyCell}>
                      <div className={styles.companyInfo}>
                        <div className={styles.companyAvatar}>
                          <MdBusiness />
                        </div>
                        <div>
                          <strong>{org.name}</strong>
                          <small>ID: {org.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>{org.cnpj ? organizationService.formatCNPJ(org.cnpj) : '-'}</td>
                    <td>
                      <span className={`${styles.planBadge} ${planConfig.badgeClass}`}>
                        {planConfig.label}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${statusConfig.badgeClass}`}>
                        {statusConfig.text}
                      </span>
                    </td>
                    <td>
                      <div className={styles.dueDate}>
                        <MdCalendarToday />
                        {organizationService.formatDate(org.createdAt)}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button 
                          className={styles.actionButton}
                          onClick={() => handleViewOrganization(org.id)}
                          title="Visualizar"
                        >
                          <MdVisibility />
                        </button>
                        <button 
                          className={styles.actionButton}
                          onClick={() => handleEditOrganization(org.id)}
                          title="Editar"
                        >
                          <MdEdit />
                        </button>
                        <div className={styles.actionDropdown}>
                          <button 
                            className={styles.actionButton}
                            title="Mais ações"
                          >
                            <MdMoreVert />
                          </button>
                          <div className={styles.dropdownMenu}>
                            {getNextStatusOptions(org.status).map(status => (
                              <button
                                key={status}
                                onClick={() => {
                                  setSelectedOrganization(org);
                                  setNewStatus(status);
                                  setShowStatusModal(true);
                                }}
                              >
                                {status === 'ACTIVE' && <MdPlayArrow />}
                                {status === 'SUSPENDED' && <MdBlock />}
                                {status === 'CANCELLED' && <MdCancel />}
                                Alterar para {getStatusConfig(status).text}
                              </button>
                            ))}
                            <button
                              onClick={() => {
                                setSelectedOrganization(org);
                                setShowPlanModal(true);
                              }}
                            >
                              <MdAttachMoney />
                              Alterar Plano
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <span>Página {currentPage} de {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}

      {/* Visualização em Grid */}
      {viewMode === 'grid' && (
        <div className={styles.gridContainer}>
          {filteredOrganizations.map(org => {
            const statusConfig = getStatusConfig(org.status);
            const planConfig = getPlanConfig(org.planType);
            
            return (
              <div key={org.id} className={`${styles.gridCard} ${selectedOrganizations.includes(org.id) ? styles.selectedCard : ''}`}>
                <div className={styles.gridHeader}>
                  <input
                    type="checkbox"
                    checked={selectedOrganizations.includes(org.id)}
                    onChange={() => handleToggleSelect(org.id)}
                  />
                  <span className={`${styles.statusBadge} ${statusConfig.badgeClass}`}>
                    {statusConfig.text}
                  </span>
                </div>

                <div className={styles.gridAvatar}>
                  <MdBusiness />
                </div>

                <h3 className={styles.gridTitle}>{org.name}</h3>
                
                <div className={styles.gridInfo}>
                  <span><MdBusiness /> {org.cnpj ? organizationService.formatCNPJ(org.cnpj) : 'CNPJ não informado'}</span>
                  <span><MdCalendarToday /> Cadastro: {organizationService.formatDate(org.createdAt)}</span>
                </div>

                <div className={styles.gridFooter}>
                  <span className={`${styles.planBadge} ${planConfig.badgeClass}`}>
                    {planConfig.label}
                  </span>
                </div>

                <div className={styles.gridActions}>
                  <button 
                    className={styles.gridActionButton}
                    onClick={() => handleViewOrganization(org.id)}
                    title="Visualizar"
                  >
                    <MdVisibility />
                  </button>
                  <button 
                    className={styles.gridActionButton}
                    onClick={() => handleEditOrganization(org.id)}
                    title="Editar"
                  >
                    <MdEdit />
                  </button>
                  {getNextStatusOptions(org.status).map(status => (
                    <button
                      key={status}
                      className={`${styles.gridActionButton} ${
                        status === 'ACTIVE' ? styles.successButton :
                        status === 'SUSPENDED' ? styles.warningButton :
                        styles.dangerButton
                      }`}
                      onClick={() => {
                        setSelectedOrganization(org);
                        setNewStatus(status);
                        setShowStatusModal(true);
                      }}
                      title={`Alterar para ${getStatusConfig(status).text}`}
                    >
                      {status === 'ACTIVE' && <MdPlayArrow />}
                      {status === 'SUSPENDED' && <MdBlock />}
                      {status === 'CANCELLED' && <MdCancel />}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Visualização em Cards */}
      {viewMode === 'cards' && (
        <div className={styles.cardsContainer}>
          {filteredOrganizations.map(org => {
            const statusConfig = getStatusConfig(org.status);
            const planConfig = getPlanConfig(org.planType);
            
            return (
              <div key={org.id} className={styles.businessCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderLeft}>
                    <div className={styles.cardAvatar}>
                      <MdBusiness />
                    </div>
                    <div>
                      <h3>{org.name}</h3>
                      <span className={styles.cardId}>ID: {org.id}</span>
                    </div>
                  </div>
                  <span className={`${styles.statusBadge} ${statusConfig.badgeClass}`}>
                    {statusConfig.text}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardRow}>
                    <MdBusiness />
                    <span>CNPJ: {org.cnpj ? organizationService.formatCNPJ(org.cnpj) : 'Não informado'}</span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.cardFooterLeft}>
                    <span className={`${styles.planBadge} ${planConfig.badgeClass}`}>
                      {planConfig.label}
                    </span>
                    <span className={styles.cardDate}>
                      <MdCalendarToday />
                      Cadastro: {organizationService.formatDate(org.createdAt)}
                    </span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button 
                    className={styles.cardAction}
                    onClick={() => handleViewOrganization(org.id)}
                  >
                    <MdVisibility /> Ver Detalhes
                  </button>
                  <button 
                    className={styles.cardAction}
                    onClick={() => handleEditOrganization(org.id)}
                  >
                    <MdEdit /> Editar
                  </button>
                  {getNextStatusOptions(org.status).map(status => (
                    <button
                      key={status}
                      className={`${styles.cardAction} ${
                        status === 'ACTIVE' ? styles.successButton :
                        status === 'SUSPENDED' ? styles.warningButton :
                        styles.dangerButton
                      }`}
                      onClick={() => {
                        setSelectedOrganization(org);
                        setNewStatus(status);
                        setShowStatusModal(true);
                      }}
                    >
                      {status === 'ACTIVE' && <><MdPlayArrow /> Ativar</>}
                      {status === 'SUSPENDED' && <><MdBlock /> Suspender</>}
                      {status === 'CANCELLED' && <><MdCancel /> Cancelar</>}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredOrganizations.length === 0 && !loading && (
        <div className={styles.emptyState}>
          <MdBusiness size={48} />
          <h3>Nenhuma organização encontrada</h3>
          <p>
            {filters.busca || filters.status || filters.plan
              ? 'Tente ajustar seus filtros para encontrar organizações.'
              : 'Comece cadastrando sua primeira organização.'}
          </p>
          {filters.busca || filters.status || filters.plan ? (
            <button 
              className={styles.secondaryButton}
              onClick={handleClearFilters}
            >
              Limpar filtros
            </button>
          ) : (
            <button 
              className={styles.primaryButton}
              onClick={handleNewOrganization}
            >
              <MdAdd />
              Nova Organização
            </button>
          )}
        </div>
      )}

      {/* Modal de confirmação de exclusão individual */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a organização ${selectedOrganization?.name}?`}
        type="danger"
        onConfirm={handleDeleteOrganization}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSelectedOrganization(null);
        }}
        confirmText="Excluir"
        cancelText="Cancelar"
      />

      {/* Modal de confirmação de exclusão em massa */}
      <ConfirmationModal
        isOpen={showBulkDeleteConfirm}
        title="Excluir Organizações"
        message={`Tem certeza que deseja excluir ${selectedOrganizations.length} organizações?`}
        type="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => {
          setShowBulkDeleteConfirm(false);
          setShowBulkActions(false);
        }}
        confirmText="Excluir Todas"
        cancelText="Cancelar"
      />

      {/* Modal de alteração de status */}
      {showStatusModal && selectedOrganization && newStatus && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Alterar Status da Organização</h2>
              <button 
                className={styles.closeButton}
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedOrganization(null);
                  setNewStatus(null);
                  setStatusMotivo('');
                }}
              >
                <MdClose />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p>
                <strong>Organização:</strong> {selectedOrganization.name}
              </p>
              <p>
                <strong>Status atual:</strong>{' '}
                <span className={`${styles.statusBadge} ${getStatusConfig(selectedOrganization.status).badgeClass}`}>
                  {getStatusConfig(selectedOrganization.status).text}
                </span>
              </p>
              <p>
                <strong>Novo status:</strong>{' '}
                <span className={`${styles.statusBadge} ${getStatusConfig(newStatus).badgeClass}`}>
                  {getStatusConfig(newStatus).text}
                </span>
              </p>

              <div className={styles.formGroup}>
                <label htmlFor="motivo">Motivo da alteração:</label>
                <textarea
                  id="motivo"
                  value={statusMotivo}
                  onChange={(e) => setStatusMotivo(e.target.value)}
                  placeholder="Descreva o motivo da alteração de status..."
                  rows={4}
                  required
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedOrganization(null);
                  setNewStatus(null);
                  setStatusMotivo('');
                }}
              >
                Cancelar
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleUpdateStatus}
                disabled={!statusMotivo.trim()}
              >
                Confirmar Alteração
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de alteração de plano */}
      {showPlanModal && selectedOrganization && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Alterar Plano da Organização</h2>
              <button 
                className={styles.closeButton}
                onClick={() => {
                  setShowPlanModal(false);
                  setSelectedOrganization(null);
                  setNewPlan(null);
                }}
              >
                <MdClose />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p>
                <strong>Organização:</strong> {selectedOrganization.name}
              </p>
              <p>
                <strong>Plano atual:</strong>{' '}
                <span className={`${styles.planBadge} ${getPlanConfig(selectedOrganization.planType).badgeClass}`}>
                  {getPlanConfig(selectedOrganization.planType).label}
                </span>
              </p>

              <div className={styles.formGroup}>
                <label htmlFor="novoPlano">Novo plano:</label>
                <select
                  id="novoPlano"
                  value={newPlan || ''}
                  onChange={(e) => setNewPlan(e.target.value as PlanType)}
                >
                  <option value="">Selecione um plano</option>
                  {availablePlans.map(plan => (
                    <option key={plan.value} value={plan.value}>
                      {plan.label}
                    </option>
                  ))}
                </select>
              </div>

              {newPlan && (
                <div className={styles.planFeatures}>
                  <h4>Recursos do {getPlanConfig(newPlan).label}:</h4>
                  <ul>
                    {getPlanConfig(newPlan).features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowPlanModal(false);
                  setSelectedOrganization(null);
                  setNewPlan(null);
                }}
              >
                Cancelar
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleUpdatePlan}
                disabled={!newPlan || newPlan === selectedOrganization.planType}
              >
                Confirmar Alteração
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de erro */}
      <ErrorModal
        isOpen={!!error}
        message={error || ''}
        onClose={() => setError(null)}
      />
    </div>
  );
};