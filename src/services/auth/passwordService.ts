
import { supabase, checkColumnExistsFallback } from '../supabaseClient';
import { getCurrentISTDateTime } from '../../utils/dateUtils';
import { logAuthError } from '../../utils/authErrorLogger';
import { hashPassword, generateSalt, verifyPassword } from '../../utils/securePassword';

export const changePassword = async (userId: string, currentPassword: string, newPassword: string, clientIP?: string, clientLocation?: string): Promise<{ success: boolean; message: string }> => {
  try {
    // First get the user record to verify the current password
    const { data: user, error: getUserError } = await supabase
      .from('user_details')
      .select('id, phone_number, password')
      .eq('id', userId)
      .single();
    
    if (getUserError || !user) {
      return { success: false, message: 'User not found' };
    }

    // Check if the password_salt column exists using the fallback method
    let hasSaltColumn = false;
    try {
      hasSaltColumn = await checkColumnExistsFallback('user_details', 'password_salt');
    } catch (err) {
      console.error('Error checking for password_salt column:', err);
      hasSaltColumn = false;
    }
    
    let isPasswordValid = false;
      
    if (hasSaltColumn) {
      // Get the user with salt
      try {
        const result = await supabase
          .from('user_details')
          .select('password, password_salt')
          .eq('id', userId)
          .single();
          
        if (!result.error && result.data) {
          // Safely check if data exists and has the properties we need
          const userPass = result.data.password;
          const userSalt = result.data.password_salt;
          
          if (userPass !== undefined && userSalt !== undefined) {
            // Verify using salt
            isPasswordValid = await verifyPassword(
              currentPassword, 
              String(userPass), 
              String(userSalt)
            );
          } else {
            // Fallback to direct comparison if we couldn't get the salt
            isPasswordValid = user.password === currentPassword;
          }
        } else {
          // Fallback to direct comparison if we couldn't get the salt
          isPasswordValid = user.password === currentPassword;
        }
      } catch (err) {
        // If there's an error, fall back to direct comparison
        console.error('Error in salt verification:', err);
        isPasswordValid = user.password === currentPassword;
      }
    } else {
      // No salt column, use direct comparison
      isPasswordValid = user.password === currentPassword;
    }
    
    if (!isPasswordValid) {
      // Log failed password change attempt
      await logAuthError({
        attempt_type: 'password_change',
        phone_number: user.phone_number,
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
    
    // Prepare update object
    let updateData: any = { 
      password: hashedPassword
    };
    
    // Only add salt if the column exists
    if (hasSaltColumn) {
      updateData.password_salt = salt;
    }
    
    // Update to the new password
    const { error: updateError } = await supabase
      .from('user_details')
      .update(updateData)
      .eq('id', userId);
    
    if (updateError) {
      // Log password change error
      await logAuthError({
        attempt_type: 'password_change',
        phone_number: user.phone_number,
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
      ip_address: clientIP || null,
      location: clientLocation || null
    });
    
    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
    console.error('Password change error:', error);
    return { success: false, message: 'Failed to change password' };
  }
};
