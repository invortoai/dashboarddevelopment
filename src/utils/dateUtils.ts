
import { format, formatDistanceToNow } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Format a date to IST (Indian Standard Time) with the format: dd-MMM-yyyy hh:mm a
 * This function now correctly formats the date without adding an extra 5:30 hours
 */
export const formatToIST = (date: Date | string): string => {
  if (!date) return '';
  
  try {
    // Convert the input date to a Date object
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Use the date directly without timezone conversion
    // This prevents the system from adding an extra 5:30 hours
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
export const formatTimeAgo = (date: Date): string => {
  if (!date) return '';
  
  // Use date-fns for consistent and reliable relative time formatting
  return formatDistanceToNow(date, { addSuffix: true });
};
