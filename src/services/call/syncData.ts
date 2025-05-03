
import { supabase } from '../supabaseClient';

export const syncCallLogToCallDetails = async (callDetailId: string): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
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
    
    return { success: true, message: 'Call log data synced to call details successfully' };
  } catch (error) {
    console.error('Sync call log to details error:', error);
    return { success: false, message: 'Failed to sync call log data to call details' };
  }
};
