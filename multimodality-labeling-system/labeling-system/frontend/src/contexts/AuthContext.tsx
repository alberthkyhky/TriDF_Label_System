// AuthContext with fast fallback and shorter timeout
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserProfile = async (userId: string, userEmail?: string, userMetadata?: any) => {
    
    try {
      setLoading(true);
      
      // Import api here to avoid circular dependency
      const { api } = await import('../services/api');
      
      const profile = await api.getUserProfile();
      
      setUser(profile);
    } catch (error) {
      console.error('Error details:', error);
      
      // Create intelligent fallback profile
      const fallbackProfile: UserProfile = {
        id: userId,
        email: userEmail || '',
        full_name: userMetadata?.full_name || getSmartName(userEmail),
        role: getSmartRole(userEmail),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setUser(fallbackProfile);
    } finally {
      setLoading(false);
    }
  };

  const getSmartName = (email?: string): string => {
    if (!email) return 'Demo User';
    if (email.includes('admin')) return 'System Administrator';
    if (email.includes('labeler')) return 'Demo Labeler'; 
    if (email.includes('reviewer')) return 'Demo Reviewer';
    
    // Extract name from email
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const getSmartRole = (email?: string): 'admin' | 'labeler' | 'reviewer' => {
    if (!email) return 'labeler';
    if (email.includes('admin')) return 'admin';
    if (email.includes('reviewer')) return 'reviewer';
    return 'labeler';
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        setLoading(false);
        throw error;
      }
      
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      
      if (error) {
        setLoading(false);
        throw error;
      }
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    localStorage.clear();
    if (error) throw error;
  }, []);

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      // Import api here to avoid circular dependency
      const { api } = await import('../services/api');
      const updatedProfile = await api.updateUserProfile(data);
      
      setUser({ ...user, ...updatedProfile });
    } catch (error) {
      // Still update local state
      setUser({ ...user, ...data });
    }
  }, [user]);

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile
  };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};