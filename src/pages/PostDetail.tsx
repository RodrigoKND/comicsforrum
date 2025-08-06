import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postService } from '../services/postService';
import { Post } from '../types';
import CommentSection from '../components/common/CommentSection';
import PostCard from '../components/common/PostCard';
import { ArrowLeft, User, Calendar, Flag } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [recommendations, setRecommendations] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const postData = await postService.getPostById(id);
      if (postData) {
        setPost(postData);
        // Load recommendations
        const recommendationsData = await postService.getRecommendations(
          postData.id,
          postData.category
        );
        setRecommendations(recommendationsData);
      }
    } catch (error) {
      console.error('Error loading post:', error);
      toast.error('Error al cargar el contenido');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'comics':
        return { name: 'Cómic', color: 'bg-blue-600' };
      case 'manga':
        return { name: 'Manga', color: 'bg-pink-600' };
      case 'art':
        return { name: 'Arte', color: 'bg-green-600' };
      default:
        return { name: 'Contenido', color: 'bg-gray-600' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded mb-6 w-32" />
            <div className="h-96 bg-gray-800 rounded-lg mb-8" />
            <div className="h-8 bg-gray-800 rounded mb-4 w-3/4" />
            <div className="h-4 bg-gray-800 rounded mb-2" />
            <div className="h-4 bg-gray-800 rounded mb-8 w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Contenido no encontrado</h2>
          <Link
            to="/"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(post.category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <div className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>

        <div className="relative z-10 h-full flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Link
                to="/"
                className="inline-flex items-center space-x-2 text-gray-300 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Volver</span>
              </Link>

              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-white ${categoryInfo.color}`}>
                  {categoryInfo.name}
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                {post.title}
              </h1>

              <p className="text-xl text-gray-300 mb-6 max-w-3xl">
                {post.description}
              </p>

              <div className="flex items-center space-x-6 text-gray-400">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>{post.user?.username || 'Usuario'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CommentSection postId={post.id} />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-xl font-semibold text-white mb-6">
                Contenido Relacionado
              </h3>
              
              {recommendations.length > 0 ? (
                <div className="space-y-6">
                  {recommendations.map((rec) => (
                    <PostCard key={rec.id} post={rec} className="w-full" />
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">
                  No hay recomendaciones disponibles
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;