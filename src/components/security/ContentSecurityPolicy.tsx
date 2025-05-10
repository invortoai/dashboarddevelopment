
import React, { useEffect } from 'react';

/**
 * Applies Content Security Policy dynamically to help prevent XSS attacks
 */
const ContentSecurityPolicy: React.FC = () => {
  useEffect(() => {
    // Check if we already have a CSP meta tag
    const existingCsp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCsp) return; // CSP already exists
    
    // Create CSP meta tag
    const meta = document.createElement('meta');
    meta.httpEquiv = "Content-Security-Policy";
    
    // Configure CSP directives
    meta.content = [
      // Only allow scripts from same origin
      "script-src 'self' 'unsafe-inline'",
      
      // Only allow stylesheets from same origin
      "style-src 'self' 'unsafe-inline'",
      
      // Restrict where resources can be loaded from
      "default-src 'self'",
      
      // Allow images from own origin and data URIs (for base64)
      "img-src 'self' data:",
      
      // Allow connections to Supabase
      `connect-src 'self' https://jcazvdqmxlzpdwgzlyph.supabase.co wss://jcazvdqmxlzpdwgzlyph.supabase.co`,
      
      // Disable inline eval for extra security
      "script-src-attr 'none'",
      
      // Restrict form submissions to same origin
      "form-action 'self'",
      
      // Block all <object>, <embed>, and <applet> elements
      "object-src 'none'",
      
      // Frame ancestors (who can embed this site)
      "frame-ancestors 'self'",
      
      // Block use of <base> to change base URL
      "base-uri 'self'"
    ].join('; ');
    
    // Add it to head
    document.head.appendChild(meta);
    
    // Remove on cleanup
    return () => {
      const cspTag = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (cspTag) {
        document.head.removeChild(cspTag);
      }
    };
  }, []);
  
  // This component doesn't render anything
  return null;
};

export default ContentSecurityPolicy;
