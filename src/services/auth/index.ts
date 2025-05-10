
// Export all auth service functions from their respective files
export { signUp, login, logout, checkPhoneExists } from './authenticationService';
export { updateUserProfile, getUserDetails, getUserLoginHistory } from './userProfileService';
export { changePassword } from './passwordService';

// Export security helpers
export { sanitizeInput, requireAuth } from '../supabaseClient';
