
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

    // Generate salt and hash password (security enhancement)
    const salt = await generateSalt();
    const hashedPassword = await hashPassword(password, salt);
    
    const currentTime = getCurrentISTDateTime();
    
    // First try the primary check, then fall back to the secondary if needed
    let hasSaltColumn = false;
    try {
      hasSaltColumn = await checkColumnExistsFallback('user_details', 'password_salt');
      console.log('Column check result (fallback):', hasSaltColumn);
    } catch (columnCheckError) {
      console.error('Error checking column existence:', columnCheckError);
      // Default to false if we can't check
      hasSaltColumn = false;
    }
    
    let userInsertData: any = {
      name,
      phone_number: phoneNumber,
      password: hashedPassword, // Store the hash instead of plaintext
      signup_time: currentTime,
      credit: 1000
    };
    
    // Only add salt if the column exists
    if (hasSaltColumn) {
      userInsertData.password_salt = salt;
    }
    
    // Create the user
    const { data: newUser, error: createError } = await supabase
      .from('user_details')
      .insert(userInsertData)
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
      // If salt column exists, we need to fetch the user again to include the column
      try {
        const result = await supabase
          .from('user_details')
          .select('password, password_salt')
          .eq('id', user.id)
          .single();
          
        if (!result.error && result.data) {
          // Safely check if data exists and has the properties we need
          const userPass = result.data.password;
          const userSalt = result.data.password_salt;
          
          if (userPass !== undefined && userSalt !== undefined) {
            // Verify using salt
            isPasswordValid = await verifyPassword(
              password, 
              String(userPass),
              String(userSalt)
            );
          } else {
            // Fallback to direct comparison if we couldn't get salt
            isPasswordValid = user.password === password;
          }
        } else {
          // Fallback to direct comparison if we couldn't get the salt
          isPasswordValid = user.password === password;
        }
      } catch (err) {
        // If there's any error in the salt handling, fall back to direct comparison
        console.error('Error handling password salt:', err);
        isPasswordValid = user.password === password;
      }
    } else {
      // No salt column, use direct comparison
      isPasswordValid = user.password === password;
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

// Import function from supabaseClient
import { checkColumnExistsFallback } from '../supabaseClient';
