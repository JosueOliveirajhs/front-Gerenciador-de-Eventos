// src/pages/Client/components/dashboard/ClientDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, 
  FiDollarSign, 
  FiImage, 
  FiMessageCircle,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiPlus,
  FiArrowRight
} from 'react-icons/fi';
import { MdEvent, MdCalculate, MdPhotoLibrary, MdPeople } from 'react-icons/md';
import { useAuth } from '../../../../context/AuthContext';
import { eventService } from '../../../../services/events';
import { paymentService } from '../../../../services/payments';
import { collabService } from '../../../../services/collab';
import { Event } from '../../../../types/Event';
import { Payment } from '../../../../types/Payment';
import styles from './ClientDashboard.module.css';

interface ClientDashboardProps {
  onViewChange: (view: string) => void;
}

interface DashboardStats {
  totalEvents: number;
  confirmedEvents: number;
  totalSpent: number;
  pendingPayments: number;
  collabOpportunities: number;
  nextEventDays: number | null;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ onViewChange }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [collabs, setCollabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    confirmedEvents: 0,
    totalSpent: 0,
    pendingPayments: 0,
    collabOpportunities: 0,
    nextEventDays: null
  });

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carregar eventos do cliente
      const clientEvents = await eventService.getEventsByClientId(user!.id);
      setEvents(clientEvents);
      
      // Carregar pagamentos
      const clientPayments = await paymentService.getPaymentsByClientId(user!.id);
      setPayments(clientPayments);
      
      // Carregar oportunidades de collab
      const collabOpportunities = await collabService.getOpportunities();
      setCollabs(collabOpportunities);
      
      // Calcular estatísticas
      calculateStats(clientEvents, clientPayments, collabOpportunities);
      
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (events: Event[], payments: Payment[], collabs: any[]) => {
    const confirmedEvents = events.filter(e => e.status === 'CONFIRMED');
    const totalSpent = events
      .filter(e => e.status === 'CONFIRMED' || e.status === 'COMPLETED')
      .reduce((sum, event) => sum + (event.totalValue || 0), 0);
    
    const pendingPayments = payments.filter(p => p.status === 'PENDING').length;
    
    // Calcular dias até o próximo evento
    let nextEventDays = null;
    const futureEvents = events
      .filter(e => e.status === 'CONFIRMED')
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    
    if (futureEvents.length > 0) {
      const nextEvent = futureEvents[0];
      const eventDate = new Date(nextEvent.eventDate);
      const today = new Date();
      const diffTime = eventDate.getTime() - today.getTime();
      nextEventDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    setStats({
      totalEvents: events.length,
      confirmedEvents: confirmedEvents.length,
      totalSpent,
      pendingPayments,
      collabOpportunities: collabs.length,
      nextEventDays
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getNextEvent = () => {
    const futureEvents = events
      .filter(e => e.status === 'CONFIRMED')
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    
    return futureEvents[0] || null;
  };

  const nextEvent = getNextEvent();

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando seu dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Header com Boas-vindas */}
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeContent}>
          <h1 className={styles.welcomeTitle}>
            Bem-vindo(a) de volta, {user?.name?.split(' ')[0]}!
          </h1>
          <p className={styles.welcomeSubtitle}>
            {stats.nextEventDays !== null && stats.nextEventDays >= 0 ? (
              <>🎉 Faltam <strong>{stats.nextEventDays} dias</strong> para seu próximo evento</>
            ) : (
              <>✨ Planeje seu próximo evento conosco</>
            )}
          </p>
        </div>
        <button 
          className={styles.primaryAction}
          onClick={() => onViewChange('budget')}
        >
          <FiPlus size={20} />
          Simular Orçamento
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} onClick={() => onViewChange('events')}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <MdEvent size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Meus Eventos</span>
            <span className={styles.statValue}>{stats.totalEvents}</span>
            <span className={styles.statSubtext}>
              {stats.confirmedEvents} confirmados
            </span>
          </div>
        </div>

        <div className={styles.statCard} onClick={() => onViewChange('payments')}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <FiDollarSign size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Total Investido</span>
            <span className={styles.statValue}>{formatCurrency(stats.totalSpent)}</span>
            {stats.pendingPayments > 0 && (
              <span className={styles.statSubtext} style={{ color: '#f59e0b' }}>
                <FiAlertCircle size={14} />
                {stats.pendingPayments} pagamentos pendentes
              </span>
            )}
          </div>
        </div>

        <div className={styles.statCard} onClick={() => onViewChange('collabs')}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <MdPeople size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Collabs</span>
            <span className={styles.statValue}>{stats.collabOpportunities}</span>
            <span className={styles.statSubtext}>
              oportunidades disponíveis
            </span>
          </div>
        </div>

        <div className={styles.statCard} onClick={() => onViewChange('gallery')}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' }}>
            <MdPhotoLibrary size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Galeria</span>
            <span className={styles.statValue}>150+</span>
            <span className={styles.statSubtext}>
              inspirações para você
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Conteúdo */}
      <div className={styles.dashboardGrid}>
        {/* Coluna Esquerda */}
        <div className={styles.mainColumn}>
          {/* Próximo Evento */}
          {nextEvent && (
            <div className={styles.nextEventCard}>
              <div className={styles.cardHeader}>
                <h3>
                  <FiCalendar size={20} />
                  Próximo Evento
                </h3>
                <button 
                  className={styles.viewAllLink}
                  onClick={() => onViewChange('events')}
                >
                  Ver todos <FiArrowRight size={14} />
                </button>
              </div>
              
              <div className={styles.eventPreview}>
                <div className={styles.eventDate}>
                  <span className={styles.dateDay}>
                    {new Date(nextEvent.eventDate).getDate()}
                  </span>
                  <span className={styles.dateMonth}>
                    {new Date(nextEvent.eventDate).toLocaleDateString('pt-BR', { month: 'short' })}
                  </span>
                </div>
                <div className={styles.eventInfo}>
                  <h4>{nextEvent.title}</h4>
                  <div className={styles.eventDetails}>
                    <span>
                      <FiClock size={14} />
                      {nextEvent.startTime} - {nextEvent.endTime}
                    </span>
                    <span>
                      <MdPeople size={14} />
                      {nextEvent.guestCount} convidados
                    </span>
                  </div>
                  <div className={styles.eventProgress}>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ width: `${Math.max(0, 100 - (stats.nextEventDays || 0))}%` }}
                      />
                    </div>
                    <span className={styles.progressText}>
                      {stats.nextEventDays} dias restantes
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ações Rápidas */}
          <div className={styles.quickActions}>
            <h3>Ações Rápidas</h3>
            <div className={styles.actionsGrid}>
              <button 
                className={styles.actionCard}
                onClick={() => onViewChange('budget')}
              >
                <MdCalculate size={32} />
                <span>Simular Orçamento</span>
              </button>
              
              <button 
                className={styles.actionCard}
                onClick={() => onViewChange('gallery')}
              >
                <MdPhotoLibrary size={32} />
                <span>Ver Inspirações</span>
              </button>
              
              <button 
                className={styles.actionCard}
                onClick={() => onViewChange('collabs')}
              >
                <MdPeople size={32} />
                <span>Explorar Collabs</span>
              </button>
              
              <button 
                className={styles.actionCard}
                onClick={() => onViewChange('events')}
              >
                <MdEvent size={32} />
                <span>Meus Eventos</span>
              </button>
            </div>
          </div>
        </div>

        {/* Coluna Direita - Insights */}
        <div className={styles.sidebarColumn}>
          {/* Insights de Negócio */}
          <div className={styles.insightsCard}>
            <h3>
              <FiTrendingUp size={20} />
              Insights para Você
            </h3>
            
            <div className={styles.insightsList}>
              {stats.nextEventDays !== null && stats.nextEventDays <= 30 && (
                <div className={styles.insightItem}>
                  <div className={styles.insightIcon} style={{ background: '#fef3c7' }}>
                    <FiClock color="#f59e0b" size={16} />
                  </div>
                  <div className={styles.insightContent}>
                    <strong>Evento se aproximando!</strong>
                    <p>Faltam apenas {stats.nextEventDays} dias. Confira sua checklist.</p>
                  </div>
                </div>
              )}
              
              {stats.pendingPayments > 0 && (
                <div className={styles.insightItem}>
                  <div className={styles.insightIcon} style={{ background: '#fee2e2' }}>
                    <FiAlertCircle color="#ef4444" size={16} />
                  </div>
                  <div className={styles.insightContent}>
                    <strong>Pagamentos Pendentes</strong>
                    <p>Você tem {stats.pendingPayments} pagamento(s) para realizar.</p>
                  </div>
                </div>
              )}
              
              <div className={styles.insightItem}>
                <div className={styles.insightIcon} style={{ background: '#d1fae5' }}>
                  <FiCheckCircle color="#10b981" size={16} />
                </div>
                <div className={styles.insightContent}>
                  <strong>Economize com Collabs</strong>
                  <p>Parcerias podem reduzir custos em até 30%.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Collabs em Destaque */}
          <div className={styles.collabsPreview}>
            <div className={styles.cardHeader}>
              <h3>
                <MdPeople size={20} />
                Collabs em Destaque
              </h3>
              <button 
                className={styles.viewAllLink}
                onClick={() => onViewChange('collabs')}
              >
                Ver todos <FiArrowRight size={14} />
              </button>
            </div>
            
            {collabs.slice(0, 2).map((collab, index) => (
              <div key={index} className={styles.collabItem}>
                <div className={styles.collabPartners}>
                  <div className={styles.partnerAvatar}>🎨</div>
                  <div className={styles.partnerAvatar}>📸</div>
                </div>
                <div className={styles.collabInfo}>
                  <strong>{collab.title}</strong>
                  <p>Economia de {collab.discount}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};