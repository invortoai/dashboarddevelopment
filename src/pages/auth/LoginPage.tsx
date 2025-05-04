
import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoginForm from '@/components/auth/LoginForm';

const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Additional useEffect to ensure redirect happens
  useEffect(() => {
    if (isAuthenticated) {
      console.log("LoginPage: User is authenticated, redirecting to analytics");
      navigate('/analytics', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Immediate redirect if already authenticated
  if (isAuthenticated) {
    console.log("LoginPage: Initial check - user is authenticated, redirecting to analytics");
    return <Navigate to="/analytics" />;
  }

  return <LoginForm />;
};

export default LoginPage;
