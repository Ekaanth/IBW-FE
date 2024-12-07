import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Types for our database tables
export type UserPosition = Database['public']['Tables']['positions']['Row'];
export type PriceHistory = Database['public']['Tables']['price_history']['Row'];
export type ValidatorAction = Database['public']['Tables']['validator_actions']['Row'];

export { supabase };