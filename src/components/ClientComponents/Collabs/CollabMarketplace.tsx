// src/pages/Client/components/collabs/CollabMarketplace.tsx
import React, { useState, useEffect } from 'react';
import { FiStar, FiUsers, FiDollarSign, FiArrowRight, FiCheck } from 'react-icons/fi';
import { MdPeople, MdPhotoCamera, MdBrush, MdRestaurant } from 'react-icons/md';
import { collabService, CollabOpportunity } from '../../../../services/collab';
import styles from './CollabMarketplace.module.css';

export const CollabMarketplace: React.FC = () => {
  const [opportunities, setOpportunities] = useState<CollabOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollab, setSelectedCollab] = useState<CollabOpportunity | null>(null);

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const data = await collabService.getOpportunities();
      setOpportunities(data);
    } catch (error) {
      console.error('Erro ao carregar collabs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPartnerIcon = (type: string) => {
    switch(type) {
      case 'DECORATOR': return <MdBrush size={20} />;
      case 'PHOTOGRAPHER': return <MdPhotoCamera size={20} />;
      case 'CATERING': return <MdRestaurant size={20} />;
      default: return <MdPeople size={20} />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Descobrindo parcerias incríveis...</p>
      </div>
    );
  }

  return (
    <div className={styles.collabMarketplace}>
      <div className={styles.pageHeader}>
        <h1>
          <MdPeople size={28} />
          Marketplace de Collabs
        </h1>
        <p className={styles.pageDescription}>
          Conecte-se com os melhores profissionais e economize em seu evento
        </p>
      </div>

      {/* Banner de Benefícios */}
      <div className={styles.benefitsBanner}>
        <div className={styles.benefitItem}>
          <FiDollarSign size={24} />
          <div>
            <strong>Economia Garantida</strong>
            <p>Até 30% de desconto em parcerias</p>
          </div>
        </div>
        <div className={styles.benefitItem}>
          <FiStar size={24} />
          <div>
            <strong>Profissionais Premium</strong>
            <p>Parceiros verificados e avaliados</p>
          </div>
        </div>
        <div className={styles.benefitItem}>
          <FiUsers size={24} />
          <div>
            <strong>Divulgação Cruzada</strong>
            <p>Seu evento em múltiplos canais</p>
          </div>
        </div>
      </div>

      {/* Grid de Oportunidades */}
      <div className={styles.opportunitiesGrid}>
        {opportunities.map(opp => (
          <div key={opp.id} className={styles.opportunityCard}>
            <div className={styles.cardHeader}>
              <h3>{opp.title}</h3>
              <span className={styles.discountBadge}>
                {opp.discount}% OFF
              </span>
            </div>
            
            <p className={styles.description}>{opp.description}</p>
            
            <div className={styles.partnersList}>
              <h4>Parceiros:</h4>
              <div className={styles.partnersAvatars}>
                {opp.partners.map((partner, idx) => (
                  <div key={idx} className={styles.partnerChip}>
                    {getPartnerIcon(partner.type)}
                    <span>{partner.name}</span>
                    <div className={styles.rating}>
                      <FiStar size={12} fill="#fbbf24" color="#fbbf24" />
                      {partner.rating}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.benefitsList}>
              <h4>Benefícios:</h4>
              <ul>
                {opp.benefits.map((benefit, idx) => (
                  <li key={idx}>
                    <FiCheck size={14} color="#10b981" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            
            <button 
              className={styles.viewDetailsBtn}
              onClick={() => setSelectedCollab(opp)}
            >
              Ver Detalhes
              <FiArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Modal de Detalhes */}
      {selectedCollab && (
        <div className={styles.modal} onClick={() => setSelectedCollab(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>{selectedCollab.title}</h2>
            <p>{selectedCollab.description}</p>
            
            <div className={styles.modalSection}>
              <h3>Parceiros Envolvidos</h3>
              {selectedCollab.partners.map((partner, idx) => (
                <div key={idx} className={styles.partnerDetail}>
                  <div className={styles.partnerIcon}>
                    {getPartnerIcon(partner.type)}
                  </div>
                  <div className={styles.partnerInfo}>
                    <strong>{partner.name}</strong>
                    <span>{partner.type}</span>
                    <div className={styles.partnerRating}>
                      <FiStar size={14} fill="#fbbf24" />
                      {partner.rating} • 50+ eventos
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className={styles.modalSection}>
              <h3>Requisitos</h3>
              <ul>
                {selectedCollab.requirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
            
            <div className={styles.modalActions}>
              <button className={styles.contactBtn}>
                Entrar em Contato
              </button>
              <button className={styles.applyBtn}>
                Solicitar Parceria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};