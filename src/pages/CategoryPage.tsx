import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { postService } from '../services/postService';
import { Post } from '../types';
import PostCard from '../components/common/PostCard';
import { motion } from 'framer-motion';

const CategoryPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (category) {
      loadPosts();
    }
  }, [category]);

  const loadPosts = async () => {
    if (!category) return;

    setLoading(true);
    try {
      const data = await postService.getPosts(category);
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryInfo = () => {
    switch (category) {
      case 'comics':
        return {
          title: 'Cómics',
          description: 'Descubre las mejores historias, fans de verdad',
          emoji: '',
          gradient: 'from-blue-600 to-blue-800'
        };
      case 'manga':
        return {
          title: 'Manga',
          description: 'Expresa lo que te gusta, sin límites',
          emoji: '🎌',
          gradient: 'from-pink-600 to-pink-800'
        };
      case 'art':
        return {
          title: 'Arte',
          description: 'Explora las creaciones artísticas',
          emoji: '🎨',
          gradient: 'from-green-600 to-green-800'
        };
      default:
        return {
          title: 'Contenido',
          description: 'Explora todo nuestro contenido',
          emoji: '✨',
          gradient: 'from-pink-600 to-purple-800'
        };
    }
  };

  const categoryInfo = getCategoryInfo();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-gray-800 animate-pulse rounded-lg h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-20">
      {/* Header */}
      <header className={`relative overflow-hidden py-10 bg-center bg-cover bg-no-repeat ${categoryInfo.gradient}`}
      style={{ backgroundImage: `url(${posts[0]?.image_url})` }}>
        {/* Background glow effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[20%] w-[300px] h-[300px] bg-pink-500 opacity-30 blur-3xl rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-purple-500 opacity-25 blur-3xl rounded-full"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-10 shadow-2xl"
          >
            <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
              <span className="block text-white/90 drop-shadow">{categoryInfo.emoji} {categoryInfo.title}</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/80 font-light leading-relaxed max-w-2xl mx-auto">
              {categoryInfo.description}
            </p>
          </motion.div>
        </div>
      </header>


      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PostCard post={post} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">{categoryInfo.emoji}</div>
            <h3 className="text-2xl font-semibold text-white mb-2">
              No hay contenido disponible
            </h3>
            <p className="text-gray-400 mb-6">
              ¡Sé el primero en compartir algo increíble en esta categoría!
            </p>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors">
              Publicar Ahora
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;