// src/components/ClientComponents/CommunityView/CommunityView.tsx
import React, { useState } from 'react';
import { 
  FiUsers, 
  FiMessageCircle, 
  FiShare2, 
  FiHeart, 
  FiCalendar,
  FiMapPin,
  FiImage
} from 'react-icons/fi';
import { MdEvent, MdGroup } from 'react-icons/md';
import { useAuth } from '../../../context/AuthContext';
import styles from './CommunityView.module.css';

interface Post {
  id: string;
  author: string;
  authorAvatar?: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  createdAt: string;
  eventType?: string;
}

export const CommunityView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'events'>('feed');
  const [newPost, setNewPost] = useState('');
  
  const [posts] = useState<Post[]>([
    {
      id: '1',
      author: 'Maria Silva',
      content: 'Acabei de confirmar meu casamento para Junho! Alguma dica de decoração? 🌸',
      image: 'https://via.placeholder.com/400x200',
      likes: 24,
      comments: 8,
      createdAt: '2026-04-20T10:00:00',
      eventType: 'Casamento'
    },
    {
      id: '2',
      author: 'João Santos',
      content: 'Dica: Contratem buffet com antecedência! Consegui um desconto de 15% fechando 6 meses antes. 💰',
      likes: 45,
      comments: 12,
      createdAt: '2026-04-19T15:30:00',
      eventType: 'Aniversário'
    },
    {
      id: '3',
      author: 'Ana Oliveira',
      content: 'Fiz minha festa de 15 anos da minha filha no Espaço Premium. Super recomendo! Atendimento excelente ✨',
      likes: 32,
      comments: 5,
      createdAt: '2026-04-18T09:15:00',
      eventType: '15 Anos'
    }
  ]);

  const formatTimeAgo = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return date.toLocaleDateString('pt-BR');
  };

  const handlePostSubmit = () => {
    if (newPost.trim()) {
      console.log('Nova postagem:', newPost);
      setNewPost('');
    }
  };

  return (
    <div className={styles.community}>
      <div className={styles.communityHeader}>
        <h2>
          <FiUsers size={24} />
          Comunidade EEMS
        </h2>
        <p>Conecte-se com outros clientes e compartilhe experiências</p>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'feed' ? styles.active : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          <FiMessageCircle size={16} />
          Feed
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'groups' ? styles.active : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          <MdGroup size={16} />
          Grupos
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'events' ? styles.active : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <MdEvent size={16} />
          Eventos Comunitários
        </button>
      </div>

      {activeTab === 'feed' && (
        <>
          <div className={styles.postBox}>
            <div className={styles.postBoxHeader}>
              <div className={styles.userAvatar}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <textarea
                placeholder="Compartilhe sua experiência, dica ou dúvida..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                rows={3}
              />
            </div>
            <div className={styles.postBoxFooter}>
              <button className={styles.attachButton}>
                <FiImage size={16} />
                Adicionar foto
              </button>
              <button 
                className={styles.postButton}
                onClick={handlePostSubmit}
                disabled={!newPost.trim()}
              >
                Publicar
              </button>
            </div>
          </div>

          <div className={styles.feed}>
            {posts.map(post => (
              <div key={post.id} className={styles.postCard}>
                <div className={styles.postHeader}>
                  <div className={styles.postAuthor}>
                    <div className={styles.authorAvatar}>
                      {post.author.charAt(0)}
                    </div>
                    <div className={styles.authorInfo}>
                      <span className={styles.authorName}>{post.author}</span>
                      <span className={styles.postMeta}>
                        {post.eventType && `${post.eventType} • `}
                        {formatTimeAgo(post.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className={styles.postContent}>{post.content}</p>
                
                {post.image && (
                  <img src={post.image} alt="Post" className={styles.postImage} />
                )}
                
                <div className={styles.postActions}>
                  <button className={styles.actionButton}>
                    <FiHeart size={18} />
                    <span>{post.likes}</span>
                  </button>
                  <button className={styles.actionButton}>
                    <FiMessageCircle size={18} />
                    <span>{post.comments}</span>
                  </button>
                  <button className={styles.actionButton}>
                    <FiShare2 size={18} />
                    <span>Compartilhar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'groups' && (
        <div className={styles.comingSoon}>
          <MdGroup size={64} />
          <h3>Grupos em breve!</h3>
          <p>Participe de grupos por tipo de evento e conecte-se com pessoas que têm interesses similares.</p>
        </div>
      )}

      {activeTab === 'events' && (
        <div className={styles.comingSoon}>
          <FiCalendar size={64} />
          <h3>Eventos comunitários em breve!</h3>
          <p>Participe de workshops, webinars e encontros da comunidade EEMS.</p>
        </div>
      )}
    </div>
  );
};