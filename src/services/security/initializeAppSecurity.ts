import { applyCSP, setupSessionTimeout } from '@/utils/securityUtils';
import { validateDatabaseSecurity } from '../database/securityMigrations';
import { executeSql, executeBatchSql } from '../database/sqlExecutor';

/**
 * Initializes all security features for the application
 * This should be called once on application startup
 */
export const initializeAppSecurity = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Apply Content Security Policy
    if (typeof window !== 'undefined') {
      applyCSP();
    }
    
    // Validate database security structure
    const isDbSecure = await validateDatabaseSecurity();
    if (!isDbSecure) {
      console.warn('Database security validation failed - some security features may not work correctly');
    }
    
    // Check for secure context (HTTPS)
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && 
        !window.location.hostname.includes('localhost') && 
        !window.location.hostname.includes('127.0.0.1')) {
      console.warn('Application is not running in a secure context (HTTPS) - security features may be limited');
    }
    
    // Successfully initialized security features
    return { 
      success: true, 
      message: 'Security features initialized successfully' 
    };
  } catch (error) {
    console.error('Failed to initialize security features:', error);
    return { 
      success: false, 
      message: 'Failed to initialize security features' 
    };
  }
};

/**
 * Function to enable RLS on tables if not already enabled
 * This should only be called by admin users or during initial setup
 */
export const enableDatabaseSecurity = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Define SQL statements to enable RLS and add policies
    // We'll split these into small, atomic operations to avoid deadlocks
    
    // First, enable RLS on each table
    const enableRlsQueries = [
      "ALTER TABLE public.call_details ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE public.auth_error_logs ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE public.call_log ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE public.user_details ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;"
    ];
    
    const rlsResult = await executeBatchSql(enableRlsQueries);
    
    // Then, create policies for each table separately
    const callDetailsPolicies = [
      `CREATE POLICY IF NOT EXISTS "Users can view their own call details" 
        ON public.call_details 
        FOR SELECT 
        USING (auth.uid() = user_id);`,
      
      `CREATE POLICY IF NOT EXISTS "Users can insert their own call details" 
        ON public.call_details 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);`,
      
      `CREATE POLICY IF NOT EXISTS "Users can update their own call details" 
        ON public.call_details 
        FOR UPDATE 
        USING (auth.uid() = user_id);`
    ];
    
    const authErrorLogsPolicies = [
      `CREATE POLICY IF NOT EXISTS "Only system can access auth error logs" 
        ON public.auth_error_logs 
        FOR ALL
        USING (false);` // No direct client access for security logs
    ];
    
    const callLogPolicies = [
      `CREATE POLICY IF NOT EXISTS "Users can view their own call logs" 
        ON public.call_log 
        FOR SELECT 
        USING (auth.uid() = user_id);`,
      
      `CREATE POLICY IF NOT EXISTS "Users can insert their own call logs" 
        ON public.call_log 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);`,
      
      `CREATE POLICY IF NOT EXISTS "Users can update their own call logs" 
        ON public.call_log 
        FOR UPDATE 
        USING (auth.uid() = user_id);`
    ];
    
    const userActivityPolicies = [
      `CREATE POLICY IF NOT EXISTS "Users can view their own activity" 
        ON public.user_activity 
        FOR SELECT 
        USING (auth.uid() = user_id);`,
      
      `CREATE POLICY IF NOT EXISTS "Users can insert their own activity" 
        ON public.user_activity 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);`
    ];
    
    const userDetailsPolicies = [
      `CREATE POLICY IF NOT EXISTS "Users can view their own details" 
        ON public.user_details 
        FOR SELECT 
        USING (auth.uid() = id);`,
      
      `CREATE POLICY IF NOT EXISTS "Users can update their own details" 
        ON public.user_details 
        FOR UPDATE 
        USING (auth.uid() = id);`
    ];
    
    const systemLogsPolicies = [
      `CREATE POLICY IF NOT EXISTS "Users can view their own system logs" 
        ON public.system_logs 
        FOR SELECT 
        USING (auth.uid() = user_id OR user_id IS NULL);`,
      
      `CREATE POLICY IF NOT EXISTS "System can insert logs" 
        ON public.system_logs 
        FOR INSERT 
        WITH CHECK (true);` // Allow system to create logs
    ];
    
    // Execute all policy creation queries in batches
    const results = await Promise.all([
      executeBatchSql(callDetailsPolicies),
      executeBatchSql(authErrorLogsPolicies),
      executeBatchSql(callLogPolicies),
      executeBatchSql(userActivityPolicies),
      executeBatchSql(userDetailsPolicies),
      executeBatchSql(systemLogsPolicies)
    ]);
    
    // Check if any batch had errors
    const hasErrors = results.some(result => !result.success);
    
    // Fix execute_sql function to use search_path parameter for security
    const fixFunctionQuery = `
      CREATE OR REPLACE FUNCTION public.execute_sql(query_text text)
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = ''
      AS $$
      DECLARE
        result JSONB;
      BEGIN
        -- Execute the query and capture the result
        EXECUTE query_text;
        result := '{"success": true}'::JSONB;
        RETURN result;
      EXCEPTION WHEN OTHERS THEN
        -- Return error information
        RETURN jsonb_build_object(
          'success', false,
          'error', SQLERRM,
          'code', SQLSTATE
        );
      END;
      $$;
    `;
    
    const functionResult = await executeSql(fixFunctionQuery);
    
    // Also fix the other functions with search_path issues
    const fixUpdateCreditsQuery = `
      CREATE OR REPLACE FUNCTION public.update_user_credits(user_id_param uuid, credits_to_deduct integer)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = ''
      AS $$
      BEGIN
        UPDATE public.user_details
        SET credit = credit - credits_to_deduct
        WHERE id = user_id_param;
      END;
      $$;
    `;
    
    const fixHashPasswordQuery = `
      CREATE OR REPLACE FUNCTION public.hash_password(plain_password text)
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = ''
      AS $$
      BEGIN
        -- Using a simple hash for demonstration
        -- In production, consider more secure options
        RETURN encode(sha256(plain_password::bytea), 'hex');
      END;
      $$;
    `;
    
    // Execute the fixes for all functions with search_path issues
    const functionFixResults = await Promise.all([
      executeSql(fixUpdateCreditsQuery),
      executeSql(fixHashPasswordQuery)
    ]);
    
    const hasFunctionFixErrors = functionFixResults.some(result => !result.success);
    
    if (hasErrors || !functionResult.success || hasFunctionFixErrors) {
      return { 
        success: false, 
        message: 'Some database security features could not be enabled' 
      };
    }
    
    return { 
      success: true, 
      message: 'Database security enabled successfully' 
    };
  } catch (error) {
    console.error('Failed to enable database security:', error);
    return { 
      success: false, 
      message: `Failed to enable database security: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};
