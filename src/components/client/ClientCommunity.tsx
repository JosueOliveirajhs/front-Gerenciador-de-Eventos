import React, { useState } from 'react';
import { FiHeart, FiMessageSquare, FiShare2 } from 'react-icons/fi';
import { MdPeople } from 'react-icons/md';
import styles from './ClientCommunity.module.css';

interface CommunityPost {
  id: number;
  userName: string;
  userAvatar: string;
  eventType: string;
  description: string;
  likes: number;
  comments: number;
  liked: boolean;
}

export const ClientCommunity: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([
    {
      id: 1,
      userName: 'Maria Silva',
      userAvatar: '👩',
      eventType: 'Casamento',
      description: 'Nosso casamento foi simplesmente perfeito! Agradecemos a toda equipe pelo cuidado e dedicação.',
      likes: 45,
      comments: 12,
      liked: false
    },
    {
      id: 2,
      userName: 'João Santos',
      userAvatar: '👨',
      eventType: 'Aniversário',
      description: 'Festa inesquecível! Minha filha amou cada detalhe. Recomendo demais!',
      likes: 32,
      comments: 8,
      liked: true
    },
    {
      id: 3,
      userName: 'Carla Oliveira',
      userAvatar: '👩',
      eventType: 'Corporativo',
      description: 'Confraternização da empresa foi um sucesso! Ambiente incrível e organização impecável.',
      likes: 28,
      comments: 5,
      liked: false
    }
  ]);

  const [newPost, setNewPost] = useState('');

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, likes: post.liked ? post.likes - 1 : post.likes + 1, liked: !post.liked }
        : post
    ));
  };

  const handleCreatePost = () => {
    if (!newPost.trim()) return;
    
    const post: CommunityPost = {
      id: posts.length + 1,
      userName: 'Você',
      userAvatar: '👤',
      eventType: 'Compartilhamento',
      description: newPost,
      likes: 0,
      comments: 0,
      liked: false
    };
    
    setPosts([post, ...posts]);
    setNewPost('');
  };

  return (
    <div className={styles.community}>
      <h2 className={styles.title}>
        <MdPeople size={28} />
        Comunidade
      </h2>

      <div className={styles.createPost}>
        <div className={styles.createPostHeader}>
          <div className={styles.userAvatar}>👤</div>
          <textarea
            className={styles.postInput}
            placeholder="Compartilhe sua experiência..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
          />
        </div>
        <div className={styles.createPostActions}>
          <button 
            className={styles.postButton}
            onClick={handleCreatePost}
            disabled={!newPost.trim()}
          >
            Publicar
          </button>
        </div>
      </div>

      <div className={styles.feed}>
        {posts.map(post => (
          <div key={post.id} className={styles.post}>
            <div className={styles.postHeader}>
              <div className={styles.postUser}>
                <span className={styles.userAvatar}>{post.userAvatar}</span>
                <div>
                  <h4>{post.userName}</h4>
                  <span className={styles.eventBadge}>{post.eventType}</span>
                </div>
              </div>
            </div>

            <p className={styles.postContent}>{post.description}</p>

            <div className={styles.postStats}>
              <span>{post.likes} curtidas</span>
              <span>{post.comments} comentários</span>
            </div>

            <div className={styles.postActions}>
              <button 
                className={`${styles.actionButton} ${post.liked ? styles.liked : ''}`}
                onClick={() => handleLike(post.id)}
              >
                <FiHeart size={18} />
                Curtir
              </button>
              <button className={styles.actionButton}>
                <FiMessageSquare size={18} />
                Comentar
              </button>
              <button className={styles.actionButton}>
                <FiShare2 size={18} />
                Compartilhar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};