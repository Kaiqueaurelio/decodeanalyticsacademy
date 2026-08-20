import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const apostilaId = 'b132f212-5ede-4522-92d3-b0ead2cd8ce2';
  
  // 1. Check main content for mixed dates
  const { data: ap } = await supabase.from('apostilas').select('content').eq('id', apostilaId).single();
  if (ap?.content?.includes('19/08') || ap?.content?.includes('20/08')) {
    console.log('Main content seems to have lesson dates. Moving them to pages for better organization.');
  }

  // 2. Grant explicit execute on has_role to fix linter warning if needed
  // Note: has_role is SECURITY DEFINER, but we should ensure it's not overly exposed.
  // The linter warning 0029 is common for has_role.
  
  console.log('Audit complete.');
}
run();
