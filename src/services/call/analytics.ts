
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';

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
        dailyCounts[dateKey].credits += call.credits_consumed || (call.call_duration > 0 ? 10 : 0);
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
      timestamp: new Date().toISOString(),
    });
    
    return { success: true, message: 'Daily call stats retrieved successfully', stats };
  } catch (error) {
    console.error('Get daily call stats error:', error);
    return { success: false, message: 'Failed to retrieve daily call stats' };
  }
};

export const getCallDispositionStatsByDate = async (userId: string, timeRange: number = 7): Promise<{ 
  success: boolean; 
  message: string; 
  stats?: Array<{ date: string; status: string; count: number; color: string }> 
}> => {
  try {
    // Calculate the date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - timeRange);
    
    // Get call details with status information
    const { data, error } = await supabase
      .from('call_details')
      .select('created_at, call_status')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
      
    if (error) throw error;
    
    console.log('Retrieved call disposition details for analytics:', data);
    
    // Assign colors to different status types
    const statusColors: Record<string, string> = {
      'answered': '#22c55e',
      'no answer': '#f97316',
      'busy': '#eab308',
      'failed': '#ef4444',
      'pending': '#6b7280'
    };
    
    // Group calls by day and status
    const dailyStatusCounts: Record<string, Record<string, number>> = {};
    
    data.forEach(call => {
      try {
        // Parse the date and format it to get just the day (format: MMM dd)
        const dateObj = new Date(call.created_at);
        const dateKey = format(dateObj, 'MMM dd');
        
        // Normalize status
        let status = 'pending';
        if (call.call_status) {
          const normalizedStatus = call.call_status.toLowerCase();
          if (normalizedStatus.includes('answer') && !normalizedStatus.includes('no')) {
            status = 'answered';
          } else if (normalizedStatus.includes('no answer') || normalizedStatus.includes('not answered')) {
            status = 'no answer';
          } else if (normalizedStatus.includes('busy')) {
            status = 'busy';
          } else if (normalizedStatus.includes('fail') || normalizedStatus.includes('error')) {
            status = 'failed';
          }
        }
        
        // Initialize the day's data if it doesn't exist
        if (!dailyStatusCounts[dateKey]) {
          dailyStatusCounts[dateKey] = {};
        }
        
        // Initialize the status count if it doesn't exist
        if (!dailyStatusCounts[dateKey][status]) {
          dailyStatusCounts[dateKey][status] = 0;
        }
        
        // Increment the count
        dailyStatusCounts[dateKey][status] += 1;
      } catch (err) {
        console.error('Error processing call disposition record for analytics:', err, call);
      }
    });
    
    // Convert to array format for charting
    const stats: Array<{ date: string; status: string; count: number; color: string }> = [];
    
    Object.entries(dailyStatusCounts).forEach(([date, statusCounts]) => {
      Object.entries(statusCounts).forEach(([status, count]) => {
        stats.push({
          date,
          status,
          count,
          color: statusColors[status] || '#6b7280'
        });
      });
    });
    
    // Sort by date
    stats.sort((a, b) => {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const [aMonth, aDay] = a.date.split(' ');
      const [bMonth, bDay] = b.date.split(' ');
      
      const aMonthIndex = monthNames.indexOf(aMonth);
      const bMonthIndex = monthNames.indexOf(bMonth);
      
      if (aMonthIndex !== bMonthIndex) return aMonthIndex - bMonthIndex;
      return parseInt(aDay) - parseInt(bDay);
    });
    
    console.log('Processed call disposition stats:', stats);
    
    return { success: true, message: 'Call disposition stats by date retrieved successfully', stats };
  } catch (error) {
    console.error('Get call disposition stats by date error:', error);
    return { success: false, message: 'Failed to retrieve call disposition stats by date' };
  }
};
