
import { DateFormatOptions } from '../types';
import { format, formatDistanceToNow } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Format a date to IST (Indian Standard Time) with the format: dd-MMM-yyyy hh:mm A
 */
export const formatToIST = (date: Date | string): string => {
  if (!date) return '';
  
  // Convert the input date to a Date object
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Convert UTC time to IST
  const istDate = toZonedTime(dateObj, 'Asia/Kolkata');
  
  // Format using date-fns for better reliability
  return format(istDate, 'dd-MMM-yyyy hh:mm a');
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
