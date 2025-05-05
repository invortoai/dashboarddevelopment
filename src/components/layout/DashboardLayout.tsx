
import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Navigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const isMobile = useIsMobile();

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
      <main className={`flex-1 p-3 md:p-6 overflow-y-auto ${isMobile ? 'pt-20' : ''}`}>
        <div className="container mx-auto max-w-7xl min-h-[calc(100vh-5rem)] pb-safe">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
