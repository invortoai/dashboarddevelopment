
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/services/supabaseClient';
import { User } from '@/types';
import { toast } from '@/components/ui/use-toast';

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

  useEffect(() => {
    const loadSession = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setIsAuthenticated(true);
          await refreshUserData();
        }
      } catch (error) {
        console.error("Error loading session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setIsAuthenticated(true);
        refreshUserData();
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const formatPhoneAsEmail = (phoneNumber: string): string => {
    // Ensure the phone number has no spaces or special characters
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    return `${cleanPhone}@phone.user`;
  };

  const signUp = async (phoneNumber: string, password: string, email: string, name: string): Promise<void> => {
    try {
      console.log("Signing up with phone number:", phoneNumber);
      // Convert phone to email format for Supabase auth
      const phoneAsEmail = formatPhoneAsEmail(phoneNumber);
      
      const { data, error } = await supabase.auth.signUp({
        email: phoneAsEmail,
        password: password,
        options: {
          data: {
            phone_number: phoneNumber,
            name: name,
          }
        }
      });

      if (error) throw error;

      console.log("Sign up response:", data);
      
      // Optionally, sign in the user immediately after signing up
      if (data.user) {
        await signIn(phoneNumber, password);
      }
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
      // Convert phone to email format for Supabase auth
      const phoneAsEmail = formatPhoneAsEmail(phoneNumber);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: phoneAsEmail,
        password: password,
      });

      if (error) {
        console.error("Sign-in error:", error.message);
        toast({
          variant: "destructive",
          title: "Sign In Failed",
          description: error.message || "Invalid credentials"
        });
        throw error;
      }

      console.log("Sign in response:", data);

      if (data.user) {
        setIsAuthenticated(true);
        await refreshUserData();
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in."
        });
      }
    } catch (error: any) {
      console.error("Sign-in failed:", error.message);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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

  const refreshUserData = async (): Promise<void> => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        console.log("Auth user found:", authUser);
        // Extract phone number from email or metadata
        const phoneNumber = authUser.user_metadata?.phone_number || 
                          authUser.email?.replace('@phone.user', '');
                          
        const { data: userDetails, error } = await supabase
          .from('user_details')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) {
          console.error("Error fetching user details:", error.message);
          throw error;
        }

        if (userDetails) {
          console.log("User details found:", userDetails);
          const userObject: User = {
            id: userDetails.id,
            name: userDetails.name,
            phoneNumber: userDetails.phone_number,
            credit: userDetails.credit,
            signupTime: userDetails.signup_time,
            lastLogin: userDetails.last_login,
          };
          setUser(userObject);
          setIsAuthenticated(true);
        } else {
          console.error("No user details found for ID:", authUser.id);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error: any) {
      console.error("Error refreshing user data:", error.message);
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
