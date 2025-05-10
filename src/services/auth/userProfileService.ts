
import { supabase } from '../supabaseClient';
import { User } from '../../types';
import { getCurrentISTDateTime } from '../../utils/dateUtils';

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

export const getUserLoginHistory = async (userId: string): Promise<{ 
  success: boolean; 
  message: string; 
  history?: { 
    timestamp: string; 
    location?: string | null; 
    ip_address?: string | null; 
  }[] 
}> => {
  try {
    // Fetch login activities from user_activity table
    const { data, error } = await supabase
      .from('user_activity')
      .select('timestamp, ip_address, location')
      .eq('user_id', userId)
      .eq('activity_type', 'login')
      .order('timestamp', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching login history:', error);
      return { success: false, message: 'Failed to retrieve login history' };
    }
    
    return { 
      success: true, 
      message: 'Login history retrieved successfully', 
      history: data || []
    };
  } catch (error) {
    console.error('Get login history error:', error);
    return { success: false, message: 'Failed to retrieve login history' };
  }
};
