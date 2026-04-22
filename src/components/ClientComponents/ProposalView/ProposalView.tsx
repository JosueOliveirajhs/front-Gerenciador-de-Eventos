// src/components/ClientComponents/ProposalView/ProposalView.tsx
import React, { useState, useEffect } from 'react';
import { 
  FiDollarSign, 
  FiCalendar, 
  FiClock, 
  FiUsers,
  FiDownload,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
  FiPackage,
  FiMessageCircle,
  FiChevronRight,
  FiAlertCircle,
  FiClock as FiHistory,
  FiCheck,
  FiInfo
} from 'react-icons/fi';
import { 
  MdCalculate, 
  MdAttachMoney, 
  MdChecklist,
  MdDescription,
  MdHistory,
  MdVerified
} from 'react-icons/md';
import { proposalService } from '../../../services/proposal';
import { useAuth } from '../../../context/AuthContext';
import styles from './ProposalView.module.css';

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

interface ProposalVersion {
  id: string;
  version: number;
  createdAt: string;
  totalValue: number;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'APPROVED' | 'REJECTED';
  changes: string;
  createdBy: string;
}

interface Proposal {
  id: string;
  eventId: string;
  eventTitle: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  proposalNumber: string;
  createdAt: string;
  validUntil: string;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'APPROVED' | 'REJECTED';
  subtotal: number;
  discount: number;
  discountReason?: string;
  totalValue: number;
  services: ServiceItem[];
  paymentTerms: {
    installments: number;
    firstPaymentDate: string;
    installmentValue: number;
    paymentMethod?: string;
  };
  notes: string;
  termsAndConditions: string;
  versions: ProposalVersion[];
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

interface ProposalViewProps {
  proposalId?: string;
  onBack?: () => void;
  onStatusChange?: (status: string) => void;
}

export const ProposalView: React.FC<ProposalViewProps> = ({ 
  proposalId, 
  onBack, 
  onStatusChange 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ProposalVersion | null>(null);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    loadProposal();
  }, [proposalId]);

  const loadProposal = async () => {
    try {
      setLoading(true);
      // Dados mockados para demonstração
      setProposal(getMockProposal());
    } catch (error) {
      console.error('Erro ao carregar proposta:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMockProposal = (): Proposal => {
    return {
      id: 'prop-001',
      eventId: 'evt-001',
      eventTitle: 'Aniversário de 30 anos - Maria',
      eventType: 'ANIVERSARIO',
      eventDate: '2026-06-15',
      startTime: '19:00',
      endTime: '00:00',
      guestCount: 80,
      proposalNumber: 'PROP-2026-0042',
      createdAt: '2026-03-10T10:00:00',
      validUntil: '2026-04-10',
      status: 'SENT',
      subtotal: 23500,
      discount: 1000,
      discountReason: 'Desconto especial para fechamento antecipado',
      totalValue: 22500,
      services: [
        {
          id: 's1',
          name: 'Buffet Completo Premium',
          description: 'Jantar completo com 3 opções de prato principal, buffet de sobremesas, open bar premium (whisky 12 anos, vodka importada, espumante) e equipe de serviço completa',
          quantity: 1,
          unitPrice: 12000,
          totalPrice: 12000
        },
        {
          id: 's2',
          name: 'Decoração Temática',
          description: 'Decoração completa com flores naturais importadas, iluminação cênica, mobiliário premium e arranjos especiais',
          quantity: 1,
          unitPrice: 5000,
          totalPrice: 5000
        },
        {
          id: 's3',
          name: 'Fotografia e Filmagem',
          description: 'Cobertura completa com 2 fotógrafos, 1 cinegrafista, making off, álbum digital e vídeo editado',
          quantity: 1,
          unitPrice: 3500,
          totalPrice: 3500
        },
        {
          id: 's4',
          name: 'DJ e Iluminação',
          description: 'DJ profissional com equipamento de som de alta qualidade e iluminação para pista de dança',
          quantity: 1,
          unitPrice: 2000,
          totalPrice: 2000
        },
        {
          id: 's5',
          name: 'Bolo Personalizado',
          description: 'Bolo de 3 andares personalizado com tema tropical chic',
          quantity: 1,
          unitPrice: 800,
          totalPrice: 800
        },
        {
          id: 's6',
          name: 'Segurança',
          description: '2 seguranças para controle de acesso e estacionamento',
          quantity: 1,
          unitPrice: 1200,
          totalPrice: 1200
        }
      ],
      paymentTerms: {
        installments: 4,
        firstPaymentDate: '2026-03-20',
        installmentValue: 5625,
        paymentMethod: 'Transferência Bancária ou PIX'
      },
      notes: 'Valores incluem todos os impostos e taxas de serviço. Qualquer alteração no número de convidados ou serviços deve ser comunicada com pelo menos 15 dias de antecedência.',
      termsAndConditions: '1. O sinal de 30% deve ser pago em até 5 dias úteis após aprovação da proposta.\n2. Cancelamento com até 60 dias de antecedência: reembolso de 70%.\n3. Cancelamento com menos de 30 dias: sem reembolso.\n4. Qualquer dano ao espaço será cobrado à parte.',
      versions: [
        {
          id: 'v1',
          version: 1,
          createdAt: '2026-03-10T10:00:00',
          totalValue: 24500,
          status: 'SENT',
          changes: 'Proposta inicial',
          createdBy: 'Equipe Comercial'
        },
        {
          id: 'v2',
          version: 2,
          createdAt: '2026-03-12T14:30:00',
          totalValue: 22500,
          status: 'SENT',
          changes: 'Ajuste de valores após negociação. Incluído desconto de R$ 1.000 e adicionado bolo personalizado',
          createdBy: 'Gerente Comercial'
        }
      ]
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      DRAFT: { label: 'Rascunho', color: '#64748b', icon: <FiFileText size={14} /> },
      SENT: { label: 'Enviada', color: '#3b82f6', icon: <FiFileText size={14} /> },
      VIEWED: { label: 'Visualizada', color: '#f59e0b', icon: <FiFileText size={14} /> },
      APPROVED: { label: 'Aprovada', color: '#10b981', icon: <FiCheckCircle size={14} /> },
      REJECTED: { label: 'Recusada', color: '#ef4444', icon: <FiXCircle size={14} /> }
    };
    
    const config = statusConfig[status] || statusConfig.DRAFT;
    
    return (
      <span className={styles.statusBadge} style={{ background: `${config.color}20`, color: config.color }}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const handleApprove = async () => {
    if (!proposal) return;
    
    setProcessing(true);
    try {
      await proposalService.approveProposal(proposal.id);
      setProposal({ 
        ...proposal, 
        status: 'APPROVED',
        approvedAt: new Date().toISOString()
      });
      onStatusChange?.('APPROVED');
    } catch (error) {
      console.error('Erro ao aprovar proposta:', error);
      alert('Erro ao aprovar proposta. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!proposal || !rejectReason.trim()) return;
    
    setProcessing(true);
    try {
      await proposalService.rejectProposal(proposal.id, rejectReason);
      setProposal({ 
        ...proposal, 
        status: 'REJECTED',
        rejectedAt: new Date().toISOString(),
        rejectionReason: rejectReason
      });
      setShowRejectModal(false);
      setRejectReason('');
      onStatusChange?.('REJECTED');
    } catch (error) {
      console.error('Erro ao recusar proposta:', error);
      alert('Erro ao recusar proposta. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!proposal) return;
    
    try {
      const pdfBlob = await proposalService.downloadProposalPDF(proposal.id);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Proposta_${proposal.proposalNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      alert('Erro ao baixar PDF. Tente novamente.');
    }
  };

  const handleRequestChange = () => {
    alert('Funcionalidade de solicitar alterações será integrada ao chat.');
  };

  const getEventTypeText = (type: string) => {
    const types: Record<string, string> = {
      'ANIVERSARIO': 'Aniversário',
      'CASAMENTO': 'Casamento',
      'CORPORATIVO': 'Corporativo',
      'FORMATURA': 'Formatura',
      'CONFRATERNIZACAO': 'Confraternização',
      'OUTRO': 'Outro'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando proposta...</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className={styles.emptyState}>
        <MdCalculate size={64} />
        <h3>Nenhuma proposta encontrada</h3>
        <p>Solicite um orçamento para visualizar sua proposta aqui.</p>
        {onBack && (
          <button className={styles.backButton} onClick={onBack}>
            Voltar
          </button>
        )}
      </div>
    );
  }

  const canApprove = ['SENT', 'VIEWED'].includes(proposal.status);
  const isApproved = proposal.status === 'APPROVED';
  const isRejected = proposal.status === 'REJECTED';
  const isExpired = new Date(proposal.validUntil) < new Date();

  return (
    <div className={styles.proposalView}>
      {/* Header */}
      <div className={styles.proposalHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.proposalTitle}>
            <MdCalculate size={28} />
            <h1>Proposta Comercial</h1>
          </div>
          <p className={styles.proposalNumber}>Nº {proposal.proposalNumber}</p>
        </div>
        <div className={styles.headerRight}>
          {getStatusBadge(proposal.status)}
          <button 
            className={styles.versionHistoryButton}
            onClick={() => setShowVersionHistory(true)}
          >
            <MdHistory size={16} />
            Histórico
          </button>
        </div>
      </div>

      {/* Alerta de Expiração */}
      {!isApproved && !isRejected && (
        <div className={`${styles.expiryAlert} ${isExpired ? styles.expired : ''}`}>
          <FiAlertCircle size={16} />
          <span>
            {isExpired 
              ? 'Esta proposta expirou. Solicite uma nova proposta.' 
              : `Proposta válida até ${formatDate(proposal.validUntil)}`
            }
          </span>
        </div>
      )}

      {/* Informações do Evento */}
      <div className={styles.eventInfoCard}>
        <div className={styles.eventHeader}>
          <h3>{proposal.eventTitle}</h3>
          <span className={styles.eventType}>{getEventTypeText(proposal.eventType)}</span>
        </div>
        <div className={styles.eventDetails}>
          <div className={styles.detailItem}>
            <FiCalendar size={16} />
            <span>{formatDate(proposal.eventDate)}</span>
          </div>
          <div className={styles.detailItem}>
            <FiClock size={16} />
            <span>{proposal.startTime} - {proposal.endTime}</span>
          </div>
          <div className={styles.detailItem}>
            <FiUsers size={16} />
            <span>{proposal.guestCount} convidados</span>
          </div>
        </div>
      </div>

      {/* Serviços Incluídos */}
      <div className={styles.servicesSection}>
        <h2>
          <FiPackage size={20} />
          Serviços Incluídos
        </h2>
        
        <div className={styles.servicesTable}>
          <div className={styles.tableHeader}>
            <span>Serviço</span>
            <span>Qtd</span>
            <span>Valor Unit.</span>
            <span>Total</span>
          </div>
          
          {proposal.services.map(service => (
            <div key={service.id} className={styles.tableRow}>
              <div className={styles.serviceInfo}>
                <strong>{service.name}</strong>
                <p>{service.description}</p>
              </div>
              <span>{service.quantity}</span>
              <span>{formatCurrency(service.unitPrice)}</span>
              <span className={styles.serviceTotal}>{formatCurrency(service.totalPrice)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Resumo de Valores */}
      <div className={styles.financialSummary}>
        <div className={styles.summaryRow}>
          <span>Subtotal</span>
          <strong>{formatCurrency(proposal.subtotal)}</strong>
        </div>
        {proposal.discount > 0 && (
          <div className={styles.summaryRow} style={{ color: '#10b981' }}>
            <span>
              Desconto
              {proposal.discountReason && (
                <span className={styles.discountReason}> ({proposal.discountReason})</span>
              )}
            </span>
            <strong>-{formatCurrency(proposal.discount)}</strong>
          </div>
        )}
        <div className={`${styles.summaryRow} ${styles.totalRow}`}>
          <span>Total</span>
          <strong className={styles.totalValue}>{formatCurrency(proposal.totalValue)}</strong>
        </div>
      </div>

      {/* Condições de Pagamento */}
      <div className={styles.paymentTerms}>
        <h3>
          <MdAttachMoney size={20} />
          Condições de Pagamento
        </h3>
        <div className={styles.termsContent}>
          <div className={styles.termsGrid}>
            <div className={styles.termItem}>
              <span>Parcelas</span>
              <strong>{proposal.paymentTerms.installments}x</strong>
            </div>
            <div className={styles.termItem}>
              <span>Valor da Parcela</span>
              <strong>{formatCurrency(proposal.paymentTerms.installmentValue)}</strong>
            </div>
            <div className={styles.termItem}>
              <span>Primeiro Pagamento</span>
              <strong>{formatDate(proposal.paymentTerms.firstPaymentDate)}</strong>
            </div>
            {proposal.paymentTerms.paymentMethod && (
              <div className={styles.termItem}>
                <span>Forma de Pagamento</span>
                <strong>{proposal.paymentTerms.paymentMethod}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Observações */}
      {proposal.notes && (
        <div className={styles.notesSection}>
          <h3>
            <FiInfo size={16} />
            Observações
          </h3>
          <p>{proposal.notes}</p>
        </div>
      )}

      {/* Termos e Condições */}
      <div className={styles.termsSection}>
        <div className={styles.termsHeader} onClick={() => setShowTerms(!showTerms)}>
          <h3>
            <MdDescription size={20} />
            Termos e Condições
          </h3>
          <FiChevronRight 
            size={20} 
            style={{ transform: showTerms ? 'rotate(90deg)' : 'none' }}
          />
        </div>
        {showTerms && (
          <div className={styles.termsContent}>
            {proposal.termsAndConditions.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}
      </div>

      {/* Status de Aprovação/Rejeição */}
      {isApproved && (
        <div className={styles.approvedSection}>
          <MdVerified size={24} color="#10b981" />
          <div>
            <strong>Proposta Aprovada!</strong>
            <p>Aprovada em {formatDateTime(proposal.approvedAt!)}</p>
          </div>
        </div>
      )}

      {isRejected && proposal.rejectionReason && (
        <div className={styles.rejectedSection}>
          <FiXCircle size={24} color="#ef4444" />
          <div>
            <strong>Proposta Recusada</strong>
            <p>Motivo: {proposal.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className={styles.proposalActions}>
        <button 
          className={styles.downloadButton}
          onClick={handleDownloadPDF}
        >
          <FiDownload size={18} />
          Baixar PDF
        </button>
        
        <button 
          className={styles.messageButton}
          onClick={handleRequestChange}
        >
          <FiMessageCircle size={18} />
          Solicitar Alterações
        </button>
        
        {canApprove && !isExpired && (
          <>
            <button 
              className={styles.approveButton}
              onClick={handleApprove}
              disabled={processing}
            >
              <FiCheckCircle size={18} />
              {processing ? 'Processando...' : 'Aprovar Proposta'}
            </button>
            
            <button 
              className={styles.rejectButton}
              onClick={() => setShowRejectModal(true)}
              disabled={processing}
            >
              <FiXCircle size={18} />
              Recusar
            </button>
          </>
        )}
      </div>

      {/* Modal de Histórico de Versões */}
      {showVersionHistory && (
        <div className={styles.modalOverlay} onClick={() => setShowVersionHistory(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                <MdHistory size={20} />
                Histórico de Versões
              </h3>
              <button onClick={() => setShowVersionHistory(false)}>
                <FiXCircle size={20} />
              </button>
            </div>
            
            <div className={styles.versionList}>
              {proposal.versions.sort((a, b) => b.version - a.version).map(version => (
                <div 
                  key={version.id} 
                  className={`${styles.versionItem} ${selectedVersion?.id === version.id ? styles.selected : ''}`}
                  onClick={() => setSelectedVersion(version)}
                >
                  <div className={styles.versionHeader}>
                    <span className={styles.versionNumber}>Versão {version.version}</span>
                    <span className={styles.versionDate}>{formatDateTime(version.createdAt)}</span>
                    {getStatusBadge(version.status)}
                  </div>
                  <p className={styles.versionChanges}>{version.changes}</p>
                  <div className={styles.versionFooter}>
                    <span className={styles.versionValue}>
                      Valor: {formatCurrency(version.totalValue)}
                    </span>
                    <span className={styles.versionAuthor}>
                      Por: {version.createdBy}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className={styles.modalFooter}>
              <button onClick={() => setShowVersionHistory(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Recusa */}
      {showRejectModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRejectModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Motivo da Recusa</h3>
              <button onClick={() => setShowRejectModal(false)}>
                <FiXCircle size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <p>Por favor, informe o motivo para recusar esta proposta:</p>
              
              <textarea
                className={styles.rejectInput}
                placeholder="Ex: Valor acima do orçamento, data não disponível, serviços não atendem..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className={styles.modalFooter}>
              <button onClick={() => setShowRejectModal(false)}>Cancelar</button>
              <button 
                className={styles.confirmRejectButton}
                onClick={handleReject}
                disabled={!rejectReason.trim() || processing}
              >
                {processing ? 'Processando...' : 'Confirmar Recusa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalView;