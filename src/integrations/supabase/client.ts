import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const PRODUCTION_SUPABASE_URL = 'https://wxkkpjpqyrygglbuogsd.supabase.co';
const PRODUCTION_SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_Zh6H3y8GJ2J_wkRVXxyTng_eylbCAVM';
const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const configuredKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const SUPABASE_URL = PRODUCTION_SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY =
  configuredUrl === PRODUCTION_SUPABASE_URL && configuredKey
    ? configuredKey
    : PRODUCTION_SUPABASE_PUBLISHABLE_KEY;
export const SUPABASE_PROJECT_ID = 'wxkkpjpqyrygglbuogsd';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: { headers: { 'x-client-info': 'decode-analytics-academy' } },
});
