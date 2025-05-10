
import { supabase, sanitizeInput } from '../supabaseClient';
import { User } from '../../types';
import { getCurrentISTDateTime } from '../../utils/dateUtils';
import { logAuthError, recordFailedAttempt } from '../../utils/authErrorLogger';
import { hashPassword, generateSalt, verifyPassword } from '../../utils/securePassword';

// Add a new function to check if a phone number exists
export const checkPhoneExists = async (phoneNumber: string): Promise<{ exists: boolean; message: string }> => {
  try {
    // Sanitize phone number input
    const sanitizedPhone = sanitizeInput(phoneNumber);
    
    // Check if user with this phone number exists
    const { data, error } = await supabase
      .from('user_details')
      .select('id')
      .eq('phone_number', sanitizedPhone)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking for phone number:', error);
      return { exists: false, message: 'Failed to verify phone number. Please try again.' };
    }
    
    return { 
      exists: !!data, 
      message: data ? 'Phone number exists' : 'No account found with this phone number. Please sign up first.' 
    };
  } catch (err: any) {
    console.error('Error in checkPhoneExists:', err);
    return { exists: false, message: 'Failed to verify phone number. Please try again.' };
  }
};

export const signUp = async (
  name: string, 
  phoneNumber: string, 
  password: string,
  clientIP?: string | null,
  clientLocation?: string | null
): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedPhone = sanitizeInput(phoneNumber);
    
    console.log(`Attempting to create user with phone: ${sanitizedPhone.substring(0, 3)}***${sanitizedPhone.substring(7)}`);
    
    // Check if user with this phone number already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('user_details')
      .select('id')
      .eq('phone_number', sanitizedPhone)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing user:', checkError);
      
      // Log the error
      await logAuthError({
        attempt_type: 'signup',
        phone_number: sanitizedPhone,
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
        phone_number: sanitizedPhone,
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
    
    // Check if password_hash column exists
    const { data: columnExists } = await supabase.rpc('execute_sql', {
      query_text: "SELECT column_name FROM information_schema.columns WHERE table_name = 'user_details' AND column_name = 'password_hash'"
    });
    
    let userData;
    
    if (columnExists && Array.isArray(columnExists) && columnExists.length > 0) {
      // Create the user with separate salt and hash fields
      const { data: newUser, error: createError } = await supabase
        .from('user_details')
        .insert({
          name: sanitizedName,
          phone_number: sanitizedPhone,
          password_salt: saltPart, // Store just the salt
          // @ts-ignore - The column exists in DB but not in TypeScript types
          password_hash: hashPart, // Store just the hash
          signup_time: currentTime,
          credit: 1000
        })
        .select()
        .single();
        
      if (createError) throw createError;
      userData = newUser;
    } else {
      // Fallback: store the combined hash in password_salt
      const { data: newUser, error: createError } = await supabase
        .from('user_details')
        .insert({
          name: sanitizedName,
          phone_number: sanitizedPhone,
          password_salt: hashedPassword, // Store the complete hash including salt
          signup_time: currentTime,
          credit: 1000
        })
        .select()
        .single();
        
      if (createError) throw createError;
      userData = newUser;
    }
      
    if (!userData) {
      throw new Error('Failed to create user account');
    }

    // Record user signup activity
    try {
      await supabase.from('user_activity').insert({
        user_id: userData.id,
        activity_type: 'signup',
        timestamp: currentTime,
      });

      console.log('User activity recorded successfully');
    } catch (activityError) {
      console.error('Failed to record signup activity:', activityError);
      // Non-critical error, continue with signup process
    }

    const user: User = {
      id: userData.id,
      name: userData.name,
      phoneNumber: userData.phone_number,
      credit: userData.credit,
      signupTime: userData.signup_time,
    };

    console.log('User successfully registered');
    return { success: true, message: 'User successfully registered', user };
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
    // Sanitize inputs
    const sanitizedPhone = sanitizeInput(phoneNumber);
    
    // First check if the phone number exists
    const { exists, message } = await checkPhoneExists(sanitizedPhone);
    
    if (!exists) {
      // Phone doesn't exist in the system - no need to check password or rate limiting
      await logAuthError({
        attempt_type: 'login',
        phone_number: sanitizedPhone,
        password: password,
        error_message: 'Phone number not found',
        error_code: 'PHONE_NOT_FOUND',
        ip_address: clientIP || undefined,
        location: clientLocation || undefined
      });
      
      return { success: false, message };
    }
    
    // Check for rate limiting by directly querying auth_error_logs
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: failedAttempts, error: rateError } = await supabase
      .from('auth_error_logs')
      .select('id')
      .eq('phone_number', sanitizedPhone)
      .eq('attempt_type', 'login')
      .gte('attempt_time', hourAgo);
      
    if (rateError) {
      console.error("Error checking rate limit:", rateError);
      // Continue with login process even if rate check fails
    } else if (failedAttempts && failedAttempts.length >= 5) {
      // Rate limited
      await logAuthError({
        attempt_type: 'login',
        phone_number: sanitizedPhone,
        password: password,
        error_message: 'Login attempt rate-limited',
        error_code: 'RATE_LIMITED',
        ip_address: clientIP || undefined,
        location: clientLocation || undefined
      });
      
      return { success: false, message: 'Too many login attempts. Please try again later.' };
    }
    
    // Get the user record
    const { data: user, error } = await supabase
      .from('user_details')
      .select('*')
      .eq('phone_number', sanitizedPhone)
      .single();
      
    if (error || !user) {
      // This shouldn't happen since we already checked existence, but just in case
      // Record failed attempt for rate limiting
      recordFailedAttempt(sanitizedPhone);
      
      // Log failed login attempt
      await logAuthError({
        attempt_type: 'login',
        phone_number: sanitizedPhone,
        password: password,
        error_message: 'Invalid phone number or password',
        error_code: error?.code,
        error_details: error?.message,
        ip_address: clientIP || undefined,
        location: clientLocation || undefined
      });
      
      return { success: false, message: 'Invalid phone number or password' };
    }
    
    // Check if the user record has password_hash field
    // We can't check this with TypeScript, so we'll handle it at runtime
    const hasPasswordHash = 'password_hash' in user;
    
    // Verify the password using the appropriate method based on stored format
    let isPasswordValid = false;
    
    try {
      if (hasPasswordHash) {
        // @ts-ignore - TypeScript doesn't know about password_hash
        const storedHash = user.password_hash;
        const storedSalt = user.password_salt;
        // New format: Verify using separate salt and hash
        const combinedValue = `${storedSalt}:${storedHash}`;
        isPasswordValid = await verifyPassword(password, combinedValue);
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
      recordFailedAttempt(sanitizedPhone);
      
      // Log failed login attempt
      await logAuthError({
        attempt_type: 'login',
        phone_number: sanitizedPhone,
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
    
    // Store session info in localStorage with secure flags
    localStorage.setItem('sessionInfo', JSON.stringify(session));
    
    // Set expiry on session
    setTimeout(() => {
      localStorage.removeItem('sessionInfo');
    }, 24 * 60 * 60 * 1000);

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
