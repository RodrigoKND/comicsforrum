export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: 'comics' | 'manga' | 'art';
  user_id: string;
  user?: User;
  created_at: string;
  updated_at: string;
  comments_count?: number;
}

export interface Comment {
  id: string;
  content: string;
  post_id: string;
  user_id: string;
  user?: User;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}