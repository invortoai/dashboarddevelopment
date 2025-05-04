
import { supabase } from '../supabaseClient';
import { CallDetails } from '../../types';
import { syncCallLogToCallDetails } from './syncData';
import { recalculateUserCredits } from '../userCredits';

export const getCallStatusFromDetails = async (callDetailId: string): Promise<{
  success: boolean;
  message: string;
  callStatus?: string;
  callData?: Partial<CallDetails>;
  isComplete?: boolean;
}> => {
  try {
    console.log('Fetching call status from call_details for ID:', callDetailId);
    
    // First attempt to sync data from call_log to call_details to ensure we have latest data
    const syncResult = await syncCallLogToCallDetails(callDetailId);
    console.log('Sync result before status check:', syncResult);
    
    // Now query the call_details table for status information
    const { data, error } = await supabase
      .from('call_details')
      .select('call_status, call_duration, transcript, call_recording, summary, credits_consumed, call_log_id, user_id')
      .eq('id', callDetailId)
      .single();
      
    if (error) {
      console.error('Error fetching call status from details:', error);
      
      // If we can't get it from call_details, try from call_log directly
      console.log('Attempting to fetch directly from call_log');
      const { data: logData, error: logError } = await supabase
        .from('call_log')
        .select('call_status, call_duration, transcript, call_recording, summary, credits_consumed, id, user_id')
        .eq('call_detail_id', callDetailId)
        .single();
        
      if (logError || !logData) {
        console.error('Error fetching from call_log as fallback:', logError);
        return { success: false, message: 'Could not retrieve call status from either table' };
      }
      
      console.log('Successfully retrieved data from call_log instead:', logData);
      
      // Use the data from call_log
      const isError = logData.call_status?.toLowerCase().includes('error') || 
                      logData.call_status?.toLowerCase().includes('busy') ||
                      logData.call_status?.toLowerCase().includes('failed');
                      
      const isComplete = 
        (logData.call_duration !== null && logData.call_duration > 0) || 
        (logData.transcript !== null) || 
        (logData.call_recording !== null) ||
        (logData.summary !== null) ||
        (logData.call_status === 'completed') ||
        (logData.call_status?.toLowerCase().includes('complete')) ||
        isError;
        
      // Try to force sync one more time
      await syncCallLogToCallDetails(callDetailId);
      
      // If the call is complete, trigger a credit recalculation for the user
      if (isComplete && logData.user_id) {
        try {
          console.log(`Call is complete, recalculating credits for user ${logData.user_id}`);
          await recalculateUserCredits(logData.user_id);
        } catch (recalcError) {
          console.error('Error recalculating credits after call completion:', recalcError);
        }
      }
      
      return { 
        success: true, 
        message: 'Call status retrieved from call_log', 
        callStatus: logData.call_status,
        isComplete,
        callData: {
          callStatus: logData.call_status,
          callDuration: logData.call_duration,
          transcript: logData.transcript,
          callRecording: logData.call_recording,
          summary: logData.summary,
          creditsConsumed: logData.credits_consumed,
          callLogId: logData.id
        }
      };
    }
    
    if (!data) {
      return { success: false, message: 'No call status data found' };
    }
    
    console.log('Retrieved call status data from call_details:', data);
    
    // Determine if call is complete or has errors
    const isError = data.call_status?.toLowerCase().includes('error') || 
                    data.call_status?.toLowerCase().includes('busy') ||
                    data.call_status?.toLowerCase().includes('failed');
    
    // Determine if call is complete based on data
    const isComplete = 
      (data.call_duration !== null && data.call_duration > 0) || 
      (data.transcript !== null) || 
      (data.call_recording !== null) ||
      (data.summary !== null) ||
      (data.call_status === 'completed') ||
      (data.call_status?.toLowerCase().includes('complete')) ||
      isError;
    
    // If the call is complete, trigger a credit recalculation for the user
    if (isComplete && data.user_id) {
      try {
        console.log(`Call is complete, recalculating credits for user ${data.user_id}`);
        await recalculateUserCredits(data.user_id);
      } catch (recalcError) {
        console.error('Error recalculating credits after call completion:', recalcError);
      }
    }
    
    return { 
      success: true, 
      message: 'Call status retrieved successfully', 
      callStatus: data.call_status,
      isComplete,
      callData: {
        callStatus: data.call_status,
        callDuration: data.call_duration,
        transcript: data.transcript,
        callRecording: data.call_recording,
        summary: data.summary,
        creditsConsumed: data.credits_consumed,
        callLogId: data.call_log_id
      }
    };
  } catch (error) {
    console.error('Get call status error:', error);
    return { success: false, message: 'Failed to retrieve call status' };
  }
};
