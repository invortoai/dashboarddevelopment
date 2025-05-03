
import { supabase } from '../supabaseClient';
import { getCurrentISTDateTime } from '../../utils/dateUtils';

export const submitFeedback = async (
  userId: string, 
  callId: string, 
  feedback: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const currentTime = getCurrentISTDateTime();
    
    // Check if feedback already exists in call_details
    const { data: existingCall } = await supabase
      .from('call_details')
      .select('feedback')
      .eq('id', callId)
      .single();
    
    let activityType = 'feedback_added';
    let updatedFeedback = feedback;
    
    // If feedback exists, append the new feedback
    if (existingCall && existingCall.feedback) {
      updatedFeedback = `${existingCall.feedback}\n\n${currentTime}: ${feedback}`;
      activityType = 'feedback_edited';
    } else {
      updatedFeedback = `${currentTime}: ${feedback}`;
    }
    
    // Update the feedback in call_details
    const { error: feedbackDetailError } = await supabase
      .from('call_details')
      .update({ feedback: updatedFeedback })
      .eq('id', callId);
      
    if (feedbackDetailError) throw feedbackDetailError;
    
    // Update the feedback in call_log
    const { error: feedbackLogError } = await supabase
      .from('call_log')
      .update({ feedback: updatedFeedback })
      .eq('call_detail_id', callId);
      
    if (feedbackLogError) throw feedbackLogError;
    
    // Record feedback activity
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: activityType,
      timestamp: currentTime,
      call_detail_id: callId
    });
    
    return { success: true, message: 'Feedback submitted successfully' };
  } catch (error) {
    console.error('Submit feedback error:', error);
    return { success: false, message: 'Failed to submit feedback' };
  }
};
