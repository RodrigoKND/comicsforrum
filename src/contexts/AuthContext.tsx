import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, AuthContextType } from '../types';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (mounted) {
        if (session?.user) {
          await fetchUserProfile(session.user);
        }
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        (async () => {
          if (mounted) {
            if (session?.user) {
              await fetchUserProfile(session.user);
            } else {
              setUser(null);
            }
          }
        })();
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (authUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, created_at')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      // Show immediate feedback
      toast.loading('Creando tu cuenta...', { id: 'signup' });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data?.user?.id,
            username,
            email: data?.user?.email,
            avatar_url: null
          },
        ]);

      if (profileError) throw profileError;


      toast.dismiss('signup');
      toast.success('¡Cuenta creada exitosamente!');
    } catch (error) {
      toast.dismiss('signup');
      const errorMessage =
        error instanceof Error ? error.message : 'Error al crear la cuenta';
      toast.error(errorMessage);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      toast.loading('Iniciando sesión...', { id: 'signin' });

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.dismiss('signin');
      toast.success('¡Bienvenido de vuelta!');
    } catch (error) {
      toast.dismiss('signin');
      const errorMessage =
        error instanceof Error ? error.message : 'Error al iniciar sesión';
      toast.error(errorMessage);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al cerrar sesión';
      toast.error(errorMessage);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};