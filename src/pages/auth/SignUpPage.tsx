
import React from 'react';
import SignUpForm from '@/components/auth/SignUpForm';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from "lucide-react";

const SignUpPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  // Get the intended destination from location state, or default to analytics
  const from = location.state?.from?.pathname || '/analytics';
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen animated-bg">
        <div className="bg-card rounded-lg p-8 shadow-lg">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-purple" />
            <p className="text-lg font-medium">Loading...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    // Redirect to the page they were trying to access, or analytics by default
    return <Navigate to={from} replace />;
  }
  
  return <SignUpForm />;
};

export default SignUpPage;
