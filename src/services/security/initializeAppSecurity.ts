
import { applyCSP, setupSessionTimeout } from '@/utils/securityUtils';
import { validateDatabaseSecurity } from '../database/securityMigrations';

/**
 * Initializes all security features for the application
 * This should be called once on application startup
 */
export const initializeAppSecurity = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Apply Content Security Policy
    if (typeof window !== 'undefined') {
      applyCSP();
    }
    
    // Validate database security structure
    const isDbSecure = await validateDatabaseSecurity();
    if (!isDbSecure) {
      console.warn('Database security validation failed - some security features may not work correctly');
    }
    
    // Check for secure context (HTTPS)
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && 
        !window.location.hostname.includes('localhost') && 
        !window.location.hostname.includes('127.0.0.1')) {
      console.warn('Application is not running in a secure context (HTTPS) - security features may be limited');
    }
    
    // Successfully initialized security features
    return { 
      success: true, 
      message: 'Security features initialized successfully' 
    };
  } catch (error) {
    console.error('Failed to initialize security features:', error);
    return { 
      success: false, 
      message: 'Failed to initialize security features' 
    };
  }
};
