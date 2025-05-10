
import { supabase } from '@/integrations/supabase/client';

/**
 * Utility to safely execute SQL statements with proper error handling
 * Should only be used by administrative functions with proper authorization
 */
export const executeSql = async (query: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('execute_sql', { 
      query_text: query 
    });
    
    if (error) {
      console.error('SQL execution error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to execute query' 
      };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('SQL execution exception:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error during query execution'
    };
  }
};

/**
 * Execute multiple SQL statements in sequence, with error handling for each
 * Will continue executing statements even if some fail
 */
export const executeBatchSql = async (queries: string[]): Promise<{
  success: boolean;
  results: { query: string; success: boolean; error?: string }[];
}> => {
  const results = [];
  let overallSuccess = true;
  
  for (const query of queries) {
    const result = await executeSql(query);
    
    results.push({
      query,
      success: result.success,
      error: result.error
    });
    
    if (!result.success) {
      overallSuccess = false;
    }
  }
  
  return {
    success: overallSuccess,
    results
  };
};
