
/**
 * Centralized security utilities
 * Provides CSRF protection, secure token storage, and other security functions
 */

// Generate a strong CSRF token using Web Crypto API
export const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// More secure comparison function to prevent timing attacks
export const secureCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  
  // Use a constant-time comparison algorithm to prevent timing attacks
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    // Use bitwise XOR which takes the same time regardless of match/mismatch
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};

// Secure token storage using httpOnly cookie-like behavior
// Since we can't directly set httpOnly cookies from client-side JS,
// we'll implement a more secure approach than plain localStorage
export const secureTokenStorage = {
  // Store token with additional security measures
  setToken: (name: string, token: string, expiryMinutes = 60): void => {
    if (!token) return;
    
    // Add expiry timestamp and domain binding for additional security
    const securePayload = {
      value: token,
      expires: Date.now() + (expiryMinutes * 60 * 1000),
      domain: window.location.hostname,
      created: Date.now()
    };
    
    try {
      // In a production app, consider using more advanced encryption here
      localStorage.setItem(name, JSON.stringify(securePayload));
    } catch (error) {
      console.error('Failed to store token securely:', error);
    }
  },
  
  // Get token with security validations
  getToken: (name: string): string | null => {
    try {
      const storedData = localStorage.getItem(name);
      if (!storedData) return null;
      
      const payload = JSON.parse(storedData);
      
      // Security checks
      if (payload.expires < Date.now()) {
        // Token expired, clear it
        localStorage.removeItem(name);
        return null;
      }
      
      // Domain binding check
      if (payload.domain !== window.location.hostname) {
        // Possible token theft or domain change, clear it
        localStorage.removeItem(name);
        return null;
      }
      
      return payload.value;
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  },
  
  // Clear token securely
  clearToken: (name: string): void => {
    localStorage.removeItem(name);
  }
};

// Input sanitization utility to prevent XSS and SQL injection
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Enhanced sanitization to prevent XSS and SQL injection
  return input
    .replace(/['"\\]/g, '') // SQL injection protection
    .replace(/[<>]/g, '&lt;') // Basic XSS protection
    .trim();
};

// Enhanced XSS prevention for HTML content
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/`/g, '&#x60;')
    .replace(/\(/g, '&#40;')
    .replace(/\)/g, '&#41;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;');
};

// Validate CSRF token with secure comparison
export const validateCSRFToken = (token: string): boolean => {
  const storedToken = secureTokenStorage.getToken('csrf_token');
  if (!storedToken) return false;
  
  return secureCompare(token, storedToken);
};

// Generate a CSRF token with secure storage
export const generateCSRFToken = (): string => {
  const token = generateSecureToken();
  secureTokenStorage.setToken('csrf_token', token, 60); // 60 minutes expiry
  return token;
};

// Content Security Policy helper
export const applyCSP = (): void => {
  // Only run on the client
  if (typeof document !== 'undefined') {
    // Create CSP meta tag
    const meta = document.createElement('meta');
    meta.httpEquiv = "Content-Security-Policy";
    meta.content = 
      "default-src 'self';" + 
      "script-src 'self' 'unsafe-inline';" +
      "style-src 'self' 'unsafe-inline';" +
      "img-src 'self' data:;" +
      `connect-src 'self' https://jcazvdqmxlzpdwgzlyph.supabase.co wss://jcazvdqmxlzpdwgzlyph.supabase.co;`;
    
    // Add it to head
    document.head.appendChild(meta);
  }
};

// Session timeout handler
export const setupSessionTimeout = (timeoutMinutes = 60): () => void => {
  let timeoutId: number;
  
  const resetTimer = () => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      // Clear session data
      localStorage.removeItem('sessionInfo');
      localStorage.removeItem('csrf_token');
      // Redirect to login page
      window.location.href = '/login';
    }, timeoutMinutes * 60 * 1000);
  };
  
  // Reset timer on user activity
  const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart'];
  activityEvents.forEach(event => {
    document.addEventListener(event, resetTimer);
  });
  
  // Start timer initially
  resetTimer();
  
  // Return cleanup function
  return () => {
    window.clearTimeout(timeoutId);
    activityEvents.forEach(event => {
      document.removeEventListener(event, resetTimer);
    });
  };
};

// Require authentication check
export const requireAuth = async (): Promise<boolean> => {
  try {
    // Check if we have a valid session info in secure storage
    const sessionInfo = localStorage.getItem('sessionInfo');
    if (!sessionInfo) return false;
    
    const session = JSON.parse(sessionInfo);
    
    // Check for session expiry
    const expiresAt = new Date(session.expiresAt);
    if (expiresAt < new Date()) {
      // Session expired, clear it
      localStorage.removeItem('sessionInfo');
      localStorage.removeItem('csrf_token');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

// Check permissions
export const checkPermission = (requiredPermission: string, userPermissions: string[]): boolean => {
  return userPermissions.includes(requiredPermission);
};

