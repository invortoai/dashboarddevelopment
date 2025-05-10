
// Export all auth service functions from their respective files
export { signUp, login, logout, checkPhoneExists } from './authenticationService';
export { updateUserProfile, getUserDetails, getUserLoginHistory } from './userProfileService';
export { changePassword } from './passwordService';

// Export security helpers from our new security utilities
export { 
  sanitizeInput, 
  requireAuth, 
  secureCompare, 
  validateCSRFToken, 
  generateCSRFToken 
} from '@/utils/securityUtils';
