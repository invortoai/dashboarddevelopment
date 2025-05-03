
import { format, formatDistanceToNow } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Format a date to IST (Indian Standard Time) with the format: dd-MMM-yyyy hh:mm a
 */
export const formatToIST = (date: Date | string): string => {
  if (!date) return '';
  
  // Convert the input date to a Date object
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    // Convert to IST timezone using date-fns-tz
    const istDate = toZonedTime(dateObj, 'Asia/Kolkata');
    
    // Format using date-fns with correct format string
    // Use 'dd-MMM-yyyy hh:mm a' for proper formatting (MMM for month abbreviation, a for AM/PM)
    return format(istDate, 'dd-MMM-yyyy hh:mm a');
  } catch (error) {
    console.error('Error formatting date to IST:', error);
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
