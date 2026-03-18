// src/components/DeveloperCompents/Catalogo/CatalogoDetails.tsx
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
  MdCheckCircle,
  MdInfoOutline,
  MdCategory
} from 'react-icons/md';
import { catalogoService } from '../../../services/catalogo';
import { EmpresaResponse } from '../../../types/developer';
import styles from './CatalogoDetails.module.css';

interface CatalogoDetailsProps {
  empresaId: number;
  onBack: () => void;
  onEdit: () => void;
}

export const CatalogoDetails: React.FC<CatalogoDetailsProps> = ({ 
  empresaId, 
  onBack, 
  onEdit 
}) => {
  const [empresa, setEmpresa] = useState<EmpresaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadEmpresa = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`🔍 Carregando empresa ID: ${empresaId}`);
        const data = await catalogoService.getEmpresaById(empresaId);
        
        if (isMounted) {
          setEmpresa(data);
        }
      } catch (err: any) {
        console.error('❌ Erro ao carregar empresa:', err);
        if (isMounted) {
          if (err.response?.status === 404) {
            setError('Empresa não encontrada no catálogo.');
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

    loadEmpresa();

    return () => {
      isMounted = false;
    };
  }, [empresaId]);

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
        <p>Carregando empresa...</p>
      </div>
    );
  }

  if (error || !empresa) {
    return (
      <div className={styles.errorContainer}>
        <MdError size={48} />
        <h3>{error || 'Empresa não encontrada'}</h3>
        <button onClick={onBack} className={styles.backButton}>
          <MdArrowBack />
          Voltar para catálogo
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
          {empresa.nome}
        </h1>
        <button onClick={onEdit} className={styles.editButton}>
          <MdEdit />
          Editar
        </button>
      </div>

      {/* Company Card */}
      <div className={styles.companyCard}>
        <div className={styles.companyHeader}>
          <div className={styles.companyInfo}>
            <div className={styles.companyAvatar}>
              <MdBusiness size={48} />
            </div>
            <div className={styles.companyDetails}>
              <h2>{empresa.nome}</h2>
              <div className={styles.companyMeta}>
                <span 
                  className={styles.categoryBadge}
                  style={{ backgroundColor: catalogoService.getCategoriaColor(empresa.categoria) + '20', 
                           color: catalogoService.getCategoriaColor(empresa.categoria) }}
                >
                  <MdCategory />
                  {empresa.categoria}
                </span>
                {empresa.verificado && (
                  <span className={styles.verifiedBadge}>
                    <MdCheckCircle />
                    Verificado
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {empresa.avaliacao && (
          <div className={styles.ratingSection}>
            <h3>Avaliação</h3>
            {renderStars(empresa.avaliacao)}
          </div>
        )}

        <div className={styles.infoSection}>
          <h3>Informações de Contato</h3>
          <div className={styles.infoGrid}>
            {empresa.email && (
              <div className={styles.infoItem}>
                <MdEmail />
                <div>
                  <strong>Email:</strong>
                  <a href={`mailto:${empresa.email}`}>{empresa.email}</a>
                </div>
              </div>
            )}
            {empresa.telefone && (
              <div className={styles.infoItem}>
                <MdPhone />
                <div>
                  <strong>Telefone:</strong>
                  <a href={`tel:${empresa.telefone}`}>{catalogoService.formatPhone(empresa.telefone)}</a>
                </div>
              </div>
            )}
            {empresa.localizacao && (
              <div className={styles.infoItem}>
                <MdLocationOn />
                <div>
                  <strong>Localização:</strong>
                  <span>{empresa.localizacao}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {empresa.descricao && (
          <div className={styles.descriptionSection}>
            <h3>Descrição</h3>
            <p>{empresa.descricao}</p>
          </div>
        )}

        {empresa.observacao && (
          <div className={styles.noteSection}>
            <h3>Observações</h3>
            <div className={styles.noteCard}>
              <MdNote />
              <p>{empresa.observacao}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};