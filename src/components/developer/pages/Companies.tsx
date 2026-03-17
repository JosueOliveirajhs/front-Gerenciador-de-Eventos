import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MdAdd,
  MdSearch,
  MdFilterList,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdMoreVert,
  MdBusiness,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdStar,
  MdNote,
  MdCheckCircle,
  MdInfoOutline,
  MdClose,
  MdRefresh,
  MdDownload
} from 'react-icons/md';
import { companyService, EmpresaResponse } from '../../../services/company';
import { CompanyFilters } from '../../../types/developer';
import { ConfirmationModal } from '../../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../../common/Alerts/ErrorModal';
import styles from './Companies.module.css';

type ViewMode = 'grid' | 'table';

export const Companies: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados principais
  const [companies, setCompanies] = useState<EmpresaResponse[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<EmpresaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  
  // Estados de UI
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados de filtros
  const [filters, setFilters] = useState<CompanyFilters>({
    busca: '',
    categoria: undefined
  });
  
  // Estados de modais
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<EmpresaResponse | null>(null);
  const [noteText, setNoteText] = useState('');

  // Categorias disponíveis
  const categorias = companyService.getCategorias();

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (companies.length > 0) {
      filterCompanies();
    } else {
      setFilteredCompanies([]);
    }
  }, [companies, filters]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getAllCompanies();
      console.log('📦 Empresas carregadas:', data);
      setCompanies(Array.isArray(data) ? data : []);
      await loadStats();
    } catch (error) {
      console.error('❌ Erro ao carregar empresas:', error);
      setError('Erro ao carregar lista de empresas');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await companyService.getCompanyStats();
      setStats(data);
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
    }
  };

  const filterCompanies = () => {
    if (!companies || companies.length === 0) {
      setFilteredCompanies([]);
      return;
    }

    let filtered = [...companies];

    if (filters.busca) {
      const term = filters.busca.toLowerCase();
      filtered = filtered.filter(company =>
        company.nome.toLowerCase().includes(term) ||
        company.email?.toLowerCase().includes(term) ||
        company.localizacao?.toLowerCase().includes(term)
      );
    }

    if (filters.categoria) {
      filtered = filtered.filter(company => company.categoria === filters.categoria);
    }

    setFilteredCompanies(filtered);
  };

  const handleSearch = () => {
    filterCompanies();
  };

  const handleFilterChange = (key: keyof CompanyFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      busca: '',
      categoria: undefined
    });
  };

  const handleViewCompany = (id: number) => {
    navigate(`/admin/companies/${id}`);
  };

  const handleEditCompany = (id: number) => {
    navigate(`/admin/companies/${id}/edit`);
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return;

    try {
      await companyService.deleteCompany(selectedCompany.id);
      await loadCompanies();
      setShowDeleteConfirm(false);
      setSelectedCompany(null);
    } catch (error) {
      console.error('❌ Erro ao deletar empresa:', error);
      setError('Erro ao deletar empresa');
    }
  };

  const handleOpenNoteModal = (company: EmpresaResponse) => {
    setSelectedCompany(company);
    setNoteText(company.observacao || '');
    setShowNoteModal(true);
  };

  const handleSaveNote = async () => {
    if (!selectedCompany) return;

    try {
      await companyService.saveAnnotation(selectedCompany.id, noteText);
      await loadCompanies();
      setShowNoteModal(false);
      setSelectedCompany(null);
      setNoteText('');
    } catch (error) {
      console.error('❌ Erro ao salvar anotação:', error);
      setError('Erro ao salvar anotação');
    }
  };

  const renderStars = (avaliacao?: number) => {
    if (!avaliacao) return null;
    
    const stars = companyService.getStarRating(avaliacao);
    
    return (
      <div className={styles.stars}>
        {stars.map((value, index) => (
          <MdStar
            key={index}
            className={value === 1 ? styles.starFilled : value === 0.5 ? styles.starHalf : styles.starEmpty}
          />
        ))}
        <span className={styles.ratingValue}>{avaliacao.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
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
            Empresas Parceiras
          </h1>
          {stats && (
            <div className={styles.statsBadges}>
              <span className={styles.statBadge}>
                Total: {stats.total}
              </span>
              <span className={styles.statBadge}>
                Verificadas: {stats.verificadas}
              </span>
              <span className={styles.statBadge}>
                Média: {stats.mediaAvaliacoes} ⭐
              </span>
            </div>
          )}
        </div>

        <div className={styles.headerActions}>
          <button 
            className={styles.primaryButton}
            onClick={() => navigate('/admin/companies/new')}
          >
            <MdAdd />
            Nova Empresa
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
            onClick={loadCompanies}
            title="Atualizar"
          >
            <MdRefresh />
          </button>
        </div>
      </div>

      {/* Barra de busca */}
      <div className={styles.searchBar}>
        <div className={styles.searchInput}>
          <MdSearch />
          <input
            type="text"
            placeholder="Buscar por nome, email ou localização..."
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
            className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
            onClick={() => setViewMode('grid')}
          >
            Cards
          </button>
          <button 
            className={`${styles.viewButton} ${viewMode === 'table' ? styles.active : ''}`}
            onClick={() => setViewMode('table')}
          >
            Tabela
          </button>
        </div>
      </div>

      {/* Painel de filtros */}
      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label>Categoria:</label>
            <select 
              value={filters.categoria || ''}
              onChange={(e) => handleFilterChange('categoria', e.target.value || undefined)}
            >
              <option value="">Todas</option>
              {categorias.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {(filters.categoria) && (
            <button 
              className={styles.clearFiltersButton}
              onClick={handleClearFilters}
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Grid de Cards */}
      {viewMode === 'grid' && (
        <div className={styles.grid}>
          {filteredCompanies.length > 0 ? (
            filteredCompanies.map(company => (
              <div key={company.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderLeft}>
                    <div className={styles.cardIcon}>
                      <MdBusiness size={24} />
                    </div>
                    <h3 className={styles.companyName}>{company.nome}</h3>
                  </div>
                  {company.verificado && (
                    <span className={styles.verifiedBadge} title="Verificado">
                      <MdCheckCircle />
                    </span>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <span 
                    className={styles.categoryBadge}
                    style={{ backgroundColor: companyService.getCategoriaColor(company.categoria) + '20', color: companyService.getCategoriaColor(company.categoria) }}
                  >
                    {company.categoria}
                  </span>

                  {renderStars(company.avaliacao)}

                  {company.descricao && (
                    <p className={styles.description}>{company.descricao}</p>
                  )}

                  <div className={styles.contactInfo}>
                    {company.email && (
                      <div className={styles.contactItem}>
                        <MdEmail className={styles.contactIcon} />
                        <span>{company.email}</span>
                      </div>
                    )}
                    {company.telefone && (
                      <div className={styles.contactItem}>
                        <MdPhone className={styles.contactIcon} />
                        <span>{companyService.formatPhone(company.telefone)}</span>
                      </div>
                    )}
                    {company.localizacao && (
                      <div className={styles.contactItem}>
                        <MdLocationOn className={styles.contactIcon} />
                        <span>{company.localizacao}</span>
                      </div>
                    )}
                  </div>

                  {company.observacao && (
                    <div className={styles.notePreview}>
                      <MdNote className={styles.noteIcon} />
                      <span className={styles.noteText}>
                        {company.observacao.length > 60 
                          ? company.observacao.substring(0, 60) + '...' 
                          : company.observacao}
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <button 
                    className={styles.noteButton}
                    onClick={() => handleOpenNoteModal(company)}
                    title="Anotações"
                  >
                    <MdNote />
                    <span>Anotações</span>
                  </button>
                  <button 
                    className={styles.editButton}
                    onClick={() => handleEditCompany(company.id)}
                    title="Editar"
                  >
                    <MdEdit />
                    <span>Editar</span>
                  </button>
                  <button 
                    className={styles.viewButton}
                    onClick={() => handleViewCompany(company.id)}
                    title="Visualizar"
                  >
                    <MdVisibility />
                    <span>Ver</span>
                  </button>
                  <button 
                    className={styles.deleteButton}
                    onClick={() => {
                      setSelectedCompany(company);
                      setShowDeleteConfirm(true);
                    }}
                    title="Excluir"
                  >
                    <MdDelete />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <MdBusiness size={48} />
              <h3>Nenhuma empresa encontrada</h3>
              <p>
                {filters.busca || filters.categoria
                  ? 'Tente ajustar seus filtros para encontrar empresas.'
                  : 'Comece cadastrando sua primeira empresa parceira.'}
              </p>
              {filters.busca || filters.categoria ? (
                <button 
                  className={styles.secondaryButton}
                  onClick={handleClearFilters}
                >
                  Limpar filtros
                </button>
              ) : (
                <button 
                  className={styles.primaryButton}
                  onClick={() => navigate('/admin/companies/new')}
                >
                  <MdAdd />
                  Nova Empresa
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Visualização em Tabela */}
      {viewMode === 'table' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Categoria</th>
                <th>Avaliação</th>
                <th>Contato</th>
                <th>Localização</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map(company => (
                  <tr key={company.id}>
                    <td className={styles.companyCell}>
                      <div className={styles.companyInfo}>
                        <strong>{company.nome}</strong>
                        {company.verificado && (
                          <MdCheckCircle className={styles.verifiedIcon} />
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={styles.categoryBadge}>
                        {company.categoria}
                      </span>
                    </td>
                    <td>
                      {company.avaliacao ? (
                        <span>⭐ {company.avaliacao.toFixed(1)}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <div className={styles.contactInfo}>
                        {company.email && <div>{company.email}</div>}
                        {company.telefone && <div>{companyService.formatPhone(company.telefone)}</div>}
                      </div>
                    </td>
                    <td>{company.localizacao || '-'}</td>
                    <td>
                      {company.verificado ? (
                        <span className={styles.verified}>Verificado</span>
                      ) : (
                        <span className={styles.unverified}>Não verificado</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button 
                          className={styles.actionButton}
                          onClick={() => handleViewCompany(company.id)}
                          title="Visualizar"
                        >
                          <MdVisibility />
                        </button>
                        <button 
                          className={styles.actionButton}
                          onClick={() => handleEditCompany(company.id)}
                          title="Editar"
                        >
                          <MdEdit />
                        </button>
                        <button 
                          className={styles.actionButton}
                          onClick={() => handleOpenNoteModal(company)}
                          title="Anotações"
                        >
                          <MdNote />
                        </button>
                        <button 
                          className={`${styles.actionButton} ${styles.dangerButton}`}
                          onClick={() => {
                            setSelectedCompany(company);
                            setShowDeleteConfirm(true);
                          }}
                          title="Excluir"
                        >
                          <MdDelete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className={styles.emptyTable}>
                    Nenhuma empresa encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a empresa ${selectedCompany?.nome}?`}
        type="danger"
        onConfirm={handleDeleteCompany}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSelectedCompany(null);
        }}
        confirmText="Excluir"
        cancelText="Cancelar"
      />

      {/* Modal de anotações */}
      {showNoteModal && selectedCompany && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Anotações - {selectedCompany.nome}</h2>
              <button 
                className={styles.closeButton}
                onClick={() => {
                  setShowNoteModal(false);
                  setSelectedCompany(null);
                  setNoteText('');
                }}
              >
                <MdClose />
              </button>
            </div>

            <div className={styles.modalBody}>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Escreva suas observações sobre esta empresa..."
                rows={6}
                className={styles.noteTextarea}
                autoFocus
              />
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowNoteModal(false);
                  setSelectedCompany(null);
                  setNoteText('');
                }}
              >
                Cancelar
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleSaveNote}
              >
                Salvar
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