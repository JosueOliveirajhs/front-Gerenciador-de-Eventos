// src/components/OwnerCompoents/OwnerChat/OwnerChat.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FiSend, FiSearch, FiX, FiRefreshCw, FiCheck, FiCheckCircle, 
  FiClock, FiMessageCircle, FiUsers, FiCalendar, FiPaperclip,
  FiMoreVertical, FiSmile, FiChevronLeft, FiPhone, FiVideo,
  FiStar, FiArchive, FiTrash2, FiDownload, FiImage, FiFile,
  FiAlertCircle, FiInfo, FiUser, FiBell, FiBellOff
} from 'react-icons/fi';
import { 
  MdChat, MdEvent, MdPerson, MdSend, MdAttachFile,
  MdOutlineEmojiEmotions, MdVerified, MdCheck, MdRefresh,
  MdNotifications, MdNotificationsOff, MdOutlineInfo
} from 'react-icons/md';
import { messageService, Conversation } from '../../../services/message';
import { eventService } from '../../../services/events';
import { notificationService } from '../../../services/notification';
import { useAuth } from '../../../context/AuthContext';
import styles from './OwnerChat.module.css';

interface DisplayMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  status: string;
  isOwn: boolean;
  attachments?: any[];
}

interface EventItem {
  id: number;
  title: string;
  eventDate: string;
  eventType: string;
  status: string;
  guestCount?: number;
  client?: { id: number; name: string; email: string; phone: string };
}

export const OwnerChat: React.FC = () => {
  const { user, refreshUnreadCount } = useAuth();
  
  // Estado principal
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Modal nova conversa
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [newChatSearchTerm, setNewChatSearchTerm] = useState('');
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // EFEITOS
  // ============================================================
  
  useEffect(() => {
    loadConversations();
    
    // ✅ Polling de notificações e conversas
    const interval = setInterval(() => {
      loadConversations(true);
      if (refreshUnreadCount) refreshUnreadCount();
    }, 10000); // a cada 10 segundos
    
    return () => { 
      clearInterval(interval);
      if (pollingRef.current) clearInterval(pollingRef.current); 
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      if (selectedConversation.unreadCount > 0) {
        messageService.markAsRead(selectedConversation.id).catch(console.error);
        if (refreshUnreadCount) refreshUnreadCount();
      }
      pollingRef.current = setInterval(() => {
        loadMessages(selectedConversation.id, true);
      }, 5000);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ Escutar eventos de nova mensagem
  useEffect(() => {
    const handleNewMessageEvent = () => {
      loadConversations(true);
      if (refreshUnreadCount) refreshUnreadCount();
    };

    window.addEventListener('newMessage', handleNewMessageEvent);
    return () => window.removeEventListener('newMessage', handleNewMessageEvent);
  }, []);

  // ============================================================
  // CARREGAMENTO
  // ============================================================

  const loadConversations = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await messageService.getConversations();
      data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setConversations(data);
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }
    } catch (err) {
      if (!silent) setError('Erro ao carregar conversas');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadMessages = async (convId: number, silent = false) => {
    try {
      if (!silent) setMessagesLoading(true);
      const data = await messageService.getMessages(convId);
      setMessages(data.map(msg => ({
        id: String(msg.id),
        senderId: String(msg.senderId),
        senderName: msg.senderName || 'Usuário',
        content: msg.content || '',
        timestamp: msg.timestamp,
        status: msg.status,
        isOwn: String(msg.senderId) === String(user?.id),
        attachments: msg.attachments
      })));
    } catch (err) {
      if (!silent) setError('Erro ao carregar mensagens');
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  };

  // ============================================================
  // AÇÕES
  // ============================================================

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedAttachments.length === 0) return;
    if (!selectedConversation) return;

    const text = newMessage.trim();
    const files = selectedAttachments.length > 0 ? [...selectedAttachments] : undefined;
    
    setNewMessage('');
    setSelectedAttachments([]);
    setShowAttachmentMenu(false);
    setShowEmojiPicker(false);
    setSending(true);

    try {
      await messageService.sendMessage(selectedConversation.id, text, files);
      await loadMessages(selectedConversation.id);
      await loadConversations(true);
      
      // ✅ Disparar evento de nova mensagem
      window.dispatchEvent(new CustomEvent('newMessage'));
      
      // ✅ Atualizar contador de notificações
      if (refreshUnreadCount) refreshUnreadCount();
      
    } catch (err) {
      setError('Erro ao enviar mensagem');
      setNewMessage(text);
      if (files) setSelectedAttachments(files);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setShowConversationInfo(false);
    setShowMoreOptions(false);
  };

  const handleOpenNewChat = async () => {
    setShowNewChatModal(true);
    setEventsLoading(true);
    setNewChatSearchTerm('');
    try {
      const all = await eventService.getAllEvents();
      setEvents(all.filter((e: EventItem) => 
        (e.status === 'CONFIRMED' || e.status === 'QUOTE')
      ));
    } catch (err) {
      setError('Erro ao carregar eventos');
    } finally {
      setEventsLoading(false);
    }
  };

  const handleCreateConversation = async (eventId: number) => {
    setCreatingConversation(true);
    try {
      const conv = await messageService.createConversation(eventId);
      await loadConversations();
      setSelectedConversation(conv);
      setShowNewChatModal(false);
      loadMessages(conv.id);
      setSuccessMessage('Conversa iniciada com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // ✅ Atualizar notificações
      if (refreshUnreadCount) refreshUnreadCount();
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar conversa');
    } finally {
      setCreatingConversation(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setSelectedAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleToggleNotifications = () => {
    setNotificationsEnabled(prev => !prev);
    setSuccessMessage(notificationsEnabled ? 'Notificações desativadas' : 'Notificações ativadas');
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const handleArchiveConversation = () => {
    setSuccessMessage('Conversa arquivada');
    setTimeout(() => setSuccessMessage(null), 2000);
    setShowMoreOptions(false);
  };

  const handleStarConversation = () => {
    setSuccessMessage('Conversa favoritada ⭐');
    setTimeout(() => setSuccessMessage(null), 2000);
    setShowMoreOptions(false);
  };

  const handleClearConversation = () => {
    setMessages([]);
    setSuccessMessage('Conversa limpa localmente');
    setTimeout(() => setSuccessMessage(null), 2000);
    setShowMoreOptions(false);
  };

  const handleExportConversation = () => {
    const text = messages.map(m => `[${m.timestamp}] ${m.senderName}: ${m.content}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversa-${selectedConversation?.id || 'export'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMessage('Conversa exportada!');
    setTimeout(() => setSuccessMessage(null), 2000);
    setShowMoreOptions(false);
  };

  // ============================================================
  // FORMATAÇÃO
  // ============================================================

  const formatTime = (t: string) => {
    try { return new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } 
    catch { return ''; }
  };

  const formatMessageTime = (t: string) => {
    try {
      const d = new Date(t);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      if (diff < 60000) return 'Agora';
      if (diff < 3600000) return Math.floor(diff / 60000) + 'min';
      if (diff < 86400000) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch { return ''; }
  };

  const formatDateHeader = (t: string) => {
    try {
      const d = new Date(t);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) return 'Hoje';
      const y = new Date(today); y.setDate(y.getDate() - 1);
      if (d.toDateString() === y.toDateString()) return 'Ontem';
      return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    } catch { return ''; }
  };

  const getStatusIcon = (s: string) => {
    switch(s) {
      case 'SENT': return <FiCheck size={12} />;
      case 'DELIVERED': return <FiCheckCircle size={12} />;
      case 'READ': return <FiCheckCircle size={12} color="#00B4D8" />;
      default: return <FiClock size={12} />;
    }
  };

  const getStatusText = (s: string) => {
    switch(s) {
      case 'SENT': return 'Enviado';
      case 'DELIVERED': return 'Entregue';
      case 'READ': return 'Lido';
      default: return 'Enviando...';
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  const getClientInfo = (conv: Conversation) => {
    return conv.participants?.find(p => p.role === 'CLIENT');
  };

  // ✅ Verificar se o cliente está online (simulado - sempre online por enquanto)
  const isClientOnline = (conv: Conversation) => {
    const client = getClientInfo(conv);
    return client?.online ?? true; // Sempre online para teste
  };

  // ============================================================
  // EMOJIS
  // ============================================================

  const quickEmojis = ['😊', '👍', '❤️', '😂', '🎉', '👋', '✅', '🙏', '🔥', '💯', '🤝', '📅', '💰', '📋', '📎'];

  // ============================================================
  // FILTROS
  // ============================================================

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          conv.participants?.some(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesUnread = !filterUnread || conv.unreadCount > 0;
    return matchesSearch && matchesUnread;
  });

  const unreadCount = conversations.filter(c => c.unreadCount > 0).length;

  const filteredEvents = events.filter(e =>
    e.title?.toLowerCase().includes(newChatSearchTerm.toLowerCase()) ||
    e.client?.name?.toLowerCase().includes(newChatSearchTerm.toLowerCase())
  );

  const groupedMessages = messages.reduce((groups: any[], msg) => {
    const date = formatDateHeader(msg.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.date === date) { last.messages.push(msg); }
    else { groups.push({ date, messages: [msg] }); }
    return groups;
  }, []);

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinnerLarge}></div>
        <p>Carregando mensagens...</p>
      </div>
    );
  }

  return (
    <div className={styles.ownerChat}>
      {/* Banners */}
      {successMessage && (
        <div className={styles.successBanner}>
          <FiCheckCircle size={16} /> {successMessage}
          <button onClick={() => setSuccessMessage(null)}><FiX size={14} /></button>
        </div>
      )}
      {error && (
        <div className={styles.errorBanner}>
          <FiAlertCircle size={16} /> {error}
          <button onClick={() => setError(null)}><FiX size={14} /></button>
        </div>
      )}

      <div className={styles.messages}>
        {/* ============================================================ */}
        {/* SIDEBAR DE CONVERSAS */}
        {/* ============================================================ */}
        <div className={`${styles.conversationsSidebar} ${!showSidebar ? styles.sidebarHidden : ''}`}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarHeaderTop}>
              <h2><MdChat size={24} /> Mensagens</h2>
              <div className={styles.sidebarActions}>
                {unreadCount > 0 && (
                  <span className={styles.unreadCountBadge}>{unreadCount}</span>
                )}
                <button className={styles.iconButton} onClick={handleOpenNewChat} title="Nova conversa">
                  <FiMessageCircle size={18} />
                </button>
                <button className={styles.iconButtonSecondary} onClick={() => loadConversations()} title="Atualizar">
                  <MdRefresh size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className={styles.searchBar}>
            <FiSearch size={16} />
            <input
              type="text"
              placeholder="Pesquisar conversas..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className={styles.clearButton} onClick={() => setSearchTerm('')}>
                <FiX size={14} />
              </button>
            )}
          </div>

          <div className={styles.quickFilters}>
            <button 
              className={`${styles.filterChip} ${!filterUnread ? styles.active : ''}`}
              onClick={() => setFilterUnread(false)}
            >
              Todas
            </button>
            <button 
              className={`${styles.filterChip} ${filterUnread ? styles.active : ''}`}
              onClick={() => setFilterUnread(!filterUnread)}
            >
              Não lidas {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          <div className={styles.conversationsList}>
            {filteredConversations.length === 0 ? (
              <div className={styles.emptyState}>
                <MdChat size={48} />
                <h4>Nenhuma conversa</h4>
                <p>{searchTerm ? 'Nenhum resultado encontrado' : 'Inicie uma conversa com um cliente'}</p>
                {!searchTerm && (
                  <button className={styles.startButton} onClick={handleOpenNewChat}>
                    <FiMessageCircle size={16} /> Nova Conversa
                  </button>
                )}
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = selectedConversation?.id === conv.id;
                const hasUnread = conv.unreadCount > 0;
                const client = getClientInfo(conv);
                const online = isClientOnline(conv);
                
                return (
                  <div
                    key={conv.id}
                    className={`${styles.conversationItem} ${isSelected ? styles.active : ''} ${hasUnread ? styles.unread : ''}`}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className={styles.conversationAvatar}>
                      {client ? getInitials(client.name) : <MdEvent size={18} />}
                      {online && <span className={styles.onlineDot} />}
                    </div>
                    <div className={styles.conversationInfo}>
                      <div className={styles.conversationHeader}>
                        <span className={styles.conversationName}>
                          {conv.eventTitle || client?.name || 'Conversa'}
                        </span>
                        <span className={styles.conversationTime}>
                          {conv.lastMessage?.timestamp ? formatMessageTime(conv.lastMessage.timestamp) : ''}
                        </span>
                      </div>
                      <div className={styles.conversationPreview}>
                        <p>
                          {conv.lastMessage 
                            ? `${conv.lastMessage.isOwn ? 'Você' : conv.lastMessage.senderName?.split(' ')[0]}: ${conv.lastMessage.content?.substring(0, 35)}${(conv.lastMessage.content?.length || 0) > 35 ? '...' : ''}`
                            : 'Nova conversa'
                          }
                        </p>
                        <div className={styles.conversationMeta}>
                          {hasUnread && <span className={styles.unreadBadge}>{conv.unreadCount}</span>}
                          <span className={styles.eventBadge}><MdEvent size={10} /></span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* ÁREA DE CHAT */}
        {/* ============================================================ */}
        <div className={styles.chatArea}>
          {selectedConversation ? (
            <>
              {/* Header do Chat */}
              <div className={styles.chatHeader}>
                <div className={styles.chatHeaderLeft}>
                  <button className={styles.mobileBackButton} onClick={() => setShowSidebar(true)}>
                    <FiChevronLeft size={20} />
                  </button>
                  <div className={styles.chatAvatarLarge}>
                    {getInitials(getClientInfo(selectedConversation)?.name || 'C')}
                    {isClientOnline(selectedConversation) && <span className={styles.onlineDotLarge} />}
                  </div>
                  <div className={styles.chatInfo}>
                    <h3>{selectedConversation.eventTitle || getClientInfo(selectedConversation)?.name || 'Cliente'}</h3>
                    <div className={styles.chatSubInfo}>
                      <span className={styles.onlineStatus}>
                        <span className={styles.statusDot} /> Online
                      </span>
                      {selectedConversation.eventId && (
                        <span className={styles.eventTag}>Evento #{selectedConversation.eventId}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.chatHeaderActions}>
                  <button 
                    className={`${styles.headerBtn} ${notificationsEnabled ? styles.active : ''}`} 
                    onClick={handleToggleNotifications}
                    title={notificationsEnabled ? 'Notificações ativadas' : 'Notificações desativadas'}
                  >
                    {notificationsEnabled ? <MdNotifications size={18} /> : <MdNotificationsOff size={18} />}
                  </button>
                  <button 
                    className={`${styles.headerBtn} ${showConversationInfo ? styles.active : ''}`}
                    onClick={() => { setShowConversationInfo(!showConversationInfo); setShowMoreOptions(false); }}
                    title="Informações"
                  >
                    <FiInfo size={18} />
                  </button>
                  <div className={styles.moreOptionsWrapper}>
                    <button 
                      className={`${styles.headerBtn} ${showMoreOptions ? styles.active : ''}`}
                      onClick={() => { setShowMoreOptions(!showMoreOptions); setShowConversationInfo(false); }}
                      title="Mais opções"
                    >
                      <FiMoreVertical size={18} />
                    </button>
                    
                    {showMoreOptions && (
                      <div className={styles.moreOptionsDropdown}>
                        <button onClick={handleStarConversation}>
                          <FiStar size={16} /> Favoritar
                        </button>
                        <button onClick={handleArchiveConversation}>
                          <FiArchive size={16} /> Arquivar
                        </button>
                        <button onClick={handleExportConversation}>
                          <FiDownload size={16} /> Exportar
                        </button>
                        <div className={styles.dropdownDivider} />
                        <button onClick={handleClearConversation} className={styles.dangerOption}>
                          <FiTrash2 size={16} /> Limpar conversa
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Painel de Informações da Conversa */}
              {showConversationInfo && (
                <div className={styles.infoPanel}>
                  <h4><MdOutlineInfo size={18} /> Informações da Conversa</h4>
                  <div className={styles.infoContent}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Evento</span>
                      <span className={styles.infoValue}>{selectedConversation.eventTitle || 'N/A'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>ID do Evento</span>
                      <span className={styles.infoValue}>#{selectedConversation.eventId || 'N/A'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Participantes</span>
                      <span className={styles.infoValue}>{selectedConversation.participants?.length || 0}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Criado em</span>
                      <span className={styles.infoValue}>{selectedConversation.createdAt ? new Date(selectedConversation.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Última atualização</span>
                      <span className={styles.infoValue}>{selectedConversation.updatedAt ? new Date(selectedConversation.updatedAt).toLocaleString('pt-BR') : 'N/A'}</span>
                    </div>
                    <div className={styles.infoSection}>
                      <h5>Participantes</h5>
                      {selectedConversation.participants?.map(p => (
                        <div key={p.id} className={styles.participantItem}>
                          <div className={styles.participantAvatar}>{getInitials(p.name)}</div>
                          <div>
                            <span className={styles.participantName}>{p.name}</span>
                            <span className={styles.participantRole}>{p.role === 'CLIENT' ? 'Cliente' : 'Equipe'}</span>
                          </div>
                          {p.online && <span className={styles.onlineIndicator}>● Online</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Mensagens */}
              <div className={styles.messagesList}>
                {messagesLoading ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className={styles.emptyChat}>
                    <div className={styles.emptyChatIcon}>
                      <MdChat size={48} />
                    </div>
                    <h4>Inicie a conversa</h4>
                    <p>Envie a primeira mensagem para começar</p>
                  </div>
                ) : (
                  groupedMessages.map((group, gi) => (
                    <div key={gi} className={styles.messageGroup}>
                      <div className={styles.dateDivider}><span>{group.date}</span></div>
                      {group.messages.map((msg: DisplayMessage, mi: number) => {
                        const prevMsg = mi > 0 ? group.messages[mi - 1] : null;
                        const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId;
                        
                        return (
                          <div 
                            key={msg.id} 
                            className={`${styles.messageWrapper} ${msg.isOwn ? styles.own : ''} ${isConsecutive ? styles.consecutive : ''}`}
                          >
                            {!msg.isOwn && !isConsecutive && (
                              <div className={styles.messageAvatar}>
                                {getInitials(msg.senderName)}
                              </div>
                            )}
                            {!msg.isOwn && isConsecutive && <div className={styles.messageAvatarSpacer} />}
                            
                            <div className={styles.messageContent}>
                              {!msg.isOwn && !isConsecutive && (
                                <span className={styles.messageSender}>{msg.senderName}</span>
                              )}
                              <div className={`${styles.messageBubble} ${msg.isOwn ? styles.ownBubble : ''} ${isConsecutive ? styles.consecutiveBubble : ''}`}>
                                <p>{msg.content}</p>
                                {msg.attachments?.length > 0 && (
                                  <div className={styles.attachmentList}>
                                    {msg.attachments.map((att: any) => (
                                      <a key={att.id} href={att.url} target="_blank" className={styles.attachmentItem} download>
                                        <MdAttachFile size={14} />
                                        <span>{att.name}</span>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className={`${styles.messageMeta} ${msg.isOwn ? styles.ownMeta : ''}`}>
                                <span className={styles.messageTime}>{formatTime(msg.timestamp)}</span>
                                {msg.isOwn && (
                                  <span className={styles.messageStatus} title={getStatusText(msg.status)}>
                                    {getStatusIcon(msg.status)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de Mensagem */}
              <div className={styles.inputArea}>
                {selectedAttachments.length > 0 && (
                  <div className={styles.attachmentPreview}>
                    {selectedAttachments.map((file, i) => (
                      <div key={i} className={styles.previewChip}>
                        {file.type.startsWith('image') ? <FiImage size={14} /> : <FiFile size={14} />}
                        <span>{file.name.substring(0, 25)}</span>
                        <button onClick={() => removeAttachment(i)}><FiX size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.inputRow}>
                  <button 
                    className={styles.inputActionButton}
                    onClick={() => { setShowAttachmentMenu(!showAttachmentMenu); setShowEmojiPicker(false); }}
                    title="Anexar arquivo"
                  >
                    <FiPaperclip size={20} />
                  </button>

                  {showAttachmentMenu && (
                    <div className={styles.attachmentDropdown}>
                      <button onClick={() => { fileInputRef.current?.click(); setShowAttachmentMenu(false); }}>
                        <FiImage size={18} /> Imagem
                      </button>
                      <button onClick={() => { fileInputRef.current?.click(); setShowAttachmentMenu(false); }}>
                        <FiFile size={18} /> Documento
                      </button>
                      <input 
                        ref={fileInputRef} 
                        type="file" 
                        multiple 
                        onChange={handleFileSelect} 
                        style={{display:'none'}} 
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" 
                      />
                    </div>
                  )}

                  <textarea
                    ref={inputRef}
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    rows={1}
                  />

                  <button 
                    className={styles.inputActionButton}
                    onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowAttachmentMenu(false); }}
                    title="Emoji"
                  >
                    <MdOutlineEmojiEmotions size={22} />
                  </button>

                  {showEmojiPicker && (
                    <div className={styles.emojiPicker}>
                      {quickEmojis.map(emoji => (
                        <button key={emoji} onClick={() => handleInsertEmoji(emoji)}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    className={`${styles.sendButton} ${(newMessage.trim() || selectedAttachments.length > 0) ? styles.hasContent : ''}`}
                    onClick={handleSendMessage}
                    disabled={(!newMessage.trim() && selectedAttachments.length === 0) || sending}
                    title="Enviar mensagem"
                  >
                    {sending ? <div className={styles.spinnerSmall} /> : <MdSend size={22} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.noChat}>
              <div className={styles.noChatIcon}>
                <MdChat size={80} />
              </div>
              <h2>Mensagens</h2>
              <p>Selecione uma conversa ao lado ou inicie uma nova</p>
              <button className={styles.primaryButton} onClick={handleOpenNewChat}>
                <FiMessageCircle size={20} /> Iniciar Nova Conversa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL - NOVA CONVERSA */}
      {/* ============================================================ */}
      {showNewChatModal && (
        <div className={styles.modalOverlay} onClick={() => setShowNewChatModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3><FiMessageCircle size={20} /> Nova Conversa</h3>
              <button onClick={() => setShowNewChatModal(false)} className={styles.modalCloseBtn}>
                <FiX size={20} />
              </button>
            </div>

            <div className={styles.modalSearch}>
              <FiSearch size={16} />
              <input
                type="text"
                placeholder="Buscar evento ou cliente..."
                value={newChatSearchTerm}
                onChange={e => setNewChatSearchTerm(e.target.value)}
              />
            </div>

            <div className={styles.modalBody}>
              {eventsLoading ? (
                <div className={styles.modalLoadingState}>
                  <div className={styles.spinner}></div>
                  <p>Carregando eventos...</p>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className={styles.modalEmptyState}>
                  <MdEvent size={48} />
                  <p>{newChatSearchTerm ? 'Nenhum evento encontrado' : 'Nenhum evento ativo disponível'}</p>
                </div>
              ) : (
                <div className={styles.modalEventList}>
                  {filteredEvents.map(event => (
                    <div
                      key={event.id}
                      className={styles.modalEventCard}
                      onClick={() => !creatingConversation && handleCreateConversation(event.id)}
                    >
                      <div className={styles.modalEventIcon}>
                        <MdEvent size={20} />
                      </div>
                      <div className={styles.modalEventInfo}>
                        <strong>{event.title || 'Evento sem título'}</strong>
                        <div className={styles.modalEventMeta}>
                          <span><FiCalendar size={12} /> {new Date(event.eventDate).toLocaleDateString('pt-BR')}</span>
                          <span><FiUsers size={12} /> {event.guestCount || 0} convidados</span>
                        </div>
                        {event.client && (
                          <span className={styles.modalEventClient}>
                            <MdPerson size={12} /> {event.client.name}
                          </span>
                        )}
                      </div>
                      <button 
                        className={`${styles.modalEventButton} ${creatingConversation ? styles.creating : ''}`}
                        disabled={creatingConversation}
                      >
                        {creatingConversation ? (
                          <div className={styles.spinnerSmall}></div>
                        ) : (
                          <FiMessageCircle size={16} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerChat;