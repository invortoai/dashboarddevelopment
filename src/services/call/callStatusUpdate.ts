
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
    
    // Always ensure call_duration is properly set as a number for call_details table
    if (data.callDuration !== undefined) {
      updateObject.call_duration = data.callDuration;
    }
    
    // Calculate credits consumed based on call duration
    // Minimum 10 credits for ANY call with duration > 0
    // 10 credits for every 60 seconds (or part thereof) of call duration
    if (data.callDuration !== undefined && data.callDuration > 0) {
      // Calculate how many 60-second blocks (or part thereof) the call lasted
      const CREDITS_PER_MINUTE = 10;
      const sixtySecondBlocks = Math.max(1, Math.ceil(data.callDuration / 60));
      
      // Multiply by credits per minute to get total credits
      const calculatedCredits = sixtySecondBlocks * CREDITS_PER_MINUTE;
      
      updateObject.credits_consumed = calculatedCredits;
      console.log(`Calculated credits consumed: ${updateObject.credits_consumed} for ${data.callDuration} seconds (${sixtySecondBlocks} 60-second blocks)`);
    } else if (data.creditsConsumed !== undefined) {
      updateObject.credits_consumed = data.creditsConsumed;
    } else if (data.callDuration === 0 || data.callDuration === undefined) {
      // For failed or empty calls, charge minimum of 10 credits
      updateObject.credits_consumed = 10;
      console.log('No call duration recorded, charging minimum 10 credits');
    }
    
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
      
      // For call_details table, ensure call_duration is an integer
      if (updateObject.call_duration !== undefined) {
        updateObject.call_duration = Math.round(updateObject.call_duration);
      }
      
      // Update the call_details table with the same data
      const { error: callError } = await supabase
        .from('call_details')
        .update(updateObject)
        .eq('id', callId);
        
      if (callError) {
        console.error('Error updating call_details:', callError);
        throw callError;
      }
      
      console.log('Successfully updated both tables with credit consumption:', updateObject.credits_consumed);
    }
    
    // Record call completion activity
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: 'call_completed',
      timestamp: new Date().toISOString(),
      call_detail_id: callId
    });
    
    // Make sure we have a creditsToDeduct value
    const creditsToDeduct = updateObject.credits_consumed || 10;
    
    console.log(`Deducting ${creditsToDeduct} credits from user ${userId}`);
    
    // FIXED: Add explicit log to debug database function call
    console.log('Calling update_user_credits database function with params:', {
      user_id_param: userId,
      credits_to_deduct: creditsToDeduct
    });
    
    // Explicitly call the update_user_credits function to deduct credits
    const { data: creditUpdateResult, error: creditError } = await supabase.rpc('update_user_credits', {
      user_id_param: userId,
      credits_to_deduct: creditsToDeduct
    });
    
    if (creditError) {
      console.error('Error updating user credits:', creditError);
      
      // Additional debugging information
      console.error('Credit update parameters:', {
        userId,
        creditsToDeduct
      });
      
      // FIXED: Try direct update as a fallback if the RPC fails
      console.log('Attempting direct update to user_details table as fallback');
      const { error: directUpdateError } = await supabase
        .from('user_details')
        .update({ 
          credit: supabase.rpc('get_current_credits', { user_id_param: userId }) - creditsToDeduct 
        })
        .eq('id', userId);
        
      if (directUpdateError) {
        console.error('Error with direct credit update:', directUpdateError);
        throw directUpdateError;
      }
      
      // Try to get user details to verify user exists
      const { data: userCheck, error: userCheckError } = await supabase
        .from('user_details')
        .select('id, credit')
        .eq('id', userId)
        .single();
        
      if (userCheckError) {
        console.error('Error checking user details:', userCheckError);
      } else {
        console.log('User details found:', userCheck);
      }
    } else {
      console.log(`Successfully deducted ${creditsToDeduct} credits from user ${userId}`);
    }
    
    return { success: true, message: 'Call completion data updated successfully' };
  } catch (error) {
    console.error('Update call completion error:', error);
    return { success: false, message: 'Failed to update call completion data' };
  }
};
