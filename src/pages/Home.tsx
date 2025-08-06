import React, { useState, useEffect } from 'react';
import { postService } from '../services/postService';
import { Post } from '../types';
import PostCarousel from '../components/common/PostCarousel';
import { motion } from 'framer-motion';

const Home: React.FC = () => {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [comicPosts, setComicPosts] = useState<Post[]>([]);
  const [mangaPosts, setMangaPosts] = useState<Post[]>([]);
  const [artPosts, setArtPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const [all, comics, manga, art] = await Promise.all([
        postService.getPosts(),
        postService.getPosts('comics'),
        postService.getPosts('manga'),
        postService.getPosts('art'),
      ]);

      setAllPosts(all.slice(0, 10));
      setComicPosts(comics.slice(0, 10));
      setMangaPosts(manga.slice(0, 10));
      setArtPosts(art.slice(0, 10));
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4"
        >
          <h1 className="text-5xl md:text-4xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Tu mejor foro para compartir lo que amas
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Descubre, comparte y debate sobre las mejores obras visuales con una comunidad apasionada
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Explorar Contenido
          </motion.button>
        </motion.div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-purple-400 rounded-full opacity-30"
              animate={{
                x: [0, Math.random() * 100, 0],
                y: [0, Math.random() * 100, 0],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <PostCarousel title="✨ Destacados" posts={allPosts} loading={loading} />
          <PostCarousel title="📚 Cómics" posts={comicPosts} loading={loading} />
          <PostCarousel title="🎌 Manga" posts={mangaPosts} loading={loading} />
          <PostCarousel title="🎨 Arte" posts={artPosts} loading={loading} />
        </motion.div>
      </div>
    </div>
  );
};

export default Home;