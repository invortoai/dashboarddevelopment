
import { supabase } from './supabaseClient';
import { User } from '../types';
import { getCurrentISTDateTime } from '../utils/dateUtils';

export const signUp = async (name: string, phoneNumber: string, password: string): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    // Check if user with this phone number already exists
    const { data: existingUser } = await supabase
      .from('user_details')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single();
    
    if (existingUser) {
      return { success: false, message: 'A user with this phone number already exists' };
    }

    const currentTime = getCurrentISTDateTime();
    
    // Create the user
    const { data: newUser, error } = await supabase
      .from('user_details')
      .insert({
        name,
        phone_number: phoneNumber,
        password: password, // In a real app, this would be hashed by Supabase Auth
        signup_time: currentTime,
        credit: 1000
      })
      .select()
      .single();
      
    if (error) throw error;

    // Record user signup activity
    await supabase.from('user_activity').insert({
      user_id: newUser.id,
      activity_type: 'signup',
      timestamp: currentTime,
    });

    const user: User = {
      id: newUser.id,
      name: newUser.name,
      phoneNumber: newUser.phone_number,
      credit: newUser.credit,
      signupTime: newUser.signup_time,
    };

    return { success: true, message: 'User successfully registered', user };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, message: 'Failed to register user' };
  }
};

export const login = async (phoneNumber: string, password: string): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const { data: user, error } = await supabase
      .from('user_details')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('password', password) // In a real app, this would be handled by Supabase Auth
      .single();
      
    if (error || !user) {
      return { success: false, message: 'Invalid phone number or password' };
    }

    const currentTime = getCurrentISTDateTime();

    // Update the last login time
    await supabase
      .from('user_details')
      .update({ last_login: currentTime })
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

    return { success: true, message: 'Login successful', user: userData };
  } catch (error) {
    console.error('Login error:', error);
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

export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  try {
    // First verify the current password
    const { data: user, error: verifyError } = await supabase
      .from('user_details')
      .select('id')
      .eq('id', userId)
      .eq('password', currentPassword)
      .single();
    
    if (verifyError || !user) {
      return { success: false, message: 'Current password is incorrect' };
    }
    
    // Update to the new password
    const { error: updateError } = await supabase
      .from('user_details')
      .update({ password: newPassword })
      .eq('id', userId);
    
    if (updateError) throw updateError;
    
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
