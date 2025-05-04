
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/services/supabaseClient';
import { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '@/types';
import { getUserProfile } from '@/services/userCredits';
import { login as customLogin, logout as customLogout } from '@/services/authService';
// Import the logging service directly
import { initLoggingService } from '../services/loggingService';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (phoneNumber: string, password: string) => Promise<void>;
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
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log("Auth state changed:", event, session?.user?.id);
      setSession(session);
      
      if (session) {
        await fetchUser(session?.user?.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });
    
    // When user changes, update the logging service with the user ID
    if (user) {
      initLoggingService(user.id);
    }
    
    return () => {
      subscription.unsubscribe();
    };
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
  
  const signIn = async (phoneNumber: string, password: string): Promise<void> => {
    setIsLoading(true);
    console.info("Attempting login with phone:", phoneNumber);
    try {
      // Use custom login service for phone authentication
      const { success, message, user: loggedInUser } = await customLogin(phoneNumber, password);
      
      if (!success || !loggedInUser) {
        throw new Error(message || "Invalid login credentials");
      }
      
      // Set user directly from custom auth service
      setUser(loggedInUser);
      
      // Create a mock session since we're using custom auth
      const mockSession = {
        access_token: "custom_auth_token",
        user: { id: loggedInUser.id }
      } as unknown as Session;
      
      setSession(mockSession);
      initLoggingService(loggedInUser.id);
      console.log("Login successful, user set:", loggedInUser.id);
      
    } catch (error: any) {
      console.error("Error signing in:", error.message);
      throw error; // Rethrow to allow form to handle the error
    } finally {
      setIsLoading(false);
    }
  };
  
  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (user) {
        await customLogout(user.id);
      }
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
    if (user?.id) {
      const { success, user: refreshedUser } = await getUserProfile(user.id);
      if (success && refreshedUser) {
        setUser(refreshedUser);
      }
    }
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      isAuthenticated: !!user, // Use user presence instead of session for custom auth
      signUp, 
      signIn, 
      signOut, 
      refreshUserData 
    }}>
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
