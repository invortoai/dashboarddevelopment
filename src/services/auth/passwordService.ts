
import { supabase } from '../supabaseClient';
import { checkColumnExistsFallback } from '../supabaseClient';
import { getCurrentISTDateTime } from '../../utils/dateUtils';
import { logAuthError } from '../../utils/authErrorLogger';
import { hashPassword, generateSalt, verifyPassword } from '../../utils/securePassword';
import { sanitizeInput } from '@/utils/securityUtils';

export const changePassword = async (userId: string, currentPassword: string, newPassword: string, clientIP?: string, clientLocation?: string): Promise<{ success: boolean; message: string }> => {
  try {
    // First get the user record to verify the current password
    const { data: user, error: getUserError } = await supabase
      .from('user_details')
      .select('id, phone_number, password_salt, password_hash')
      .eq('id', userId)
      .single();
    
    if (getUserError || !user) {
      return { success: false, message: 'User not found' };
    }

    // Verify using the stored hashed password in password_salt field
    let isPasswordValid = false;
    
    try {
      // Check if we're using the new format with explicit salt and hash
      if (user && 'password_hash' in user && user.password_hash) {
        // New approach: separate salt and hash
        const salt = user.password_salt as string;
        const hash = user.password_hash as string;
        isPasswordValid = await verifyPassword(
          currentPassword, 
          `${salt}:${hash}`
        );
      } else if (user && user.password_salt) {
        // Legacy approach: use just the password_salt field
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
    
    // Check if password_hash column exists
    const hasPasswordHashColumn = await checkColumnExistsFallback('user_details', 'password_hash');
    
    // Update to the new password
    let updateError;
    if (hasPasswordHashColumn) {
      // Split the salt and hash for secure storage
      const [saltPart, hashPart] = hashedPassword.split(':');
      
      const { error } = await supabase
        .from('user_details')
        .update({
          password_salt: saltPart,
          password_hash: hashPart
        })
        .eq('id', userId);
        
      updateError = error;
    } else {
      // Legacy approach: store in password_salt
      const { error } = await supabase
        .from('user_details')
        .update({
          password_salt: hashedPassword
        })
        .eq('id', userId);
        
      updateError = error;
    }
    
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
