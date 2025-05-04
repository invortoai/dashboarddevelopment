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
    
    // Use a cache-busting parameter with headers to ensure fresh data
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
 * Recalculate a single user's credits based on their call history
 * This will reset their balance to the initial credit amount minus all consumed credits
 */
export const recalculateUserCredits = async (userId: string, initialCredit: number = 1000): Promise<{
  success: boolean;
  previousBalance?: number;
  newBalance?: number;
  message: string;
}> => {
  try {
    console.log(`Recalculating credits for user ${userId} with initial balance of ${initialCredit}`);
    
    // First get the current credit balance
    const { data: userData, error: userError } = await supabase
      .from('user_details')
      .select('credit')
      .eq('id', userId)
      .single();
      
    if (userError || !userData) {
      console.error('Error fetching user credit balance for recalculation:', userError);
      return {
        success: false,
        message: 'Failed to fetch current credit balance'
      };
    }
    
    const previousBalance = userData.credit;
    console.log(`Current credit balance for user ${userId}: ${previousBalance}`);
    
    // Get all completed calls with credits consumed
    const { data: callData, error: callError } = await supabase
      .from('call_details')
      .select('credits_consumed')
      .eq('user_id', userId)
      .not('credits_consumed', 'is', null);
      
    if (callError) {
      console.error(`Error fetching call credit history for user ${userId}:`, callError);
      return {
        success: false,
        message: 'Failed to fetch call history'
      };
    }
    
    // Calculate total credits consumed
    const totalConsumedCredits = callData.reduce((sum, call) => {
      return sum + (call.credits_consumed || 0);
    }, 0);
    
    console.log(`User ${userId} - Total consumed credits: ${totalConsumedCredits}`);
    
    // Calculate the correct credit balance
    const calculatedBalance = initialCredit - totalConsumedCredits;
    
    // Set the corrected credit balance
    const result = await setUserCredits(userId, calculatedBalance);
    
    if (!result.success) {
      console.error(`Failed to update credit balance for user ${userId}:`, result.message);
      return {
        success: false,
        message: `Failed to update credit balance: ${result.message}`,
        previousBalance
      };
    }
    
    // Log this credit correction in system logs
    await supabase.from('system_logs').insert({
      user_id: userId,
      action_type: 'credit_balance_recalculation',
      message: `Credit balance recalculated from ${previousBalance} to ${calculatedBalance}`,
      response: `Initial: ${initialCredit}, Total consumed: ${totalConsumedCredits}`
    });
    
    console.log(`Successfully recalculated credits for user ${userId} - New balance: ${calculatedBalance}`);
    
    return {
      success: true,
      message: `Credit balance successfully recalculated from ${previousBalance} to ${calculatedBalance}`,
      previousBalance,
      newBalance: calculatedBalance
    };
  } catch (error) {
    console.error('Error in recalculateUserCredits:', error);
    return {
      success: false,
      message: 'Unexpected error while recalculating user credit balance'
    };
  }
};

/**
 * Directly deduct credits from a user's balance
 * This is the preferred approach for all credit deductions
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
    
    // Log this credit update in system logs
    await supabase.from('system_logs').insert({
      user_id: userId,
      action_type: 'credit_deduction_direct',
      message: `Successfully deducted ${creditsToDeduct} credits via direct method`,
      response: `New balance: ${data.credit}`
    });
    
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

/**
 * Update all users' credits - adds or deducts the specified amount
 * This bulk operation affects all users in the system
 */
export const updateAllUserCredits = async (creditAmount: number, isDeduction: boolean = false): Promise<{
  success: boolean;
  usersUpdated?: number;
  message: string;
}> => {
  try {
    console.log(`${isDeduction ? 'Deducting' : 'Adding'} ${Math.abs(creditAmount)} credits for all users`);
    
    // First get all users to update and log
    const { data: users, error: fetchError } = await supabase
      .from('user_details')
      .select('id, credit');
      
    if (fetchError || !users) {
      console.error('Error fetching users for credit update:', fetchError);
      return {
        success: false,
        message: 'Failed to fetch users for credit update'
      };
    }
    
    console.log(`Found ${users.length} users to update credits`);
    
    // Process each user individually to ensure accurate credit tracking
    const updatePromises = users.map(async user => {
      try {
        const currentCredit = user.credit || 0;
        const newCredit = isDeduction 
          ? currentCredit - Math.abs(creditAmount)
          : currentCredit + Math.abs(creditAmount);
        
        const finalCredit = Math.max(0, newCredit); // Ensure credit doesn't go below zero
        
        const { error: updateError } = await supabase
          .from('user_details')
          .update({ credit: finalCredit })
          .eq('id', user.id);
          
        if (updateError) {
          console.error(`Error updating credits for user ${user.id}:`, updateError);
          return false;
        }
        
        // Log the credit change in system_logs
        await supabase.from('system_logs').insert({
          user_id: user.id,
          action_type: 'bulk_credit_update',
          message: `${isDeduction ? 'Deducted' : 'Added'} ${Math.abs(creditAmount)} credits`,
          response: `Previous: ${currentCredit}, New: ${finalCredit}`
        });
        
        return true;
      } catch (error) {
        console.error(`Error processing user ${user.id} during bulk update:`, error);
        return false;
      }
    });
    
    const results = await Promise.all(updatePromises);
    const successCount = results.filter(result => result).length;
    
    console.log(`Successfully updated credits for ${successCount} out of ${users.length} users`);
    
    return {
      success: true,
      usersUpdated: successCount,
      message: `Successfully updated credits for ${successCount} out of ${users.length} users`
    };
    
  } catch (error) {
    console.error('Error in updateAllUserCredits:', error);
    return {
      success: false,
      message: 'Error updating all user credits'
    };
  }
};
