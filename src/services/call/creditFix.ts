
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
 * Fix the specified user's credit balance based on call history
 * This recalculates the correct balance based on all historical calls
 */
export const recalculateUserCredits = async (userId: string, initialCredit: number = 1000): Promise<{
  success: boolean;
  message: string;
  previousBalance?: number;
  calculatedBalance?: number;
  totalConsumedCredits?: number;
}> => {
  try {
    // First get current credit balance
    const { data: userData, error: userError } = await supabase
      .from('user_details')
      .select('credit')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('Error fetching user credit balance for recalculation:', userError);
      return {
        success: false,
        message: 'Failed to fetch current credit balance'
      };
    }
    
    const previousBalance = userData.credit;
    
    // Get all completed calls with credits consumed
    const { data: callData, error: callError } = await supabase
      .from('call_details')
      .select('credits_consumed')
      .eq('user_id', userId)
      .not('credits_consumed', 'is', null);
      
    if (callError) {
      console.error('Error fetching call credit history:', callError);
      return {
        success: false,
        message: 'Failed to fetch call credit history',
        previousBalance
      };
    }
    
    // Calculate total credits consumed
    const totalConsumedCredits = callData.reduce((sum, call) => {
      return sum + (call.credits_consumed || 0);
    }, 0);
    
    console.log(`Total consumed credits for user ${userId}: ${totalConsumedCredits}`);
    
    // Calculate the correct credit balance
    const calculatedBalance = initialCredit - totalConsumedCredits;
    
    // Set the corrected credit balance
    const result = await setUserCredits(userId, calculatedBalance);
    
    if (!result.success) {
      return {
        success: false,
        message: `Failed to set recalculated credit balance: ${result.message}`,
        previousBalance,
        calculatedBalance,
        totalConsumedCredits
      };
    }
    
    // Log this credit correction in system logs
    await supabase.from('system_logs').insert({
      user_id: userId,
      action_type: 'credit_balance_recalculation',
      message: `Credit balance recalculated from ${previousBalance} to ${calculatedBalance}`,
      response: `Initial: ${initialCredit}, Total consumed: ${totalConsumedCredits}`
    });
    
    return {
      success: true,
      message: `Credit balance successfully recalculated from ${previousBalance} to ${calculatedBalance}`,
      previousBalance,
      calculatedBalance,
      totalConsumedCredits
    };
  } catch (error) {
    console.error('Error in recalculateUserCredits:', error);
    return {
      success: false,
      message: 'Unexpected error while recalculating user credit balance'
    };
  }
};

// Fix the specific user mentioned in the request (b36cd024-3f22-43f0-af73-9da43bcf0884)
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

// Initialize the fix on module import (will run once when first imported)
(async () => {
  console.log('Running one-time credit fix for user b36cd024-3f22-43f0-af73-9da43bcf0884');
  const result = await fixSpecificUser();
  console.log('Credit fix result:', result);
})();
