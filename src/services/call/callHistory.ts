
import { supabase } from '../supabaseClient';
import { CallDetails } from '../../types';
import { getCurrentISTDateTime } from '../../utils/dateUtils';

export const getCallHistory = async (
  userId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{ 
  success: boolean; 
  message: string; 
  callHistory?: CallDetails[];
  totalCount?: number;
}> => {
  try {
    // First get the total count of calls for pagination
    const { count, error: countError } = await supabase
      .from('call_details')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (countError) throw countError;
    
    // Calculate pagination values
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Get the paginated data
    const { data, error } = await supabase
      .from('call_details')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (error) throw error;
    
    console.log(`Fetched ${data.length} calls out of ${count} total calls. Page: ${page}, PageSize: ${pageSize}`);
    
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
    
    return { 
      success: true, 
      message: 'Call history retrieved successfully', 
      callHistory,
      totalCount: count 
    };
  } catch (error) {
    console.error('Get call history error:', error);
    return { success: false, message: 'Failed to retrieve call history' };
  }
};
