// src/components/ClientComponents/Messages/Messages.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  FiSend, 
  FiPaperclip, 
  FiImage, 
  FiCheck, 
  FiCheckCircle,
  FiClock,
  FiUser,
  FiSearch,
  FiMoreVertical,
  FiSmile,
  FiX,
  FiAlertCircle
} from 'react-icons/fi';
import { 
  MdChat, 
  MdEvent, 
  MdAttachFile,
  MdNotifications,
  MdVerified
} from 'react-icons/md';
import { messageService } from '../../../services/message';
import { useAuth } from '../../../context/AuthContext';
import styles from './Messages.module.css';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole?: string;
  content: string;
  timestamp: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  attachments?: Attachment[];
  isAutomated?: boolean;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnail?: string;
}

interface Conversation {
  id: string;
  eventId?: string;
  eventTitle?: string;
  participants: Participant[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
  isOnline?: boolean;
  typing?: boolean;
}

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  role: 'CLIENT' | 'OWNER' | 'MANAGER' | 'SUPPORT';
  online?: boolean;
}

interface MessagesProps {
  conversationId?: string;
  onBack?: () => void;
}

export const Messages: React.FC<MessagesProps> = ({ conversationId, onBack }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<File[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data
  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setConversations(getMockConversations());
      const conv = getMockConversations()[0];
      setSelectedConversation(conv);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMockConversations = (): Conversation[] => {
    return [
      {
        id: 'conv-001',
        eventId: 'evt-001',
        eventTitle: 'Aniversário de 30 anos - Maria',
        participants: [
          { id: 'user-001', name: 'Maria Silva', role: 'CLIENT' },
          { id: 'staff-001', name: 'Ana (Gerente)', role: 'MANAGER', online: true },
          { id: 'staff-002', name: 'Carlos (Comercial)', role: 'OWNER', online: false }
        ],
        lastMessage: {
          id: 'msg-010',
          senderId: 'staff-001',
          senderName: 'Ana (Gerente)',
          content: 'A decoração ficará pronta até amanhã! 🌸',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          status: 'READ'
        },
        unreadCount: 0,
        updatedAt: new Date().toISOString()
      },
      {
        id: 'conv-002',
        eventId: 'evt-002',
        eventTitle: 'Casamento João e Maria',
        participants: [
          { id: 'user-001', name: 'Maria Silva', role: 'CLIENT' },
          { id: 'staff-003', name: 'Suporte EEMS', role: 'SUPPORT', online: true }
        ],
        lastMessage: {
          id: 'msg-020',
          senderId: 'staff-003',
          senderName: 'Suporte EEMS',
          content: 'Olá! Como podemos ajudar?',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          status: 'DELIVERED'
        },
        unreadCount: 2,
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      }
    ];
  };

  const loadMessages = async (convId: string) => {
    try {
      const mockMessages = getMockMessages(convId);
      setMessages(mockMessages);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const getMockMessages = (convId: string): Message[] => {
    const now = new Date();
    return [
      {
        id: 'msg-001',
        senderId: 'staff-002',
        senderName: 'Carlos (Comercial)',
        senderRole: 'OWNER',
        content: 'Olá Maria! Tudo bem? Enviei a proposta comercial para o seu evento. Você já teve a oportunidade de visualizar?',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        status: 'READ'
      },
      {
        id: 'msg-002',
        senderId: 'user-001',
        senderName: 'Maria Silva',
        content: 'Olá Carlos! Sim, recebi a proposta. Estou analisando com calma. Tem alguns itens que gostaria de ajustar.',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 30).toISOString(),
        status: 'READ'
      },
      {
        id: 'msg-003',
        senderId: 'staff-002',
        senderName: 'Carlos (Comercial)',
        senderRole: 'OWNER',
        content: 'Claro, fique à vontade! Me diga quais itens gostaria de ajustar que faremos uma nova versão da proposta.',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 45).toISOString(),
        status: 'READ'
      },
      {
        id: 'msg-004',
        senderId: 'user-001',
        senderName: 'Maria Silva',
        content: 'Principalmente a parte do buffet. Gostaria de incluir mais opções vegetarianas e uma estação de massas.',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        status: 'READ'
      },
      {
        id: 'msg-005',
        senderId: 'staff-002',
        senderName: 'Carlos (Comercial)',
        senderRole: 'OWNER',
        content: 'Ótimo! Vou verificar com o chef as opções e já retorno com a proposta atualizada.',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 20).toISOString(),
        status: 'READ'
      },
      {
        id: 'msg-006',
        senderId: 'staff-001',
        senderName: 'Ana (Gerente)',
        senderRole: 'MANAGER',
        content: 'Aproveitando, Maria! Já definimos a decoração com o tema Tropical Chic que você pediu. As flores serão orquídeas e folhagens tropicais. Ficará lindo! 🌺',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 12).toISOString(),
        status: 'READ'
      },
      {
        id: 'msg-007',
        senderId: 'user-001',
        senderName: 'Maria Silva',
        content: 'Que maravilha, Ana! Mal posso esperar para ver!',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 12 + 1000 * 60 * 15).toISOString(),
        status: 'READ'
      },
      {
        id: 'msg-008',
        senderId: 'system',
        senderName: 'Sistema',
        senderRole: 'SUPPORT',
        content: '🔔 Lembrete: Faltam 90 dias para o seu evento! Não se esqueça de confirmar a lista de convidados.',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
        status: 'READ',
        isAutomated: true
      },
      {
        id: 'msg-009',
        senderId: 'staff-001',
        senderName: 'Ana (Gerente)',
        senderRole: 'MANAGER',
        content: 'Maria, aprovei o fornecedor de fotografia que você indicou. Já estou alinhando os horários com eles.',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        status: 'READ'
      },
      {
        id: 'msg-010',
        senderId: 'staff-001',
        senderName: 'Ana (Gerente)',
        senderRole: 'MANAGER',
        content: 'A decoração ficará pronta até amanhã! Vou enviar fotos assim que estiver montada. 🌸',
        timestamp: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
        status: 'READ'
      }
    ];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedAttachments.length === 0) return;
    if (!selectedConversation) return;

    setSending(true);
    
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: user?.id || 'user-001',
      senderName: user?.name || 'Você',
      content: newMessage,
      timestamp: new Date().toISOString(),
      status: 'SENT',
      attachments: selectedAttachments.map((file, index) => ({
        id: `att-${index}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: '#'
      }))
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setSelectedAttachments([]);
    setShowAttachmentMenu(false);
    
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, status: 'DELIVERED' } 
            : msg
        )
      );
      setSending(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    setTypingTimeout(setTimeout(() => {
      setTypingTimeout(null);
    }, 1000));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setSelectedAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getMessageStatusIcon = (status: string) => {
    switch(status) {
      case 'SENT': return <FiCheck size={12} />;
      case 'DELIVERED': return <FiCheckCircle size={12} />;
      case 'READ': return <FiCheckCircle size={12} color="#00B4D8" />;
      default: return <FiClock size={12} />;
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchTerm.toLowerCase();
    return conv.eventTitle?.toLowerCase().includes(searchLower) ||
           conv.participants.some(p => p.name.toLowerCase().includes(searchLower));
  });

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando mensagens...</p>
      </div>
    );
  }

  return (
    <div className={styles.messages}>
      {/* Sidebar de Conversas */}
      <div className={styles.conversationsSidebar}>
        <div className={styles.sidebarHeader}>
          <h2>
            <MdChat size={24} />
            Mensagens
          </h2>
        </div>
        
        <div className={styles.searchBar}>
          <FiSearch size={16} />
          <input
            type="text"
            placeholder="Buscar conversa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className={styles.conversationsList}>
          {filteredConversations.length === 0 ? (
            <div className={styles.emptyConversations}>
              <MdChat size={48} />
              <p>Nenhuma conversa</p>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const otherParticipant = conv.participants.find(p => p.role !== 'CLIENT');
              
              return (
                <div
                  key={conv.id}
                  className={`${styles.conversationItem} ${selectedConversation?.id === conv.id ? styles.active : ''} ${conv.unreadCount > 0 ? styles.unread : ''}`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div className={styles.conversationAvatar}>
                    {conv.eventTitle ? (
                      <MdEvent size={20} />
                    ) : (
                      <FiUser size={20} />
                    )}
                    {otherParticipant?.online && (
                      <span className={styles.onlineIndicator} />
                    )}
                  </div>
                  
                  <div className={styles.conversationInfo}>
                    <div className={styles.conversationHeader}>
                      <span className={styles.conversationName}>
                        {conv.eventTitle || otherParticipant?.name || 'Suporte'}
                      </span>
                      <span className={styles.conversationTime}>
                        {conv.lastMessage && formatTime(conv.lastMessage.timestamp)}
                      </span>
                    </div>
                    
                    <div className={styles.conversationPreview}>
                      <p>{conv.lastMessage?.content || 'Nova conversa'}</p>
                      {conv.unreadCount > 0 && (
                        <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Área de Chat */}
      <div className={styles.chatArea}>
        {selectedConversation ? (
          <>
            {/* Header do Chat */}
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderInfo}>
                <div className={styles.chatAvatar}>
                  {selectedConversation.eventTitle ? (
                    <MdEvent size={24} />
                  ) : (
                    <FiUser size={24} />
                  )}
                </div>
                <div className={styles.chatInfo}>
                  <h3>{selectedConversation.eventTitle || 'Suporte EEMS'}</h3>
                  <div className={styles.chatMeta}>
                    {selectedConversation.eventTitle && (
                      <span className={styles.eventTag}>
                        <MdEvent size={12} />
                        Evento
                      </span>
                    )}
                    {selectedConversation.participants.find(p => p.role !== 'CLIENT')?.online ? (
                      <span className={styles.onlineStatus}>
                        <span className={styles.onlineDot} />
                        Online
                      </span>
                    ) : (
                      <span className={styles.offlineStatus}>
                        <FiClock size={12} />
                        Responde em até 2h
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <button className={styles.moreButton}>
                <FiMoreVertical size={20} />
              </button>
            </div>

            {/* Mensagens */}
            <div className={styles.messagesList}>
              {messages.length === 0 ? (
                <div className={styles.emptyMessages}>
                  <MdChat size={64} />
                  <h4>Nenhuma mensagem ainda</h4>
                  <p>Envie uma mensagem para iniciar a conversa</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isOwn = message.senderId === user?.id || message.senderId === 'user-001';
                  const showAvatar = !isOwn && (index === 0 || messages[index - 1].senderId !== message.senderId);
                  const isAutomated = message.isAutomated;
                  
                  return (
                    <div
                      key={message.id}
                      className={`${styles.messageWrapper} ${isOwn ? styles.ownMessage : ''} ${isAutomated ? styles.automatedMessage : ''}`}
                    >
                      {showAvatar && !isAutomated && (
                        <div className={styles.messageAvatar}>
                          {message.senderAvatar ? (
                            <img src={message.senderAvatar} alt={message.senderName} />
                          ) : (
                            <FiUser size={16} />
                          )}
                        </div>
                      )}
                      
                      <div className={styles.messageContent}>
                        {showAvatar && !isAutomated && (
                          <span className={styles.messageSender}>
                            {message.senderName}
                            {message.senderRole === 'OWNER' || message.senderRole === 'MANAGER' ? (
                              <MdVerified size={12} className={styles.verifiedIcon} />
                            ) : null}
                          </span>
                        )}
                        
                        <div className={`${styles.messageBubble} ${isAutomated ? styles.automatedBubble : ''}`}>
                          {isAutomated && (
                            <div className={styles.automatedHeader}>
                              <MdNotifications size={12} />
                              <span>Notificação do Sistema</span>
                            </div>
                          )}
                          <p>{message.content}</p>
                          
                          {message.attachments && message.attachments.length > 0 && (
                            <div className={styles.attachmentsList}>
                              {message.attachments.map(att => (
                                <a
                                  key={att.id}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.attachmentItem}
                                >
                                  {att.type.startsWith('image') ? (
                                    <FiImage size={14} />
                                  ) : (
                                    <MdAttachFile size={14} />
                                  )}
                                  <span>{att.name}</span>
                                  <small>{formatFileSize(att.size)}</small>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className={styles.messageMeta}>
                          <span className={styles.messageTime}>
                            {formatTime(message.timestamp)}
                          </span>
                          {isOwn && !isAutomated && (
                            <span className={styles.messageStatus}>
                              {getMessageStatusIcon(message.status)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {selectedConversation.typing && (
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                  <small>Digitando...</small>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensagem */}
            <div className={styles.messageInputArea}>
              {selectedAttachments.length > 0 && (
                <div className={styles.attachmentPreview}>
                  {selectedAttachments.map((file, index) => (
                    <div key={index} className={styles.previewItem}>
                      {file.type.startsWith('image') ? (
                        <FiImage size={14} />
                      ) : (
                        <MdAttachFile size={14} />
                      )}
                      <span>{file.name}</span>
                      <button onClick={() => removeAttachment(index)}>
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className={styles.inputWrapper}>
                <button 
                  className={styles.attachButton}
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                >
                  <FiPaperclip size={20} />
                </button>
                
                {showAttachmentMenu && (
                  <div className={styles.attachmentMenu}>
                    <button onClick={() => fileInputRef.current?.click()}>
                      <FiImage size={16} />
                      Imagem
                    </button>
                    <button onClick={() => fileInputRef.current?.click()}>
                      <MdAttachFile size={16} />
                      Arquivo
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      accept="image/*,.pdf,.doc,.docx"
                    />
                  </div>
                )}
                
                <textarea
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={handleKeyPress}
                  rows={1}
                />
                
                <button 
                  className={styles.emojiButton}
                  onClick={() => setNewMessage(prev => prev + '😊')}
                >
                  <FiSmile size={20} />
                </button>
                
                <button 
                  className={styles.sendButton}
                  onClick={handleSendMessage}
                  disabled={(!newMessage.trim() && selectedAttachments.length === 0) || sending}
                >
                  <FiSend size={20} />
                </button>
              </div>
              
              <div className={styles.inputHint}>
                <FiAlertCircle size={12} />
                <span>Respostas em até 2 horas em horário comercial</span>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.noConversation}>
            <MdChat size={64} />
            <h3>Suas Mensagens</h3>
            <p>Selecione uma conversa para começar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;