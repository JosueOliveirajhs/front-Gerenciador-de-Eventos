import React, { useState } from 'react';
import { FiUpload, FiFile, FiDownload, FiTrash2, FiEye } from 'react-icons/fi';
import { MdInsertDriveFile, MdPictureAsPdf, MdImage } from 'react-icons/md';
import styles from './ClientDocuments.module.css';

interface Document {
  id: number;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  eventName?: string;
  url: string;
}

export const ClientDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 1,
      name: 'Contrato - Casamento.pdf',
      type: 'application/pdf',
      size: 2500000,
      uploadDate: '2026-02-15',
      eventName: 'Casamento João e Maria',
      url: '#'
    },
    {
      id: 2,
      name: 'Comprovante de Pagamento.jpg',
      type: 'image/jpeg',
      size: 1500000,
      uploadDate: '2026-02-10',
      eventName: 'Casamento João e Maria',
      url: '#'
    }
  ]);

  const [uploading, setUploading] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <MdPictureAsPdf size={24} />;
    if (type.includes('image')) return <MdImage size={24} />;
    return <MdInsertDriveFile size={24} />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setUploading(true);
    
    setTimeout(() => {
      const newDocuments: Document[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        newDocuments.push({
          id: documents.length + i + 1,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadDate: new Date().toISOString().split('T')[0],
          url: '#'
        });
      }
      setDocuments([...newDocuments, ...documents]);
      setUploading(false);
    }, 2000);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este documento?')) {
      setDocuments(documents.filter(doc => doc.id !== id));
    }
  };

  return (
    <div className={styles.documents}>
      <h2 className={styles.title}>
        <FiFile size={28} />
        Espaço de Anexar Documento
      </h2>

      <div className={styles.uploadSection}>
        <div className={styles.uploadArea}>
          <input
            type="file"
            id="fileUpload"
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <label htmlFor="fileUpload" className={styles.uploadLabel}>
            <FiUpload size={24} />
            <span>Clique para anexar documentos</span>
            <span className={styles.uploadHint}>PDF, imagens (max 10MB)</span>
          </label>
        </div>

        {uploading && (
          <div className={styles.uploadProgress}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill}></div>
            </div>
            <p>Enviando...</p>
          </div>
        )}
      </div>

      <h3 className={styles.sectionTitle}>Documentos Anexados</h3>

      {documents.length === 0 ? (
        <div className={styles.emptyState}>
          <FiFile size={48} />
          <p>Nenhum documento anexado</p>
        </div>
      ) : (
        <div className={styles.documentsGrid}>
          {documents.map(doc => (
            <div key={doc.id} className={styles.documentCard}>
              <div className={styles.documentIcon}>
                {getFileIcon(doc.type)}
              </div>
              
              <div className={styles.documentInfo}>
                <h4>{doc.name}</h4>
                <div className={styles.documentMeta}>
                  <span>{formatFileSize(doc.size)}</span>
                  <span>•</span>
                  <span>{formatDate(doc.uploadDate)}</span>
                </div>
                {doc.eventName && (
                  <span className={styles.eventTag}>{doc.eventName}</span>
                )}
              </div>

              <div className={styles.documentActions}>
                <button className={styles.actionButton} title="Visualizar">
                  <FiEye size={16} />
                </button>
                <button className={styles.actionButton} title="Download">
                  <FiDownload size={16} />
                </button>
                <button 
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  title="Excluir"
                  onClick={() => handleDelete(doc.id)}
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};