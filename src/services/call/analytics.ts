
import { supabase } from '../supabaseClient';

// Add this new function to the existing file
export const getCallStatusAnalytics = async (userId: string, days = 7): Promise<{ 
  success: boolean; 
  message: string; 
  data?: any[]; 
}> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    
    // Format dates for Supabase query
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('call_details')
      .select('created_at, call_status')
      .eq('user_id', userId)
      .gte('created_at', `${startDateStr}T00:00:00Z`)
      .lte('created_at', `${endDateStr}T23:59:59Z`)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    
    // Generate list of dates in the range
    const dateList: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dateList.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Initialize result array with dates and zero counts
    const result = dateList.map(date => ({
      date,
      answered: 0,
      noAnswer: 0,
      busy: 0,
      failed: 0,
      pending: 0,
    }));
    
    // Count calls by date and status
    data.forEach(call => {
      const callDate = call.created_at.split('T')[0];
      const dateIndex = dateList.indexOf(callDate);
      
      if (dateIndex !== -1) {
        const status = call.call_status?.toLowerCase() || 'pending';
        
        if (status.includes('answer') && !status.includes('no')) {
          result[dateIndex].answered++;
        } else if (status.includes('no answer') || status.includes('not answered')) {
          result[dateIndex].noAnswer++;
        } else if (status.includes('busy')) {
          result[dateIndex].busy++;
        } else if (status.includes('fail') || status.includes('error')) {
          result[dateIndex].failed++;
        } else {
          result[dateIndex].pending++;
        }
      }
    });
    
    return { success: true, message: 'Call status analytics retrieved successfully', data: result };
  } catch (error) {
    console.error('Error fetching call status analytics:', error);
    return { success: false, message: 'Failed to retrieve call status analytics' };
  }
};

// Implementation for getCallVolumeAnalytics
export const getCallVolumeAnalytics = async (userId: string, days = 7): Promise<{
  success: boolean;
  message: string;
  data?: any[];
}> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    
    // Format dates for Supabase query
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('call_details')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', `${startDateStr}T00:00:00Z`)
      .lte('created_at', `${endDateStr}T23:59:59Z`);
      
    if (error) throw error;
    
    // Generate list of dates in the range
    const dateList: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dateList.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Initialize result array with dates and zero counts
    const result = dateList.map(date => ({
      date,
      calls: 0
    }));
    
    // Count calls by date
    data.forEach(call => {
      const callDate = call.created_at.split('T')[0];
      const dateIndex = dateList.indexOf(callDate);
      
      if (dateIndex !== -1) {
        result[dateIndex].calls++;
      }
    });
    
    return { success: true, message: 'Call volume analytics retrieved successfully', data: result };
  } catch (error) {
    console.error('Error fetching call volume analytics:', error);
    return { success: false, message: 'Failed to retrieve call volume analytics' };
  }
};

// Implementation for getCallDurationAnalytics
export const getCallDurationAnalytics = async (userId: string, days = 7): Promise<{
  success: boolean;
  message: string;
  data?: any[];
}> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    
    // Format dates for Supabase query
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('call_details')
      .select('created_at, call_duration')
      .eq('user_id', userId)
      .gte('created_at', `${startDateStr}T00:00:00Z`)
      .lte('created_at', `${endDateStr}T23:59:59Z`);
      
    if (error) throw error;
    
    // Generate list of dates in the range
    const dateList: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dateList.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Initialize result array with dates and zero durations
    const result = dateList.map(date => ({
      date,
      duration: 0
    }));
    
    // Sum call durations by date
    data.forEach(call => {
      if (call.call_duration) {
        const callDate = call.created_at.split('T')[0];
        const dateIndex = dateList.indexOf(callDate);
        
        if (dateIndex !== -1) {
          result[dateIndex].duration += call.call_duration;
        }
      }
    });
    
    return { success: true, message: 'Call duration analytics retrieved successfully', data: result };
  } catch (error) {
    console.error('Error fetching call duration analytics:', error);
    return { success: false, message: 'Failed to retrieve call duration analytics' };
  }
};

// Implementation for getCreditsUsedAnalytics
export const getCreditsUsedAnalytics = async (userId: string, days = 7): Promise<{
  success: boolean;
  message: string;
  data?: any[];
}> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    
    // Format dates for Supabase query
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('call_details')
      .select('created_at, credits_consumed')
      .eq('user_id', userId)
      .gte('created_at', `${startDateStr}T00:00:00Z`)
      .lte('created_at', `${endDateStr}T23:59:59Z`);
      
    if (error) throw error;
    
    // Generate list of dates in the range
    const dateList: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dateList.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Initialize result array with dates and zero credit usage
    const result = dateList.map(date => ({
      date,
      credits: 0
    }));
    
    // Sum credits consumed by date
    data.forEach(call => {
      if (call.credits_consumed) {
        const callDate = call.created_at.split('T')[0];
        const dateIndex = dateList.indexOf(callDate);
        
        if (dateIndex !== -1) {
          result[dateIndex].credits += call.credits_consumed;
        }
      }
    });
    
    return { success: true, message: 'Credits usage analytics retrieved successfully', data: result };
  } catch (error) {
    console.error('Error fetching credits usage analytics:', error);
    return { success: false, message: 'Failed to retrieve credits usage analytics' };
  }
};
