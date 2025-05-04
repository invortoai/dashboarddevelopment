
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
      console.log("LoginPage useEffect: User is authenticated, redirecting to analytics");
      // Force a hard redirect
      window.location.href = '/analytics';
    }
  }, [isAuthenticated, navigate]);

  // Immediate redirect if already authenticated
  if (isAuthenticated) {
    console.log("LoginPage: Initial check - user is authenticated, redirecting to analytics");
    // Use window.location for a hard redirect instead of React Router
    window.location.href = '/analytics';
    return null; // Return null while redirecting
  }

  return <LoginForm />;
};

export default LoginPage;
