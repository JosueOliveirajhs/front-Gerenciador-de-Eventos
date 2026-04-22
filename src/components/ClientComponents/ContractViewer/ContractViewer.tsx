// src/components/ClientComponents/ContractViewer/ContractViewer.tsx
import React, { useState, useEffect } from 'react';
import { 
  FiDownload, 
  FiFileText, 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle,
  FiEye,
  FiPenTool,
  FiCalendar,
  FiLock,
  FiUnlock,
  FiCheck
} from 'react-icons/fi';
import { 
  MdGavel, 
  MdOutlineFileCopy,
  MdVerified,
  MdDescription,
  MdHistory
} from 'react-icons/md';
import { contractService } from '../../../services/contract';
import { useAuth } from '../../../context/AuthContext';
import styles from './ContractViewer.module.css';

interface SignatureInfo {
  signed: boolean;
  signedAt?: string;
  signedBy?: string;
  ipAddress?: string;
  signatureMethod?: 'DIGITAL' | 'ELECTRONIC' | 'PHYSICAL';
}

interface Contract {
  id: string;
  eventId: string;
  eventTitle: string;
  contractNumber: string;
  createdAt: string;
  updatedAt: string;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';
  content: string;
  fileUrl: string;
  clientSignature: SignatureInfo;
  companySignature: SignatureInfo;
  validUntil: string;
  signedAt?: string;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
}

interface ContractViewerProps {
  contractId?: string;
  onBack?: () => void;
}

export const ContractViewer: React.FC<ContractViewerProps> = ({ contractId, onBack }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<Contract | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  useEffect(() => {
    loadContract();
  }, [contractId]);

  const loadContract = async () => {
    try {
      setLoading(true);
      setContract(getMockContract());
    } catch (error) {
      console.error('Erro ao carregar contrato:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMockContract = (): Contract => {
    return {
      id: 'ctr-001',
      eventId: 'evt-001',
      eventTitle: 'Aniversário de 30 anos - Maria',
      contractNumber: 'CTR-2026-0042',
      createdAt: '2026-03-15T10:00:00',
      updatedAt: '2026-03-15T10:00:00',
      status: 'SENT',
      content: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE EVENTOS\n\nPelo presente instrumento particular, de um lado ESPAÇO PREMIUM EVENTOS LTDA, inscrita no CNPJ sob o nº XX.XXX.XXX/0001-XX, com sede na Av. Paulista, 1000 - São Paulo/SP, neste ato representada por seu representante legal, doravante denominada CONTRATADA, e de outro lado o(a) Sr(a). MARIA SILVA, inscrito(a) no CPF sob o nº XXX.XXX.XXX-XX, residente e domiciliado(a) na Rua das Flores, 123 - São Paulo/SP, doravante denominado(a) CONTRATANTE, têm entre si justo e contratado o seguinte:\n\nCLÁUSULA PRIMEIRA - DO OBJETO\nO presente contrato tem por objeto a prestação de serviços de organização e realização de evento de aniversário, conforme descrito na proposta comercial nº PROP-2026-0042, aprovada em 15/03/2026.\n\nCLÁUSULA SEGUNDA - DO EVENTO\nData: 15 de Junho de 2026\nHorário: 19:00 às 00:00\nLocal: Espaço Premium Eventos\nConvidados: 80 pessoas\n\nCLÁUSULA TERCEIRA - DO VALOR E PAGAMENTO\nO valor total dos serviços é de R$ 22.500,00 (vinte e dois mil e quinhentos reais), a ser pago em 4 parcelas de R$ 5.625,00.\n\nCLÁUSULA QUARTA - DAS OBRIGAÇÕES\n...',
      fileUrl: '#',
      clientSignature: {
        signed: false
      },
      companySignature: {
        signed: true,
        signedAt: '2026-03-15T10:00:00',
        signedBy: 'Espaço Premium Eventos',
        signatureMethod: 'DIGITAL'
      },
      validUntil: '2026-04-15',
      attachments: [
        {
          id: 'att1',
          name: 'Proposta Comercial.pdf',
          url: '#',
          type: 'application/pdf'
        },
        {
          id: 'att2',
          name: 'Termos e Condições.pdf',
          url: '#',
          type: 'application/pdf'
        },
        {
          id: 'att3',
          name: 'Política de Cancelamento.pdf',
          url: '#',
          type: 'application/pdf'
        }
      ]
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      DRAFT: { label: 'Rascunho', color: '#64748b', icon: <FiFileText size={14} /> },
      SENT: { label: 'Aguardando Assinatura', color: '#3b82f6', icon: <FiClock size={14} /> },
      VIEWED: { label: 'Visualizado', color: '#f59e0b', icon: <FiEye size={14} /> },
      SIGNED: { label: 'Assinado', color: '#10b981', icon: <FiCheckCircle size={14} /> },
      EXPIRED: { label: 'Expirado', color: '#ef4444', icon: <FiAlertCircle size={14} /> },
      CANCELLED: { label: 'Cancelado', color: '#ef4444', icon: <FiAlertCircle size={14} /> }
    };
    return configs[status] || configs.DRAFT;
  };

  const handleDownload = async () => {
    if (!contract) return;
    
    try {
      const blob = await contractService.downloadContract(contract.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Contrato_${contract.contractNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar contrato:', error);
    }
  };

  const handleDownloadAttachment = async (attachment: { id: string; name: string; url: string }) => {
    try {
      const blob = await contractService.downloadAttachment(contract!.id, attachment.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar anexo:', error);
    }
  };

  const handleSign = async () => {
    if (!contract || !agreeTerms) return;
    
    setProcessing(true);
    try {
      await contractService.signContract(contract.id);
      setContract({
        ...contract,
        status: 'SIGNED',
        signedAt: new Date().toISOString(),
        clientSignature: {
          signed: true,
          signedAt: new Date().toISOString(),
          signedBy: user?.name || 'Cliente',
          signatureMethod: 'DIGITAL',
          ipAddress: '192.168.1.1'
        }
      });
      setShowSignModal(false);
    } catch (error) {
      console.error('Erro ao assinar contrato:', error);
      alert('Erro ao assinar contrato. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando contrato...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className={styles.emptyState}>
        <MdGavel size={64} />
        <h3>Nenhum contrato disponível</h3>
        <p>Após a aprovação da proposta, o contrato estará disponível aqui.</p>
        {onBack && (
          <button className={styles.backButton} onClick={onBack}>
            Voltar
          </button>
        )}
      </div>
    );
  }

  const statusConfig = getStatusConfig(contract.status);
  const canSign = ['SENT', 'VIEWED'].includes(contract.status);
  const isSigned = contract.status === 'SIGNED';
  const isExpired = contract.status === 'EXPIRED';
  const bothSigned = contract.clientSignature.signed && contract.companySignature.signed;

  return (
    <div className={styles.contractViewer}>
      {/* Header */}
      <div className={styles.contractHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.contractTitle}>
            <MdGavel size={28} />
            <h1>Contrato de Prestação de Serviços</h1>
          </div>
          <p className={styles.contractNumber}>Nº {contract.contractNumber}</p>
        </div>
        <div className={styles.headerRight}>
          <span 
            className={styles.statusBadge} 
            style={{ background: `${statusConfig.color}20`, color: statusConfig.color }}
          >
            {statusConfig.icon}
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Event Info */}
      <div className={styles.eventInfoCard}>
        <h3>{contract.eventTitle}</h3>
        <p className={styles.contractDates}>
          <FiCalendar size={14} />
          Criado em {formatDate(contract.createdAt)}
          {contract.updatedAt !== contract.createdAt && (
            <> • Atualizado em {formatDate(contract.updatedAt)}</>
          )}
        </p>
      </div>

      {/* Signature Status */}
      <div className={styles.signatureStatus}>
        <h3>Status de Assinatura</h3>
        
        <div className={styles.signatureGrid}>
          {/* Assinatura do Cliente */}
          <div className={`${styles.signatureCard} ${contract.clientSignature.signed ? styles.signed : styles.pending}`}>
            <div className={styles.signatureHeader}>
              <span className={styles.signatureLabel}>
                {contract.clientSignature.signed ? <FiUnlock size={16} /> : <FiLock size={16} />}
                Cliente (Você)
              </span>
              {contract.clientSignature.signed ? (
                <span className={styles.signedBadge}>
                  <FiCheckCircle size={14} />
                  Assinado
                </span>
              ) : (
                <span className={styles.pendingBadge}>
                  <FiClock size={14} />
                  Pendente
                </span>
              )}
            </div>
            {contract.clientSignature.signed ? (
              <div className={styles.signatureDetails}>
                <p><strong>Assinado por:</strong> {contract.clientSignature.signedBy}</p>
                <p><strong>Data:</strong> {formatDateTime(contract.clientSignature.signedAt)}</p>
                <p><strong>Método:</strong> {contract.clientSignature.signatureMethod}</p>
                {contract.clientSignature.ipAddress && (
                  <p><strong>IP:</strong> {contract.clientSignature.ipAddress}</p>
                )}
              </div>
            ) : (
              <div className={styles.signaturePending}>
                <p>Aguardando sua assinatura</p>
              </div>
            )}
          </div>
          
          {/* Assinatura da Empresa */}
          <div className={`${styles.signatureCard} ${contract.companySignature.signed ? styles.signed : styles.pending}`}>
            <div className={styles.signatureHeader}>
              <span className={styles.signatureLabel}>
                {contract.companySignature.signed ? <FiUnlock size={16} /> : <FiLock size={16} />}
                Empresa
              </span>
              {contract.companySignature.signed ? (
                <span className={styles.signedBadge}>
                  <FiCheckCircle size={14} />
                  Assinado
                </span>
              ) : (
                <span className={styles.pendingBadge}>
                  <FiClock size={14} />
                  Aguardando
                </span>
              )}
            </div>
            {contract.companySignature.signed ? (
              <div className={styles.signatureDetails}>
                <p><strong>Assinado por:</strong> {contract.companySignature.signedBy}</p>
                <p><strong>Data:</strong> {formatDateTime(contract.companySignature.signedAt)}</p>
                <p><strong>Método:</strong> {contract.companySignature.signatureMethod}</p>
              </div>
            ) : (
              <div className={styles.signaturePending}>
                <p>Aguardando assinatura da empresa</p>
              </div>
            )}
          </div>
        </div>

        {bothSigned && (
          <div className={styles.fullySignedMessage}>
            <MdVerified size={20} color="#10b981" />
            <span>Contrato totalmente assinado e válido!</span>
          </div>
        )}
      </div>

      {/* Contract Preview */}
      <div className={styles.contractPreview}>
        <div className={styles.previewHeader}>
          <h3>
            <MdDescription size={20} />
            Visualização do Documento
          </h3>
          <button className={styles.downloadButton} onClick={handleDownload}>
            <FiDownload size={16} />
            Baixar PDF
          </button>
        </div>
        
        <div className={styles.previewContent}>
          <div className={styles.documentViewer}>
            <div className={styles.contractTextPreview}>
              {contract.content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Attachments */}
      {contract.attachments && contract.attachments.length > 0 && (
        <div className={styles.attachmentsSection}>
          <div 
            className={styles.attachmentsHeader}
            onClick={() => setShowAttachments(!showAttachments)}
          >
            <h3>
              <FiFileText size={20} />
              Documentos Anexos ({contract.attachments.length})
            </h3>
            <span className={styles.toggleIcon}>{showAttachments ? '−' : '+'}</span>
          </div>
          
          {showAttachments && (
            <div className={styles.attachmentsList}>
              {contract.attachments.map(att => (
                <div key={att.id} className={styles.attachmentItem}>
                  <div className={styles.attachmentInfo}>
                    <FiFileText size={18} />
                    <span>{att.name}</span>
                  </div>
                  <button 
                    className={styles.attachmentDownload}
                    onClick={() => handleDownloadAttachment(att)}
                  >
                    <FiDownload size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Validity */}
      {!isSigned && !isExpired && (
        <div className={styles.validityInfo}>
          <FiAlertCircle size={16} />
          <span>Este contrato deve ser assinado até {formatDate(contract.validUntil)}</span>
        </div>
      )}

      {/* Actions */}
      <div className={styles.contractActions}>
        <button className={styles.outlineButton} onClick={handleDownload}>
          <FiDownload size={18} />
          Baixar Contrato
        </button>
        
        <button className={styles.outlineButton}>
          <MdOutlineFileCopy size={18} />
          Copiar Link
        </button>
        
        {canSign && !isExpired && (
          <button 
            className={styles.signButton}
            onClick={() => setShowSignModal(true)}
          >
            <FiPenTool size={18} />
            Assinar Contrato
          </button>
        )}
        
        {isSigned && (
          <div className={styles.signedMessage}>
            <FiCheckCircle size={20} />
            <span>Contrato assinado com sucesso!</span>
          </div>
        )}
        
        {isExpired && (
          <div className={styles.expiredMessage}>
            <FiAlertCircle size={20} />
            <span>Este contrato expirou. Solicite um novo contrato.</span>
          </div>
        )}
      </div>

      {/* Sign Modal */}
      {showSignModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSignModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Assinar Contrato Digitalmente</h3>
              <button onClick={() => setShowSignModal(false)}>✕</button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.signatureInfo}>
                <p>Ao assinar este contrato, você concorda com todos os termos e condições estabelecidos.</p>
                <p><strong>Contrato:</strong> {contract.contractNumber}</p>
                <p><strong>Evento:</strong> {contract.eventTitle}</p>
              </div>
              
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span>Li e concordo com todos os termos e condições deste contrato.</span>
              </label>
              
              <div className={styles.signaturePlaceholder}>
                <p>Sua assinatura digital será registrada como:</p>
                <div className={styles.signaturePreview}>
                  <strong>{user?.name}</strong>
                  <span>{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
                <p className={styles.signatureNote}>
                  Esta assinatura digital tem validade jurídica conforme Lei 14.063/2020.
                </p>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button onClick={() => setShowSignModal(false)}>Cancelar</button>
              <button 
                className={styles.confirmSignButton}
                onClick={handleSign}
                disabled={!agreeTerms || processing}
              >
                {processing ? 'Processando...' : 'Confirmar Assinatura'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractViewer;