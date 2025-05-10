import { supabase } from './supabaseClient';
import { User } from '../types';
import { getCurrentISTDateTime } from '../utils/dateUtils';
import { 
  logAuthError, 
  recordFailedAttempt 
} from '../utils/authErrorLogger';
import { 
  hashPassword, 
  generateSalt, 
  verifyPassword 
} from '../utils/securePassword';

export const signUp = async (
  name: string, 
  phoneNumber: string, 
  password: string,
  clientIP?: string | null,
  clientLocation?: string | null
): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    console.log(`Attempting to create user with phone: ${phoneNumber.substring(0, 3)}***${phoneNumber.substring(7)}`);
    
    // Check if user with this phone number already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('user_details')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing user:', checkError);
      
      // Log the error
      await logAuthError({
        attempt_type: 'signup',
        phone_number: phoneNumber,
        password: password,
        error_message: 'Failed to verify if phone number exists',
        error_code: checkError.code,
        error_details: checkError.message,
        ip_address: clientIP || undefined,
        location: clientLocation || undefined
      });
      
      return { 
        success: false, 
        message: 'Failed to verify if phone number exists. Please try again.' 
      };
    }
    
    if (existingUser) {
      console.log('User with this phone number already exists');
      
      // Log the duplicate signup attempt
      await logAuthError({
        attempt_type: 'signup',
        phone_number: phoneNumber,
        password: password,
        error_message: 'A user with this phone number already exists',
        error_code: 'DUPLICATE_USER',
        ip_address: clientIP || undefined,
        location: clientLocation || undefined
      });
      
      return { 
        success: false, 
        message: 'A user with this phone number already exists' 
      };
    }

    // Generate salt and hash password (security enhancement)
    const salt = generateSalt();
    const hashedPassword = hashPassword(password, salt);
    
    const currentTime = getCurrentISTDateTime();
    
    // Create the user with secure password storage
    const { data: newUser, error: createError } = await supabase
      .from('user_details')
      .insert({
        name,
        phone_number: phoneNumber,
        password: hashedPassword, // Store the hash instead of plaintext
        password_salt: salt, // Store the salt
        signup_time: currentTime,
        credit: 1000
      })
      .select()
      .single();
      
    if (createError) {
      console.error('Error creating user:', createError);
      
      // Log the signup error
      await logAuthError({
        attempt_type: 'signup',
        phone_number: phoneNumber,
        password: password,
        error_message: 'Failed to register user',
        error_code: createError.code,
        error_details: createError.message,
        ip_address: clientIP || undefined,
        location: clientLocation || undefined
      });
      
      let errorMessage = 'Failed to register user';
      
      // Provide more specific error messages
      if (createError.code === '23505') {
        errorMessage = 'This phone number is already registered';
      }
      
      throw new Error(errorMessage);
    }

    // Record user signup activity
    if (newUser) {
      try {
        await supabase.from('user_activity').insert({
          user_id: newUser.id,
          activity_type: 'signup',
          timestamp: currentTime,
          ip_address: clientIP || null,
          location: clientLocation || null
        });

        console.log('User activity recorded successfully');
      } catch (activityError) {
        console.error('Failed to record signup activity:', activityError);
        // Non-critical error, continue with signup process
      }

      const user: User = {
        id: newUser.id,
        name: newUser.name,
        phoneNumber: newUser.phone_number,
        credit: newUser.credit,
        signupTime: newUser.signup_time,
      };

      console.log('User successfully registered');
      return { success: true, message: 'User successfully registered', user };
    } else {
      console.error('Failed to create user: No user data returned');
      
      // Log the error
      await logAuthError({
        attempt_type: 'signup',
        phone_number: phoneNumber,
        password: password,
        error_message: 'Failed to create user account: No user data returned',
        error_code: 'NO_USER_DATA',
        ip_address: clientIP || undefined,
        location: clientLocation || undefined
      });
      
      throw new Error('Failed to create user account');
    }
  } catch (error: any) {
    console.error('Sign up error:', error);
    
    // Log any uncaught errors
    await logAuthError({
      attempt_type: 'signup',
      phone_number: phoneNumber,
      password: password,
      error_message: error.message || 'Failed to register user',
      error_details: error.stack,
      ip_address: clientIP || undefined,
      location: clientLocation || undefined
    });
    
    return { 
      success: false, 
      message: error.message || 'Failed to register user' 
    };
  }
};

export const login = async (
  phoneNumber: string, 
  password: string,
  clientIP?: string | null,
  clientLocation?: string | null
): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    // First, get the user record to find salt and hashed password
    const { data: user, error } = await supabase
      .from('user_details')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();
      
    if (error || !user) {
      // Record failed attempt for rate limiting
      recordFailedAttempt(phoneNumber);
      
      // Log failed login attempt
      await logAuthError({
        attempt_type: 'login',
        phone_number: phoneNumber,
        password: password,
        error_message: 'Invalid phone number or password',
        error_code: error?.code,
        error_details: error?.message,
        ip_address: clientIP || undefined,
        location: clientLocation || undefined
      });
      
      return { success: false, message: 'Invalid phone number or password' };
    }
    
    // Security enhancement: Check if password hashing has been implemented for this user
    if (user.password_salt) {
      // New secure method: verify password using salt
      const isPasswordValid = verifyPassword(password, user.password, user.password_salt);
      
      if (!isPasswordValid) {
        // Record failed attempt for rate limiting
        recordFailedAttempt(phoneNumber);
        
        // Log failed login attempt
        await logAuthError({
          attempt_type: 'login',
          phone_number: phoneNumber,
          password: password,
          error_message: 'Invalid password',
          ip_address: clientIP || undefined,
          location: clientLocation || undefined
        });
        
        return { success: false, message: 'Invalid phone number or password' };
      }
    } else {
      // Legacy method (temporary): direct password comparison for users migrated from old system
      if (user.password !== password) {
        // Record failed attempt for rate limiting
        recordFailedAttempt(phoneNumber);
        
        // Log failed login attempt 
        await logAuthError({
          attempt_type: 'login',
          phone_number: phoneNumber,
          password: password,
          error_message: 'Invalid password (legacy check)',
          ip_address: clientIP || undefined,
          location: clientLocation || undefined
        });
        
        return { success: false, message: 'Invalid phone number or password' };
      }
      
      // If using legacy method but valid, upgrade the user's password to hashed version
      try {
        const salt = generateSalt();
        const hashedPassword = hashPassword(password, salt);
        
        await supabase
          .from('user_details')
          .update({ 
            password: hashedPassword,
            password_salt: salt 
          })
          .eq('id', user.id);
          
        console.log('User password upgraded to secure storage');
      } catch (upgradeErr) {
        // Non-critical error, continue with login process
        console.error('Failed to upgrade user password:', upgradeErr);
      }
    }

    const currentTime = getCurrentISTDateTime();

    // Update the last login time and location data
    await supabase
      .from('user_details')
      .update({ 
        last_login: currentTime,
        last_login_ip: clientIP || null,
        last_login_location: clientLocation || null
      })
      .eq('id', user.id);

    // Record login activity with location
    await supabase.from('user_activity').insert({
      user_id: user.id,
      activity_type: 'login',
      timestamp: currentTime,
      ip_address: clientIP || null,
      location: clientLocation || null
    });

    const userData: User = {
      id: user.id,
      name: user.name,
      phoneNumber: user.phone_number,
      credit: user.credit,
      signupTime: user.signup_time,
      lastLogin: currentTime
    };

    return { success: true, message: 'Login successful', user: userData };
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Log any uncaught login errors
    await logAuthError({
      attempt_type: 'login',
      phone_number: phoneNumber,
      password: password,
      error_message: 'Failed to login',
      error_details: error?.stack,
      ip_address: clientIP || undefined,
      location: clientLocation || undefined
    });
    
    return { success: false, message: 'Failed to login' };
  }
};

export const logout = async (userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const currentTime = getCurrentISTDateTime();
    
    // Record logout activity
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: 'logout',
      timestamp: currentTime,
    });
    
    return { success: true, message: 'Logout successful' };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, message: 'Failed to logout' };
  }
};

export const updateUserProfile = async (
  userId: string, 
  updateData: { name?: string; phoneNumber?: string; }
): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const updateObj: Record<string, any> = {};
    
    if (updateData.name) {
      updateObj.name = updateData.name;
    }
    
    if (updateData.phoneNumber) {
      // Check if phone number is already used by another user
      const { data: existingUser } = await supabase
        .from('user_details')
        .select('id')
        .eq('phone_number', updateData.phoneNumber)
        .neq('id', userId)
        .single();
      
      if (existingUser) {
        return { success: false, message: 'This phone number is already in use by another account' };
      }
      
      updateObj.phone_number = updateData.phoneNumber;
    }
    
    if (Object.keys(updateObj).length === 0) {
      return { success: false, message: 'No fields to update' };
    }
    
    const currentTime = getCurrentISTDateTime();
    
    // Update the user profile
    const { data: updatedUser, error } = await supabase
      .from('user_details')
      .update(updateObj)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Record profile update activity
    const activityType = updateData.name && updateData.phoneNumber 
      ? 'update_name_and_phone' 
      : updateData.name 
        ? 'update_name' 
        : 'update_phone';
    
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: activityType,
      timestamp: currentTime,
    });
    
    const userData: User = {
      id: updatedUser.id,
      name: updatedUser.name,
      phoneNumber: updatedUser.phone_number,
      credit: updatedUser.credit,
      signupTime: updatedUser.signup_time,
      lastLogin: updatedUser.last_login
    };
    
    return { success: true, message: 'Profile updated successfully', user: userData };
  } catch (error) {
    console.error('Profile update error:', error);
    return { success: false, message: 'Failed to update profile' };
  }
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string, clientIP?: string, clientLocation?: string): Promise<{ success: boolean; message: string }> => {
  try {
    // First get the user record to verify the current password
    const { data: user, error: getUserError } = await supabase
      .from('user_details')
      .select('id, phone_number, password, password_salt')
      .eq('id', userId)
      .single();
    
    if (getUserError || !user) {
      return { success: false, message: 'User not found' };
    }

    // Verify current password
    let isPasswordValid = false;
    
    if (user.password_salt) {
      // New secure method: verify password using salt
      isPasswordValid = verifyPassword(currentPassword, user.password, user.password_salt);
    } else {
      // Legacy method: direct comparison
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
    const salt = generateSalt();
    const hashedPassword = hashPassword(newPassword, salt);
    
    // Update to the new password
    const { error: updateError } = await supabase
      .from('user_details')
      .update({ 
        password: hashedPassword,
        password_salt: salt
      })
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

export const getUserDetails = async (userId: string): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const { data: userData, error } = await supabase
      .from('user_details')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error || !userData) {
      return { success: false, message: 'User not found' };
    }
    
    const user: User = {
      id: userData.id,
      name: userData.name,
      phoneNumber: userData.phone_number,
      credit: userData.credit,
      signupTime: userData.signup_time,
      lastLogin: userData.last_login
    };
    
    return { success: true, message: 'User details retrieved successfully', user };
  } catch (error) {
    console.error('Get user details error:', error);
    return { success: false, message: 'Failed to retrieve user details' };
  }
};
