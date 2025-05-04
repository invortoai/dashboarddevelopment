
import { supabase } from '../supabaseClient';
import { CallDetails } from '../../types';

export const getCallLogData = async (callDetailId: string): Promise<{
  success: boolean;
  message: string;
  callData?: CallDetails;
}> => {
  try {
    console.log('Fetching call log data for ID:', callDetailId);
    
    // Get the call log data for this call detail ID
    const { data: callLogData, error: callLogError } = await supabase
      .from('call_log')
      .select('*')
      .eq('call_detail_id', callDetailId)
      .single();
      
    if (callLogError || !callLogData) {
      console.error('Error fetching call log data:', callLogError);
      return { success: false, message: 'Could not find call log data' };
    }
    
    console.log('Found call log data:', callLogData);
    
    // Transform call log data to match CallDetails type
    const callData: CallDetails = {
      id: callDetailId,
      userId: callLogData.user_id,
      number: callLogData.number,
      developer: callLogData.developer,
      project: callLogData.project,
      callAttempted: callLogData.call_attempted || true, // Default to true if present in call_log
      callLogId: callLogData.id,
      callStatus: callLogData.call_status || null, // Using actual status from call_log
      summary: callLogData.summary,
      callRecording: callLogData.call_recording,
      transcript: callLogData.transcript,
      callDuration: callLogData.call_duration,
      callTime: callLogData.call_time,
      creditsConsumed: callLogData.credits_consumed,
      feedback: callLogData.feedback,
      createdAt: callLogData.created_at
    };
    
    return { success: true, message: 'Call log data retrieved successfully', callData };
  } catch (error) {
    console.error('Get call log data error:', error);
    return { success: false, message: 'Failed to retrieve call log data' };
  }
};

export const getCallHistory = async (userId: string): Promise<{ 
  success: boolean; 
  message: string; 
  callHistory?: CallDetails[] 
}> => {
  try {
    console.log('Fetching call history from call_log for user ID:', userId);
    
    // Get data directly from call_log table
    const { data, error } = await supabase
      .from('call_log')
      .select('*, call_details(id)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching call history from call_log:', error);
      throw error;
    }
    
    // Transform the data to match our CallDetails type
    const callHistory: CallDetails[] = data.map(call => ({
      id: call.call_details?.id || call.call_detail_id,
      userId: call.user_id,
      number: call.number,
      developer: call.developer,
      project: call.project,
      callAttempted: call.call_attempted || true, // Default to true if in call_log
      callLogId: call.id,
      callStatus: call.call_status || null, // Using actual status from call_log
      summary: call.summary,
      callRecording: call.call_recording,
      transcript: call.transcript,
      callDuration: call.call_duration,
      callTime: call.call_time,
      creditsConsumed: call.credits_consumed,
      feedback: call.feedback,
      createdAt: call.created_at
    }));
    
    return { success: true, message: 'Call history retrieved successfully', callHistory };
  } catch (error) {
    console.error('Get call history error:', error);
    return { success: false, message: 'Failed to retrieve call history' };
  }
};
