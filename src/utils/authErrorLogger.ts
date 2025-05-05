
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

export const logAuthError = async (data: AuthErrorLogData): Promise<void> => {
  try {
    // Get current time in IST
    const istTime = getCurrentISTDateTime();
    
    // Hash password if provided (for security)
    let passwordHash = null;
    if (data.password) {
      const { data: hashResult } = await supabase.rpc('hash_password', {
        plain_password: data.password
      });
      passwordHash = hashResult;
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
