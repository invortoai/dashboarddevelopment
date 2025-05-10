
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use a fallback value if the environment variable is not available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jcazvdqmxlzpdwgzlyph.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYXp2ZHFteGx6cGR3Z3pseXBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDI3MTMsImV4cCI6MjA2MDgxODcxM30.rjGM4Q4k1PzGb4FCOWpcSQOYnYQKw0iCQLBLeugLMGc';

// No need to log an error since we're providing fallback values
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Remove cookieOptions that's causing an error
    }
  }
);

// Helper function to check if a column exists in a table
export const checkColumnExists = async (table: string, column: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(table as any)
      .select(column)
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error(`Error checking if column ${column} exists in table ${table}:`, error);
    return false;
  }
};

// Fallback version that returns a default value if column doesn't exist
export const checkColumnExistsFallback = async <T>(
  table: string, 
  column: string, 
  defaultValue: T
): Promise<T | null> => {
  try {
    const { data, error } = await supabase
      .from(table as any)
      .select(column)
      .limit(1);
    
    if (error && error.message.includes('does not exist')) {
      return defaultValue;
    }
    
    return data && data.length > 0 ? data[0][column] : null;
  } catch (error) {
    console.error(`Error in column check fallback:`, error);
    return defaultValue;
  }
};
