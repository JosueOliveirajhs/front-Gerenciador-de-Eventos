// src/components/ClientComponents/CompanySearch/CompanySearch.tsx
import React, { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiMapPin, 
  FiStar, 
  FiChevronRight,
  FiFilter,
  FiCalendar
} from 'react-icons/fi';
import { MdEvent, MdVerified } from 'react-icons/md';
import styles from './CompanySearch.module.css';

// Importe o serviço (ajuste o caminho se necessário de acordo com a sua estrutura de pastas)
import { empresaService, EmpresaData } from '../../../services/empresa'; 

interface Company {
  id: string;
  name: string;
  logo?: string;
  description: string;
  location: string;
  rating: number;
  totalReviews: number;
  specialties: string[];
  verified: boolean;
  nextAvailable?: string;
}

interface CompanySearchProps {
  onViewChange?: (view: string, params?: any) => void;
}

export const CompanySearch: React.FC<CompanySearchProps> = ({ onViewChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estado alterado para iniciar vazio e receber dados da API
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Hook para buscar as empresas na montagem do componente
  useEffect(() => {
    carregarEmpresas();
  }, []);

  const carregarEmpresas = async () => {
    try {
      setLoading(true);
      const data: EmpresaData[] = await empresaService.listar();
      
      // Mapeando o retorno da API (EmpresaData) para o formato da Interface UI (Company)
      const empresasFormatadas: Company[] = data.map((empresa) => ({
        id: String(empresa.id),
        name: empresa.nome,
        description: empresa.descricao || 'Nenhuma descrição fornecida.',
        location: empresa.localizacao || 'Localização não informada',
        rating: empresa.avaliacao || 0,
        // Mock de avaliações, já que o back-end atual não possui um campo totalReviews
        totalReviews: Math.floor(Math.random() * 200) + 10, 
        // Convertendo a categoria única do back-end para o array visual de especialidades
        specialties: [empresa.categoria], 
        verified: empresa.verificado,
      }));

      setCompanies(empresasFormatadas);
    } catch (error) {
      console.error("Erro ao buscar empresas da API:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mantendo os filtros que você já tinha (ajustados dinamicamente)
  const locations = Array.from(new Set(companies.map(c => c.location))).filter(Boolean);
  const specialties = ['Buffet', 'Decoracao', 'Fotografia', 'Outros']; // Categorias baseadas no seu Enum do Java

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !selectedLocation || company.location === selectedLocation;
    const matchesSpecialty = !selectedSpecialty || company.specialties.includes(selectedSpecialty);
    
    return matchesSearch && matchesLocation && matchesSpecialty;
  });

  const handleCompanyClick = (companyId: string) => {
    console.log('Selecionar empresa:', companyId);
    onViewChange?.('company-details', { companyId });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <FiStar 
        key={index}
        size={14}
        color={index < Math.floor(rating) ? '#fbbf24' : '#e2e8f0'}
        fill={index < Math.floor(rating) ? '#fbbf24' : 'none'}
      />
    ));
  };

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
            placeholder="Buscar por nome, serviço ou especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button 
          className={styles.filterButton}
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
            <label>Localização</label>
            <select 
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">Todas as localizações</option>
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
        <span>{loading ? 'Carregando empresas...' : `${filteredCompanies.length} empresas encontradas`}</span>
      </div>

      <div className={styles.companiesList}>
        {loading ? (
           <div className={styles.emptyState}>
             <h3>Buscando fornecedores...</h3>
           </div>
        ) : filteredCompanies.length === 0 ? (
          <div className={styles.emptyState}>
            <FiSearch size={48} />
            <h3>Nenhuma empresa encontrada</h3>
            <p>Tente ajustar seus filtros ou buscar por outro termo.</p>
          </div>
        ) : (
          filteredCompanies.map(company => (
            <div 
              key={company.id} 
              className={styles.companyCard}
              onClick={() => handleCompanyClick(company.id)}
            >
              <div className={styles.companyHeader}>
                <div className={styles.companyLogo}>
                  {company.logo ? (
                    <img src={company.logo} alt={company.name} />
                  ) : (
                    <MdEvent size={24} />
                  )}
                </div>
                <div className={styles.companyInfo}>
                  <div className={styles.companyNameRow}>
                    <h3>{company.name}</h3>
                    {company.verified && (
                      <MdVerified size={16} className={styles.verifiedIcon} />
                    )}
                  </div>
                  <div className={styles.companyRating}>
                    {renderStars(company.rating)}
                    <span>{company.rating} ({company.totalReviews} avaliações)</span>
                  </div>
                </div>
              </div>
              
              <p className={styles.companyDescription}>{company.description}</p>
              
              <div className={styles.companyMeta}>
                <span className={styles.location}>
                  <FiMapPin size={14} />
                  {company.location}
                </span>
                {company.nextAvailable && (
                  <span className={styles.availability}>
                    <FiCalendar size={14} />
                    Disponível a partir de {new Date(company.nextAvailable).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
              
              <div className={styles.specialties}>
                {company.specialties.map((specialty, index) => (
                  <span key={index} className={styles.specialtyTag}>
                    {specialty}
                  </span>
                ))}
              </div>
              
              <button className={styles.viewButton}>
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