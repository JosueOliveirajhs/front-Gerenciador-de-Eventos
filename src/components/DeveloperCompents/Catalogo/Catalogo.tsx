// src/components/DeveloperCompents/Catalogo/Catalogo.tsx
import React, { useState, useEffect } from 'react';
import { 
  MdAdd, MdSearch, MdFilterList, MdEdit, MdDelete,
  MdVisibility, MdBusiness, MdEmail, MdPhone,
  MdLocationOn, MdStar, MdNote, MdCheckCircle,
  MdClose, MdRefresh
} from 'react-icons/md';
import { catalogoService } from '../../../services/catalogo';
import { EmpresaResponse, CatalogoFilters } from '../../../types/developer';
import { ConfirmationModal } from '../../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../../common/Alerts/ErrorModal';
import styles from './Catalogo.module.css';

interface CatalogoProps {
  onNavigate: (view: string, id?: number) => void;
}

type ViewMode = 'grid' | 'table';

export const Catalogo: React.FC<CatalogoProps> = ({ onNavigate }) => {
  const [empresas, setEmpresas] = useState<EmpresaResponse[]>([]);
  const [filteredEmpresas, setFilteredEmpresas] = useState<EmpresaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CatalogoFilters>({
    busca: '', categoria: undefined, verificado: undefined
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<EmpresaResponse | null>(null);
  const [noteText, setNoteText] = useState('');

  const categorias = catalogoService.getCategorias();

  useEffect(() => { loadEmpresas(); }, []);

  useEffect(() => {
    if (empresas.length > 0) filterEmpresas();
    else setFilteredEmpresas([]);
  }, [empresas, filters]);

  const loadEmpresas = async () => {
    try {
      setLoading(true);
      const data = await catalogoService.getAllEmpresas();
      setEmpresas(Array.isArray(data) ? data : []);
      await loadStats();
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      setError('Erro ao carregar lista de empresas');
      setEmpresas([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await catalogoService.getCatalogoStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatisticas:', error);
    }
  };

  const filterEmpresas = () => {
    if (!empresas || empresas.length === 0) {
      setFilteredEmpresas([]);
      return;
    }
    let filtered = [...empresas];
    if (filters.busca) {
      const term = filters.busca.toLowerCase();
      filtered = filtered.filter(empresa =>
        empresa.nome.toLowerCase().includes(term) ||
        empresa.email?.toLowerCase().includes(term) ||
        empresa.localizacao?.toLowerCase().includes(term)
      );
    }
    if (filters.categoria) {
      filtered = filtered.filter(empresa => empresa.categoria === filters.categoria);
    }
    if (filters.verificado !== undefined) {
      filtered = filtered.filter(empresa => empresa.verificado === filters.verificado);
    }
    setFilteredEmpresas(filtered);
  };

  const handleSearch = () => { filterEmpresas(); };

  const handleFilterChange = (key: keyof CatalogoFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ busca: '', categoria: undefined, verificado: undefined });
  };

  // ✅ CORRIGIDO: Agora chama onNavigate com 2 parametros (view, id)
  const handleViewEmpresa = (id: number) => {
    onNavigate('details', id);
  };

  const handleEditEmpresa = (id: number) => {
    onNavigate('form', id);
  };

  const handleNewEmpresa = () => {
    onNavigate('form'); // Sem ID = novo
  };

  const handleDeleteEmpresa = async () => {
    if (!selectedEmpresa) return;
    try {
      await catalogoService.deleteEmpresa(selectedEmpresa.id);
      await loadEmpresas();
      setShowDeleteConfirm(false);
      setSelectedEmpresa(null);
    } catch (error) {
      console.error('Erro ao deletar empresa:', error);
      setError('Erro ao deletar empresa');
    }
  };

  const handleOpenNoteModal = (empresa: EmpresaResponse) => {
    setSelectedEmpresa(empresa);
    setNoteText(empresa.observacao || '');
    setShowNoteModal(true);
  };

  const handleSaveNote = async () => {
    if (!selectedEmpresa) return;
    try {
      await catalogoService.saveAnnotation(selectedEmpresa.id, noteText);
      await loadEmpresas();
      setShowNoteModal(false);
      setSelectedEmpresa(null);
      setNoteText('');
    } catch (error) {
      console.error('Erro ao salvar anotacao:', error);
      setError('Erro ao salvar anotacao');
    }
  };

  const renderStars = (avaliacao?: number) => {
    if (!avaliacao) return null;
    const stars = catalogoService.getStarRating(avaliacao);
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
        <p>Carregando catalogo...</p>
      </div>
    );
  }

  return (
    <div className={styles.catalogo}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}><MdBusiness /> Catalogo de Fornecedores</h1>
          {stats && (
            <div className={styles.statsBadges}>
              <span className={styles.statBadge}>Total: {stats.total}</span>
              <span className={styles.statBadge}>Verificadas: {stats.verificadas}</span>
              <span className={styles.statBadge}>Media: {stats.mediaAvaliacoes}</span>
            </div>
          )}
        </div>
        <div className={styles.headerActions}>
          <button className={styles.primaryButton} onClick={handleNewEmpresa}>
            <MdAdd /> Nova Empresa
          </button>
          <button className={`${styles.iconButton} ${showFilters ? styles.active : ''}`} onClick={() => setShowFilters(!showFilters)} title="Filtros">
            <MdFilterList />
          </button>
          <button className={styles.iconButton} onClick={loadEmpresas} title="Atualizar">
            <MdRefresh />
          </button>
        </div>
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchInput}>
          <MdSearch />
          <input type="text" placeholder="Buscar por nome, email ou localizacao..." value={filters.busca}
            onChange={(e) => handleFilterChange('busca', e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && handleSearch()} />
          {filters.busca && (
            <button className={styles.clearButton} onClick={() => handleFilterChange('busca', '')}>
              <MdClose />
            </button>
          )}
        </div>
        <div className={styles.viewToggle}>
          <button className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`} onClick={() => setViewMode('grid')}>Cards</button>
          <button className={`${styles.viewButton} ${viewMode === 'table' ? styles.active : ''}`} onClick={() => setViewMode('table')}>Tabela</button>
        </div>
      </div>

      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label>Categoria:</label>
            <select value={filters.categoria || ''} onChange={(e) => handleFilterChange('categoria', e.target.value || undefined)}>
              <option value="">Todas</option>
              {categorias.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Verificacao:</label>
            <select value={filters.verificado === undefined ? '' : filters.verificado.toString()}
              onChange={(e) => { const v = e.target.value; handleFilterChange('verificado', v === '' ? undefined : v === 'true'); }}>
              <option value="">Todos</option>
              <option value="true">Verificados</option>
              <option value="false">Nao verificados</option>
            </select>
          </div>
          {(filters.categoria || filters.verificado !== undefined) && (
            <button className={styles.clearFiltersButton} onClick={handleClearFilters}>Limpar filtros</button>
          )}
        </div>
      )}

      {viewMode === 'grid' && (
        <div className={styles.grid}>
          {filteredEmpresas.length > 0 ? (
            filteredEmpresas.map(empresa => (
              <div key={empresa.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderLeft}>
                    <div className={styles.cardIcon}><MdBusiness size={24} /></div>
                    <h3 className={styles.companyName}>{empresa.nome}</h3>
                  </div>
                  {empresa.verificado && <span className={styles.verifiedBadge} title="Verificado"><MdCheckCircle /></span>}
                </div>
                <div className={styles.cardBody}>
                  <span className={styles.categoryBadge} style={{ backgroundColor: catalogoService.getCategoriaColor(empresa.categoria) + '20', color: catalogoService.getCategoriaColor(empresa.categoria) }}>
                    {empresa.categoria}
                  </span>
                  {renderStars(empresa.avaliacao)}
                  {empresa.descricao && <p className={styles.description}>{empresa.descricao}</p>}
                  <div className={styles.contactInfo}>
                    {empresa.email && <div className={styles.contactItem}><MdEmail className={styles.contactIcon} /><span>{empresa.email}</span></div>}
                    {empresa.telefone && <div className={styles.contactItem}><MdPhone className={styles.contactIcon} /><span>{catalogoService.formatPhone(empresa.telefone)}</span></div>}
                    {empresa.localizacao && <div className={styles.contactItem}><MdLocationOn className={styles.contactIcon} /><span>{empresa.localizacao}</span></div>}
                  </div>
                  {empresa.observacao && (
                    <div className={styles.notePreview}><MdNote className={styles.noteIcon} /><span className={styles.noteText}>{empresa.observacao.length > 60 ? empresa.observacao.substring(0, 60) + '...' : empresa.observacao}</span></div>
                  )}
                </div>
                <div className={styles.cardFooter}>
                  <button className={styles.noteButton} onClick={() => handleOpenNoteModal(empresa)} title="Anotacoes"><MdNote /><span>Anotacoes</span></button>
                  <button className={styles.editButton} onClick={() => handleEditEmpresa(empresa.id)} title="Editar"><MdEdit /><span>Editar</span></button>
                  <button className={styles.viewButton} onClick={() => handleViewEmpresa(empresa.id)} title="Visualizar"><MdVisibility /><span>Ver</span></button>
                  <button className={styles.deleteButton} onClick={() => { setSelectedEmpresa(empresa); setShowDeleteConfirm(true); }} title="Excluir"><MdDelete /><span>Excluir</span></button>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <MdBusiness size={48} />
              <h3>Nenhuma empresa encontrada</h3>
              <p>{filters.busca || filters.categoria || filters.verificado !== undefined ? 'Tente ajustar seus filtros.' : 'Comece cadastrando sua primeira empresa no catalogo.'}</p>
              {filters.busca || filters.categoria || filters.verificado !== undefined ? (
                <button className={styles.secondaryButton} onClick={handleClearFilters}>Limpar filtros</button>
              ) : (
                <button className={styles.primaryButton} onClick={handleNewEmpresa}><MdAdd /> Nova Empresa</button>
              )}
            </div>
          )}
        </div>
      )}

      {viewMode === 'table' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Empresa</th><th>Categoria</th><th>Avaliacao</th><th>Contato</th><th>Localizacao</th><th>Status</th><th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmpresas.length > 0 ? filteredEmpresas.map(empresa => (
                <tr key={empresa.id}>
                  <td className={styles.companyCell}><div className={styles.companyInfo}><strong>{empresa.nome}</strong>{empresa.verificado && <MdCheckCircle className={styles.verifiedIcon} />}</div></td>
                  <td><span className={styles.categoryBadge}>{empresa.categoria}</span></td>
                  <td>{empresa.avaliacao ? <span>{empresa.avaliacao.toFixed(1)}</span> : '-'}</td>
                  <td><div className={styles.contactInfo}>{empresa.email && <div>{empresa.email}</div>}{empresa.telefone && <div>{catalogoService.formatPhone(empresa.telefone)}</div>}</div></td>
                  <td>{empresa.localizacao || '-'}</td>
                  <td>{empresa.verificado ? <span className={styles.verified}>Verificado</span> : <span className={styles.unverified}>Nao verificado</span>}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button className={styles.actionButton} onClick={() => handleViewEmpresa(empresa.id)} title="Visualizar"><MdVisibility /></button>
                      <button className={styles.actionButton} onClick={() => handleEditEmpresa(empresa.id)} title="Editar"><MdEdit /></button>
                      <button className={styles.actionButton} onClick={() => handleOpenNoteModal(empresa)} title="Anotacoes"><MdNote /></button>
                      <button className={`${styles.actionButton} ${styles.dangerButton}`} onClick={() => { setSelectedEmpresa(empresa); setShowDeleteConfirm(true); }} title="Excluir"><MdDelete /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className={styles.emptyTable}>Nenhuma empresa encontrada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmationModal isOpen={showDeleteConfirm} title="Confirmar Exclusao"
        message={`Tem certeza que deseja excluir a empresa ${selectedEmpresa?.nome}?`}
        type="danger" onConfirm={handleDeleteEmpresa}
        onCancel={() => { setShowDeleteConfirm(false); setSelectedEmpresa(null); }}
        confirmText="Excluir" cancelText="Cancelar" />

      {showNoteModal && selectedEmpresa && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Anotacoes - {selectedEmpresa.nome}</h2>
              <button className={styles.closeButton} onClick={() => { setShowNoteModal(false); setSelectedEmpresa(null); setNoteText(''); }}><MdClose /></button>
            </div>
            <div className={styles.modalBody}>
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
                placeholder="Escreva suas observacoes sobre esta empresa..." rows={6}
                className={styles.noteTextarea} autoFocus />
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={() => { setShowNoteModal(false); setSelectedEmpresa(null); setNoteText(''); }}>Cancelar</button>
              <button className={styles.saveButton} onClick={handleSaveNote}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      <ErrorModal isOpen={!!error} message={error || ''} onClose={() => setError(null)} />
    </div>
  );
};