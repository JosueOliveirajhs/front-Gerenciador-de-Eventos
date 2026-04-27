// src/components/ClientComponents/CompanySearch/CompanySearch.tsx
import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiMapPin, FiStar, FiChevronRight,
  FiFilter, FiLoader, FiAlertCircle, FiRefreshCw
} from 'react-icons/fi';
import { MdVerified, MdBusiness } from 'react-icons/md';
import { empresaService, EmpresaData } from '../../../services/empresa';
import { CompanyDetails } from '../CompanyDetails/CompanyDetails';
import styles from './CompanySearch.module.css';

interface Company {
  id: number;
  name: string;
  description: string;
  location: string;
  rating: number;
  specialties: string[];
  verified: boolean;
  email?: string;
  phone?: string;
}

interface CompanySearchProps {
  onViewChange?: (view: string, params?: any) => void;
}

export const CompanySearch: React.FC<CompanySearchProps> = ({ onViewChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingCompanyId, setViewingCompanyId] = useState<number | null>(null);

  useEffect(() => {
    carregarEmpresas();
  }, []);

  const carregarEmpresas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: EmpresaData[] = await empresaService.listar();
      
      const empresasFormatadas: Company[] = data.map((empresa) => ({
        id: empresa.id,
        name: empresa.nome,
        description: empresa.descricao || 'Nenhuma descricao fornecida.',
        location: empresa.localizacao || 'Localizacao nao informada',
        rating: empresa.avaliacao || 0,
        specialties: [empresa.categoria],
        verified: empresa.verificado,
        email: empresa.email,
        phone: empresa.telefone,
      }));

      setCompanies(empresasFormatadas);
    } catch (err) {
      console.error("Erro ao buscar empresas:", err);
      setError('Erro ao carregar empresas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const locations = Array.from(new Set(companies.map(c => c.location))).filter(Boolean);
  const specialties = ['Buffet', 'Decoracao', 'Fotografia', 'Outros'];

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = !searchTerm || 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !selectedLocation || company.location === selectedLocation;
    const matchesSpecialty = !selectedSpecialty || company.specialties.includes(selectedSpecialty);
    return matchesSearch && matchesLocation && matchesSpecialty;
  });

  const handleViewDetails = (companyId: number) => {
    setViewingCompanyId(companyId);
  };

  const handleBackToList = () => {
    setViewingCompanyId(null);
    carregarEmpresas();
  };

  // ✅ ESTRELAS para avaliação
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <FiStar 
        key={index}
        size={16}
        color={index < Math.floor(rating) ? '#fbbf24' : '#e2e8f0'}
        fill={index < Math.floor(rating) ? '#fbbf24' : 'none'}
      />
    ));
  };

  if (viewingCompanyId) {
    return <CompanyDetails companyId={viewingCompanyId} onBack={handleBackToList} />;
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando empresas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <FiAlertCircle size={48} />
        <h3>Erro ao carregar</h3>
        <p>{error}</p>
        <button className={styles.retryButton} onClick={carregarEmpresas}>
          <FiRefreshCw size={16} /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className={styles.companySearch}>
      <div className={styles.searchHeader}>
        <h2>
          <FiSearch size={24} />
          Pesquisar Empresas de Eventos
        </h2>
        <p>Encontre os melhores fornecedores para seu evento</p>
      </div>

      <div className={styles.searchSection}>
        <div className={styles.searchBox}>
          <FiSearch size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome, servico ou especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button 
          className={`${styles.filterButton} ${showFilters ? styles.filterActive : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FiFilter size={18} />
          Filtros
          {(selectedLocation || selectedSpecialty) && (
            <span className={styles.filterBadge}>●</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label>Localizacao</label>
            <select 
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">Todas as localizacoes</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label>Especialidade</label>
            <select 
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
            >
              <option value="">Todas as especialidades</option>
              {specialties.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
          
          <button 
            className={styles.clearFiltersButton}
            onClick={() => {
              setSelectedLocation('');
              setSelectedSpecialty('');
            }}
          >
            Limpar Filtros
          </button>
        </div>
      )}

      <div className={styles.resultsInfo}>
        <span>{filteredCompanies.length} empresas encontradas</span>
      </div>

      <div className={styles.companiesList}>
        {filteredCompanies.length === 0 ? (
          <div className={styles.emptyState}>
            <FiSearch size={48} />
            <h3>Nenhuma empresa encontrada</h3>
            <p>Tente ajustar seus filtros ou buscar por outro termo.</p>
          </div>
        ) : (
          filteredCompanies.map(company => (
            <div key={company.id} className={styles.companyCard}>
              <div className={styles.companyHeader}>
                <div className={styles.companyLogo}>
                  <MdBusiness size={24} />
                </div>
                <div className={styles.companyInfo}>
                  <div className={styles.companyNameRow}>
                    <h3>{company.name}</h3>
                    {company.verified && (
                      <MdVerified size={16} className={styles.verifiedIcon} />
                    )}
                  </div>
                  {/* ✅ ESTRELAS na listagem */}
                  <div className={styles.companyRating}>
                    {company.rating > 0 ? (
                      <>
                        <div className={styles.stars}>
                          {renderStars(company.rating)}
                        </div>
                        <span>{company.rating.toFixed(1)}</span>
                      </>
                    ) : (
                      <span className={styles.noRating}>Sem avaliacoes</span>
                    )}
                  </div>
                </div>
              </div>
              
              <p className={styles.companyDescription}>{company.description}</p>
              
              <div className={styles.companyMeta}>
                <span className={styles.location}>
                  <FiMapPin size={14} />
                  {company.location}
                </span>
              </div>
              
              <div className={styles.specialties}>
                {company.specialties.map((specialty, index) => (
                  <span key={index} className={styles.specialtyTag}>
                    {specialty}
                  </span>
                ))}
              </div>
              
              <button 
                className={styles.viewButton}
                onClick={() => handleViewDetails(company.id)}
              >
                Ver detalhes
                <FiChevronRight size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};