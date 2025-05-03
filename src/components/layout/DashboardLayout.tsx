
import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading state
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

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
    </div>
  );
};

export default DashboardLayout;
