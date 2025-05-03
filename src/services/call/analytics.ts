
import { supabase } from '../supabaseClient';
import { getCurrentISTDateTime } from '../../utils/dateUtils';

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
