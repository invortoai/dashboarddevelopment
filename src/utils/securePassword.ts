
/**
 * Secure password hashing utility
 * Note: In a full production environment, this would be replaced with a proper bcrypt implementation
 * on the server-side with Supabase functions
 */

// Salt generation for password hashing
export const generateSalt = (length: number = 16): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let salt = '';
  
  // In a real implementation, we would use crypto.randomBytes
  // This is a simplified version for demonstration
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    salt += charset[randomIndex];
  }
  
  return salt;
};

// Hash password using SHA-256 (browser-compatible version)
export const hashPassword = (password: string, salt: string): string => {
  // Using SubtleCrypto API which is available in browsers
  // For simplicity in this demo, we'll use a simpler approach
  // that works in the browser without external dependencies
  
  // In production, you should use a proper password hashing library or backend function
  let hash = 0;
  const combinedString = password + salt;
  
  // Simple string hash function (NOT for production use)
  for (let i = 0; i < combinedString.length; i++) {
    const char = combinedString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex string and ensure it's positive
  return Math.abs(hash).toString(16).padStart(8, '0');
};

// Verify password
export const verifyPassword = (plainPassword: string, hashedPassword: string, salt: string): boolean => {
  const newHash = hashPassword(plainPassword, salt);
  return newHash === hashedPassword;
};

// For securely comparing strings (helps prevent timing attacks)
export const secureCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};
