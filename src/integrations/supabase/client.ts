import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Production backend of Decode Analytics Academy.
const PRODUCTION_SUPABASE_URL = 'https://wxkkpjpqyrygglbuogsd.supabase.co';
const PRODUCTION_SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_Zh6H3y8GJ2J_wkRVXxyTng_eylbCAVM';

// Prefer the explicitly configured production environment, but never allow a
// missing/mismatched environment variable to silently break authentication.
const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const configuredKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const SUPABASE_URL = PRODUCTION_SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY =
  configuredUrl === PRODUCTION_SUPABASE_URL && configuredKey
    ? configuredKey
    : PRODUCTION_SUPABASE_PUBLISHABLE_KEY;

export const SUPABASE_PROJECT_ID = 'wxkkpjpqyrygglbuogsd';

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'x-client-info': 'decode-analytics-academy',
      },
    },
  },
);
