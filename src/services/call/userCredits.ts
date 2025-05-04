
import { supabase } from '../supabaseClient';

/**
 * Get the current credit balance for a user
 */
export const getCurrentCredits = async (userId: string): Promise<{ 
  success: boolean; 
  credits?: number; 
  message?: string;
}> => {
  try {
    const { data, error } = await supabase
      .from('user_details')
      .select('credit')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error getting current credits:', error);
      return { 
        success: false, 
        message: 'Failed to retrieve credit balance' 
      };
    }
    
    return {
      success: true,
      credits: data.credit
    };
  } catch (error) {
    console.error('Get current credits error:', error);
    return { 
      success: false, 
      message: 'Failed to retrieve credit balance' 
    };
  }
};

/**
 * Manually update user credits by a specific amount
 */
export const updateUserCreditsManually = async (
  userId: string, 
  creditsToDeduct: number
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    // First get current credits
    const { data, error } = await supabase
      .from('user_details')
      .select('credit')
      .eq('id', userId)
      .single();
      
    if (error) {
      throw error;
    }
    
    const currentCredits = data.credit;
    const newCreditValue = Math.max(0, currentCredits - creditsToDeduct);
    
    console.log(`Manual credit update: Current=${currentCredits}, Deduct=${creditsToDeduct}, New=${newCreditValue}`);
    
    // Update with new value
    const { error: updateError } = await supabase
      .from('user_details')
      .update({ credit: newCreditValue })
      .eq('id', userId);
      
    if (updateError) {
      throw updateError;
    }
    
    return {
      success: true,
      message: `Successfully updated credits: deducted ${creditsToDeduct} credits`
    };
  } catch (error) {
    console.error('Error manually updating user credits:', error);
    return {
      success: false,
      message: 'Failed to update user credits manually'
    };
  }
};
