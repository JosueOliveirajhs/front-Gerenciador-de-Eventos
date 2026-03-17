// src/pages/developer/CompanyDetails.tsx
import React, { useState, useEffect } from 'react';
import {
  MdArrowBack,
  MdBusiness,
  MdEdit,
  MdError,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdStar,
  MdNote,
  MdCheckCircle
} from 'react-icons/md';
import { companyService, EmpresaResponse } from '../../../services/company';
import styles from './CompanyDetails.module.css';

interface CompanyDetailsProps {
  companyId: number;
  onBack: () => void;
  onEdit: () => void;
}

export const CompanyDetails: React.FC<CompanyDetailsProps> = ({ 
  companyId, 
  onBack, 
  onEdit 
}) => {
  const [company, setCompany] = useState<EmpresaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCompany = async () => {
      if (!companyId) {
        setError('ID da empresa não fornecido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log(`🔍 Carregando empresa ID: ${companyId}`);
        const data = await companyService.getCompanyById(companyId);
        
        if (isMounted) {
          console.log('✅ Empresa carregada:', data);
          setCompany(data);
        }
      } catch (err: any) {
        console.error('❌ Erro ao carregar empresa:', err);
        if (isMounted) {
          if (err.response?.status === 404) {
            setError('Empresa não encontrada.');
          } else if (err.response?.status === 403) {
            setError('Acesso negado. Verifique suas permissões.');
          } else {
            setError('Erro ao carregar dados da empresa.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCompany();

    return () => {
      isMounted = false;
    };
  }, [companyId]);

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
        <p>Carregando empresa...</p>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className={styles.errorContainer}>
        <MdError size={48} />
        <h3>{error || 'Empresa não encontrada'}</h3>
        <button onClick={onBack} className={styles.backButton}>
          <MdArrowBack />
          Voltar para lista
        </button>
      </div>
    );
  }

  return (
    <div className={styles.detailsContainer}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          <MdArrowBack />
          Voltar
        </button>
        <h1 className={styles.title}>
          <MdBusiness />
          {company.nome}
        </h1>
        <button onClick={onEdit} className={styles.editButton}>
          <MdEdit />
          Editar
        </button>
      </div>

      {/* Company Info Card */}
      <div className={styles.companyCard}>
        <div className={styles.companyHeader}>
          <div className={styles.companyInfo}>
            <div className={styles.companyAvatar}>
              <MdBusiness size={48} />
            </div>
            <div className={styles.companyDetails}>
              <h2>{company.nome}</h2>
              <p><strong>Categoria:</strong> {company.categoria}</p>
              {company.verificado && (
                <span className={styles.verifiedBadge}>
                  <MdCheckCircle />
                  Verificado
                </span>
              )}
            </div>
          </div>
        </div>

        {company.avaliacao && (
          <div className={styles.ratingSection}>
            <h3>Avaliação</h3>
            {renderStars(company.avaliacao)}
          </div>
        )}

        <div className={styles.infoSection}>
          <h3>Informações de Contato</h3>
          <div className={styles.infoGrid}>
            {company.email && (
              <div className={styles.infoItem}>
                <MdEmail />
                <div>
                  <strong>Email:</strong>
                  <a href={`mailto:${company.email}`}>{company.email}</a>
                </div>
              </div>
            )}
            {company.telefone && (
              <div className={styles.infoItem}>
                <MdPhone />
                <div>
                  <strong>Telefone:</strong>
                  <a href={`tel:${company.telefone}`}>{companyService.formatPhone(company.telefone)}</a>
                </div>
              </div>
            )}
            {company.localizacao && (
              <div className={styles.infoItem}>
                <MdLocationOn />
                <div>
                  <strong>Localização:</strong>
                  <span>{company.localizacao}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {company.descricao && (
          <div className={styles.descriptionSection}>
            <h3>Descrição</h3>
            <p>{company.descricao}</p>
          </div>
        )}

        {company.observacao && (
          <div className={styles.noteSection}>
            <h3>Observações</h3>
            <div className={styles.noteCard}>
              <MdNote />
              <p>{company.observacao}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};