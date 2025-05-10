
import { supabase } from '@/integrations/supabase/client';

/**
 * Validates database security configuration
 * Ensures RLS policies are properly set up for all tables
 */
export const validateDatabaseSecurity = async (): Promise<boolean> => {
  try {
    // Check if RLS is enabled on critical tables
    const tablesWithRls = ['call_details', 'auth_error_logs', 'call_log', 'user_activity', 'user_details', 'system_logs'];
    let allTablesSecure = true;
    
    for (const tableName of tablesWithRls) {
      const { data, error } = await supabase
        .rpc('check_rls_enabled', { table_name: tableName });
      
      if (error) {
        console.error(`Error checking RLS for ${tableName}:`, error);
        allTablesSecure = false;
        continue;
      }
      
      if (!data) {
        console.error(`RLS not enabled for ${tableName}`);
        allTablesSecure = false;
      }
    }
    
    // Check for proper search_path configuration in functions
    const { data: functions, error: funcError } = await supabase
      .rpc('list_functions_without_search_path');
    
    if (funcError) {
      console.error('Error checking function security:', funcError);
      return false;
    }
    
    if (functions && functions.length > 0) {
      console.error('Functions without proper search_path:', functions);
      allTablesSecure = false;
    }
    
    return allTablesSecure;
  } catch (error) {
    console.error('Database security validation failed:', error);
    return false;
  }
};
