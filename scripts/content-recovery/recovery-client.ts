import { createClient } from '@supabase/supabase-js';

// Server-side/script-only client. This file MUST stay outside of src/ so that
// Vite never bundles it (and never inlines the service-role key) into the
// browser bundle. Secrets here are read from non-VITE_ env vars only.
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. These recovery scripts must be run server-side with script-only environment variables.',
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
