import React from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../../types';
import { MessageCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface PostCardProps {
  post: Post;
  className?: string;
}

const PostCard: React.FC<PostCardProps> = ({ post, className = '' }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative group cursor-pointer ${className}`}
    >
      <Link to={`/post/${post.id}`}>
        <div className="relative overflow-hidden rounded-lg bg-gray-900">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="font-semibold text-lg mb-1 line-clamp-2">{post.title}</h3>
            <p className="text-sm text-gray-300 mb-2 line-clamp-2">{post.description}</p>
            
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{post.user?.username || 'Usuario'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-3 w-3" />
                <span>{post.comments_count || 0}</span>
              </div>
            </div>
          </div>

          {/* Category Badge */}
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              post.category === 'comics' ? 'bg-blue-600 text-white' :
              post.category === 'manga' ? 'bg-pink-600 text-white' :
              'bg-green-600 text-white'
            }`}>
              {post.category === 'comics' ? 'Cómic' :
               post.category === 'manga' ? 'Manga' : 'Arte'}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default PostCard;