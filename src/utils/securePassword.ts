
/**
 * Secure password hashing utility
 * Uses the Web Crypto API for more secure password handling
 */

// Generate a cryptographically strong salt
export const generateSalt = async (length: number = 16): Promise<string> => {
  // Use Web Crypto API to generate random bytes for salt
  const buffer = new Uint8Array(length);
  window.crypto.getRandomValues(buffer);
  
  // Convert to base64 string for storage
  return btoa(String.fromCharCode.apply(null, [...buffer]));
};

// Hash password using SHA-256 with salt (more secure than the previous implementation)
export const hashPassword = async (password: string, salt: string): Promise<string> => {
  // Combine password and salt
  const combinedString = password + salt;
  
  // Convert to buffer
  const msgBuffer = new TextEncoder().encode(combinedString);
  
  // Use Web Crypto API to create a secure hash
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Return salt:hash format for more secure storage
  return `${salt}:${hashHex}`;
};

// Verify password by comparing hashes
export const verifyPassword = async (
  plainPassword: string, 
  storedValue: string
): Promise<boolean> => {
  // Check if we're using the new format with explicit salt
  if (storedValue.includes(':')) {
    // New format: salt:hash
    const [salt, storedHash] = storedValue.split(':');
    
    // Generate hash with the provided salt
    const combinedString = plainPassword + salt;
    const msgBuffer = new TextEncoder().encode(combinedString);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const newHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Compare hashes
    return secureCompare(newHash, storedHash);
  } 
  
  // Legacy format - the whole string is the hash (hash already includes the salt)
  // Generate hash using empty salt and compare directly
  const newHash = await hashPassword(plainPassword, "");
  return secureCompare(newHash.split(':')[1], storedValue);
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
