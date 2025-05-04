
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
    
    // Use forcefully non-cached fetch with headers to ensure fresh data
    const { data, error } = await supabase
      .from('user_details')
      .select('credit')
      .eq('id', userId)
      .single()
      .options({
        head: false,
        count: 'exact'
      });
      
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
      .single()
      .options({
        head: false,
        count: 'exact'
      });
      
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

/**
 * Manually set user credits to a specific value (used for fixing balance issues)
 */
export const setUserCredits = async (userId: string, creditAmount: number): Promise<{
  success: boolean;
  credits?: number;
  message: string;
}> => {
  try {
    console.log(`Manually setting credit balance for user ${userId} to ${creditAmount}`);
    
    const { data, error } = await supabase
      .from('user_details')
      .update({ credit: creditAmount })
      .eq('id', userId)
      .select('credit')
      .single();
      
    if (error) {
      console.error('Error setting user credit balance:', error);
      return { 
        success: false, 
        message: 'Failed to set credit balance' 
      };
    }
    
    console.log(`Set credit balance for user ${userId} to ${data.credit}`);
    return { 
      success: true, 
      credits: data.credit,
      message: 'Credit balance set successfully' 
    };
  } catch (error) {
    console.error('Error in setUserCredits:', error);
    return { 
      success: false, 
      message: 'Error setting credit balance' 
    };
  }
};

/**
 * Directly deduct credits from a user's balance
 * This is a more direct approach that bypasses the RPC function
 */
export const deductUserCredits = async (userId: string, creditsToDeduct: number): Promise<{
  success: boolean;
  credits?: number;
  message: string;
}> => {
  try {
    console.log(`Directly deducting ${creditsToDeduct} credits from user ${userId}`);
    
    // First fetch the current credit balance to ensure accurate deductions
    const { data: userData, error: fetchError } = await supabase
      .from('user_details')
      .select('credit')
      .eq('id', userId)
      .single();
      
    if (fetchError || !userData) {
      console.error('Error fetching current credit balance:', fetchError);
      return { 
        success: false, 
        message: 'Failed to fetch current credit balance' 
      };
    }
    
    const currentCredit = userData.credit;
    console.log(`Current credit balance for user ${userId}: ${currentCredit}`);
    
    // Calculate new balance
    const newCreditBalance = currentCredit - creditsToDeduct;
    console.log(`New credit balance will be: ${newCreditBalance}`);
    
    // Update the balance
    const { data, error: updateError } = await supabase
      .from('user_details')
      .update({ credit: newCreditBalance })
      .eq('id', userId)
      .select('credit')
      .single();
      
    if (updateError) {
      console.error('Error deducting user credits:', updateError);
      return { 
        success: false, 
        message: 'Failed to deduct credits' 
      };
    }
    
    console.log(`Successfully deducted ${creditsToDeduct} credits. New balance: ${data.credit}`);
    return { 
      success: true, 
      credits: data.credit,
      message: 'Credits deducted successfully' 
    };
  } catch (error) {
    console.error('Error in deductUserCredits:', error);
    return { 
      success: false, 
      message: 'Error deducting credits' 
    };
  }
};
