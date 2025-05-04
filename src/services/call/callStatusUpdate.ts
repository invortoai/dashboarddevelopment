
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
}): Promise<{ success: boolean; message: string; creditsDeducted?: number }> => {
  try {
    console.log('Starting updateCallCompletion with data:', { callId, userId, ...data });
    
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
    let creditsToDeduct = 0;
    
    if (data.callDuration !== undefined && data.callDuration > 0) {
      // Calculate how many 60-second blocks (or part thereof) the call lasted
      const CREDITS_PER_MINUTE = 10;
      const sixtySecondBlocks = Math.max(1, Math.ceil(data.callDuration / 60));
      
      // Multiply by credits per minute to get total credits
      creditsToDeduct = sixtySecondBlocks * CREDITS_PER_MINUTE;
      
      updateObject.credits_consumed = creditsToDeduct;
      console.log(`Calculated credits consumed: ${updateObject.credits_consumed} for ${data.callDuration} seconds (${sixtySecondBlocks} 60-second blocks)`);
    } else if (data.creditsConsumed !== undefined) {
      creditsToDeduct = data.creditsConsumed;
      updateObject.credits_consumed = data.creditsConsumed;
    } else if (data.callDuration === 0 || data.callDuration === undefined) {
      // For failed or empty calls, charge minimum of 10 credits
      creditsToDeduct = 10;
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
    
    // Ensure we have a valid creditsToDeduct value before proceeding
    if (creditsToDeduct <= 0) {
      creditsToDeduct = 10; // Minimum credits to deduct
    }
    
    console.log(`Attempting to deduct ${creditsToDeduct} credits from user ${userId}`);
    
    // First check the current credit balance for better debugging
    const { data: userData, error: userQueryError } = await supabase
      .from('user_details')
      .select('credit')
      .eq('id', userId)
      .single();

    if (userQueryError) {
      console.error('Error checking user credit balance:', userQueryError);
    } else {
      console.log(`Current user credit balance before deduction: ${userData.credit}`);
    }
    
    // Use the update_user_credits database function instead of direct update
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'update_user_credits', 
      { 
        user_id_param: userId, 
        credits_to_deduct: creditsToDeduct 
      }
    );
    
    if (rpcError) {
      console.error('Error calling update_user_credits:', rpcError);
      throw rpcError;
    }
    
    // Verify the deduction was successful by checking the updated balance
    const { data: updatedUserData, error: updatedUserError } = await supabase
      .from('user_details')
      .select('credit')
      .eq('id', userId)
      .single();
      
    if (updatedUserError) {
      console.error('Error verifying credit update:', updatedUserError);
    } else {
      console.log(`Updated user credit balance after deduction: ${updatedUserData.credit}`);
      console.log(`Credits deducted: ${userData?.credit - updatedUserData.credit}`);
    }
    
    return { 
      success: true, 
      message: 'Call completion data updated successfully',
      creditsDeducted: creditsToDeduct
    };
  } catch (error) {
    console.error('Update call completion error:', error);
    return { success: false, message: 'Failed to update call completion data' };
  }
};
