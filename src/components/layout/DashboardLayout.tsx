
import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Navigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  // Wrap the useAuth call in a try/catch to avoid crashing the app
  // if AuthProvider is not available
  let isAuthenticated = false;
  let isLoading = true;
  let authError = false;
  
  try {
    const auth = useAuth();
    isAuthenticated = auth.isAuthenticated;
    isLoading = auth.isLoading;
  } catch (error) {
    console.error("Auth context not available:", error);
    authError = true;
  }
  
  const isMobile = useIsMobile();

  // If we couldn't access the auth context, redirect to login
  if (authError) {
    return <Navigate to="/login" />;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen animated-bg">
        <div className="bg-card rounded-lg p-4 md:p-8 shadow-lg w-full max-w-md mx-auto">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full border-4 border-t-transparent border-purple animate-spin"></div>
            <p className="text-lg font-medium">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Navbar />
      <main className={`flex-1 overflow-y-auto p-3 md:p-6 ${isMobile ? 'pt-20' : ''}`}>
        <div className="container mx-auto max-w-7xl min-h-[calc(100vh-5rem)] pb-safe">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
