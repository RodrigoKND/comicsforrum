/*
  # Esquema inicial del foro visual

  1. Nuevas tablas
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `email` (text, unique)
      - `avatar_url` (text, optional)
      - `created_at` (timestamp)
    
    - `posts`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `image_url` (text)
      - `category` (enum: comics, manga, art)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `comments`
      - `id` (uuid, primary key)
      - `content` (text)
      - `post_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Seguridad
    - Enable RLS en todas las tablas
    - Políticas para usuarios autenticados
    - Políticas de lectura pública para posts y comentarios
    - Políticas de escritura solo para usuarios autenticados

  3. Storage
    - Bucket para imágenes con políticas públicas de lectura
*/

-- Create custom types
CREATE TYPE post_category AS ENUM ('comics', 'manga', 'art');

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  category post_category NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for posts updated_at
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "Anyone can read posts" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can read comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);