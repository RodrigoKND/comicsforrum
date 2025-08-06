import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services/postService';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const PublishPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'comics' | 'manga' | 'art'>('comics');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('La imagen no puede superar los 5MB');
        return;
      }

      setImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !image) return;

    if (!title.trim() || !description.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setUploading(true);
    try {
      // Upload image first
      const imageUrl = await postService.uploadImage(image);
      // Create post
      const newPost = await postService.createPost({
        title: title.trim(),
        description: description.trim(),
        category,
        image_url: imageUrl,
        user_id: user.id
      });
      toast.success('¡Contenido publicado exitosamente!');
      navigate(`/post/${newPost.id}`);
      setUploading(false);
    } catch (error) {
      console.error('Error publishing post:', error);
      toast.error('Error al publicar el contenido');
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
            Comparte tu Pasión
          </h1>

          <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-8 space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-white text-sm font-medium mb-3">
                Imagen *
              </label>

              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">
                      Haz clic para subir una imagen
                    </p>
                    <p className="text-gray-500 text-sm">
                      PNG, JPG, GIF hasta 5MB
                    </p>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-white text-sm font-medium mb-3">
                Categoría *
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'comics', label: 'Cómics', emoji: '📚' },
                  { value: 'manga', label: 'Manga', emoji: '🎌' },
                  { value: 'art', label: 'Arte', emoji: '🎨' },
                ].map((option: { value: string; label: string; emoji: string }) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategory(option.value as 'comics' | 'manga' | 'art')}
                    className={`p-4 rounded-lg border-2 transition-all ${category === option.value
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                      }`}
                  >
                    <div className="text-2xl mb-2">{option.emoji}</div>
                    <div className="font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-white text-sm font-medium mb-3">
                Título *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Dale un título llamativo a tu contenido"
                className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                maxLength={100}
              />
              <p className="text-gray-400 text-sm mt-1">
                {title.length}/100 caracteres
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-white text-sm font-medium mb-3">
                Descripción *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe tu contenido, comparte tu opinión o inicia un debate..."
                className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                rows={6}
                maxLength={1000}
              />
              <p className="text-gray-400 text-sm mt-1">
                {description.length}/1000 caracteres
              </p>
            </div>

            {/* Disclaimer */}
            <p role="note" className="text-white text-sm font-medium mb-3">
              Las publicaciones estarán moderadas para garantizar un espacio seguro.
              No se permitirá contenido que
              promueva la violencia o afecte la integridad de los usuarios.
              Los moderadores supervisarán las imágenes publicadas y se
              eliminarán automáticamente.
            </p>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 text-gray-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!image || !title.trim() || !description.trim() || uploading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2"
              >
                <ImageIcon className="h-5 w-5" />
                <span>{uploading ? 'Publicando...' : 'Publicar'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default PublishPage;