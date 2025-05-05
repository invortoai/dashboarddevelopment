
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { User } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { signUp as serviceSignUp, login as serviceLogin, logout as serviceLogout, getUserDetails } from '@/services/authService';
import { supabase } from '@/services/supabaseClient';

interface AuthContextProps {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (phoneNumber: string, password: string, email: string, name: string) => Promise<void>;
  signIn: (phoneNumber: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Make refreshUserData available via useCallback so it can be dependency in useEffect
  const refreshUserData = useCallback(async (userId?: string): Promise<void> => {
    try {
      const id = userId || user?.id || localStorage.getItem('userId');
      
      if (!id) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      console.log("Refreshing user data for ID:", id);
      const { success, user: userData } = await getUserDetails(id);

      if (success && userData) {
        console.log("User data refreshed successfully:", userData);
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        console.warn("Failed to refresh user data, clearing auth state");
        // If we couldn't get the user, clear authentication state
        localStorage.removeItem('userId');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error: any) {
      console.error("Error refreshing user data:", error.message);
      // On error, clear authentication state
      localStorage.removeItem('userId');
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [user?.id]);

  useEffect(() => {
    // Check if there's a user ID stored in local storage
    const storedUserId = localStorage.getItem('userId');
    
    if (storedUserId) {
      console.log("Found stored user ID, refreshing user data:", storedUserId);
      // If there's a stored user ID, fetch user details
      refreshUserData(storedUserId)
        .then(() => {
          setIsAuthenticated(true);
        })
        .catch(error => {
          console.error("Error refreshing user data:", error);
          // Clear invalid stored user ID
          localStorage.removeItem('userId');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      console.log("No stored user ID found, setting not authenticated");
      setIsLoading(false);
    }
  }, [refreshUserData]);

  const signUp = async (phoneNumber: string, password: string, email: string, name: string): Promise<void> => {
    try {
      console.log("Signing up with phone number:", phoneNumber);
      
      const { success, message, user: newUser } = await serviceSignUp(name, phoneNumber, password);

      if (!success || !newUser) {
        throw new Error(message);
      }

      console.log("Sign up response:", newUser);
      
      // Store the user ID for future sessions
      localStorage.setItem('userId', newUser.id);
      
      // Set the user in state
      setUser(newUser);
      setIsAuthenticated(true);
      
      toast({
        title: "Account created!",
        description: "Your account has been created successfully."
      });
    } catch (error: any) {
      console.error("Sign up failed:", error.message);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message || "Failed to create account"
      });
      throw error;
    }
  };

  const signIn = async (phoneNumber: string, password: string): Promise<void> => {
    try {
      console.log("Signing in with phone number:", phoneNumber);
      
      const { success, message, user: userData } = await serviceLogin(phoneNumber, password);

      if (!success || !userData) {
        throw new Error(message || "Invalid credentials");
      }

      console.log("Sign in response:", userData);

      // Store the user ID for future sessions
      localStorage.setItem('userId', userData.id);
      
      // Set the user in state
      setUser(userData);
      setIsAuthenticated(true);
      
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in."
      });
    } catch (error: any) {
      console.error("Sign-in failed:", error.message);
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error.message || "Invalid credentials"
      });
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      if (user) {
        const { success, message } = await serviceLogout(user.id);
        if (!success) {
          throw new Error(message);
        }
      }
      
      // Clear stored user ID
      localStorage.removeItem('userId');
      
      setIsAuthenticated(false);
      setUser(null);
      
      toast({
        title: "Signed out",
        description: "You've been successfully signed out."
      });
    } catch (error: any) {
      console.error("Sign-out error:", error.message);
      toast({
        variant: "destructive",
        title: "Sign Out Failed",
        description: error.message || "Failed to sign out"
      });
    }
  };

  const refreshUserData = async (userId?: string): Promise<void> => {
    try {
      const id = userId || user?.id || localStorage.getItem('userId');
      
      if (!id) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const { success, user: userData } = await getUserDetails(id);

      if (success && userData) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        // If we couldn't get the user, clear authentication state
        localStorage.removeItem('userId');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error: any) {
      console.error("Error refreshing user data:", error.message);
      // On error, clear authentication state
      localStorage.removeItem('userId');
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const value: AuthContextProps = {
    user,
    isAuthenticated,
    isLoading,
    signUp,
    signIn,
    signOut,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
