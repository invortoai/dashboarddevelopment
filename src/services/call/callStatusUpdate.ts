
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
    
    // Ensure call_duration is an integer for call_details table
    if (data.callDuration !== undefined) {
      // For call_log (can be float)
      updateObject.call_duration = data.callDuration;
    }
    
    // Calculate credits consumed based on call duration
    if (data.callDuration !== undefined && data.callDuration > 0) {
      // Calculate credits based on duration (10 credits per minute)
      const CREDITS_PER_MINUTE = 10;
      const durationMinutes = data.callDuration / 60;
      
      // Always use minimum of 10 credits for any successful call
      updateObject.credits_consumed = Math.max(CREDITS_PER_MINUTE, Math.ceil(durationMinutes * CREDITS_PER_MINUTE));
      console.log(`Calculated credits consumed: ${updateObject.credits_consumed} for ${data.callDuration} seconds`);
    } else if (data.creditsConsumed !== undefined) {
      updateObject.credits_consumed = data.creditsConsumed;
    }
    
    // Only update if we have actual data
    if (Object.keys(updateObject).length > 0) {
      console.log('Updating call_log with completion data:', updateObject);
      
      // Update the call_log table with processed data
      const { error: logError } = await supabase
        .from('call_log')
        .update(updateObject)
        .eq('call_detail_id', callId);
        
      if (logError) throw logError;
      
      // For call_details table, ensure call_duration is an integer
      if (updateObject.call_duration !== undefined) {
        updateObject.call_duration = Math.round(updateObject.call_duration);
      }
      
      // Update the call_details table with the same data
      const { error: callError } = await supabase
        .from('call_details')
        .update(updateObject)
        .eq('id', callId);
        
      if (callError) throw callError;
    }
    
    // Record call completion activity
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: 'call_completed',
      timestamp: new Date().toISOString(),
      call_detail_id: callId
    });
    
    // Deduct credits from the user's balance if we know how many to deduct
    if (updateObject.credits_consumed) {
      console.log(`Deducting ${updateObject.credits_consumed} credits from user ${userId}`);
      const { error: creditError } = await supabase.rpc('update_user_credits', {
        user_id_param: userId,
        credits_to_deduct: updateObject.credits_consumed
      });
      
      if (creditError) {
        console.error('Error updating user credits:', creditError);
        throw creditError;
      }
    }
    
    return { success: true, message: 'Call completion data updated successfully' };
  } catch (error) {
    console.error('Update call completion error:', error);
    return { success: false, message: 'Failed to update call completion data' };
  }
};
