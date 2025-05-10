
/**
 * Security headers utility to enhance application security
 * These headers can be applied programmatically in React Router 
 * or by the hosting platform like Vercel, Netlify, etc.
 */

// Security headers to apply to responses
export const securityHeaders = {
  // Prevent site being opened in iframes (clickjacking protection)
  'X-Frame-Options': 'DENY',
  
  // Enable browser XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Referrer policy to control information sent in requests
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Strict transport security (HTTPS enforcement)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  
  // Permissions policy to limit browser features
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  
  // Content security policy (should be set via meta tag for client-side apps)
  // Set a fallback policy here for SSR or server-configured systems
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self' https://jcazvdqmxlzpdwgzlyph.supabase.co wss://jcazvdqmxlzpdwgzlyph.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ')
};

// Apply these headers to fetch requests
export const addSecurityHeadersToFetch = (headers: Record<string, string> = {}): Record<string, string> => {
  return {
    ...headers,
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
  };
};

// For frameworks that support middleware (like Next.js)
export const applySecurityHeaders = (response: Response): Response => {
  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
};
