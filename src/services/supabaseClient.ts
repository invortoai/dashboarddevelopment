
import { 
  supabase,
  checkColumnExists, 
  checkColumnExistsFallback, 
  sanitizeInput, 
  requireAuth,
  secureCompare,
  validateCsrfToken,
  generateCsrfToken
} from '@/integrations/supabase/client';

// Export all the functionality from our integrations directory
export { 
  supabase, 
  checkColumnExists, 
  checkColumnExistsFallback, 
  sanitizeInput, 
  requireAuth,
  secureCompare,
  validateCsrfToken,
  generateCsrfToken
};
