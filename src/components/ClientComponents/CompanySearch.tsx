import React, { useState } from 'react';
import { FiSearch, FiStar, FiMapPin, FiPhone, FiMail } from 'react-icons/fi';
import { MdBusiness, MdVerified } from 'react-icons/md';
import styles from './CompanySearch.module.css';

interface Company {
  id: number;
  name: string;
  category: string;
  rating: number;
  location: string;
  phone: string;
  email: string;
  description: string;
  verified: boolean;
  notes?: string;
}

export const CompanySearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [companyNotes, setCompanyNotes] = useState<Record<number, string>>({});

  const [companies] = useState<Company[]>([
    {
      id: 1,
      name: 'Buffet Festa Perfeita',
      category: 'Buffet',
      rating: 4.8,
      location: 'Centro',
      phone: '(11) 99999-9999',
      email: 'contato@buffet.com',
      description: 'Buffet completo para todos os tipos de evento',
      verified: true
    },
    {
      id: 2,
      name: 'Decorações Elegance',
      category: 'Decoração',
      rating: 4.9,
      location: 'Zona Sul',
      phone: '(11) 98888-8888',
      email: 'contato@decoracoes.com',
      description: 'Decoração personalizada para eventos',
      verified: true
    },
    {
      id: 3,
      name: 'Foto e Vídeo Recordar',
      category: 'Fotografia',
      rating: 4.7,
      location: 'Zona Norte',
      phone: '(11) 97777-7777',
      email: 'contato@foto.com',
      description: 'Registros profissionais para momentos especiais',
      verified: false
    }
  ]);

  const categories = ['all', 'Buffet', 'Decoração', 'Fotografia'];

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || company.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSaveNote = (companyId: number, note: string) => {
    setCompanyNotes({ ...companyNotes, [companyId]: note });
    setShowNotesModal(false);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FiStar 
          key={i} 
          size={14} 
          className={i <= rating ? styles.starFilled : styles.starEmpty}
        />
      );
    }
    return stars;
  };

  return (
    <div className={styles.companySearch}>
      <h2 className={styles.title}>
        <MdBusiness size={28} />
        Pesquisar Empresas e Notas
      </h2>

      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <FiSearch size={20} />
          <input
            type="text"
            placeholder="Buscar empresas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.categoryFilter}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`${styles.categoryBtn} ${selectedCategory === cat ? styles.active : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? 'Todos' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.companiesGrid}>
        {filteredCompanies.map(company => (
          <div key={company.id} className={styles.companyCard}>
            <div className={styles.companyHeader}>
              <h3>{company.name}</h3>
              {company.verified && (
                <span className={styles.verifiedBadge} title="Empresa verificada">
                  <MdVerified size={16} />
                </span>
              )}
            </div>

            <span className={styles.companyCategory}>{company.category}</span>

            <div className={styles.companyRating}>
              <div className={styles.stars}>
                {renderStars(company.rating)}
              </div>
              <span className={styles.ratingNumber}>{company.rating}</span>
            </div>

            <p className={styles.companyDescription}>{company.description}</p>

            <div className={styles.companyDetails}>
              <div className={styles.detail}>
                <FiMapPin size={14} />
                {company.location}
              </div>
              <div className={styles.detail}>
                <FiPhone size={14} />
                {company.phone}
              </div>
              <div className={styles.detail}>
                <FiMail size={14} />
                {company.email}
              </div>
            </div>

            <div className={styles.companyActions}>
              <button 
                className={styles.noteButton}
                onClick={() => {
                  setSelectedCompany(company);
                  setShowNotesModal(true);
                }}
              >
                📝 {companyNotes[company.id] ? 'Editar Nota' : 'Adicionar Nota'}
              </button>
            </div>

            {companyNotes[company.id] && (
              <div className={styles.companyNote}>
                <strong>📌 Minha nota:</strong>
                <p>{companyNotes[company.id]}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {showNotesModal && selectedCompany && (
        <div className={styles.modal} onClick={() => setShowNotesModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>Nota sobre {selectedCompany.name}</h3>
            <textarea
              className={styles.noteInput}
              placeholder="Escreva suas observações..."
              defaultValue={companyNotes[selectedCompany.id] || ''}
              rows={5}
            />
            <div className={styles.modalActions}>
              <button onClick={() => setShowNotesModal(false)}>Cancelar</button>
              <button 
                className={styles.saveButton}
                onClick={() => {
                  const textarea = document.querySelector('textarea');
                  if (textarea) {
                    handleSaveNote(selectedCompany.id, textarea.value);
                  }
                }}
              >
                Salvar Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};