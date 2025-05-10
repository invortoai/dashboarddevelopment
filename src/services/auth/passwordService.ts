
import { supabase } from '../supabaseClient';
import { checkColumnExistsFallback } from '../supabaseClient';
import { getCurrentISTDateTime } from '../../utils/dateUtils';
import { logAuthError } from '../../utils/authErrorLogger';
import { hashPassword, generateSalt, verifyPassword } from '../../utils/securePassword';
import { sanitizeInput } from '@/utils/securityUtils';
import { detectBruteForce } from './securityService';

export const changePassword = async (userId: string, currentPassword: string, newPassword: string, clientIP?: string, clientLocation?: string): Promise<{ success: boolean; message: string }> => {
  try {
    // First get the user record to verify the current password
    const { data: user, error: getUserError } = await supabase
      .from('user_details')
      .select('id, phone_number, password_salt')
      .eq('id', userId)
      .single();
    
    if (getUserError || !user) {
      return { success: false, message: 'User not found' };
    }

    // Check for brute force attempts
    if (user.phone_number) {
      const bruteForceCheck = await detectBruteForce(user.phone_number, 'password_change');
      if (bruteForceCheck.limited) {
        return { 
          success: false, 
          message: `Too many failed attempts. Please try again after ${Math.ceil(bruteForceCheck.waitTimeSeconds / 60)} minutes.` 
        };
      }
    }

    // Verify using the stored password in password_salt field
    let isPasswordValid = false;
    
    try {
      if (user.password_salt) {
        // Use the password_salt field for verification
        isPasswordValid = await verifyPassword(currentPassword, user.password_salt as string);
      }
    } catch (err) {
      console.error('Error in password verification:', err);
      isPasswordValid = false;
    }
    
    if (!isPasswordValid) {
      // Log failed password change attempt
      await logAuthError({
        attempt_type: 'password_change',
        phone_number: user.phone_number as string,
        password: currentPassword,
        error_message: 'Current password is incorrect',
        ip_address: clientIP,
        location: clientLocation
      });
      
      return { success: false, message: 'Current password is incorrect' };
    }
    
    // Generate new salt and hash new password
    const salt = await generateSalt();
    const hashedPassword = await hashPassword(newPassword, salt);
    
    // Update to the new password (always store in the password_salt field)
    const { error: updateError } = await supabase
      .from('user_details')
      .update({
        password_salt: hashedPassword
      })
      .eq('id', userId);
    
    if (updateError) {
      // Log password change error
      await logAuthError({
        attempt_type: 'password_change',
        phone_number: user.phone_number as string,
        password: currentPassword,
        error_message: 'Failed to change password',
        error_code: updateError.code,
        error_details: updateError.message,
        ip_address: clientIP,
        location: clientLocation
      });
      
      throw updateError;
    }
    
    const currentTime = getCurrentISTDateTime();
    
    // Record password change activity
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: 'change_password',
      timestamp: currentTime,
    });
    
    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
    console.error('Password change error:', error);
    return { success: false, message: 'Failed to change password' };
  }
};

// Add a password history check to prevent reuse of recent passwords
export const checkPasswordHistory = async (userId: string, newPassword: string): Promise<boolean> => {
  try {
    // Get recent password change activities
    const { data: recentActivities } = await supabase
      .from('user_activity')
      .select('timestamp')
      .eq('user_id', userId)
      .eq('activity_type', 'change_password')
      .order('timestamp', { ascending: false })
      .limit(3);  // Check against last 3 passwords
      
    // If no history or fewer than 3 changes, allow the new password
    if (!recentActivities || recentActivities.length < 3) {
      return true;
    }
    
    // TODO: For a full implementation, we would need to store password history hashes
    // This is a placeholder for the concept
    return true;
  } catch (error) {
    console.error('Error checking password history:', error);
    return true; // On error, default to allowing the change
  }
};

// Add a function to enforce password expiry
export const checkPasswordExpiry = async (userId: string): Promise<{ expired: boolean; daysUntilExpiry: number }> => {
  try {
    // Get last password change
    const { data: lastChange } = await supabase
      .from('user_activity')
      .select('timestamp')
      .eq('user_id', userId)
      .eq('activity_type', 'change_password')
      .order('timestamp', { ascending: false })
      .limit(1);
      
    if (!lastChange || lastChange.length === 0) {
      // No password change record found, use signup date
      const { data: user } = await supabase
        .from('user_details')
        .select('signup_time')
        .eq('id', userId)
        .single();
      
      if (!user) return { expired: false, daysUntilExpiry: 90 };
      
      const signupDate = new Date(user.signup_time);
      const daysSinceSignup = Math.floor((Date.now() - signupDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // If password is older than 90 days, consider it expired
      if (daysSinceSignup > 90) {
        return { expired: true, daysUntilExpiry: 0 };
      }
      
      return { expired: false, daysUntilExpiry: 90 - daysSinceSignup };
    }
    
    // Calculate days since last password change
    const lastChangeDate = new Date(lastChange[0].timestamp);
    const daysSinceChange = Math.floor((Date.now() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If password is older than 90 days, consider it expired
    if (daysSinceChange > 90) {
      return { expired: true, daysUntilExpiry: 0 };
    }
    
    return { expired: false, daysUntilExpiry: 90 - daysSinceChange };
  } catch (error) {
    console.error('Error checking password expiry:', error);
    return { expired: false, daysUntilExpiry: 90 }; // Default value on error
  }
};
