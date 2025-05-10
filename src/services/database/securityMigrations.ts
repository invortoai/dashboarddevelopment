
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
      // Using execute_sql function instead of direct rpc
      const { data, error } = await supabase
        .rpc('execute_sql', { 
          query_text: `SELECT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = '${tableName}' 
            AND rowsecurity = true
          ) as is_enabled` 
        });
      
      if (error) {
        console.error(`Error checking RLS for ${tableName}:`, error);
        allTablesSecure = false;
        continue;
      }
      
      // Check if RLS is enabled for this table
      const isEnabled = data && typeof data === 'object' && 'is_enabled' in data ? data.is_enabled : false;
      if (!isEnabled) {
        console.error(`RLS not enabled for ${tableName}`);
        allTablesSecure = false;
      }
    }
    
    // Check for proper search_path configuration in functions
    const { data, error } = await supabase
      .rpc('execute_sql', { 
        query_text: `
          SELECT json_agg(json_build_object('name', proname, 'schema', nspname)) as result
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE p.prosecdef = true
          AND NOT EXISTS (
            SELECT 1
            FROM pg_proc_info pi
            WHERE pi.oid = p.oid
            AND pi.proargnames @> ARRAY['search_path']
          )
          AND n.nspname = 'public'
        `
      });
    
    if (error) {
      console.error('Error checking function security:', error);
      return false;
    }
    
    // Check if we got a properly structured result with functions
    let unsafeQueries: any[] = [];
    if (data && typeof data === 'object' && 'result' in data) {
      unsafeQueries = data.result || [];
    }
    
    if (Array.isArray(unsafeQueries) && unsafeQueries.length > 0) {
      console.error('Functions without proper search_path:', unsafeQueries);
      allTablesSecure = false;
    }
    
    return allTablesSecure;
  } catch (error) {
    console.error('Database security validation failed:', error);
    return false;
  }
};
