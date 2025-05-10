
import { supabase } from '../supabaseClient';
import { secureTokenStorage, generateCSRFToken } from '@/utils/securityUtils';
import { getCurrentISTDateTime } from '../../utils/dateUtils';

/**
 * Enhanced security service for managing all security-related functionality
 */

// Safely create a session and store it securely
export const createSecureSession = async (userId: string, expiryHours = 24): Promise<boolean> => {
  try {
    // Generate CSRF token for enhanced protection
    const csrfToken = generateCSRFToken();

    // Get the session token for improved session management
    const session = {
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString(),
      csrfToken
    };
    
    // Store session info in localStorage with secure flags
    localStorage.setItem('sessionInfo', JSON.stringify(session));
    
    // Record session creation activity
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: 'session_created',
      timestamp: getCurrentISTDateTime(),
    });
    
    return true;
  } catch (error) {
    console.error('Error creating secure session:', error);
    return false;
  }
};

// Secure logout with comprehensive cleanup
export const secureLogout = async (userId: string): Promise<boolean> => {
  try {
    // First, log activity
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: 'logout',
      timestamp: getCurrentISTDateTime(),
    });
    
    // Clear all security-related storage items
    localStorage.removeItem('sessionInfo');
    localStorage.removeItem('csrf_token');
    
    // Clear any other cached user data for security
    localStorage.removeItem('userProfile');
    sessionStorage.clear();
    
    // Attempt to clear any persistence in supabase auth
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (e) {
      console.log('No Supabase auth to clear');
    }
    
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    
    // Even if server-side logout fails, ensure client storage is cleared
    localStorage.removeItem('sessionInfo');
    localStorage.removeItem('csrf_token');
    localStorage.removeItem('userProfile');
    sessionStorage.clear();
    
    return false;
  }
};

// Validate current session security
export const validateSession = async (): Promise<boolean> => {
  try {
    // Retrieve session
    const sessionData = localStorage.getItem('sessionInfo');
    if (!sessionData) return false;
    
    const session = JSON.parse(sessionData);
    
    // Check expiry
    const expiresAt = new Date(session.expiresAt);
    if (expiresAt <= new Date()) {
      // Clean up expired session
      await secureLogout(session.userId);
      return false;
    }
    
    // Check if CSRF token exists
    if (!secureTokenStorage.getToken('csrf_token')) {
      await secureLogout(session.userId);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
};

// Implement session heartbeat to detect suspicious activity
export const sessionHeartbeat = async (userId: string, clientIP?: string): Promise<void> => {
  try {
    // Check if last heartbeat was too recent (prevent unnecessary DB calls)
    const lastHeartbeat = localStorage.getItem('lastHeartbeat');
    if (lastHeartbeat && (Date.now() - parseInt(lastHeartbeat)) < 5 * 60 * 1000) {
      return; // Skip if last heartbeat was less than 5 minutes ago
    }
    
    // Record heartbeat
    localStorage.setItem('lastHeartbeat', Date.now().toString());
    
    // Get current IP info
    let currentIP = clientIP;
    if (!currentIP) {
      try {
        const resp = await fetch('https://api.ipify.org?format=json');
        const data = await resp.json();
        currentIP = data.ip;
      } catch (e) {
        console.log('Could not fetch IP for heartbeat verification');
      }
    }
    
    // Get stored IP from session
    const sessionData = localStorage.getItem('sessionInfo');
    if (!sessionData) return;
    
    const session = JSON.parse(sessionData);
    
    // If we have an IP stored and it's different, that's suspicious
    if (session.ip && currentIP && session.ip !== currentIP) {
      // Log the suspicious activity
      await supabase.from('user_activity').insert({
        user_id: userId,
        activity_type: 'suspicious_ip_change',
        timestamp: getCurrentISTDateTime(),
      });
      
      console.warn('Suspicious IP change detected');
    }
    
    // Update session with current IP
    if (currentIP) {
      session.ip = currentIP;
      localStorage.setItem('sessionInfo', JSON.stringify(session));
    }
  } catch (error) {
    console.error('Error during session heartbeat:', error);
  }
};

// Enhance the password service with security-specific features
export const enforcePasswordComplexity = (password: string): { 
  valid: boolean;
  errors: string[];
} => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must include at least one number');
  }
  
  if (!/[\^$*.[\]{}()?\-"!@#%&/,><':;|_~`]/.test(password)) {
    errors.push('Password must include at least one special character');
  }
  
  // Check for common passwords
  const commonPasswords = ['password', 'admin123', '123456789', 'qwerty123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a more secure password');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Detect and protect against brute force attempts
export const detectBruteForce = async (
  phoneNumber: string,
  attemptType: string = 'login'
): Promise<{ limited: boolean; waitTimeSeconds: number }> => {
  try {
    // Get recent attempts
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentAttempts, error } = await supabase
      .from('auth_error_logs')
      .select('attempt_time')
      .eq('phone_number', phoneNumber)
      .eq('attempt_type', attemptType)
      .gte('attempt_time', hourAgo)
      .order('attempt_time', { ascending: false });
    
    if (error || !recentAttempts) {
      console.error('Error checking for brute force attempts:', error);
      return { limited: false, waitTimeSeconds: 0 };
    }
    
    // Progressive backoff strategy
    if (recentAttempts.length >= 10) {
      return { limited: true, waitTimeSeconds: 3600 }; // 1 hour
    } else if (recentAttempts.length >= 5) {
      return { limited: true, waitTimeSeconds: 300 }; // 5 minutes
    } else if (recentAttempts.length >= 3) {
      return { limited: true, waitTimeSeconds: 60 }; // 1 minute
    }
    
    return { limited: false, waitTimeSeconds: 0 };
  } catch (error) {
    console.error('Error in brute force detection:', error);
    return { limited: false, waitTimeSeconds: 0 };
  }
};

// Create secure HTTP headers for use in fetch requests
export const createSecureHeaders = (): HeadersInit => {
  const csrfToken = secureTokenStorage.getToken('csrf_token') || '';
  
  return {
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  };
};

