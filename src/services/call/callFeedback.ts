
import { supabase } from '../supabaseClient';
import { formatToIST, getCurrentISTDateTime } from '../../utils/dateUtils';

export const submitFeedback = async (
  userId: string,
  callDetailId: string,
  feedback: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Get existing feedback first
    const { data: existingData, error: fetchError } = await supabase
      .from('call_details')
      .select('feedback')
      .eq('id', callDetailId)
      .eq('user_id', userId)
      .single();
      
    if (fetchError) throw fetchError;
    
    // Format the new feedback with timestamp using the same format as call information
    const timestamp = formatToIST(new Date());
    const formattedNewFeedback = `[${timestamp}]: ${feedback}`;
    
    // Combine existing feedback with new feedback
    let updatedFeedback = formattedNewFeedback;
    if (existingData && existingData.feedback) {
      updatedFeedback = `${existingData.feedback}\n\n${formattedNewFeedback}`;
    }
    
    // Update both tables for consistency
    const { error: callDetailsError } = await supabase
      .from('call_details')
      .update({ feedback: updatedFeedback })
      .eq('id', callDetailId)
      .eq('user_id', userId);
      
    if (callDetailsError) throw callDetailsError;
    
    // Also update the call_log table to keep them in sync
    const { error: callLogError } = await supabase
      .from('call_log')
      .update({ feedback: updatedFeedback })
      .eq('call_detail_id', callDetailId)
      .eq('user_id', userId);
      
    if (callLogError) throw callLogError;
    
    // Record feedback activity
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: 'submit_feedback',
      timestamp: getCurrentISTDateTime(),
      call_detail_id: callDetailId
    });
    
    return { success: true, message: 'Feedback submitted successfully' };
  } catch (error) {
    console.error('Submit feedback error:', error);
    return { success: false, message: 'Failed to submit feedback' };
  }
};
