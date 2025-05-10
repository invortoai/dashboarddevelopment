
import { supabase } from '../supabaseClient';
import { User } from '../../types';
import { getCurrentISTDateTime } from '../../utils/dateUtils';

export const getUserDetails = async (userId: string): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const { data: user, error } = await supabase
      .from('user_details')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      return { success: false, message: 'User not found' };
    }
    
    const userData: User = {
      id: user.id,
      name: user.name,
      phoneNumber: user.phone_number,
      credit: user.credit,
      signupTime: user.signup_time,
      lastLogin: user.last_login,
    };
    
    return { success: true, message: 'User details fetched successfully', user: userData };
  } catch (error: any) {
    console.error('Error getting user details:', error);
    return { success: false, message: error.message || 'Failed to get user details' };
  }
};

export const updateUserProfile = async (
  userId: string, 
  profileData: { name?: string }
): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const updates: any = {};
    
    if (profileData.name) {
      updates.name = profileData.name;
    }
    
    // Only proceed if there are updates to make
    if (Object.keys(updates).length === 0) {
      return { success: false, message: 'No updates provided' };
    }
    
    const { data, error } = await supabase
      .from('user_details')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    if (data) {
      const updatedUser: User = {
        id: data.id,
        name: data.name,
        phoneNumber: data.phone_number,
        credit: data.credit,
        signupTime: data.signup_time,
        lastLogin: data.last_login
      };
      
      return { success: true, message: 'Profile updated successfully', user: updatedUser };
    }
    
    return { success: false, message: 'Failed to update profile' };
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return { success: false, message: error.message || 'Failed to update profile' };
  }
};

export const getUserLoginHistory = async (
  userId: string
): Promise<{ 
  success: boolean; 
  message: string; 
  history?: Array<{
    timestamp: string;
    location?: string | null;
    ip_address?: string | null;
  }> 
}> => {
  try {
    // Fetch login activity records for the user
    const { data, error } = await supabase
      .from('user_activity')
      .select('timestamp')
      .eq('user_id', userId)
      .eq('activity_type', 'login')
      .order('timestamp', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching login history:', error);
      return { 
        success: false, 
        message: 'Failed to fetch login history' 
      };
    }
    
    // Check if data exists and has the expected format
    if (data && Array.isArray(data)) {
      // Map the data to the expected format - only timestamp is available
      const loginHistory = data.map(record => ({
        timestamp: record.timestamp,
        location: null,  // These fields don't exist in the table
        ip_address: null
      }));
      
      return {
        success: true,
        message: 'Login history fetched successfully',
        history: loginHistory
      };
    }
    
    return {
      success: true,
      message: 'No login history found',
      history: []
    };
  } catch (error: any) {
    console.error('Error in getUserLoginHistory:', error);
    return { 
      success: false, 
      message: error.message || 'An error occurred while fetching login history'
    };
  }
};
