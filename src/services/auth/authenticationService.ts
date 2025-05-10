
import { supabase } from '../supabaseClient';
import { User } from '../../types';
import { getCurrentISTDateTime } from '../../utils/dateUtils';
import { logAuthError, recordFailedAttempt } from '../../utils/authErrorLogger';
import { hashPassword, generateSalt, verifyPassword } from '../../utils/securePassword';

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

    // Generate salt and hash password with new format
    const salt = await generateSalt();
    const hashedPassword = await hashPassword(password, salt);
    
    // Split the salt and hash for secure storage
    const [saltPart, hashPart] = hashedPassword.split(':');
    
    const currentTime = getCurrentISTDateTime();
    
    // Create the user with separate salt and hash fields
    const { data: newUser, error: createError } = await supabase
      .from('user_details')
      .insert({
        name,
        phone_number: phoneNumber,
        password_salt: saltPart, // Store just the salt 
        password_hash: hashPart, // Store just the hash
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
    // First check server-side rate limiting
    const { data: rateLimitCheck } = await supabase
      .rpc('check_login_rate_limit', { phone_number: phoneNumber });
    
    if (rateLimitCheck === true) {
      // Record the rate-limited attempt
      await logAuthError({
        attempt_type: 'login',
        phone_number: phoneNumber,
        password: password,
        error_message: 'Login attempt rate-limited',
        error_code: 'RATE_LIMITED',
        ip_address: clientIP || undefined,
        location: clientLocation || undefined
      });
      
      return { success: false, message: 'Too many login attempts. Please try again later.' };
    }
    
    // Get the user record with both password_salt and password_hash fields
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
    
    // Verify the password using the appropriate method based on stored format
    let isPasswordValid = false;
    
    try {
      if (user.password_hash) {
        // New format: Verify using separate salt and hash
        const storedValue = `${user.password_salt}:${user.password_hash}`;
        isPasswordValid = await verifyPassword(password, storedValue);
      } else {
        // Legacy format: Verify using just the password_salt field which contains the hash
        isPasswordValid = await verifyPassword(password, user.password_salt);
      }
      
      console.log('Password verification result:', isPasswordValid);
    } catch (err) {
      console.error('Error verifying password:', err);
      isPasswordValid = false;
    }
    
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

    const currentTime = getCurrentISTDateTime();

    // Update the last login time
    await supabase
      .from('user_details')
      .update({ 
        last_login: currentTime,
      })
      .eq('id', user.id);

    // Record login activity
    await supabase.from('user_activity').insert({
      user_id: user.id,
      activity_type: 'login',
      timestamp: currentTime,
    });

    const userData: User = {
      id: user.id,
      name: user.name,
      phoneNumber: user.phone_number,
      credit: user.credit,
      signupTime: user.signup_time,
      lastLogin: currentTime
    };

    // Get the session token for improved session management
    const session = {
      userId: userData.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    // Store session info in localStorage
    localStorage.setItem('sessionInfo', JSON.stringify(session));

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
    
    // Clear session information
    localStorage.removeItem('sessionInfo');
    
    return { success: true, message: 'Logout successful' };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, message: 'Failed to logout' };
  }
};

// Import function from supabaseClient
import { checkColumnExistsFallback } from '../supabaseClient';
