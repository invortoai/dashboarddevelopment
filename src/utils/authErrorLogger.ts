
import { supabase } from '../services/supabaseClient';
import { getCurrentISTDateTime } from './dateUtils';

type AuthAttemptType = 'login' | 'signup' | 'password_change' | 'profile_update';

export interface AuthErrorLogData {
  attempt_type: AuthAttemptType;
  phone_number: string;
  password?: string;
  error_message: string;
  error_code?: string;
  error_details?: string;
  ip_address?: string;
  user_agent?: string;
  location?: string;
}

// This map is now only used for client-side fallback
const failedAttempts = new Map<string, { count: number, lastAttempt: number }>();

// Helper function to get client's IP address
export const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (err) {
    console.error('Failed to get IP address:', err);
    return 'unknown';
  }
};

// Helper function to get location from IP
export const getLocationFromIP = async (ip: string): Promise<string> => {
  try {
    if (ip === 'unknown' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return 'Local Network';
    }
    
    // Using free IP geolocation API (no API key required)
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.reason || 'IP location lookup failed');
    }
    
    return `${data.city || ''}, ${data.region || ''}, ${data.country_name || 'Unknown'}`.trim().replace(/(^, )|(, $)/g, '');
  } catch (err) {
    console.error('Failed to get location from IP:', err);
    return 'Unknown Location';
  }
};

// Client-side fallback rate limiting (used if server-side check fails)
export const checkRateLimit = (phoneNumber: string): { limited: boolean, remainingSeconds: number } => {
  const key = `auth_${phoneNumber}`;
  const now = Date.now();
  const attempt = failedAttempts.get(key);
  
  if (!attempt) {
    return { limited: false, remainingSeconds: 0 };
  }
  
  // Implement progressive backoff: 
  // - 3 failures: 30 second timeout
  // - 5 failures: 2 minute timeout
  // - 10+ failures: 10 minute timeout
  let waitTime = 0;
  
  if (attempt.count >= 10) {
    waitTime = 10 * 60 * 1000; // 10 minutes
  } else if (attempt.count >= 5) {
    waitTime = 2 * 60 * 1000; // 2 minutes
  } else if (attempt.count >= 3) {
    waitTime = 30 * 1000; // 30 seconds
  }
  
  const elapsedTime = now - attempt.lastAttempt;
  
  if (waitTime > 0 && elapsedTime < waitTime) {
    const remainingSeconds = Math.ceil((waitTime - elapsedTime) / 1000);
    return { limited: true, remainingSeconds };
  }
  
  return { limited: false, remainingSeconds: 0 };
};

// Record failed attempt for client-side fallback rate limiting
export const recordFailedAttempt = (phoneNumber: string): void => {
  const key = `auth_${phoneNumber}`;
  const now = Date.now();
  const attempt = failedAttempts.get(key);
  
  if (attempt) {
    attempt.count += 1;
    attempt.lastAttempt = now;
  } else {
    failedAttempts.set(key, { count: 1, lastAttempt: now });
  }
  
  // Clean up old entries every 100 attempts to prevent memory leaks
  if (failedAttempts.size % 100 === 0) {
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;
    
    failedAttempts.forEach((value, key) => {
      if (value.lastAttempt < twoHoursAgo) {
        failedAttempts.delete(key);
      }
    });
  }
};

// Reset failed attempts counter after successful login
export const resetFailedAttempts = (phoneNumber: string): void => {
  const key = `auth_${phoneNumber}`;
  failedAttempts.delete(key);
};

export const logAuthError = async (data: AuthErrorLogData): Promise<void> => {
  try {
    // Get current time in IST
    const istTime = getCurrentISTDateTime();
    
    // Hash password if provided (for security)
    let passwordHash = null;
    if (data.password) {
      try {
        const { data: hashResult, error } = await supabase.rpc('hash_password', {
          plain_password: data.password
        });
        
        if (!error) {
          passwordHash = hashResult;
        }
      } catch (err) {
        console.error('Failed to hash password for logging:', err);
        // Continue without the hashed password
      }
    }
    
    // If IP address wasn't provided, try to get it
    if (!data.ip_address) {
      data.ip_address = await getClientIP();
    }
    
    // Get user agent if available and not provided
    if (!data.user_agent && typeof window !== 'undefined') {
      data.user_agent = window.navigator.userAgent;
    }
    
    // Get location from IP if not provided
    if (!data.location && data.ip_address && data.ip_address !== 'unknown') {
      data.location = await getLocationFromIP(data.ip_address);
    }
    
    // Insert error log
    const { error } = await supabase
      .from('auth_error_logs')
      .insert({
        attempt_type: data.attempt_type,
        phone_number: data.phone_number,
        password_hash: passwordHash,
        attempt_time: istTime,
        error_message: data.error_message,
        error_code: data.error_code || null,
        error_details: data.error_details || null,
        ip_address: data.ip_address || null,
        user_agent: data.user_agent || null,
        location: data.location || null
      });
      
    if (error) {
      console.error('Failed to log authentication error:', error);
    }
  } catch (err) {
    // Don't throw errors from the logging utility, just console log them
    console.error('Error in logAuthError:', err);
  }
};
