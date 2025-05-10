
// Export all auth service functions from their respective files
export { signUp, login, logout, checkPhoneExists } from './authenticationService';
export { updateUserProfile, getUserDetails, getUserLoginHistory } from './userProfileService';
export { changePassword } from './passwordService';
export { 
  createSecureSession, 
  secureLogout, 
  validateSession,
  sessionHeartbeat,
  enforcePasswordComplexity,
  detectBruteForce,
  createSecureHeaders 
} from './securityService';

// Export security helpers from our new security utilities
export { 
  sanitizeInput, 
  validateCSRFToken, 
  secureCompare, 
  generateCSRFToken,
  requireAuth,
  sanitizeHtml,
  applyCSP,
  setupSessionTimeout,
  checkPermission
} from '@/utils/securityUtils';
