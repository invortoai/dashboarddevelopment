
import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Format a date to IST (Indian Standard Time) with the format: dd-MMM-yyyy hh:mm a
 * This function displays the date as stored in the database, without timezone manipulation
 */
export const formatToIST = (date: Date | string): string => {
  if (!date) return '';
  
  try {
    // Convert the input date to a Date object
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Format directly without timezone manipulation
    return format(dateObj, 'dd-MMM-yyyy hh:mm a');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export const getCurrentISTDateTime = (): string => {
  const now = new Date();
  return formatToIST(now);
};

/**
 * Format a date as a relative time string (e.g., "2 minutes ago")
 */
export const formatTimeAgo = (date: Date | string): string => {
  if (!date) return '';
  
  try {
    // Convert the input date to a Date object if it's a string
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Use date-fns for consistent and reliable relative time formatting
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Unknown time ago';
  }
};
