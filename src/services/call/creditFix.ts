import { supabase } from '../supabaseClient';
import { setUserCredits } from '../userCredits';

/**
 * Fix user credit balance for a specific user
 */
export const fixUserCreditBalance = async (userId: string, correctCreditAmount: number): Promise<{
  success: boolean;
  message: string;
  previousBalance?: number;
  newBalance?: number;
}> => {
  try {
    // First get current credit balance
    const { data, error } = await supabase
      .from('user_details')
      .select('credit')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user credit balance for fix:', error);
      return {
        success: false,
        message: 'Failed to fetch current credit balance'
      };
    }
    
    const previousBalance = data.credit;
    console.log(`Current credit balance for user ${userId}: ${previousBalance}`);
    
    // Set the corrected credit balance
    const result = await setUserCredits(userId, correctCreditAmount);
    
    if (!result.success) {
      return {
        success: false,
        message: `Failed to set corrected credit balance: ${result.message}`,
        previousBalance
      };
    }
    
    // Log this credit correction in system logs
    await supabase.from('system_logs').insert({
      user_id: userId,
      action_type: 'credit_balance_correction',
      message: `Credit balance manually corrected from ${previousBalance} to ${correctCreditAmount}`,
      response: `Correction was successful`
    });
    
    return {
      success: true,
      message: `Credit balance successfully corrected from ${previousBalance} to ${correctCreditAmount}`,
      previousBalance,
      newBalance: correctCreditAmount
    };
  } catch (error) {
    console.error('Error in fixUserCreditBalance:', error);
    return {
      success: false,
      message: 'Unexpected error while fixing user credit balance'
    };
  }
};

/**
 * Fix the specified user mentioned in the request (b36cd024-3f22-43f0-af73-9da43bcf0884)
 */
export const fixSpecificUser = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  const userId = 'b36cd024-3f22-43f0-af73-9da43bcf0884';
  const correctAmount = 700; // Set to 700 as specified
  
  try {
    const result = await fixUserCreditBalance(userId, correctAmount);
    return {
      success: result.success,
      message: result.message
    };
  } catch (error) {
    console.error('Error fixing specific user:', error);
    return {
      success: false,
      message: 'Error fixing specific user credit balance'
    };
  }
};

/**
 * Fix the credit balance for all users in the system
 * This will recalculate credits based on call history for each user
 */
export const fixAllUserCredits = async (initialCredit: number = 1000): Promise<{
  success: boolean;
  message: string;
  usersUpdated?: number;
  errors?: string[];
}> => {
  try {
    console.log(`Starting credit balance recalculation for all users with initial balance of ${initialCredit}`);
    
    // First get all users
    const { data: userData, error: userError } = await supabase
      .from('user_details')
      .select('id, credit');
      
    if (userError || !userData) {
      console.error('Error fetching users for credit recalculation:', userError);
      return {
        success: false,
        message: 'Failed to fetch user list'
      };
    }
    
    console.log(`Found ${userData.length} users for credit balance recalculation`);
    
    const results = [];
    const errors = [];
    
    // Process each user individually
    for (const user of userData) {
      try {
        console.log(`Recalculating credits for user ${user.id}`);
        
        // Get all completed calls with credits consumed
        const { data: callData, error: callError } = await supabase
          .from('call_details')
          .select('credits_consumed')
          .eq('user_id', user.id)
          .not('credits_consumed', 'is', null);
          
        if (callError) {
          console.error(`Error fetching call credit history for user ${user.id}:`, callError);
          errors.push(`Failed to fetch call history for user ${user.id}`);
          continue;
        }
        
        // Calculate total credits consumed
        const totalConsumedCredits = callData.reduce((sum, call) => {
          return sum + (call.credits_consumed || 0);
        }, 0);
        
        console.log(`User ${user.id} - Total consumed credits: ${totalConsumedCredits}, Current balance: ${user.credit}`);
        
        // Calculate the correct credit balance
        const calculatedBalance = initialCredit - totalConsumedCredits;
        
        // Set the corrected credit balance
        const result = await setUserCredits(user.id, calculatedBalance);
        
        if (!result.success) {
          console.error(`Failed to update credit balance for user ${user.id}:`, result.message);
          errors.push(`Failed to update credit balance for user ${user.id}: ${result.message}`);
          continue;
        }
        
        // Log this credit correction in system logs
        await supabase.from('system_logs').insert({
          user_id: user.id,
          action_type: 'credit_balance_recalculation',
          message: `Credit balance recalculated from ${user.credit} to ${calculatedBalance}`,
          response: `Initial: ${initialCredit}, Total consumed: ${totalConsumedCredits}`
        });
        
        results.push({
          userId: user.id,
          previousBalance: user.credit,
          newBalance: calculatedBalance,
          totalConsumed: totalConsumedCredits
        });
        
        console.log(`Successfully recalculated credits for user ${user.id} - New balance: ${calculatedBalance}`);
      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        errors.push(`Error processing user ${user.id}: ${userError.message || 'Unknown error'}`);
      }
    }
    
    return {
      success: true,
      message: `Successfully recalculated credit balances for ${results.length} out of ${userData.length} users`,
      usersUpdated: results.length,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    console.error('Error in fixAllUserCredits:', error);
    return {
      success: false,
      message: 'Unexpected error while fixing all user credit balances'
    };
  }
};

// Initialize the fix on module import (commenting out the one-time fix for specific user)
(async () => {
  // Replace the specific user fix with the all users fix
  console.log('Running credit recalculation for ALL users');
  const result = await fixAllUserCredits();
  console.log('Credit recalculation result:', result);
})();
