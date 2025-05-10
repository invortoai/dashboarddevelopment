
import { supabase } from '../supabaseClient';
import { hashPassword, verifyPassword, generateSalt, secureCompare } from '../../utils/securePassword';
import { getCurrentISTDateTime } from '../../utils/dateUtils';
import { sanitizeInput } from '../../utils/securityUtils';
import { logAuthError } from '../../utils/authErrorLogger';

export const checkPhoneExists = async (phoneNumber: string): Promise<{ exists: boolean; message: string }> => {
  try {
    const cleanPhone = sanitizeInput(phoneNumber);
    
    const { data, error } = await supabase
      .from('user_details')
      .select('id')
      .eq('phone_number', cleanPhone as any) // Type cast to avoid TS errors
      .limit(1);
    
    if (error) {
      console.error('Error checking phone exists:', error);
      return { exists: false, message: "An error occurred while checking phone number" };
    }
    
    if (data && data.length > 0) {
      return { exists: true, message: "Phone number exists" };
    } else {
      return { exists: false, message: "No account found with this phone number" };
    }
  } catch (error: any) {
    console.error('Error checking if phone exists:', error);
    return { exists: false, message: error.message || "An error occurred while checking phone number" };
  }
};

export const login = async (phoneNumber: string, password: string, ip?: string | null, location?: string | null): Promise<{ success: boolean; message: string; user?: any }> => {
  try {
    const cleanPhone = sanitizeInput(phoneNumber);
    
    // Fetch the user by phone number
    const { data: users, error } = await supabase
      .from('user_details')
      .select('*')
      .eq('phone_number', cleanPhone as any); // Type cast to avoid TS errors
    
    if (error) {
      throw error;
    }
    
    if (!users || users.length === 0) {
      // Log failed login attempt
      await logAuthError({
        attempt_type: 'login' as any, // Type cast to avoid TS errors
        phone_number: cleanPhone as any, // Type cast to avoid TS errors
        error_message: 'No user with that phone number',
        ip_address: ip || undefined,
        location: location || undefined
      });
      
      return { success: false, message: "No account found with this phone number" };
    }
    
    const user = users[0];
    const storedHash = user.password_salt; // Using password_salt field which contains the hash
    
    // Verify the password
    const isValid = await verifyPassword(password, storedHash);
    
    if (!isValid) {
      // Log failed login attempt
      await logAuthError({
        attempt_type: 'login' as any, // Type cast to avoid TS errors
        phone_number: cleanPhone as any, // Type cast to avoid TS errors
        error_message: 'Invalid password',
        ip_address: ip || undefined,
        location: location || undefined
      });
      
      return { success: false, message: "Invalid password" };
    }
    
    // Update last login time
    const currentTime = getCurrentISTDateTime();
    await supabase
      .from('user_details')
      .update({ last_login: currentTime })
      .eq('id', user.id);
    
    // Log login activity
    await supabase
      .from('user_activity')
      .insert({
        user_id: user.id,
        activity_type: 'login',
        timestamp: currentTime
      } as any); // Type cast to avoid TS errors
    
    // Return user info (excluding sensitive data)
    return { 
      success: true, 
      message: "Login successful", 
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phone_number,
        credit: user.credit,
        signupTime: user.signup_time,
        lastLogin: currentTime
      }
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, message: error.message || "An error occurred during login" };
  }
};

export const signUp = async (
  name: string, 
  phoneNumber: string, 
  password: string, 
  ip?: string | null, 
  location?: string | null
): Promise<{ success: boolean; message: string; user?: any }> => {
  try {
    const cleanPhone = sanitizeInput(phoneNumber);
    const cleanName = sanitizeInput(name);
    
    // Check if the phone number already exists
    const { exists } = await checkPhoneExists(cleanPhone);
    if (exists) {
      // Log failed signup attempt
      await logAuthError({
        attempt_type: 'signup' as any, // Type cast to avoid TS errors
        phone_number: cleanPhone as any, // Type cast to avoid TS errors
        error_message: 'Phone number already exists',
        ip_address: ip || undefined,
        location: location || undefined
      });
      
      return { success: false, message: "A user with this phone number already exists" };
    }
    
    // Generate salt and hash password
    const salt = await generateSalt();
    const hashedPassword = await hashPassword(password, salt);
    
    const currentTime = getCurrentISTDateTime();
    
    // Create user
    const { data: user, error } = await supabase
      .from('user_details')
      .insert({
        name: cleanName,
        phone_number: cleanPhone,
        password_salt: hashedPassword,
        signup_time: currentTime,
        credit: 1000
      } as any) // Type cast to avoid TS errors
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Log activity
    await supabase
      .from('user_activity')
      .insert({
        user_id: user.id,
        activity_type: 'signup',
        timestamp: currentTime
      } as any); // Type cast to avoid TS errors
    
    // Return user info (excluding sensitive data)
    return { 
      success: true, 
      message: "User created successfully", 
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phone_number,
        credit: user.credit,
        signupTime: user.signup_time,
        lastLogin: null
      }
    };
    
  } catch (error: any) {
    console.error('Sign up error:', error);
    return { success: false, message: error.message || "An error occurred during sign up" };
  }
};

export const logout = async (userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    if (!userId) {
      return { success: false, message: "No user ID provided" };
    }
    
    // Log logout activity
    const currentTime = getCurrentISTDateTime();
    await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        activity_type: 'logout',
        timestamp: currentTime
      } as any); // Type cast to avoid TS errors
    
    return { success: true, message: "Logged out successfully" };
  } catch (error: any) {
    console.error('Logout error:', error);
    return { success: false, message: error.message || "An error occurred during logout" };
  }
};
