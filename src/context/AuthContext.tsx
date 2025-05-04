import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/services/supabaseClient';
import { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '@/types';
import { getUserProfile } from '@/services/userCredits';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Initialize auth state
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        await fetchUser(session?.user?.id);
      } else {
        setIsLoading(false);
      }
    };
    
    fetchSession();
    
    supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      
      if (session) {
        await fetchUser(session?.user?.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });
    
    // Import here to avoid circular dependencies
    const { initLoggingService } = require('../services/loggingService');
    
    // When user changes, update the logging service with the user ID
    if (user) {
      initLoggingService(user.id);
    }
  }, [user?.id]);
  
  const fetchUser = async (userId: string | undefined) => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    
    if (supabaseUser) {
      const { success, user: userProfile } = await getUserProfile(supabaseUser.id);
      
      if (success && userProfile) {
        setUser(userProfile);
      } else {
        console.error("Failed to get user profile");
        setUser(null);
      }
    } else {
      setUser(null);
    }
    
    setIsLoading(false);
  };
  
  const signUp = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      setSession(data.session);
      await fetchUser(data.user?.id);
    } catch (error: any) {
      console.error("Error signing up:", error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const signIn = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setSession(data.session);
      await fetchUser(data.user?.id);
    } catch (error: any) {
      console.error("Error signing in:", error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } catch (error: any) {
      console.error("Error signing out:", error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const refreshUserData = async (): Promise<void> => {
    if (session?.user?.id) {
      await fetchUser(session.user.id);
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, session, isLoading, signUp, signIn, signOut, refreshUserData }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
