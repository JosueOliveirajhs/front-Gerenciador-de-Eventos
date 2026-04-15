// src/pages/Client/components/budget/BudgetSimulator.tsx
import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiUsers, FiCalendar, FiClock, FiZap, FiDownload } from 'react-icons/fi';
import { MdCalculate, MdEvent } from 'react-icons/md';
import { useAuth } from '../../../../context/AuthContext';
import { budgetService } from '../../../../services/budget';
import styles from './BudgetSimulator.module.css';

interface BudgetConfig {
  eventType: string;
  guestCount: number;
  hours: number;
  hasDecoration: boolean;
  hasCatering: boolean;
  hasPhotography: boolean;
  hasMusic: boolean;
}

interface BudgetResult {
  basePrice: number;
  servicesTotal: number;
  discount: number;
  finalPrice: number;
  suggestedPackage: string;
  collabSavings: number;
}

export const BudgetSimulator: React.FC = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<BudgetConfig>({
    eventType: 'ANIVERSARIO',
    guestCount: 50,
    hours: 4,
    hasDecoration: true,
    hasCatering: true,
    hasPhotography: false,
    hasMusic: false
  });
  
  const [result, setResult] = useState<BudgetResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [showCollabSuggestion, setShowCollabSuggestion] = useState(false);

  const calculateBudget = async () => {
    setCalculating(true);
    try {
      const calculation = await budgetService.calculate({
        ...config,
        clientId: user?.id
      });
      setResult(calculation);
      
      // Mostrar sugestão de collab se houver economia
      if (calculation.collabSavings > 0) {
        setShowCollabSuggestion(true);
      }
    } catch (error) {
      console.error('Erro ao calcular orçamento:', error);
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const eventTypes = [
    { value: 'ANIVERSARIO', label: 'Aniversário', icon: '🎂' },
    { value: 'CASAMENTO', label: 'Casamento', icon: '💍' },
    { value: 'CORPORATIVO', label: 'Corporativo', icon: '💼' },
    { value: 'FORMATURA', label: 'Formatura', icon: '🎓' },
    { value: 'CONFRATERNIZACAO', label: 'Confraternização', icon: '🎉' }
  ];

  return (
    <div className={styles.budgetSimulator}>
      <div className={styles.pageHeader}>
        <h1>
          <MdCalculate size={28} />
          Simulador de Orçamento
        </h1>
        <p className={styles.pageDescription}>
          Configure seu evento e veja uma estimativa de custos em tempo real
        </p>
      </div>

      <div className={styles.simulatorGrid}>
        {/* Painel de Configuração */}
        <div className={styles.configPanel}>
          <h3>📋 Configure seu Evento</h3>
          
          <div className={styles.configSection}>
            <label>Tipo de Evento</label>
            <div className={styles.eventTypesGrid}>
              {eventTypes.map(type => (
                <button
                  key={type.value}
                  className={`${styles.eventTypeBtn} ${config.eventType === type.value ? styles.active : ''}`}
                  onClick={() => setConfig({ ...config, eventType: type.value })}
                >
                  <span className={styles.eventIcon}>{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.configSection}>
            <label>
              <FiUsers size={16} />
              Número de Convidados
            </label>
            <div className={styles.sliderContainer}>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={config.guestCount}
                onChange={(e) => setConfig({ ...config, guestCount: Number(e.target.value) })}
                className={styles.slider}
              />
              <span className={styles.sliderValue}>{config.guestCount} pessoas</span>
            </div>
          </div>

          <div className={styles.configSection}>
            <label>
              <FiClock size={16} />
              Duração do Evento
            </label>
            <div className={styles.sliderContainer}>
              <input
                type="range"
                min="2"
                max="8"
                step="1"
                value={config.hours}
                onChange={(e) => setConfig({ ...config, hours: Number(e.target.value) })}
                className={styles.slider}
              />
              <span className={styles.sliderValue}>{config.hours} horas</span>
            </div>
          </div>

          <div className={styles.configSection}>
            <label>Serviços Adicionais</label>
            <div className={styles.servicesGrid}>
              <label className={styles.serviceCheckbox}>
                <input
                  type="checkbox"
                  checked={config.hasDecoration}
                  onChange={(e) => setConfig({ ...config, hasDecoration: e.target.checked })}
                />
                <span>🎨 Decoração</span>
              </label>
              
              <label className={styles.serviceCheckbox}>
                <input
                  type="checkbox"
                  checked={config.hasCatering}
                  onChange={(e) => setConfig({ ...config, hasCatering: e.target.checked })}
                />
                <span>🍽️ Buffet</span>
              </label>
              
              <label className={styles.serviceCheckbox}>
                <input
                  type="checkbox"
                  checked={config.hasPhotography}
                  onChange={(e) => setConfig({ ...config, hasPhotography: e.target.checked })}
                />
                <span>📸 Fotografia</span>
              </label>
              
              <label className={styles.serviceCheckbox}>
                <input
                  type="checkbox"
                  checked={config.hasMusic}
                  onChange={(e) => setConfig({ ...config, hasMusic: e.target.checked })}
                />
                <span>🎵 Música/DJ</span>
              </label>
            </div>
          </div>

          <button 
            className={styles.calculateBtn}
            onClick={calculateBudget}
            disabled={calculating}
          >
            {calculating ? (
              <>Calculando...</>
            ) : (
              <>
                <FiZap size={18} />
                Calcular Orçamento
              </>
            )}
          </button>
        </div>

        {/* Painel de Resultados */}
        <div className={styles.resultPanel}>
          {result ? (
            <>
              <h3>💰 Seu Orçamento</h3>
              
              <div className={styles.priceBreakdown}>
                <div className={styles.priceItem}>
                  <span>Valor Base (Espaço)</span>
                  <strong>{formatCurrency(result.basePrice)}</strong>
                </div>
                
                <div className={styles.priceItem}>
                  <span>Serviços Adicionais</span>
                  <strong>{formatCurrency(result.servicesTotal)}</strong>
                </div>
                
                {result.discount > 0 && (
                  <div className={styles.priceItem} style={{ color: '#10b981' }}>
                    <span>Desconto</span>
                    <strong>-{formatCurrency(result.discount)}</strong>
                  </div>
                )}
                
                <div className={styles.priceDivider} />
                
                <div className={styles.priceTotal}>
                  <span>Total Estimado</span>
                  <strong>{formatCurrency(result.finalPrice)}</strong>
                </div>
              </div>

              {showCollabSuggestion && result.collabSavings > 0 && (
                <div className={styles.collabSuggestion}>
                  <div className={styles.suggestionIcon}>🤝</div>
                  <div className={styles.suggestionContent}>
                    <strong>Economize ainda mais com Collabs!</strong>
                    <p>Parcerias podem reduzir seu custo em até {formatCurrency(result.collabSavings)}</p>
                    <button className={styles.exploreCollabsBtn}>
                      Explorar Parcerias
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.packageSuggestion}>
                <div className={styles.packageBadge}>
                  <MdEvent size={20} />
                  Pacote Sugerido
                </div>
                <h4>{result.suggestedPackage}</h4>
                <p>Baseado no seu perfil de evento, este pacote oferece o melhor custo-benefício.</p>
              </div>

              <div className={styles.resultActions}>
                <button className={styles.saveBudgetBtn}>
                  <FiDownload size={18} />
                  Salvar Orçamento
                </button>
                <button className={styles.requestQuoteBtn}>
                  Solicitar Cotação
                </button>
              </div>
            </>
          ) : (
            <div className={styles.emptyResult}>
              <MdCalculate size={64} />
              <h3>Configure seu evento</h3>
              <p>Preencha as informações ao lado para ver uma estimativa de custos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};