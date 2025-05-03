
import { supabase } from '../supabaseClient';

/**
 * Sync a specific call_log entry to call_details
 */
export const syncCallLogToCallDetails = async (callDetailId: string): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    console.log('Syncing call_log to call_details for ID:', callDetailId);
    
    // Get the data from call_log for this specific call detail ID
    const { data: callLogData, error: callLogError } = await supabase
      .from('call_log')
      .select('*')
      .eq('call_detail_id', callDetailId)
      .single();
      
    if (callLogError || !callLogData) {
      console.error('Error fetching call log data:', callLogError);
      return { success: false, message: 'No call log data found to sync' };
    }
    
    // Update the call_details table with the data from call_log
    const { error: updateError } = await supabase
      .from('call_details')
      .update({
        call_log_id: callLogData.id,
        call_status: callLogData.call_status,
        call_attempted: callLogData.call_attempted,
        call_duration: callLogData.call_duration,
        call_time: callLogData.call_time,
        credits_consumed: callLogData.credits_consumed,
        summary: callLogData.summary,
        call_recording: callLogData.call_recording,
        transcript: callLogData.transcript,
        feedback: callLogData.feedback
      })
      .eq('id', callDetailId);
      
    if (updateError) {
      console.error('Error syncing data to call_details:', updateError);
      return { success: false, message: 'Failed to sync data to call details' };
    }
    
    return { success: true, message: 'Successfully synced call log data to call details' };
  } catch (error) {
    console.error('Sync call log to call details error:', error);
    return { success: false, message: 'Failed to sync call log to call details' };
  }
};

/**
 * Sync all call_log entries to call_details for a user
 */
export const autoSyncCallLogToDetails = async (userId: string): Promise<{
  success: boolean;
  message: string;
  syncCount?: number;
}> => {
  try {
    console.log('Auto-syncing call_log to call_details for user ID:', userId);
    
    // Get all call_details entries for this user
    const { data: callDetails, error: detailsError } = await supabase
      .from('call_details')
      .select('id, call_log_id')
      .eq('user_id', userId);
      
    if (detailsError) {
      console.error('Error fetching call details:', detailsError);
      return { success: false, message: 'Failed to fetch call details for sync' };
    }
    
    // For each call detail, sync from call_log
    let syncCount = 0;
    for (const detail of callDetails) {
      if (detail.id) {
        const result = await syncCallLogToCallDetails(detail.id);
        if (result.success) syncCount++;
      }
    }
    
    return { 
      success: true, 
      message: `Synced all records`, 
      syncCount 
    };
  } catch (error) {
    console.error('Auto sync call log to details error:', error);
    return { success: false, message: 'Failed to auto-sync call logs to call details' };
  }
};
