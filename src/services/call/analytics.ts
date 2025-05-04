
import { supabase } from '../supabaseClient';
import { getCurrentISTDateTime } from '../../utils/dateUtils';
import { format, parseISO } from 'date-fns';

export const getDailyCallStats = async (userId: string): Promise<{ 
  success: boolean; 
  message: string; 
  stats?: Array<{ date: string; count: number; duration: number; credits: number }> 
}> => {
  try {
    // Get call details with duration and credits information
    const { data, error } = await supabase
      .from('call_details')
      .select('created_at, call_duration, credits_consumed')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    console.log('Retrieved call details for analytics:', data);
    
    // Group calls by day
    const dailyCounts: Record<string, { count: number; duration: number; credits: number }> = {};
    
    data.forEach(call => {
      try {
        // Parse the date and format it to get just the day (format: MMM dd)
        const dateObj = new Date(call.created_at);
        const dateKey = format(dateObj, 'MMM dd');
        
        // Initialize the day's data if it doesn't exist
        if (!dailyCounts[dateKey]) {
          dailyCounts[dateKey] = { count: 0, duration: 0, credits: 0 };
        }
        
        // Add this call's data to the accumulated totals
        dailyCounts[dateKey].count += 1;
        dailyCounts[dateKey].duration += call.call_duration || 0;
        dailyCounts[dateKey].credits += call.credits_consumed || 0;
      } catch (err) {
        console.error('Error processing call record for analytics:', err, call);
      }
    });
    
    // Convert to array format for charting
    const stats = Object.keys(dailyCounts).map(date => ({
      date,
      count: dailyCounts[date].count,
      duration: dailyCounts[date].duration,
      credits: dailyCounts[date].credits
    })).sort((a, b) => {
      // Sort by date ascending - parse the MMM dd format correctly
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const [aMonth, aDay] = a.date.split(' ');
      const [bMonth, bDay] = b.date.split(' ');
      
      const aMonthIndex = monthNames.indexOf(aMonth);
      const bMonthIndex = monthNames.indexOf(bMonth);
      
      if (aMonthIndex !== bMonthIndex) return aMonthIndex - bMonthIndex;
      return parseInt(aDay) - parseInt(bDay);
    });
    
    console.log('Processed analytics stats:', stats);
    
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
