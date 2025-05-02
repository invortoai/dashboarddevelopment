
import React from 'react';
import SignUpForm from '@/components/auth/SignUpForm';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const SignUpPage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen animated-bg">
        <div className="bg-card rounded-lg p-8 shadow-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full border-4 border-t-transparent border-purple animate-spin"></div>
            <p className="text-lg font-medium">Loading...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/analytics" />;
  }
  
  return <SignUpForm />;
};

export default SignUpPage;
