// src/components/ClientComponents/CompanySearch/CompanyDetails.tsx
import React, { useState, useEffect } from 'react';
import { 
  FiMapPin, FiStar, FiPhone, FiMail, FiArrowLeft,
  FiLoader, FiAlertCircle, FiCheckCircle,
  FiBookmark, FiEdit2, FiSave, FiX,
  FiClock, FiGlobe
} from 'react-icons/fi';
import { MdVerified, MdBusiness, MdCategory } from 'react-icons/md';
import { empresaService, EmpresaData } from '../../../services/empresa';
import styles from './CompanyDetails.module.css';

interface CompanyDetailsProps {
  companyId: number;
  onBack: () => void;
}

export const CompanyDetails: React.FC<CompanyDetailsProps> = ({ companyId, onBack }) => {
  const [company, setCompany] = useState<EmpresaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [observacao, setObservacao] = useState('');
  const [isEditingObs, setIsEditingObs] = useState(false);
  const [savingObs, setSavingObs] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');

  useEffect(() => {
    loadCompanyDetails();
  }, [companyId]);

  const loadCompanyDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await empresaService.buscarPorId(companyId);
      setCompany(data);
      setObservacao(data.observacao || '');
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
      setError('Erro ao carregar detalhes da empresa.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveObservacao = async () => {
    if (!company) return;
    setSavingObs(true);
    try {
      const updated = await empresaService.salvarObservacao(company.id, observacao);
      setCompany(updated);
      setIsEditingObs(false);
      setSuccessMessage('Observacao salva com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Erro ao salvar observacao:', err);
      setError('Erro ao salvar observacao.');
    } finally {
      setSavingObs(false);
    }
  };

  // ✅ Enviar avaliação usando o endpoint PATCH /avaliar
  const handleSubmitRating = async (rating: number) => {
    if (!company || submittingRating) return;
    
    setSubmittingRating(true);
    try {
      const updated = await empresaService.avaliarEmpresa(company.id, rating);
      setCompany(updated);
      setSuccessMessage(`Avaliacao de ${rating} estrela(s) registrada!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Erro ao enviar avaliacao:', err);
      setError('Erro ao enviar avaliacao. Tente novamente.');
    } finally {
      setSubmittingRating(false);
    }
  };

  // ✅ Renderizar ESTRELAS
  const renderStars = (rating: number, interactive = false, size = 22) => {
    return Array.from({ length: 5 }).map((_, index) => {
      const starValue = index + 1;
      const filled = interactive 
        ? (hoverRating || (company?.avaliacao || 0)) >= starValue
        : index < Math.floor(rating);
      
      return (
        <FiStar 
          key={index}
          size={size}
          color={filled ? '#fbbf24' : '#e2e8f0'}
          fill={filled ? '#fbbf24' : 'none'}
          className={interactive ? styles.interactiveStar : ''}
          onClick={interactive ? () => handleSubmitRating(starValue) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(starValue) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
        />
      );
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Carregando detalhes da empresa...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <FiAlertCircle size={48} />
          <h3>Erro</h3>
          <p>{error || 'Empresa nao encontrada'}</p>
          <button className={styles.backButton} onClick={onBack}>
            <FiArrowLeft size={16} /> Voltar para lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <nav className={styles.breadcrumb}>
        <button className={styles.backLink} onClick={onBack}>
          <FiArrowLeft size={18} />
          Voltar para lista
        </button>
      </nav>

      {successMessage && (
        <div className={styles.successBanner}>
          <FiCheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      <div className={styles.heroCard}>
        <div className={styles.heroContent}>
          <div className={styles.heroLeft}>
            <div className={styles.avatarWrapper}>
              <div className={styles.avatar}>
                <MdBusiness size={48} />
              </div>
              {company.verificado && (
                <span className={styles.verifiedBadge} title="Empresa Verificada">
                  <MdVerified size={16} />
                </span>
              )}
            </div>
            <div className={styles.heroInfo}>
              <div className={styles.titleRow}>
                <h1>{company.nome}</h1>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.categoryTag}>
                  <MdCategory size={14} />
                  {company.categoria}
                </span>
                <span className={styles.divider}>•</span>
                <span className={styles.locationText}>
                  <FiMapPin size={14} />
                  {company.localizacao || 'Nao informado'}
                </span>
              </div>
              {/* ✅ AVALIAÇÃO COM ESTRELAS */}
              <div className={styles.ratingRow}>
                {renderStars(company.avaliacao || 0, false, 20)}
                <span className={styles.ratingNumber}>
                  {company.avaliacao ? company.avaliacao.toFixed(1) : '0.0'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'info' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <FiGlobe size={16} /> Informacoes
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'reviews' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          <FiStar size={16} /> Avaliacoes
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'info' && (
          <>
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}><FiBookmark size={20} /> Sobre a Empresa</h2>
              <p className={styles.aboutText}>{company.descricao || 'Nenhuma descricao fornecida.'}</p>
            </div>

            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}><FiPhone size={20} /> Contato</h2>
              <div className={styles.contactGrid}>
                {company.telefone && (
                  <div className={styles.contactCard}>
                    <div className={styles.contactIcon}><FiPhone size={20} /></div>
                    <div className={styles.contactContent}>
                      <span className={styles.contactLabel}>Telefone</span>
                      <span className={styles.contactValue}>{company.telefone}</span>
                    </div>
                  </div>
                )}
                {company.email && (
                  <div className={styles.contactCard}>
                    <div className={styles.contactIcon}><FiMail size={20} /></div>
                    <div className={styles.contactContent}>
                      <span className={styles.contactLabel}>Email</span>
                      <span className={styles.contactValue}>{company.email}</span>
                    </div>
                  </div>
                )}
                {company.localizacao && (
                  <div className={styles.contactCard}>
                    <div className={styles.contactIcon}><FiMapPin size={20} /></div>
                    <div className={styles.contactContent}>
                      <span className={styles.contactLabel}>Endereco</span>
                      <span className={styles.contactValue}>{company.localizacao}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}><FiEdit2 size={20} /> Observacoes</h2>
                {!isEditingObs && (
                  <button className={styles.editObsBtn} onClick={() => setIsEditingObs(true)}>
                    <FiEdit2 size={14} /> Editar
                  </button>
                )}
              </div>
              {isEditingObs ? (
                <div className={styles.obsEditArea}>
                  <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Escreva suas observacoes..." rows={5} className={styles.obsTextarea} autoFocus />
                  <div className={styles.obsActions}>
                    <button className={styles.btnCancel} onClick={() => { setIsEditingObs(false); setObservacao(company.observacao || ''); }} disabled={savingObs}>
                      <FiX size={14} /> Cancelar
                    </button>
                    <button className={styles.btnSave} onClick={handleSaveObservacao} disabled={savingObs}>
                      {savingObs ? <><FiLoader size={14} className={styles.spinning} /> Salvando...</> : <><FiSave size={14} /> Salvar</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.obsContent}>
                  {company.observacao ? (
                    <p className={styles.obsText}>{company.observacao}</p>
                  ) : (
                    <div className={styles.obsEmpty}>
                      <FiBookmark size={24} />
                      <p>Nenhuma observacao registrada.</p>
                      <button className={styles.obsAddBtn} onClick={() => setIsEditingObs(true)}>Adicionar</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'reviews' && (
          <>
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}><FiStar size={20} /> Resumo</h2>
              <div className={styles.ratingSummary}>
                <div className={styles.ratingBig}>
                  <span className={styles.ratingBigNumber}>{company.avaliacao ? company.avaliacao.toFixed(1) : '0.0'}</span>
                  <span className={styles.ratingBigMax}>/ 5.0</span>
                </div>
                <div className={styles.ratingStars}>
                  {renderStars(company.avaliacao || 0, false, 28)}
                </div>
              </div>
            </div>

            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}><FiStar size={20} /> Sua Avaliacao</h2>
              <div className={styles.rateArea}>
                <div className={styles.rateStars}>
                  {renderStars(company.avaliacao || 0, true, 36)}
                </div>
                <p className={styles.rateHint}>
                  {submittingRating ? 'Enviando...' : 'Clique nas estrelas para avaliar'}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};