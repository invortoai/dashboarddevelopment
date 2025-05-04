
import { supabase } from './supabaseClient';

// Original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

// Track if we're currently processing a log to avoid infinite loops
let isLogging = false;

/**
 * Initialize the logging service to intercept console methods and store logs in the database
 * @param userId Optional user ID for associating logs with a specific user
 */
export const initLoggingService = (userId?: string) => {
  // Replace console.log
  console.log = function(...args) {
    // Call the original method first
    originalConsole.log.apply(console, args);
    // Then store in database
    storeLog('log', args, userId);
  };

  // Replace console.info
  console.info = function(...args) {
    originalConsole.info.apply(console, args);
    storeLog('info', args, userId);
  };

  // Replace console.warn
  console.warn = function(...args) {
    originalConsole.warn.apply(console, args);
    storeLog('warn', args, userId);
  };

  // Replace console.error
  console.error = function(...args) {
    originalConsole.error.apply(console, args);
    storeLog('error', args, userId);
  };

  // Replace console.debug
  console.debug = function(...args) {
    originalConsole.debug.apply(console, args);
    storeLog('debug', args, userId);
  };
};

/**
 * Store log entry in the database
 * @param logType Type of log (log, info, warn, error, debug)
 * @param args Arguments passed to the console method
 * @param userId Optional user ID
 */
const storeLog = async (logType: string, args: any[], userId?: string) => {
  // Prevent infinite loops if logging from inside the storeLog function
  if (isLogging) return;
  
  try {
    isLogging = true;

    // Format the message to store
    const message = args.map(arg => {
      // Handle objects and arrays by converting to JSON
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch (e) {
          return '[Object]';
        }
      }
      return String(arg);
    }).join(' ');

    // Store in database - don't await to avoid blocking the main thread
    supabase.from('system_logs').insert({
      user_id: userId || null,
      action_type: `console_${logType}`,
      message: message,
      // Include stack trace for errors
      response: logType === 'error' ? new Error().stack : null
    }).then(({ error }) => {
      if (error && !error.message.includes('system_logs_insert')) {
        // Use the original console to avoid infinite loops
        originalConsole.error('Error storing log:', error);
      }
    });
  } catch (error) {
    // Log error with original console to avoid recursion
    originalConsole.error('Error in storeLog:', error);
  } finally {
    isLogging = false;
  }
};

/**
 * Reset console methods back to their original implementations
 */
export const resetConsole = () => {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
};

/**
 * Log a message to the database directly (without using console)
 * @param type Log type
 * @param message Message to log
 * @param userId Optional user ID
 * @param response Optional response or additional data
 */
export const logToDatabase = async (
  type: string,
  message: string,
  userId?: string,
  response?: string
) => {
  try {
    await supabase.from('system_logs').insert({
      user_id: userId || null,
      action_type: type,
      message,
      response
    });
  } catch (error) {
    originalConsole.error('Error in logToDatabase:', error);
  }
};
