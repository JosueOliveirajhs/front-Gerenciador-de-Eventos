import React, { useState, useEffect } from 'react';
import { 
  MdAdd,
  MdSearch,
  MdFilterList,
  MdEdit,
  MdDelete,
  MdBusiness,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdStar,
  MdNote,
  MdCheckCircle,
  MdCancel,
  MdClose
} from 'react-icons/md';
import { companyService, CompanyResponse, CreateCompanyDTO } from '../../../services/company';
import styles from './Companies.module.css';

export const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyResponse | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [currentCompanyId, setCurrentCompanyId] = useState<number | null>(null);
  
  // Estado para o formulário
  const [formData, setFormData] = useState<CreateCompanyDTO>({
    nome: '',
    descricao: '',
    categoria: 'Outros',
    localizacao: '',
    telefone: '',
    email: ''
  });

  const categorias = companyService.getCategorias();

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined || selectedCategory !== undefined) {
        loadCompanies();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getAllCompanies(
        searchTerm || undefined,
        selectedCategory || undefined
      );
      setCompanies(data);
    } catch (error) {
      console.error('❌ Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      categoria: 'Outros',
      localizacao: '',
      telefone: '',
      email: ''
    });
    setEditingCompany(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (company: CompanyResponse) => {
    setEditingCompany(company);
    setFormData({
      nome: company.nome,
      descricao: company.descricao || '',
      categoria: company.categoria as any,
      localizacao: company.localizacao || '',
      telefone: company.telefone || '',
      email: company.email || ''
    });
    setShowEditModal(true);
  };

  const handleOpenNoteModal = (company: CompanyResponse) => {
    setCurrentCompanyId(company.id);
    setNoteText(company.observacao || '');
    setShowNoteModal(true);
  };

  const handleCreateCompany = async () => {
    try {
      // Validações básicas
      if (!formData.nome.trim()) {
        alert('O nome da empresa é obrigatório');
        return;
      }
      
      if (formData.email && !companyService.validateEmail(formData.email)) {
        alert('Email inválido');
        return;
      }

      if (formData.telefone && !companyService.validatePhone(formData.telefone)) {
        alert('Telefone inválido');
        return;
      }

      await companyService.createCompany(formData);
      await loadCompanies();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('❌ Erro ao criar empresa:', error);
      alert('Erro ao criar empresa. Tente novamente.');
    }
  };

  const handleUpdateCompany = async () => {
    if (!editingCompany) return;

    try {
      if (formData.email && !companyService.validateEmail(formData.email)) {
        alert('Email inválido');
        return;
      }

      if (formData.telefone && !companyService.validatePhone(formData.telefone)) {
        alert('Telefone inválido');
        return;
      }

      await companyService.updateCompany(editingCompany.id, formData);
      await loadCompanies();
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error('❌ Erro ao atualizar empresa:', error);
      alert('Erro ao atualizar empresa. Tente novamente.');
    }
  };

  const handleDeleteCompany = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta empresa?')) {
      try {
        await companyService.deleteCompany(id);
        await loadCompanies();
      } catch (error) {
        console.error('❌ Erro ao excluir empresa:', error);
        alert('Erro ao excluir empresa. Tente novamente.');
      }
    }
  };

  const handleSaveNote = async () => {
    if (!currentCompanyId) return;
    
    try {
      await companyService.saveAnnotation(currentCompanyId, noteText);
      await loadCompanies();
      setShowNoteModal(false);
      setNoteText('');
      setCurrentCompanyId(null);
    } catch (error) {
      console.error('❌ Erro ao salvar anotação:', error);
      alert('Erro ao salvar anotação. Tente novamente.');
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className={styles.stars}>
        {[...Array(5)].map((_, i) => (
          <MdStar
            key={i}
            className={i < Math.floor(rating) ? styles.starFilled : styles.starEmpty}
          />
        ))}
        <span className={styles.ratingValue}>{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className={styles.companies}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <MdBusiness />
            Empresas Parceiras
          </h1>
          <span className={styles.totalCount}>
            Total: {companies.length} empresas
          </span>
        </div>

        <div className={styles.headerActions}>
          <button 
            className={styles.primaryButton}
            onClick={handleOpenAddModal}
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
        </div>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <div className={styles.searchInput}>
            <MdSearch />
            <input
              type="text"
              placeholder="Buscar por nome da empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {showFilters && (
          <div className={styles.filtersPanel}>
            <div className={styles.filterGroup}>
              <label>Categoria:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={styles.categoryFilter}
              >
                <option value="">Todas as categorias</option>
                {categorias.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Empresas */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Carregando empresas...</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {companies.map(company => (
            <div key={company.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <div className={styles.cardIcon}>
                    <MdBusiness size={24} />
                  </div>
                  <h3 className={styles.companyName}>{company.nome}</h3>
                </div>
                {company.verificado && (
                  <span className={styles.verifiedBadge} title="Empresa verificada">
                    <MdCheckCircle />
                  </span>
                )}
              </div>

              <div className={styles.cardBody}>
                <span className={styles.categoryBadge}>
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
                      {company.observacao.substring(0, 60)}
                      {company.observacao.length > 60 && '...'}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <button 
                  className={styles.noteButton}
                  onClick={() => handleOpenNoteModal(company)}
                  title="Adicionar observação"
                >
                  <MdNote />
                  <span>Anotações</span>
                </button>
                <button 
                  className={styles.editButton}
                  onClick={() => handleOpenEditModal(company)}
                  title="Editar"
                >
                  <MdEdit />
                  <span>Editar</span>
                </button>
                <button 
                  className={styles.deleteButton}
                  onClick={() => handleDeleteCompany(company.id)}
                  title="Excluir"
                >
                  <MdDelete />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          ))}

          {companies.length === 0 && !loading && (
            <div className={styles.emptyState}>
              <MdBusiness size={48} className={styles.emptyIcon} />
              <h3>Nenhuma empresa encontrada</h3>
              <p className={styles.emptyText}>
                {searchTerm || selectedCategory 
                  ? 'Tente ajustar seus filtros para encontrar empresas.'
                  : 'Comece cadastrando sua primeira empresa parceira.'}
              </p>
              <button 
                className={styles.primaryButton}
                onClick={handleOpenAddModal}
              >
                <MdAdd />
                Nova Empresa
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Cadastro */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Nova Empresa</h2>
              <button 
                className={styles.closeButton}
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <MdClose />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Nome da Empresa *</label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Digite o nome da empresa"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Categoria *</label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  required
                >
                  {categorias.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Descrição</label>
                <textarea
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  placeholder="Descreva os serviços da empresa"
                  rows={3}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@empresa.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Telefone</label>
                  <input
                    type="text"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Localização</label>
                <input
                  type="text"
                  name="localizacao"
                  value={formData.localizacao}
                  onChange={handleInputChange}
                  placeholder="Cidade, Estado ou endereço completo"
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                Cancelar
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleCreateCompany}
              >
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {showEditModal && editingCompany && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Editar Empresa</h2>
              <button 
                className={styles.closeButton}
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                <MdClose />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Nome da Empresa *</label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Digite o nome da empresa"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Categoria *</label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  required
                >
                  {categorias.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Descrição</label>
                <textarea
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  placeholder="Descreva os serviços da empresa"
                  rows={3}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@empresa.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Telefone</label>
                  <input
                    type="text"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Localização</label>
                <input
                  type="text"
                  name="localizacao"
                  value={formData.localizacao}
                  onChange={handleInputChange}
                  placeholder="Cidade, Estado ou endereço completo"
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                Cancelar
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleUpdateCompany}
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Anotação */}
      {showNoteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Observações</h2>
              <button 
                className={styles.closeButton}
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteText('');
                  setCurrentCompanyId(null);
                }}
              >
                <MdClose />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Escreva suas observações sobre esta empresa:</label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Digite aqui suas observações, lembretes ou notas importantes..."
                  rows={6}
                  className={styles.noteTextarea}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteText('');
                  setCurrentCompanyId(null);
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
    </div>
  );
};