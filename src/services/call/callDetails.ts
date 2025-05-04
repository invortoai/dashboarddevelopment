
import { supabase } from '../supabaseClient';
import { CallDetails } from '../../types';

export const getCallDetails = async (callId: string, userId: string): Promise<{
  success: boolean;
  message: string;
  callDetails?: CallDetails;
}> => {
  try {
    const { data, error } = await supabase
      .from('call_details')
      .select('*')
      .eq('id', callId)
      .eq('user_id', userId)
      .single();
      
    if (error) throw error;
    
    const currentTime = new Date().toISOString();
    
    const callDetails: CallDetails = {
      id: data.id,
      userId: data.user_id,
      number: data.number,
      developer: data.developer,
      project: data.project,
      callAttempted: data.call_attempted,
      callLogId: data.call_log_id,
      callStatus: data.call_status,
      summary: data.summary,
      callRecording: data.call_recording,
      transcript: data.transcript,
      callDuration: data.call_duration,
      callTime: data.call_time,
      creditsConsumed: data.credits_consumed,
      feedback: data.feedback,
      createdAt: data.created_at
    };
    
    // Record viewing call details activity
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: 'view_call_details',
      timestamp: currentTime,
      call_detail_id: callId
    });
    
    return { success: true, message: 'Call details retrieved successfully', callDetails };
  } catch (error) {
    console.error('Get call details error:', error);
    return { success: false, message: 'Failed to retrieve call details' };
  }
};

export const viewRecording = async (userId: string, callId: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Record viewing recording activity
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: 'view_recording',
      timestamp: new Date().toISOString(),
      call_detail_id: callId
    });
    
    return { success: true, message: 'Recording view activity recorded' };
  } catch (error) {
    console.error('Record recording view error:', error);
    return { success: false, message: 'Failed to record recording view activity' };
  }
};

export const viewTranscript = async (userId: string, callId: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Record viewing transcript activity
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: 'view_transcript',
      timestamp: new Date().toISOString(),
      call_detail_id: callId
    });
    
    return { success: true, message: 'Transcript view activity recorded' };
  } catch (error) {
    console.error('Record transcript view error:', error);
    return { success: false, message: 'Failed to record transcript view activity' };
  }
};
