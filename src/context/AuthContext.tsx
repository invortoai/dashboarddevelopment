import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { User } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { 
  signUp as serviceSignUp, 
  login as serviceLogin, 
  logout as serviceLogout, 
  getUserDetails 
} from '@/services/auth';
import { supabase } from '@/services/supabaseClient';
import { 
  resetFailedAttempts
} from '@/utils/authErrorLogger';

interface AuthContextProps {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (name: string, phoneNumber: string, password: string, clientIP?: string | null, clientLocation?: string | null) => Promise<void>;
  signIn: (phoneNumber: string, password: string, clientIP?: string | null, clientLocation?: string | null) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

interface SessionInfo {
  userId: string;
  createdAt: string;
  expiresAt: string;
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
        localStorage.removeItem('sessionInfo');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error: any) {
      console.error("Error refreshing user data:", error.message);
      // On error, clear authentication state
      localStorage.removeItem('userId');
      localStorage.removeItem('sessionInfo');
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [user?.id]);

  // Check session validity
  const checkSession = useCallback(() => {
    const sessionInfoStr = localStorage.getItem('sessionInfo');
    
    if (!sessionInfoStr) return false;
    
    try {
      const sessionInfo: SessionInfo = JSON.parse(sessionInfoStr);
      const now = new Date();
      const expiresAt = new Date(sessionInfo.expiresAt);
      
      // Check if session has expired
      if (now > expiresAt) {
        console.log("Session expired");
        localStorage.removeItem('userId');
        localStorage.removeItem('sessionInfo');
        return false;
      }
      
      // Session is valid, but if it's close to expiring (within 1 hour), extend it
      if (expiresAt.getTime() - now.getTime() < 60 * 60 * 1000) {
        console.log("Extending session");
        const newExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
        const updatedSessionInfo = {
          ...sessionInfo,
          expiresAt: newExpiresAt.toISOString()
        };
        localStorage.setItem('sessionInfo', JSON.stringify(updatedSessionInfo));
      }
      
      return true;
    } catch (e) {
      console.error("Error parsing session info:", e);
      return false;
    }
  }, []);

  useEffect(() => {
    // Check if there's a valid session
    const isValid = checkSession();
    
    if (isValid) {
      // Get user ID from session
      const sessionInfoStr = localStorage.getItem('sessionInfo');
      if (sessionInfoStr) {
        const sessionInfo: SessionInfo = JSON.parse(sessionInfoStr);
        const storedUserId = sessionInfo.userId;
        
        console.log("Found valid session for user ID:", storedUserId);
        // If there's a stored user ID, fetch user details
        refreshUserData(storedUserId)
          .then(() => {
            setIsAuthenticated(true);
          })
          .catch(error => {
            console.error("Error refreshing user data:", error);
            // Clear invalid stored session
            localStorage.removeItem('userId');
            localStorage.removeItem('sessionInfo');
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    } else {
      console.log("No valid session found, setting not authenticated");
      setIsLoading(false);
    }
  }, [refreshUserData, checkSession]);

  // Security enhancement: Implement session timeout
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Automatically log out after 24 hours of inactivity
    const inactivityTimeout = 24 * 60 * 60 * 1000; // 24 hours in ms
    let logoutTimer: NodeJS.Timeout;
    
    const resetTimer = () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      logoutTimer = setTimeout(() => {
        console.log("Session expired due to inactivity");
        signOut();
        toast({
          title: "Session Expired",
          description: "You've been logged out due to inactivity",
          variant: "warning"
        });
      }, inactivityTimeout);
    };
    
    // Set initial timer
    resetTimer();
    
    // Reset timer on user activity
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    const activityHandler = () => resetTimer();
    
    events.forEach(event => {
      window.addEventListener(event, activityHandler);
    });
    
    return () => {
      // Clean up
      if (logoutTimer) clearTimeout(logoutTimer);
      events.forEach(event => {
        window.removeEventListener(event, activityHandler);
      });
    };
  }, [isAuthenticated]);

  // Updated signUp function with correctly ordered parameters
  const signUp = async (name: string, phoneNumber: string, password: string, clientIP?: string | null, clientLocation?: string | null): Promise<void> => {
    try {
      console.log("Signing up with phone number:", phoneNumber);
      
      const { success, message, user: newUser } = await serviceSignUp(name, phoneNumber, password, clientIP, clientLocation);

      if (!success || !newUser) {
        throw new Error(message);
      }

      console.log("Sign up response:", newUser);
      
      // Store the user ID for future sessions
      localStorage.setItem('userId', newUser.id);
      
      // Create session info
      const sessionInfo: SessionInfo = {
        userId: newUser.id,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };
      
      localStorage.setItem('sessionInfo', JSON.stringify(sessionInfo));
      
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

  const signIn = async (phoneNumber: string, password: string, clientIP?: string | null, clientLocation?: string | null): Promise<void> => {
    try {
      console.log("Signing in with phone number:", phoneNumber);
      
      const { success, message, user: userData } = await serviceLogin(phoneNumber, password, clientIP, clientLocation);

      if (!success || !userData) {
        throw new Error(message || "Invalid credentials");
      }

      console.log("Sign in response:", userData);

      // Reset failed attempts on successful login
      resetFailedAttempts(phoneNumber);

      // Store the user ID for future sessions
      localStorage.setItem('userId', userData.id);
      
      // Session info is now stored in the login function
      
      // Set the user in state
      setUser(userData);
      setIsAuthenticated(true);
      
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in."
      });
    } catch (error: any) {
      console.error("Sign-in failed:", error.message);
      
      // Show only one toast message here and let the error propagate to the form
      // for display in the form's error state
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error.message || "Invalid credentials"
      });
      
      // Re-throw the error so the form component can set its error state
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
      localStorage.removeItem('sessionInfo');
      
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
      {children}
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
