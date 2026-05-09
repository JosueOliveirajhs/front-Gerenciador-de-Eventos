// src/components/ClientComponents/ClientDocuments.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FiUpload, FiFile, FiDownload, FiTrash2, FiEye, 
  FiAlertCircle, FiCheckCircle, FiX, FiRefreshCw,
  FiSearch, FiImage
} from 'react-icons/fi';
import { MdInsertDriveFile, MdPictureAsPdf, MdImage, MdEvent } from 'react-icons/md';
import { documentService, Document } from '../../services/documents';
import { useAuth } from '../../context/AuthContext';
import { ConfirmationModal } from '../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../common/Alerts/ErrorModal';
import { LoadingSpinner } from '../common/Loading/LoadingSpinner';
import styles from './ClientDocuments.module.css';

export const ClientDocuments: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview state
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Modais
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await documentService.getAllDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      setError('Erro ao carregar documentos. Tente novamente.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const formatFileSize = (tamanhoFormatado?: string): string => {
    return tamanhoFormatado || '0 B';
  };

  const getFileIcon = (type: string) => {
    if (!type) return <MdInsertDriveFile size={24} color="#64748b" />;
    if (type.includes('pdf')) return <MdPictureAsPdf size={24} color="#ef4444" />;
    if (type.includes('image')) return <MdImage size={24} color="#3b82f6" />;
    return <MdInsertDriveFile size={24} color="#64748b" />;
  };

  const formatDate = (dataFormatada?: string, dataUpload?: string): string => {
    if (dataFormatada) return dataFormatada;
    if (!dataUpload) return '';
    try {
      return new Date(dataUpload).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch {
      return dataUpload;
    }
  };

  // Upload de arquivo
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (file.size > 10 * 1024 * 1024) {
          setError(`O arquivo "${file.name}" excede o limite de 10MB`);
          setShowErrorModal(true);
          continue;
        }

        await documentService.uploadDocument(file, 'cliente');
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      setSuccessMessage(`${files.length} documento(s) enviado(s) com sucesso!`);
      setShowSuccessModal(true);
      await loadDocuments();
      
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      setError(error.response?.data?.message || 'Erro ao enviar arquivo. Tente novamente.');
      setShowErrorModal(true);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Download
  const handleDownload = async (document: Document) => {
    try {
      await documentService.downloadDocument(document.id, document.nome);
      setSuccessMessage('Download iniciado!');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Erro ao baixar:', error);
      setError('Erro ao baixar arquivo.');
      setShowErrorModal(true);
    }
  };

  // ✅ CORRIGIDO: Visualizar com autenticação
  const handleView = async (document: Document) => {
    setPreviewDocument(document);
    setPreviewLoading(true);
    setPreviewError(null);
    
    try {
      const blobUrl = await documentService.viewDocument(document.id);
      setPreviewUrl(blobUrl);
      setPreviewLoading(false);
    } catch (err: any) {
      setPreviewLoading(false);
      setPreviewError(err.message || 'Erro ao carregar documento');
    }
  };

  // Fechar preview
  const handleClosePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewDocument(null);
    setPreviewUrl('');
    setPreviewLoading(false);
    setPreviewError(null);
  };

  // Deletar
  const handleDeleteClick = (doc: Document) => {
    setDocumentToDelete(doc);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (!documentToDelete) return;
    setDeleting(true);
    try {
      await documentService.deleteDocument(documentToDelete.id);
      setDocuments(prev => prev.filter(doc => doc.id !== documentToDelete.id));
      setSuccessMessage('Documento excluído com sucesso!');
      setShowSuccessModal(true);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erro ao excluir documento.');
      setShowErrorModal(true);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setDocumentToDelete(null);
    }
  }, [documentToDelete]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteConfirm(false);
    setDocumentToDelete(null);
  }, []);

  const handleCloseSuccess = useCallback(() => {
    setShowSuccessModal(false);
    setSuccessMessage(null);
  }, []);

  const handleCloseError = useCallback(() => {
    setShowErrorModal(false);
  }, []);

  // Filtrar
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.contexto?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || 
                        (filterType === 'pdf' && doc.tipo?.includes('pdf')) ||
                        (filterType === 'image' && doc.tipo?.includes('image')) ||
                        (filterType === 'other' && !doc.tipo?.includes('pdf') && !doc.tipo?.includes('image'));
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className={styles.loading}>
        <LoadingSpinner text="Carregando documentos..." />
      </div>
    );
  }

  return (
    <div className={styles.documents}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}><FiFile size={28} /> Meus Documentos</h2>
          <p className={styles.subtitle}>{documents.length} documento(s) anexado(s)</p>
        </div>
        <button className={styles.refreshButton} onClick={loadDocuments} title="Atualizar">
          <FiRefreshCw size={18} />
        </button>
      </div>

      {/* Upload */}
      <div className={styles.uploadSection}>
        <div className={styles.uploadArea}>
          <input type="file" id="fileUpload" multiple onChange={handleFileUpload}
            style={{ display: 'none' }} ref={fileInputRef}
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx" />
          <label htmlFor="fileUpload" className={styles.uploadLabel}>
            <FiUpload size={28} />
            <span>Clique para anexar documentos</span>
            <span className={styles.uploadHint}>PDF, imagens, Word, Excel (max 10MB)</span>
          </label>
        </div>
        {uploading && (
          <div className={styles.uploadProgress}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
            </div>
            <p>Enviando... {Math.round(uploadProgress)}%</p>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <FiSearch size={16} />
          <input type="text" placeholder="Buscar documentos..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} />
          {searchTerm && (
            <button className={styles.clearSearch} onClick={() => setSearchTerm('')}><FiX size={14} /></button>
          )}
        </div>
        <div className={styles.filterGroup}>
          <button className={`${styles.filterBtn} ${filterType === 'all' ? styles.active : ''}`} onClick={() => setFilterType('all')}>Todos</button>
          <button className={`${styles.filterBtn} ${filterType === 'pdf' ? styles.active : ''}`} onClick={() => setFilterType('pdf')}><MdPictureAsPdf size={14} /> PDF</button>
          <button className={`${styles.filterBtn} ${filterType === 'image' ? styles.active : ''}`} onClick={() => setFilterType('image')}><FiImage size={14} /> Imagens</button>
          <button className={`${styles.filterBtn} ${filterType === 'other' ? styles.active : ''}`} onClick={() => setFilterType('other')}>Outros</button>
        </div>
      </div>

      {/* Lista */}
      <h3 className={styles.sectionTitle}>Documentos Anexados <span className={styles.sectionCount}>{filteredDocuments.length}</span></h3>

      {filteredDocuments.length === 0 ? (
        <div className={styles.emptyState}><FiFile size={48} /><p>{searchTerm || filterType !== 'all' ? 'Nenhum documento corresponde aos filtros.' : 'Nenhum documento anexado'}</p></div>
      ) : (
        <div className={styles.documentsGrid}>
          {filteredDocuments.map(doc => (
            <div key={doc.id} className={styles.documentCard}>
              <div className={styles.documentIcon}>{getFileIcon(doc.tipo)}</div>
              <div className={styles.documentInfo}>
                <h4 title={doc.nome}>{doc.nome}</h4>
                <div className={styles.documentMeta}>
                  <span>{formatFileSize(doc.tamanhoFormatado)}</span><span>•</span>
                  <span>{formatDate(doc.dataFormatada, (doc as any).dataUpload)}</span>
                </div>
                {doc.contexto && <span className={styles.eventTag}><MdEvent size={12} />{doc.contexto}</span>}
              </div>
              <div className={styles.documentActions}>
                <button className={styles.actionButton} title="Visualizar" onClick={() => handleView(doc)}><FiEye size={16} /></button>
                <button className={styles.actionButton} title="Download" onClick={() => handleDownload(doc)}><FiDownload size={16} /></button>
                <button className={`${styles.actionButton} ${styles.deleteButton}`} title="Excluir" onClick={() => handleDeleteClick(doc)}><FiTrash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Preview */}
      {previewDocument && previewUrl && (
        <div className={styles.previewOverlay} onClick={handleClosePreview}>
          <div className={styles.previewModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewHeader}>
              <div className={styles.previewHeaderLeft}>
                <div className={styles.previewHeaderIcon}>{getFileIcon(previewDocument.tipo)}</div>
                <div className={styles.previewHeaderInfo}>
                  <h3>{previewDocument.nome}</h3>
                  <span>{formatFileSize(previewDocument.tamanhoFormatado)}</span>
                </div>
              </div>
              <div className={styles.previewHeaderActions}>
                <button className={styles.previewActionButton} onClick={() => handleDownload(previewDocument)} title="Download"><FiDownload size={18} /></button>
                <button className={styles.previewCloseButton} onClick={handleClosePreview} title="Fechar"><FiX size={20} /></button>
              </div>
            </div>
            <div className={styles.previewContent}>
              {previewLoading && (
                <div className={styles.previewLoading}><div className={styles.spinner}></div><p>Carregando documento...</p></div>
              )}
              {previewError && (
                <div className={styles.previewError}>
                  <FiAlertCircle size={48} /><p>{previewError}</p>
                  <button className={styles.previewDownloadButton} onClick={() => handleDownload(previewDocument)}><FiDownload size={16} /> Baixar documento</button>
                </div>
              )}
              <iframe src={previewUrl} className={styles.previewIframe} title={previewDocument.nome}
                style={{ display: previewLoading || previewError ? 'none' : 'block' }} />
            </div>
          </div>
        </div>
      )}

      {/* Modais */}
      <ConfirmationModal isOpen={showDeleteConfirm} title="Excluir Documento"
        message={`Tem certeza que deseja excluir o documento "${documentToDelete?.nome}"?`}
        type="warning" onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel}
        confirmText={deleting ? 'Excluindo...' : 'Sim, Excluir'} cancelText="Cancelar" />
      <ConfirmationModal isOpen={showSuccessModal} title="Sucesso!" message={successMessage || ''}
        type="success" onConfirm={handleCloseSuccess} onCancel={handleCloseSuccess} confirmText="OK" />
      <ErrorModal isOpen={showErrorModal} message={error || ''} onClose={handleCloseError} />
    </div>
  );
};

export default ClientDocuments;