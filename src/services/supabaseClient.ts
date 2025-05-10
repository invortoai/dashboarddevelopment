
import { 
  supabase,
  checkColumnExists, 
  checkColumnExistsFallback
} from '@/integrations/supabase/client';

// Import security utilities from our new module
import {
  sanitizeInput,
  requireAuth,
  secureCompare,
  validateCSRFToken,
  generateCSRFToken
} from '@/utils/securityUtils';

// Export all the functionality from our integrations directory and security utilities
export { 
  supabase, 
  checkColumnExists, 
  checkColumnExistsFallback, 
  sanitizeInput, 
  requireAuth,
  secureCompare,
  validateCSRFToken,
  generateCSRFToken
};
