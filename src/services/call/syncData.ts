
import { supabase } from '../supabaseClient';

// Sync data from call_log to call_details for a specific call
export const syncCallLogToCallDetails = async (callDetailId: string): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    console.log('Syncing data from call_log to call_details for ID:', callDetailId);
    
    // Get the call log data for this call detail ID
    const { data: callLogData, error: callLogError } = await supabase
      .from('call_log')
      .select('*')
      .eq('call_detail_id', callDetailId)
      .single();
      
    if (callLogError || !callLogData) {
      console.error('Error fetching call log data:', callLogError);
      return { success: false, message: 'Could not find call log data to sync' };
    }
    
    // Update call_details with data from call_log
    const { error: updateError } = await supabase
      .from('call_details')
      .update({
        call_attempted: callLogData.call_attempted,
        call_log_id: callLogData.id,
        call_status: callLogData.call_status,
        call_duration: callLogData.call_duration,
        call_time: callLogData.call_time,
        summary: callLogData.summary,
        call_recording: callLogData.call_recording,
        transcript: callLogData.transcript,
        credits_consumed: callLogData.credits_consumed, // Make sure credits are synced
        feedback: callLogData.feedback
      })
      .eq('id', callDetailId);
      
    if (updateError) {
      console.error('Error syncing call data:', updateError);
      return { success: false, message: 'Failed to sync call data' };
    }
    
    console.log('Successfully synced call data from call_log to call_details');
    return { success: true, message: 'Call data synced successfully' };
  } catch (error) {
    console.error('Sync call log to call details error:', error);
    return { success: false, message: 'Failed to sync call data' };
  }
};

// Auto-sync multiple calls for a specific user
export const autoSyncCallLogToDetails = async (userId: string): Promise<{
  success: boolean;
  message: string;
  synced?: number;
}> => {
  try {
    console.log('Auto-syncing all calls for user:', userId);
    
    // Get all call_log entries for this user
    const { data: callLogData, error: callLogError } = await supabase
      .from('call_log')
      .select('*')
      .eq('user_id', userId);
      
    if (callLogError) {
      console.error('Error fetching call logs:', callLogError);
      return { success: false, message: 'Error retrieving call logs' };
    }
    
    if (!callLogData || callLogData.length === 0) {
      console.log('No call logs found for user:', userId);
      return { success: true, message: 'No call logs to sync', synced: 0 };
    }
    
    console.log(`Found ${callLogData.length} call log entries to sync`);
    
    // Sync each call
    let syncedCount = 0;
    for (const log of callLogData) {
      if (log.call_detail_id) {
        const result = await syncCallLogToCallDetails(log.call_detail_id);
        if (result.success) {
          syncedCount++;
        }
      }
    }
    
    return { 
      success: true, 
      message: `Synced ${syncedCount} call records successfully`, 
      synced: syncedCount 
    };
  } catch (error) {
    console.error('Auto sync error:', error);
    return { success: false, message: 'Error during auto-sync process' };
  }
};
