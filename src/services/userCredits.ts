
import { supabase } from './supabaseClient';
import { User } from '@/types';

/**
 * Get the current credit balance for a user
 */
export const getUserCredits = async (userId: string): Promise<number> => {
  try {
    console.log(`Fetching credit balance for user ${userId}`);
    const { data, error } = await supabase
      .from('user_details')
      .select('credit')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user credit balance:', error);
      return 0;
    }
    
    console.log(`Retrieved credit balance for user ${userId}: ${data.credit}`);
    return data.credit;
  } catch (error) {
    console.error('Error in getUserCredits:', error);
    return 0;
  }
};

/**
 * Force refresh of user credit balance
 */
export const refreshUserCredits = async (userId: string): Promise<{ 
  success: boolean; 
  credits?: number; 
  message: string;
}> => {
  try {
    console.log(`Manually refreshing credit balance for user ${userId}`);
    const { data, error } = await supabase
      .from('user_details')
      .select('credit')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error refreshing user credit balance:', error);
      return { 
        success: false, 
        message: 'Failed to refresh credit balance' 
      };
    }
    
    console.log(`Refreshed credit balance for user ${userId}: ${data.credit}`);
    return { 
      success: true, 
      credits: data.credit,
      message: 'Credit balance refreshed successfully' 
    };
  } catch (error) {
    console.error('Error in refreshUserCredits:', error);
    return { 
      success: false, 
      message: 'Error refreshing credit balance' 
    };
  }
};

/**
 * Get user profile data with latest credit balance
 */
export const getUserProfile = async (userId: string): Promise<{ 
  success: boolean; 
  user?: User; 
  message: string;
}> => {
  try {
    console.log(`Fetching user profile for user ${userId}`);
    const { data, error } = await supabase
      .from('user_details')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user profile:', error);
      return { 
        success: false, 
        message: 'Failed to fetch user profile' 
      };
    }
    
    if (!data) {
      return {
        success: false,
        message: 'User profile not found'
      };
    }
    
    const user: User = {
      id: data.id,
      name: data.name,
      phoneNumber: data.phone_number,
      credit: data.credit,
      signupTime: data.signup_time,
      lastLogin: data.last_login
    };
    
    console.log(`Retrieved user profile for user ${userId} with credit: ${user.credit}`);
    return { 
      success: true, 
      user,
      message: 'User profile retrieved successfully' 
    };
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return { 
      success: false, 
      message: 'Error fetching user profile' 
    };
  }
};
