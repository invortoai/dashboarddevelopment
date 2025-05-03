
import { supabase } from '../supabaseClient';
import { CallDetails } from '../../types';

export const getCallStatusFromDetails = async (callDetailId: string): Promise<{
  success: boolean;
  message: string;
  callStatus?: string;
  callData?: Partial<CallDetails>;
  isComplete?: boolean;
}> => {
  try {
    console.log('Fetching call status from call_details for ID:', callDetailId);
    
    // Query the call_details table directly for status information
    const { data, error } = await supabase
      .from('call_details')
      .select('call_status, call_duration, transcript, call_recording, summary')
      .eq('id', callDetailId)
      .single();
      
    if (error) {
      console.error('Error fetching call status from details:', error);
      return { success: false, message: 'Could not retrieve call status' };
    }
    
    if (!data) {
      return { success: false, message: 'No call status data found' };
    }
    
    console.log('Retrieved call status data from call_details:', data);
    
    // Determine if call is complete based on data
    const isComplete = 
      (data.call_duration !== null) || 
      (data.transcript !== null) || 
      (data.call_recording !== null) ||
      (data.summary !== null) ||
      (data.call_status === 'completed');
    
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
        summary: data.summary
      }
    };
  } catch (error) {
    console.error('Get call status error:', error);
    return { success: false, message: 'Failed to retrieve call status' };
  }
};
