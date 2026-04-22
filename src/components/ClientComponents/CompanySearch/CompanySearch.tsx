// src/components/ClientComponents/CompanySearch/CompanySearch.tsx
import React, { useState } from 'react';
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
  
  const [companies] = useState<Company[]>([
    {
      id: '1',
      name: 'Espaço Premium Eventos',
      description: 'Espaço sofisticado para casamentos e eventos corporativos com capacidade para até 200 pessoas.',
      location: 'São Paulo, SP',
      rating: 4.8,
      totalReviews: 156,
      specialties: ['Casamentos', 'Corporativo', '15 Anos'],
      verified: true,
      nextAvailable: '2026-06-15'
    },
    {
      id: '2',
      name: 'Buffet Sabor & Arte',
      description: 'Buffet especializado em gastronomia contemporânea e coquetéis exclusivos.',
      location: 'Rio de Janeiro, RJ',
      rating: 4.9,
      totalReviews: 203,
      specialties: ['Buffet', 'Coquetel', 'Jantar'],
      verified: true,
      nextAvailable: '2026-05-20'
    },
    {
      id: '3',
      name: 'Fotografia Lens',
      description: 'Fotografia e filmagem profissional para eternizar seus momentos especiais.',
      location: 'Belo Horizonte, MG',
      rating: 4.7,
      totalReviews: 89,
      specialties: ['Fotografia', 'Filmagem', 'Ensaio'],
      verified: true
    },
    {
      id: '4',
      name: 'Decoração Encanto',
      description: 'Decoração personalizada para todos os tipos de eventos.',
      location: 'Curitiba, PR',
      rating: 4.6,
      totalReviews: 67,
      specialties: ['Decoração', 'Flores', 'Cenografia'],
      verified: true
    }
  ]);

  const locations = ['São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Curitiba, PR', 'Brasília, DF'];
  const specialties = ['Casamentos', 'Corporativo', '15 Anos', 'Buffet', 'Fotografia', 'Decoração', 'Música'];

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