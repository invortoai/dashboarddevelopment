import { supabase } from './supabaseClient';
import { CallDetails, UserActivity } from '../types';
import { getCurrentISTDateTime } from '../utils/dateUtils';

const WEBHOOK_URL = 'https://n8n.srv743759.hstgr.cloud/webhook/1845214a-2b66-4b02-86fa-379cfd38fef3';
const CREDITS_PER_MINUTE = 10;

export const initiateCall = async (userId: string, number: string, developer: string, project: string): Promise<{ 
  success: boolean; 
  message: string; 
  callDetails?: CallDetails
}> => {
  try {
    // Check user's credit balance
    const { data: user, error: userError } = await supabase
      .from('user_details')
      .select('credit')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      return { success: false, message: 'Could not verify user credits' };
    }
    
    if (user.credit < CREDITS_PER_MINUTE) {
      return { success: false, message: 'Insufficient credits to make a call' };
    }
    
    const currentTime = getCurrentISTDateTime();
    
    // First create the call details entry in the database
    const { data: newCall, error: callError } = await supabase
      .from('call_details')
      .insert({
        user_id: userId,
        number,
        developer,
        project,
        created_at: currentTime,
      })
      .select()
      .single();
      
    if (callError) throw callError;
    
    // Record call initiation activity
    const { data: activity, error: activityError } = await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        activity_type: 'call_initiated',
        timestamp: currentTime,
        call_detail_id: newCall.id
      })
      .select()
      .single();
      
    if (activityError) throw activityError;
    
    // Create a call_log entry with only the necessary information from call_details
    // No dummy or placeholder data is included
    const { data: callLog, error: callLogError } = await supabase
      .from('call_log')
      .insert({
        call_detail_id: newCall.id,
        user_id: userId,
        number,
        developer,
        project,
        created_at: currentTime
      })
      .select()
      .single();
      
    if (callLogError) throw callLogError;
    
    // Send the webhook request to trigger the call
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: newCall.id,
        user_id: userId,
        number,
        developer,
        project
      })
    });
    
    // Parse and return the call details
    const callDetails: CallDetails = {
      id: newCall.id,
      userId: newCall.user_id,
      number: newCall.number,
      developer: newCall.developer,
      project: newCall.project,
      createdAt: newCall.created_at
    };
    
    return { 
      success: true, 
      message: 'Call initiated successfully', 
      callDetails 
    };
  } catch (error) {
    console.error('Call initiation error:', error);
    return { success: false, message: 'Failed to initiate call' };
  }
};

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
    const currentTime = getCurrentISTDateTime();
    
    // Only update fields that have actual processed data, not dummy values
    let updateObject: any = {};
    
    if (data.summary) updateObject.summary = data.summary;
    if (data.callRecording) updateObject.call_recording = data.callRecording;
    if (data.transcript) updateObject.transcript = data.transcript;
    if (data.callDuration !== undefined) updateObject.call_duration = data.callDuration;
    if (data.creditsConsumed !== undefined) updateObject.credits_consumed = data.creditsConsumed;
    
    // Only update if we have actual data
    if (Object.keys(updateObject).length > 0) {
      // Update the call_log table with processed data
      const { error: logError } = await supabase
        .from('call_log')
        .update(updateObject)
        .eq('call_detail_id', callId);
        
      if (logError) throw logError;
      
      // Update the call_details table with the same data
      const { error: callError } = await supabase
        .from('call_details')
        .update(updateObject)
        .eq('id', callId);
        
      if (callError) throw callError;
    }
    
    // Record call completion activity
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: 'call_completed',
      timestamp: currentTime,
      call_detail_id: callId
    });
    
    // Deduct credits from the user's balance if we know how many to deduct
    if (data.creditsConsumed) {
      const { error: creditError } = await supabase.rpc('update_user_credits', {
        user_id_param: userId,
        credits_to_deduct: data.creditsConsumed
      });
      
      if (creditError) throw creditError;
    }
    
    return { success: true, message: 'Call completion data updated successfully' };
  } catch (error) {
    console.error('Update call completion error:', error);
    return { success: false, message: 'Failed to update call completion data' };
  }
};

export const submitFeedback = async (
  userId: string, 
  callId: string, 
  feedback: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const currentTime = getCurrentISTDateTime();
    
    // Check if feedback already exists in call_details
    const { data: existingCall } = await supabase
      .from('call_details')
      .select('feedback')
      .eq('id', callId)
      .single();
    
    let activityType = 'feedback_added';
    let updatedFeedback = feedback;
    
    // If feedback exists, append the new feedback
    if (existingCall && existingCall.feedback) {
      updatedFeedback = `${existingCall.feedback}\n\n${currentTime}: ${feedback}`;
      activityType = 'feedback_edited';
    } else {
      updatedFeedback = `${currentTime}: ${feedback}`;
    }
    
    // Update the feedback in call_details
    const { error: feedbackDetailError } = await supabase
      .from('call_details')
      .update({ feedback: updatedFeedback })
      .eq('id', callId);
      
    if (feedbackDetailError) throw feedbackDetailError;
    
    // Update the feedback in call_log
    const { error: feedbackLogError } = await supabase
      .from('call_log')
      .update({ feedback: updatedFeedback })
      .eq('call_detail_id', callId);
      
    if (feedbackLogError) throw feedbackLogError;
    
    // Record feedback activity
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: activityType,
      timestamp: currentTime,
      call_detail_id: callId
    });
    
    return { success: true, message: 'Feedback submitted successfully' };
  } catch (error) {
    console.error('Submit feedback error:', error);
    return { success: false, message: 'Failed to submit feedback' };
  }
};

export const getCallHistory = async (userId: string): Promise<{ 
  success: boolean; 
  message: string; 
  callHistory?: CallDetails[] 
}> => {
  try {
    const { data, error } = await supabase
      .from('call_details')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Transform the data to match our type
    const callHistory: CallDetails[] = data.map(call => ({
      id: call.id,
      userId: call.user_id,
      number: call.number,
      developer: call.developer,
      project: call.project,
      callAttempted: call.call_attempted,
      callLogId: call.call_log_id,
      callStatus: call.call_status,
      summary: call.summary,
      callRecording: call.call_recording,
      transcript: call.transcript,
      callDuration: call.call_duration,
      callTime: call.call_time,
      creditsConsumed: call.credits_consumed,
      feedback: call.feedback,
      createdAt: call.created_at
    }));
    
    // Record call history view activity
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: 'view_call_history',
      timestamp: getCurrentISTDateTime(),
    });
    
    return { success: true, message: 'Call history retrieved successfully', callHistory };
  } catch (error) {
    console.error('Get call history error:', error);
    return { success: false, message: 'Failed to retrieve call history' };
  }
};

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
    
    const currentTime = getCurrentISTDateTime();
    
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
      timestamp: getCurrentISTDateTime(),
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
      timestamp: getCurrentISTDateTime(),
      call_detail_id: callId
    });
    
    return { success: true, message: 'Transcript view activity recorded' };
  } catch (error) {
    console.error('Record transcript view error:', error);
    return { success: false, message: 'Failed to record transcript view activity' };
  }
};

export const getDailyCallStats = async (userId: string): Promise<{ 
  success: boolean; 
  message: string; 
  stats?: Array<{ date: string; count: number }> 
}> => {
  try {
    const { data, error } = await supabase
      .from('call_details')
      .select('created_at')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    // Group calls by day
    const dailyCounts: Record<string, number> = {};
    
    data.forEach(call => {
      // Extract date part for grouping (dd-MMM-yyyy)
      const date = call.created_at.split(' ')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    
    // Convert to array format for charting
    const stats = Object.keys(dailyCounts).map(date => ({
      date,
      count: dailyCounts[date]
    })).sort((a, b) => {
      // Sort by date ascending
      const dateA = new Date(a.date.split('-').reverse().join('-'));
      const dateB = new Date(b.date.split('-').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    });
    
    // Record analytics view activity
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: 'view_analytics',
      timestamp: getCurrentISTDateTime(),
    });
    
    return { success: true, message: 'Daily call stats retrieved successfully', stats };
  } catch (error) {
    console.error('Get daily call stats error:', error);
    return { success: false, message: 'Failed to retrieve daily call stats' };
  }
};

// New function to sync data from call_log to call_details
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
