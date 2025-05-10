
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileNavbar from './navbar/MobileNavbar';
import DesktopNavbar from './navbar/DesktopNavbar';

/**
 * Main Navbar component that conditionally renders either the mobile or desktop navbar
 * based on the viewport size
 */
const Navbar: React.FC = () => {
  // Wrap the useAuth call in a try/catch to avoid crashing the app
  let signOut = () => {
    console.warn("Auth context not available for logout");
    // Fallback: redirect to login page
    window.location.href = '/login';
  };
  
  try {
    const auth = useAuth();
    signOut = auth.signOut;
  } catch (error) {
    console.error("Auth context not available in Navbar:", error);
  }
  
  const isMobile = useIsMobile();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Perform logout with slight delay to ensure UI updates first
    setTimeout(() => {
      signOut();
    }, 100);
  };

  // Render either mobile or desktop navbar based on viewport
  return isMobile ? (
    <MobileNavbar handleLogout={handleLogout} />
  ) : (
    <DesktopNavbar handleLogout={handleLogout} />
  );
};

export default Navbar;
