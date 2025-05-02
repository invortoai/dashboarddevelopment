
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthState, User } from '../types';
import { getUserDetails, login, logout as logoutService, signUp as signUpService } from '../services/authService';
import { useToast } from '../hooks/use-toast';

interface AuthContextType extends AuthState {
  signUp: (name: string, phoneNumber: string, password: string) => Promise<boolean>;
  login: (phoneNumber: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is stored in localStorage on app load
    const checkAuth = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData) as User;
          
          // Verify the user still exists in the database
          const { success, user: latestUserData } = await getUserDetails(user.id);
          
          if (success && latestUserData) {
            setState({
              user: latestUserData,
              isAuthenticated: true,
            });
          } else {
            // User not found in DB or other error, clear localStorage
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signUp = async (name: string, phoneNumber: string, password: string) => {
    setLoading(true);
    try {
      const { success, message, user } = await signUpService(name, phoneNumber, password);
      
      if (success && user) {
        setState({
          user,
          isAuthenticated: true,
        });
        
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/dashboard');
        toast({
          title: "Signup successful",
          description: "Welcome to the app!",
        });
        return true;
      } else {
        toast({
          title: "Signup failed",
          description: message,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: "Signup failed",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (phoneNumber: string, password: string) => {
    setLoading(true);
    try {
      const { success, message, user } = await login(phoneNumber, password);
      
      if (success && user) {
        setState({
          user,
          isAuthenticated: true,
        });
        
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/dashboard');
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        return true;
      } else {
        toast({
          title: "Login failed",
          description: message,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (state.user) {
      try {
        await logoutService(state.user.id);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    setState({
      user: null,
      isAuthenticated: false,
    });
    
    localStorage.removeItem('user');
    navigate('/login');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signUp,
        login: loginUser,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
