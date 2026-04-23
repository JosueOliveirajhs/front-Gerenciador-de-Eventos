// src/components/ClientComponents/CommunityView/CommunityView.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FiUsers, FiMessageCircle, FiShare2, FiHeart, FiCalendar,
  FiImage, FiTrash2, FiAlertCircle, FiX, FiLoader,
  FiRefreshCw, FiSend, FiCheckCircle, FiCamera,
  FiSearch, FiStar, FiEdit2, FiCheck, FiSun, FiMoon
} from 'react-icons/fi';
import { MdEvent, MdGroup, MdPublic, MdBusiness } from 'react-icons/md';
import { useAuth } from '../../../context/AuthContext';
import { communityService, PostData } from '../../../services/community';
import { empresaService, EmpresaData } from '../../../services/empresa';
import { ConfirmationModal } from '../../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../../common/Alerts/ErrorModal';
import styles from './CommunityView.module.css';

interface Comment {
  id: number; postId: number; autorId: number; autorNome: string;
  conteudo: string; dataCriacao: string;
}

interface ImagePreview {
  file: File; url: string;
}

export const CommunityView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'companies' | 'groups' | 'events'>('feed');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  
  // Estados do Feed
  const [newPost, setNewPost] = useState('');
  const [newPostEventType, setNewPostEventType] = useState('OUTROS');
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [likingPost, setLikingPost] = useState<number | null>(null);
  const [deletingPost, setDeletingPost] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [sharedPosts, setSharedPosts] = useState<Set<number>>(new Set());
  
  // Edicao de post
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  
  // Estados para imagens
  const [selectedImages, setSelectedImages] = useState<ImagePreview[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para comentarios
  const [commentsMap, setCommentsMap] = useState<Map<number, Comment[]>>(new Map());
  const [loadingComments, setLoadingComments] = useState<Set<number>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [newComment, setNewComment] = useState<Map<number, string>>(new Map());
  const [submittingComment, setSubmittingComment] = useState<Set<number>>(new Set());
  
  // Edicao de comentario
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [editCommentPostId, setEditCommentPostId] = useState<number | null>(null);
  const [savingCommentEdit, setSavingCommentEdit] = useState(false);
  
  // Estados para Empresas
  const [empresas, setEmpresas] = useState<EmpresaData[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [filteredEmpresas, setFilteredEmpresas] = useState<EmpresaData[]>([]);
  
  // Modais
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: '', message: '', type: 'warning' as const,
    onConfirm: () => {}, confirmText: 'Confirmar'
  });
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const eventTypes = [
    { value: 'CASAMENTO', label: 'Casamento' },
    { value: 'ANIVERSARIO', label: 'Aniversario' },
    { value: 'FORMATURA', label: 'Formatura' },
    { value: 'CORPORATIVO', label: 'Corporativo' },
    { value: 'OUTROS', label: 'Outros' }
  ];

  const categorias = ['Buffet', 'Decoracao', 'Fotografia', 'Outros'];

  // Dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Carregar feed
  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await communityService.getFeed();
      setPosts(data);
    } catch (err: any) {
      console.error('Erro ao carregar feed:', err);
      setErrorMessage('Erro ao carregar feed da comunidade.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar empresas
  const loadEmpresas = useCallback(async () => {
    try {
      setLoadingEmpresas(true);
      const data = await empresaService.listar(searchTerm || undefined, selectedCategoria || undefined);
      setEmpresas(data);
      setFilteredEmpresas(data);
    } catch (err) {
      console.error('Erro ao carregar empresas:', err);
    } finally {
      setLoadingEmpresas(false);
    }
  }, [searchTerm, selectedCategoria]);

  useEffect(() => { loadFeed(); }, [loadFeed]);
  useEffect(() => { if (activeTab === 'companies') loadEmpresas(); }, [activeTab, loadEmpresas]);

  useEffect(() => {
    if (activeTab === 'companies') {
      const filtered = empresas.filter(empresa => {
        const matchesSearch = !searchTerm || 
          empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (empresa.descricao && empresa.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategoria = !selectedCategoria || empresa.categoria === selectedCategoria;
        return matchesSearch && matchesCategoria;
      });
      setFilteredEmpresas(filtered);
    }
  }, [empresas, searchTerm, selectedCategoria, activeTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  // Manipular imagens
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (selectedImages.length + files.length > 5) {
      setErrorMessage('Maximo de 5 imagens por post');
      setShowErrorModal(true);
      return;
    }
    const newImages: ImagePreview[] = files
      .filter(file => {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) { setErrorMessage(`Formato invalido: ${file.name}`); setShowErrorModal(true); return false; }
        if (file.size > 10 * 1024 * 1024) { setErrorMessage(`Imagem grande: ${file.name}`); setShowErrorModal(true); return false; }
        return true;
      })
      .map(file => ({ file, url: URL.createObjectURL(file) }));
    setSelectedImages(prev => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  };

  // Criar post
  const handlePostSubmit = async () => {
    if (!newPost.trim() && selectedImages.length === 0 || !user?.id) return;
    
    setPosting(true);
    setError(null);
    
    try {
      let imageUrls: string[] = [];
      
      if (selectedImages.length > 0) {
        setUploadingImages(true);
        try {
          const formData = new FormData();
          selectedImages.forEach(img => formData.append('images', img.file, img.file.name));
          const response = await communityService.uploadImages(formData);
          if (response.urls && response.urls.length > 0) {
            imageUrls = response.urls;
          }
        } catch (uploadErr) {
          console.warn('Falha no upload, post sem imagens:', uploadErr);
          imageUrls = [];
        } finally {
          setUploadingImages(false);
        }
      }
      
      const created = await communityService.createPost({
        autorId: user.id, conteudo: newPost.trim(),
        tipoEvento: newPostEventType, imagens: imageUrls
      });
      
      setPosts(prev => [created, ...prev]);
      setNewPost('');
      setNewPostEventType('OUTROS');
      selectedImages.forEach(img => URL.revokeObjectURL(img.url));
      setSelectedImages([]);
      setSuccessMessage('Post publicado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Erro ao publicar:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Erro ao publicar post');
      setShowErrorModal(true);
    } finally {
      setPosting(false);
    }
  };

  // Editar post
  const handleEditPost = (post: PostData) => {
    setEditingPostId(post.id);
    setEditPostContent(post.conteudo);
  };

  const handleSaveEditPost = async () => {
    if (!editingPostId || !editPostContent.trim() || !user?.id) return;
    setSavingEdit(true);
    try {
      await communityService.updatePost(editingPostId, {
        autorId: user.id, conteudo: editPostContent.trim(),
        tipoEvento: posts.find(p => p.id === editingPostId)?.tipoEvento || 'OUTROS'
      });
      setPosts(prev => prev.map(p => p.id === editingPostId ? { ...p, conteudo: editPostContent.trim() } : p));
      setEditingPostId(null); setEditPostContent('');
      setSuccessMessage('Post atualizado!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) { setErrorMessage('Erro ao editar post'); setShowErrorModal(true); }
    finally { setSavingEdit(false); }
  };

  // Curtir post
  const handleLikePost = async (postId: number) => {
    if (!user?.id || likingPost === postId) return;
    setLikingPost(postId);
    try {
      const response = await communityService.likePost(postId, user.id);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, curtidas: response.curtidas } : p));
      if (response.curtiu) { setLikedPosts(prev => new Set([...prev, postId])); }
      else { setLikedPosts(prev => { const ns = new Set(prev); ns.delete(postId); return ns; }); }
    } catch (err) { console.error('Erro ao curtir:', err); }
    finally { setLikingPost(null); }
  };

  // Compartilhar
  const handleSharePost = async (postId: number) => {
    try {
      if (navigator.share) {
        const post = posts.find(p => p.id === postId);
        if (post) { await navigator.share({ title: `Post de ${post.autorNome}`, text: post.conteudo, url: `${window.location.origin}/comunidade?post=${postId}` }); await communityService.sharePost(postId); return; }
      }
      await navigator.clipboard.writeText(`${window.location.origin}/comunidade?post=${postId}`);
      await communityService.sharePost(postId);
      setSharedPosts(prev => new Set([...prev, postId]));
      setSuccessMessage('Link copiado!'); setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) { console.error('Erro ao compartilhar:', err); }
  };

  // Comentarios
  const loadComments = async (postId: number) => {
    if (loadingComments.has(postId)) return;
    setLoadingComments(prev => new Set([...prev, postId]));
    try { const c = await communityService.getComments(postId); setCommentsMap(prev => { const nm = new Map(prev); nm.set(postId, c); return nm; }); }
    catch (err) { console.error('Erro:', err); }
    finally { setLoadingComments(prev => { const ns = new Set(prev); ns.delete(postId); return ns; }); }
  };

  const toggleComments = (postId: number) => {
    setExpandedComments(prev => {
      const ns = new Set(prev);
      if (ns.has(postId)) ns.delete(postId);
      else { ns.add(postId); if (!commentsMap.has(postId)) loadComments(postId); }
      return ns;
    });
  };

  const handleSubmitComment = async (postId: number) => {
    const c = newComment.get(postId)?.trim();
    if (!c || !user?.id) return;
    setSubmittingComment(prev => new Set([...prev, postId]));
    try {
      const nc = await communityService.addComment(postId, { autorId: user.id, conteudo: c });
      setCommentsMap(prev => { const nm = new Map(prev); nm.set(postId, [...(nm.get(postId) || []), nc]); return nm; });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comentarios: (p.comentarios || 0) + 1 } : p));
      setNewComment(prev => { const nm = new Map(prev); nm.set(postId, ''); return nm; });
    } catch (err) { console.error('Erro:', err); }
    finally { setSubmittingComment(prev => { const ns = new Set(prev); ns.delete(postId); return ns; }); }
  };

  const startEditComment = (c: Comment) => { setEditingCommentId(c.id); setEditCommentContent(c.conteudo); setEditCommentPostId(c.postId); };

  const handleSaveEditComment = async () => {
    if (!editingCommentId || !editCommentContent.trim() || !user?.id || !editCommentPostId) return;
    setSavingCommentEdit(true);
    try {
      await communityService.updateComment(editCommentPostId, editingCommentId, { autorId: user.id, conteudo: editCommentContent.trim() });
      setCommentsMap(prev => { const nm = new Map(prev); const cmts = nm.get(editCommentPostId) || []; nm.set(editCommentPostId, cmts.map(c => c.id === editingCommentId ? { ...c, conteudo: editCommentContent.trim() } : c)); return nm; });
      setEditingCommentId(null); setEditCommentContent(''); setEditCommentPostId(null);
    } catch (err) { console.error('Erro:', err); }
    finally { setSavingCommentEdit(false); }
  };

  const handleDeleteComment = (postId: number, commentId: number) => {
    if (!user?.id) return;
    setConfirmModalConfig({
      title: 'Excluir', message: 'Excluir comentario?', type: 'warning', confirmText: 'Sim',
      onConfirm: async () => {
        try {
          await communityService.deleteComment(postId, commentId, user.id);
          setCommentsMap(prev => { const nm = new Map(prev); nm.set(postId, (nm.get(postId) || []).filter(c => c.id !== commentId)); return nm; });
          setPosts(prev => prev.map(p => p.id === postId ? { ...p, comentarios: Math.max(0, (p.comentarios || 1) - 1) } : p));
          setShowConfirmModal(false);
        } catch (err) { console.error('Erro:', err); }
      }
    });
    setShowConfirmModal(true);
  };

  const handleDeletePost = (postId: number) => {
    if (!user?.id) return;
    setConfirmModalConfig({
      title: 'Excluir Post', message: 'Esta acao nao pode ser desfeita.', type: 'warning', confirmText: 'Excluir',
      onConfirm: async () => {
        setDeletingPost(postId);
        try { await communityService.deletePost(postId, user.id); setPosts(prev => prev.filter(p => p.id !== postId)); setSuccessMessage('Post excluido'); setTimeout(() => setSuccessMessage(null), 3000); }
        catch (err: any) { setErrorMessage(err.response?.data?.message || 'Erro'); setShowErrorModal(true); }
        finally { setDeletingPost(null); setShowConfirmModal(false); }
      }
    });
    setShowConfirmModal(true);
  };

  const renderStars = (rating: number) => Array.from({ length: 5 }).map((_, i) => (
    <FiStar key={i} size={14} color={i < Math.floor(rating) ? '#fbbf24' : '#e2e8f0'} fill={i < Math.floor(rating) ? '#fbbf24' : 'none'} />
  ));

  const formatTimeAgo = (ts: string): string => {
    try {
      const d = new Date(ts), now = new Date();
      const dm = Math.floor((now.getTime() - d.getTime()) / 60000);
      if (dm < 1) return 'Agora'; if (dm < 60) return `Ha ${dm} min`;
      const dh = Math.floor(dm / 60); if (dh < 24) return `Ha ${dh}h`;
      const dd = Math.floor(dh / 24); if (dd === 1) return 'Ontem'; if (dd < 7) return `Ha ${dd} dias`;
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } catch { return ''; }
  };

  const getEventTypeLabel = (t: string) => ({ CASAMENTO: 'Casamento', ANIVERSARIO: 'Aniversario', FORMATURA: 'Formatura', CORPORATIVO: 'Corporativo', OUTROS: 'Outros' }[t] || t);

  const getImageUrl = (img: string) => {
    if (!img || img.startsWith('blob:')) return '';
    if (img.startsWith('http')) return img;
    return `http://localhost:8080${img.startsWith('/') ? '' : '/'}${img}`;
  };

  useEffect(() => { return () => { selectedImages.forEach(img => URL.revokeObjectURL(img.url)); }; }, []);

  return (
    <div className={styles.community} data-theme={isDarkMode ? 'dark' : 'light'}>
      <div className={styles.communityHeader}>
        <div>
          <h2><FiUsers size={24} /> Comunidade EEMS</h2>
          <p>Conecte-se com outros clientes e compartilhe experiencias</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.themeToggle} onClick={toggleDarkMode} title={isDarkMode ? 'Modo claro' : 'Modo escuro'}>
            {isDarkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>
          {activeTab === 'feed' && (
            <button className={styles.refreshButton} onClick={handleRefresh} disabled={refreshing}>
              <FiRefreshCw size={16} className={refreshing ? styles.spinning : ''} /> Atualizar
            </button>
          )}
        </div>
      </div>

      {successMessage && <div className={styles.successBanner}><FiCheckCircle size={16} /> {successMessage}<button onClick={() => setSuccessMessage(null)}><FiX size={14} /></button></div>}
      {error && <div className={styles.errorBanner}><FiAlertCircle size={16} /> {error}<button onClick={() => setError(null)}><FiX size={14} /></button></div>}

      <div className={styles.tabs}>
        {[
          { key: 'feed', icon: MdPublic, label: 'Feed' },
          { key: 'companies', icon: MdBusiness, label: 'Buffets & Servicos' },
          { key: 'groups', icon: MdGroup, label: 'Grupos' },
          { key: 'events', icon: MdEvent, label: 'Eventos' }
        ].map(tab => (
          <button key={tab.key} className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`} onClick={() => setActiveTab(tab.key as any)}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'feed' && (
        <>
          <div className={styles.postBox}>
            <div className={styles.postBoxHeader}>
              <div className={styles.userAvatar}>{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
              <div className={styles.postInputArea}>
                <textarea placeholder="Compartilhe sua experiencia..." value={newPost} onChange={e => setNewPost(e.target.value)} rows={3} maxLength={500} disabled={posting} />
                <div className={styles.postBoxOptions}>
                  <select value={newPostEventType} onChange={e => setNewPostEventType(e.target.value)} className={styles.eventTypeSelect} disabled={posting}>
                    {eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <span className={styles.charCount}>{newPost.length}/500</span>
                </div>
              </div>
            </div>

            {selectedImages.length > 0 && (
              <div className={styles.imagePreviewGrid}>
                {selectedImages.map((img, i) => (
                  <div key={i} className={styles.imagePreviewItem}>
                    <img src={img.url} alt={`Preview ${i + 1}`} />
                    <button className={styles.removeImageButton} onClick={() => handleRemoveImage(i)} disabled={posting}><FiX size={16} /></button>
                    <div className={styles.imageIndex}>{i + 1}</div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.postBoxFooter}>
              <div className={styles.footerLeft}>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className={styles.fileInput} id="img-upload" disabled={posting || selectedImages.length >= 5} />
                <label htmlFor="img-upload" className={`${styles.attachButton} ${selectedImages.length >= 5 ? styles.disabled : ''}`}>
                  <FiCamera size={16} /> {selectedImages.length > 0 ? `${selectedImages.length}/5` : 'Foto'}
                </label>
              </div>
              <button className={styles.postButton} onClick={handlePostSubmit} disabled={(!newPost.trim() && selectedImages.length === 0) || posting}>
                {posting || uploadingImages ? <><FiLoader size={16} className={styles.spinning} />...</> : <><FiSend size={16} /> Publicar</>}
              </button>
            </div>
          </div>

          {loading ? (
            <div className={styles.loadingState}><div className={styles.spinner} /><p>Carregando feed...</p></div>
          ) : posts.length === 0 ? (
            <div className={styles.emptyState}><MdPublic size={48} /><h3>Nenhum post ainda</h3><p>Seja o primeiro!</p></div>
          ) : (
            <div className={styles.feed}>
              {posts.map(post => (
                <div key={post.id} className={styles.postCard}>
                  <div className={styles.postHeader}>
                    <div className={styles.postAuthor}>
                      <div className={styles.authorAvatar}>{post.autorNome?.charAt(0).toUpperCase() || 'U'}</div>
                      <div className={styles.authorInfo}>
                        <div className={styles.authorNameRow}>
                          <span className={styles.authorName}>{post.autorNome}</span>
                          <span className={styles.eventTypeBadge}>{getEventTypeLabel(post.tipoEvento)}</span>
                        </div>
                        <span className={styles.postMeta}>{formatTimeAgo(post.dataCriacao)}</span>
                      </div>
                    </div>
                    {user?.id === post.autorId && (
                      <div className={styles.postActionsRight}>
                        <button className={styles.iconBtn} onClick={() => handleEditPost(post)} title="Editar"><FiEdit2 size={14} /></button>
                        <button className={styles.iconBtnDanger} onClick={() => handleDeletePost(post.id)} disabled={deletingPost === post.id} title="Excluir">
                          {deletingPost === post.id ? <FiLoader size={14} className={styles.spinning} /> : <FiTrash2 size={14} />}
                        </button>
                      </div>
                    )}
                  </div>

                  {editingPostId === post.id ? (
                    <div className={styles.editArea}>
                      <textarea value={editPostContent} onChange={e => setEditPostContent(e.target.value)} rows={3} />
                      <div className={styles.editActions}>
                        <button className={styles.btnCancel} onClick={() => { setEditingPostId(null); setEditPostContent(''); }}>Cancelar</button>
                        <button className={styles.btnSave} onClick={handleSaveEditPost} disabled={savingEdit}>
                          {savingEdit ? <FiLoader size={14} className={styles.spinning} /> : <FiCheck size={14} />} Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className={styles.postContent}>{post.conteudo}</p>
                  )}

                  {post.imagens && post.imagens.filter(i => i && !i.startsWith('blob:')).length > 0 && (
                    <div className={styles.postImagesGrid}>
                      {post.imagens.filter(i => i && !i.startsWith('blob:')).map((img, i) => {
                        const src = getImageUrl(img);
                        return src ? (
                          <div key={i} className={styles.postImageItem}>
                            <img src={src} alt={`Img ${i + 1}`} loading="lazy" onError={e => { (e.target as HTMLElement).style.display = 'none'; }} />
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}

                  <div className={styles.postActions}>
                    <button className={`${styles.actionBtn} ${likedPosts.has(post.id) ? styles.liked : ''}`} onClick={() => handleLikePost(post.id)} disabled={likingPost === post.id}>
                      <FiHeart size={18} className={likedPosts.has(post.id) ? styles.heartFilled : ''} /> {post.curtidas || 0}
                    </button>
                    <button className={`${styles.actionBtn} ${expandedComments.has(post.id) ? styles.active : ''}`} onClick={() => toggleComments(post.id)}>
                      <FiMessageCircle size={18} /> {post.comentarios || 0}
                    </button>
                    <button className={`${styles.actionBtn} ${sharedPosts.has(post.id) ? styles.shared : ''}`} onClick={() => handleSharePost(post.id)}>
                      <FiShare2 size={18} /> Compartilhar
                    </button>
                  </div>

                  {expandedComments.has(post.id) && (
                    <div className={styles.commentsSection}>
                      {user && (
                        <div className={styles.newCommentBox}>
                          <div className={styles.commentAvatar}>{user.name?.charAt(0).toUpperCase() || 'U'}</div>
                          <div className={styles.commentInputArea}>
                            <input type="text" placeholder="Comente..." value={newComment.get(post.id) || ''}
                              onChange={e => setNewComment(prev => { const m = new Map(prev); m.set(post.id, e.target.value); return m; })}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmitComment(post.id); } }}
                              disabled={submittingComment.has(post.id)} />
                            <button className={styles.commentSubmitBtn} onClick={() => handleSubmitComment(post.id)} disabled={!newComment.get(post.id)?.trim() || submittingComment.has(post.id)}>
                              {submittingComment.has(post.id) ? <FiLoader size={14} className={styles.spinning} /> : <FiSend size={14} />}
                            </button>
                          </div>
                        </div>
                      )}
                      {loadingComments.has(post.id) ? (
                        <div className={styles.loadingSmall}><div className={styles.spinnerSmall} /> Carregando...</div>
                      ) : (commentsMap.get(post.id) || []).length === 0 ? (
                        <div className={styles.noComments}>Nenhum comentario.</div>
                      ) : (
                        <div className={styles.commentsList}>
                          {(commentsMap.get(post.id) || []).map(c => (
                            <div key={c.id} className={styles.commentItem}>
                              <div className={styles.commentAvatar}>{c.autorNome?.charAt(0).toUpperCase() || 'U'}</div>
                              <div className={styles.commentContent}>
                                <div className={styles.commentHeader}>
                                  <span className={styles.commentAuthor}>{c.autorNome}</span>
                                  <span className={styles.commentTime}>{formatTimeAgo(c.dataCriacao)}</span>
                                </div>
                                {editingCommentId === c.id ? (
                                  <div className={styles.editCommentArea}>
                                    <input type="text" value={editCommentContent} onChange={e => setEditCommentContent(e.target.value)} />
                                    <div className={styles.editActions}>
                                      <button className={styles.btnCancel} onClick={() => { setEditingCommentId(null); }}>Cancelar</button>
                                      <button className={styles.btnSave} onClick={handleSaveEditComment} disabled={savingCommentEdit}>
                                        {savingCommentEdit ? <FiLoader size={12} className={styles.spinning} /> : <FiCheck size={12} />} Salvar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className={styles.commentText}>{c.conteudo}</p>
                                )}
                              </div>
                              {user?.id === c.autorId && editingCommentId !== c.id && (
                                <div className={styles.commentActions}>
                                  <button onClick={() => startEditComment(c)} title="Editar"><FiEdit2 size={12} /></button>
                                  <button onClick={() => handleDeleteComment(post.id, c.id)} title="Excluir"><FiTrash2 size={12} /></button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'companies' && (
        <>
          <div className={styles.searchBar}>
            <div className={styles.searchBox}><FiSearch size={18} /><input placeholder="Buscar buffets e servicos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
            <select value={selectedCategoria} onChange={e => setSelectedCategoria(e.target.value)} className={styles.filterSelect}>
              <option value="">Todas categorias</option>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {loadingEmpresas ? (
            <div className={styles.loadingState}><div className={styles.spinner} /><p>Carregando...</p></div>
          ) : filteredEmpresas.length === 0 ? (
            <div className={styles.emptyState}><MdBusiness size={48} /><h3>Nenhuma empresa</h3><p>Ajuste sua busca.</p></div>
          ) : (
            <div className={styles.companiesGrid}>
              {filteredEmpresas.map(e => (
                <div key={e.id} className={styles.companyCard}>
                  <div className={styles.companyHeader}>
                    <div className={styles.companyLogo}><MdBusiness size={24} /></div>
                    <div>
                      <h3 className={styles.companyName}>{e.nome}</h3>
                      <span className={styles.companyCategory}>{e.categoria}</span>
                    </div>
                  </div>
                  {e.descricao && <p className={styles.companyDesc}>{e.descricao}</p>}
                  {e.avaliacao && <div className={styles.companyRating}>{renderStars(e.avaliacao)} <span>{e.avaliacao}</span></div>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'groups' && <div className={styles.emptyState}><MdGroup size={64} /><h3>Grupos em breve!</h3><p>Participe de grupos por tipo de evento.</p></div>}
      {activeTab === 'events' && <div className={styles.emptyState}><FiCalendar size={64} /><h3>Eventos em breve!</h3><p>Participe de workshops e encontros.</p></div>}

      <ConfirmationModal isOpen={showConfirmModal} title={confirmModalConfig.title} message={confirmModalConfig.message} type={confirmModalConfig.type} onConfirm={confirmModalConfig.onConfirm} onCancel={() => setShowConfirmModal(false)} confirmText={confirmModalConfig.confirmText} />
      <ErrorModal isOpen={showErrorModal} message={errorMessage} onClose={() => setShowErrorModal(false)} />
    </div>
  );
};

export default CommunityView;