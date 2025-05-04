
import { supabase } from '../supabaseClient';

export const updateCallStatus = async (callId: string, data: {
  callAttempted?: boolean;
  callLogId?: string;
  callStatus?: string;
  callTime?: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    // Update the call_log table with only verified status information
    if (data.callAttempted !== undefined || data.callStatus !== undefined || data.callTime !== undefined) {
      await supabase
        .from('call_log')
        .update({
          call_attempted: data.callAttempted,
          call_status: data.callStatus,
          call_time: data.callTime,
        })
        .eq('call_detail_id', callId);
    }
    
    // Update the call_details table
    await supabase
      .from('call_details')
      .update({
        call_attempted: data.callAttempted,
        call_log_id: data.callLogId,
        call_status: data.callStatus,
        call_time: data.callTime,
      })
      .eq('id', callId);
      
    return { success: true, message: 'Call status updated successfully' };
  } catch (error) {
    console.error('Update call status error:', error);
    return { success: false, message: 'Failed to update call status' };
  }
};

export const updateCallCompletion = async (callId: string, userId: string, data: {
  summary?: string;
  callRecording?: string;
  transcript?: string;
  callDuration?: number;
  creditsConsumed?: number;
}): Promise<{ success: boolean; message: string }> => {
  try {
    // Only update fields that have actual processed data, not dummy values
    let updateObject: any = {};
    
    if (data.summary) updateObject.summary = data.summary;
    if (data.callRecording) updateObject.call_recording = data.callRecording;
    if (data.transcript) updateObject.transcript = data.transcript;
    
    // Ensure call_duration is a number for call_log table
    if (data.callDuration !== undefined) {
      updateObject.call_duration = data.callDuration;
    }
    
    // Calculate credits consumed based on call duration
    // NEW LOGIC: 10 credits for every 60 seconds (or part thereof) of call duration
    // IMPORTANT: Only calculate credits if call duration > 0
    if (data.callDuration !== undefined && data.callDuration > 0) {
      // Calculate how many 60-second blocks (or part thereof) the call lasted
      const CREDITS_PER_MINUTE = 10;
      const sixtySecondBlocks = Math.ceil(data.callDuration / 60);
      
      // Multiply by credits per minute to get total credits
      const calculatedCredits = sixtySecondBlocks * CREDITS_PER_MINUTE;
      
      updateObject.credits_consumed = calculatedCredits;
      console.log(`Calculated credits consumed: ${updateObject.credits_consumed} for ${data.callDuration} seconds (${sixtySecondBlocks} 60-second blocks)`);
    } else if (data.creditsConsumed !== undefined) {
      updateObject.credits_consumed = data.creditsConsumed;
    }
    // No else clause for minimum credits - if duration is 0, don't set any credits_consumed
    
    // Only update if we have actual data
    if (Object.keys(updateObject).length > 0) {
      console.log('Updating call_log with completion data:', updateObject);
      
      // Update the call_log table with processed data
      const { error: logError } = await supabase
        .from('call_log')
        .update(updateObject)
        .eq('call_detail_id', callId);
        
      if (logError) {
        console.error('Error updating call_log:', logError);
        throw logError;
      }
      
      // Record call completion activity
      await supabase.from('user_activity').insert({
        user_id: userId,
        activity_type: 'call_completed',
        timestamp: new Date().toISOString(),
        call_detail_id: callId
      });
      
      // Only deduct credits from the user's balance if call had duration > 0 and we calculated credits
      if (updateObject.credits_consumed) {
        console.log(`Deducting ${updateObject.credits_consumed} credits from user ${userId}`);
        const { error: creditError } = await supabase.rpc('update_user_credits', {
          user_id_param: userId,
          credits_to_deduct: updateObject.credits_consumed
        });
        
        if (creditError) {
          console.error('Error updating user credits:', creditError);
          throw creditError;
        } else {
          console.log(`Successfully deducted ${updateObject.credits_consumed} credits from user ${userId}`);
        }
      } else {
        console.log('No credits to deduct since call duration is 0 or not provided');
      }
    }
    
    return { success: true, message: 'Call completion data updated successfully' };
  } catch (error) {
    console.error('Update call completion error:', error);
    return { success: false, message: 'Failed to update call completion data' };
  }
};
