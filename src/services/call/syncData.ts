
import { supabase } from '../supabaseClient';

export const syncCallLogToCallDetails = async (callDetailId: string): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    console.log('Syncing call log data to call details for ID:', callDetailId);
    
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
    
    console.log('Found call log data to sync:', callLogData);
    
    // Update the call_details table with the data from call_log
    const { error: updateError } = await supabase
      .from('call_details')
      .update({
        call_attempted: callLogData.call_attempted,
        call_status: callLogData.call_status,
        call_time: callLogData.call_time,
        call_duration: callLogData.call_duration,
        call_recording: callLogData.call_recording,
        transcript: callLogData.transcript,
        summary: callLogData.summary,
        credits_consumed: callLogData.credits_consumed,
        feedback: callLogData.feedback
      })
      .eq('id', callDetailId);
      
    if (updateError) {
      console.error('Error updating call details:', updateError);
      return { success: false, message: 'Failed to sync call log data to call details' };
    }
    
    console.log('Successfully synced call log data to call details for ID:', callDetailId);
    return { success: true, message: 'Call log data synced to call details successfully' };
  } catch (error) {
    console.error('Sync call log to details error:', error);
    return { success: false, message: 'Failed to sync call log data to call details' };
  }
};

export const autoSyncCallLogToDetails = async (userId: string): Promise<{
  success: boolean;
  message: string;
  synced?: number;
}> => {
  try {
    // Find all call_log records that might have newer data than call_details
    const { data: callLogs, error: callLogsError } = await supabase
      .from('call_log')
      .select('call_detail_id')
      .eq('user_id', userId);
      
    if (callLogsError || !callLogs || callLogs.length === 0) {
      return { success: true, message: 'No call logs found to sync', synced: 0 };
    }
    
    // Extract the call detail IDs
    const callDetailIds = callLogs.map(log => log.call_detail_id);
    console.log('Found call logs to sync for IDs:', callDetailIds);
    
    // Sync each call log with its call detail
    let syncedCount = 0;
    for (const callDetailId of callDetailIds) {
      if (!callDetailId) continue;
      
      const result = await syncCallLogToCallDetails(callDetailId);
      if (result.success) {
        syncedCount++;
      }
    }
    
    return { 
      success: true, 
      message: `Successfully synced ${syncedCount} call records from call_log to call_details`, 
      synced: syncedCount 
    };
  } catch (error) {
    console.error('Auto sync call logs error:', error);
    return { success: false, message: 'Failed to auto-sync call logs to call details' };
  }
};
