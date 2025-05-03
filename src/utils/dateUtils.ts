import { DateFormatOptions } from '../types';

export const formatToIST = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: DateFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  };
  
  // Format: dd-MMM-yyyy hh:mm A
  const formatted = dateObj.toLocaleString('en-IN', options);
  
  // Convert to required format (dd-MMM-yyyy hh:mm A)
  const parts = formatted.split(', ');
  if (parts.length !== 2) return formatted;
  
  const datePart = parts[0].split(' ');
  if (datePart.length !== 2) return formatted;
  
  // Convert '15 Apr' to '15-Apr'
  const formattedDate = `${datePart[0]}-${datePart[1]}-${parts[0].split(' ')[2]} ${parts[1]}`;
  
  return formattedDate;
};

export const getCurrentISTDateTime = (): string => {
  return formatToIST(new Date());
};

/**
 * Format a date as a relative time string (e.g., "2 minutes ago")
 */
export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 5) {
    return 'just now';
  }
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
};
