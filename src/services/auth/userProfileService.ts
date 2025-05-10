
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
      console.error('Error getting user details:', error);
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
      console.error('Error updating user profile:', error);
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
    // First try to fetch from user_activity table (primary source)
    let loginHistory: Array<{timestamp: string; location?: string | null; ip_address?: string | null;}> = [];
    
    try {
      // Try to get login data from user_activity table
      const { data: activityData, error: activityError } = await supabase
        .from('user_activity')
        .select('timestamp')
        .eq('user_id', userId)
        .eq('activity_type', 'login')
        .order('timestamp', { ascending: false })
        .limit(10);
      
      if (!activityError && activityData && Array.isArray(activityData) && activityData.length > 0) {
        // Map the data to the expected format
        loginHistory = activityData.map(record => ({
          timestamp: record.timestamp,
          location: null,  // These fields don't exist in the activity table
          ip_address: null
        }));
        
        return {
          success: true,
          message: 'Login history fetched successfully',
          history: loginHistory
        };
      }
    } catch (err) {
      console.error('Error fetching login activity:', err);
    }
    
    // If we have no data yet, try fallback to auth_error_logs
    if (loginHistory.length === 0) {
      try {
        // Get user's phone number first for fallback lookup
        const userResponse = await getUserDetails(userId);
        const phoneNumber = userResponse.user?.phoneNumber;
        
        if (phoneNumber) {
          // This is a fallback to get at least some data from auth_error_logs
          const { data: logsData, error: logsError } = await supabase
            .from('auth_error_logs')
            .select('attempt_time, location, ip_address')
            .eq('phone_number', phoneNumber)
            .eq('attempt_type', 'login')
            .order('attempt_time', { ascending: false })
            .limit(10);
            
          if (!logsError && logsData && Array.isArray(logsData) && logsData.length > 0) {
            // If we got data, merge it with any existing data
            const logsHistory = logsData.map(record => ({
              timestamp: record.attempt_time || new Date().toISOString(),
              location: record.location,
              ip_address: record.ip_address
            }));
            
            // Combine with any existing data
            loginHistory = [...loginHistory, ...logsHistory];
            
            return {
              success: true,
              message: 'Login history fetched successfully (fallback)',
              history: loginHistory
            };
          }
        }
      } catch (err) {
        console.error('Error in auth_error_logs fallback:', err);
      }
    }
    
    // If we still have no data, return empty array
    if (loginHistory.length === 0) {
      return {
        success: true,
        message: 'No login history found',
        history: []
      };
    } else {
      return {
        success: true,
        message: 'Login history fetched successfully',
        history: loginHistory
      };
    }
    
  } catch (error: any) {
    console.error('Error in getUserLoginHistory:', error);
    return { 
      success: false, 
      message: error.message || 'An error occurred while fetching login history',
      history: []
    };
  }
};
