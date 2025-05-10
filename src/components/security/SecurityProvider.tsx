
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ContentSecurityPolicy from './ContentSecurityPolicy';
import { setupSessionTimeout, applyCSP } from '@/utils/securityUtils';
import { sessionHeartbeat } from '@/services/auth/securityService';

interface SecurityProviderProps {
  children: React.ReactNode;
}

/**
 * Provides security features to the entire application
 * - Content Security Policy
 * - Session timeout management
 * - Session heartbeat for suspicious activity detection
 */
const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  // Safely access auth context with fallback values
  const auth = useAuth();
  const user = auth?.user || null;
  const isAuthenticated = auth?.isAuthenticated || false;
  const [sessionTimeoutCleanup, setSessionTimeoutCleanup] = useState<(() => void) | null>(null);
  
  // Apply CSP only once on mount
  useEffect(() => {
    applyCSP();
  }, []);
  
  // Setup session timeout when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Setup session timeout (60 minutes)
      const cleanup = setupSessionTimeout(60);
      setSessionTimeoutCleanup(() => cleanup);
      
      // Setup heartbeat interval when user is authenticated
      const heartbeatInterval = setInterval(() => {
        if (user?.id) {
          sessionHeartbeat(user.id);
        }
      }, 5 * 60 * 1000); // Run every 5 minutes
      
      return () => {
        // Clean up both timers
        if (cleanup) cleanup();
        clearInterval(heartbeatInterval);
      };
    } else if (sessionTimeoutCleanup) {
      // Clean up timeout if user logs out
      sessionTimeoutCleanup();
      setSessionTimeoutCleanup(null);
    }
  }, [isAuthenticated, user, sessionTimeoutCleanup]);
  
  return (
    <>
      <ContentSecurityPolicy />
      {children}
    </>
  );
};

export default SecurityProvider;
