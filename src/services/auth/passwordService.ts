
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
      .select('id, phone_number, password_salt')
      .eq('id', userId)
      .single();
    
    if (getUserError || !user) {
      return { success: false, message: 'User not found' };
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
