
import { supabase } from '../supabaseClient';
import { hashPassword, generateSalt } from '../../utils/securePassword';

/**
 * Validates database structure and ensures proper security setup
 * This should be run on application startup
 */
export const validateDatabaseSecurity = async (): Promise<boolean> => {
  try {
    // Check if auth_error_logs table exists and has the right structure
    const { error: tableCheckError } = await supabase
      .from('auth_error_logs')
      .select('id')
      .limit(1);
    
    const tableExists = !tableCheckError || !tableCheckError.message.includes('does not exist');
    
    // Check for proper password storage in user_details
    const { error: passwordFieldCheckError } = await supabase
      .from('user_details')
      .select('password_salt')
      .limit(1);
    
    const passwordFieldExists = !passwordFieldCheckError || 
      !passwordFieldCheckError.message.includes('password_salt') ||
      !passwordFieldCheckError.message.includes('does not exist');
    
    // Check if we have expected tables
    const expectedTables = ['user_details', 'user_activity', 'auth_error_logs'];
    let allTablesExist = true;
    
    for (const tableName of expectedTables) {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error && error.message.includes('does not exist')) {
        console.error(`Missing required table: ${tableName}`);
        allTablesExist = false;
        break;
      }
    }
    
    return tableExists && passwordFieldExists && allTablesExist;
  } catch (error) {
    console.error('Error validating database security:', error);
    return false;
  }
};

// Helper function to upgrade legacy password storage (if needed in the future)
export const upgradePasswordStorage = async (userId: string, legacyPassword: string): Promise<boolean> => {
  try {
    // Generate new salt
    const salt = await generateSalt();
    
    // Hash the password with the new salt
    const hashedPassword = await hashPassword(legacyPassword, salt);
    
    // Split the salt and hash for secure storage
    const [saltPart, hashPart] = hashedPassword.split(':');
    
    // Update user with new format
    const { error } = await supabase
      .from('user_details')
      .update({
        password_salt: hashedPassword
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Error upgrading password storage:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in password upgrade:', error);
    return false;
  }
};

// Note: Removed the second export statement that was causing duplicate exports
