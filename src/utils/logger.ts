
import { logToDatabase } from '../services/loggingService';
import { useAuth } from '../context/AuthContext';

/**
 * React hook for logging events with the current user ID
 */
export const useLogger = () => {
  const { user } = useAuth();
  
  return {
    /**
     * Log an event to the database
     * @param type Event type
     * @param message Event message
     * @param response Optional additional data
     */
    log: (type: string, message: string, response?: string) => {
      return logToDatabase(type, message, user?.id, response);
    },
    
    /**
     * Log an error to the database
     * @param message Error message
     * @param error Error object or details
     */
    error: (message: string, error: any) => {
      const errorDetails = error instanceof Error 
        ? `${error.message}\n${error.stack}` 
        : JSON.stringify(error);
      return logToDatabase('error', message, user?.id, errorDetails);
    },
    
    /**
     * Log application activity
     * @param feature The feature or area of the application 
     * @param action The action being performed
     * @param details Optional details about the action
     */
    activity: (feature: string, action: string, details?: any) => {
      const detailsStr = details ? JSON.stringify(details) : '';
      return logToDatabase(`${feature}_${action}`, `User performed ${action} in ${feature}`, user?.id, detailsStr);
    }
  };
};

/**
 * Log a system event (for use outside of React components)
 * @param type Event type
 * @param message Event message
 * @param userId Optional user ID
 * @param response Optional additional data
 */
export const logSystem = (type: string, message: string, userId?: string, response?: string) => {
  return logToDatabase(type, message, userId, response);
};
