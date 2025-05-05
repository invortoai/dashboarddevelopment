
import { supabase } from '../supabaseClient';
import { CallDetails } from '../../types';

export const getCallHistory = async (
  userId: string,
  page: number = 1,
  pageSize: number = 10,
  filters: {
    searchTerm?: string;
    statusFilter?: string;
    dateFilter?: Date;
  } = {}
): Promise<{ 
  success: boolean; 
  message: string; 
  callHistory?: CallDetails[];
  totalCount?: number;
}> => {
  try {
    // Create a query that will be filtered
    let query = supabase
      .from('call_details')
      .select('*')
      .eq('user_id', userId);
    
    // Apply filters if provided
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      query = query.or(`number.ilike.%${term}%,developer.ilike.%${term}%,project.ilike.%${term}%`);
    }
    
    if (filters.statusFilter && filters.statusFilter !== 'all') {
      query = query.ilike('call_status', `%${filters.statusFilter}%`);
    }
    
    if (filters.dateFilter) {
      const dateString = filters.dateFilter.toISOString().split('T')[0];
      query = query.or(`created_at::date.eq.${dateString},call_time::date.eq.${dateString}`);
    }
    
    // First get the total count of filtered calls for pagination
    const { count, error: countError } = await query.count();
      
    if (countError) throw countError;
    
    // Calculate pagination values
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Get the paginated data with filters and sorting
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (error) throw error;
    
    console.log(`Fetched ${data.length} calls out of ${count} total filtered calls. Page: ${page}, PageSize: ${pageSize}`);
    
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
      timestamp: new Date().toISOString(),
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

// New function to fetch all unique call statuses for a user
export const getUserCallStatuses = async (userId: string): Promise<{
  success: boolean;
  message: string;
  statuses?: string[];
}> => {
  try {
    const { data, error } = await supabase
      .from('call_details')
      .select('call_status')
      .eq('user_id', userId)
      .not('call_status', 'is', null);
      
    if (error) throw error;
    
    // Extract and clean up the statuses
    const uniqueStatuses = new Set<string>();
    uniqueStatuses.add('all'); // Always include 'all' option
    
    data.forEach(item => {
      if (item.call_status) {
        // Extract the basic status type for better categorization
        let normalizedStatus = item.call_status.toLowerCase();
        
        if (normalizedStatus.includes('answer') && !normalizedStatus.includes('no')) {
          uniqueStatuses.add('answered');
        } else if (normalizedStatus.includes('complete')) {
          uniqueStatuses.add('completed');
        } else if (normalizedStatus.includes('no answer') || normalizedStatus.includes('not answered')) {
          uniqueStatuses.add('no answer');
        } else if (normalizedStatus.includes('busy')) {
          uniqueStatuses.add('busy');
        } else if (normalizedStatus.includes('fail') || normalizedStatus.includes('error')) {
          uniqueStatuses.add('failed');
        } else if (normalizedStatus) {
          // Add any other unique status that doesn't match our predefined categories
          uniqueStatuses.add(normalizedStatus);
        }
      }
    });
    
    return { 
      success: true, 
      message: 'Call statuses retrieved successfully', 
      statuses: Array.from(uniqueStatuses) 
    };
  } catch (error) {
    console.error('Get call statuses error:', error);
    return { success: false, message: 'Failed to retrieve call statuses' };
  }
};
