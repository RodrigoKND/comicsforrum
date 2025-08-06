import { supabase } from '../lib/supabase';
import { Post } from '../types';

export const postService = {
  async getPosts(category?: string): Promise<Post[]> {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          user:users(id, username, avatar_url),
          comments_count:comments(count)
        `)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(post => ({
        ...post,
        comments_count: post.comments_count?.[0]?.count || 0
      })) || [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },

  async getPostById(id: string): Promise<Post | null> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(id, username, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  },

  async createPost(post: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'user'>): Promise<Post> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([post])
        .select(`
          *,
          user:users(id, username, avatar_url)
        `)
        .single();

      if (error) {
        console.log(error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  async uploadImage(file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  async getRecommendations(postId: string, category: string): Promise<Post[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(id, username, avatar_url)
        `)
        .eq('category', category)
        .neq('id', postId)
        .limit(6)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  }
};