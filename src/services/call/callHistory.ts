
import { supabase } from '../supabaseClient';
import { CallDetails } from '../../types';

export const getCallHistory = async (
  userId: string,
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    searchTerm?: string;
    dateFilter?: Date;
    statusFilter?: string;
  }
): Promise<{ 
  success: boolean; 
  message: string; 
  callHistory?: CallDetails[];
  totalCount?: number;
}> => {
  try {
    console.log(`Fetching call history for user: ${userId}, page: ${page}, pageSize: ${pageSize}, filters:`, JSON.stringify(filters, null, 2));
    
    // Build the query with filters
    let query = supabase
      .from('call_details')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);
      
    // Apply filters if provided
    if (filters) {
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        query = query.or(`number.ilike.%${searchTerm}%,developer.ilike.%${searchTerm}%,project.ilike.%${searchTerm}%`);
      }
      
      if (filters.dateFilter) {
        const dateString = filters.dateFilter.toISOString().split('T')[0];
        query = query.filter('created_at', 'gte', `${dateString}T00:00:00.000Z`);
        query = query.filter('created_at', 'lte', `${dateString}T23:59:59.999Z`);
      }
      
      if (filters.statusFilter && filters.statusFilter !== 'all') {
        query = query.ilike('call_status', `%${filters.statusFilter}%`);
      }
    }
    
    // Get count first with the applied filters
    const { count, error: countError } = await query;
    
    if (countError) {
      console.error('Error counting call history:', countError);
      throw countError;
    }
    
    // Calculate pagination values
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Get the paginated data with the same filters
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (error) {
      console.error('Error fetching call history:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length} calls out of ${count} total filtered calls. Page: ${page}, PageSize: ${pageSize}`);
    
    // Transform the data to match our type
    const callHistory: CallDetails[] = data?.map(call => ({
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
    })) || [];
    
    // Record call history view activity
    try {
      await supabase.from('user_activity').insert({
        user_id: userId,
        activity_type: 'view_call_history',
        timestamp: new Date().toISOString(),
      });
    } catch (activityError) {
      // Just log the activity error but don't fail the request
      console.error('Error recording user activity:', activityError);
    }
    
    return { 
      success: true, 
      message: 'Call history retrieved successfully', 
      callHistory,
      totalCount: count 
    };
  } catch (error) {
    console.error('Get call history error:', error);
    return { 
      success: false, 
      message: 'Failed to retrieve call history. Please try refreshing the page.' 
    };
  }
};
