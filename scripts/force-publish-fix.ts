import { supabase } from '../src/integrations/supabase/client';

async function fixApostilas() {
  console.log('--- Forced Fix: Sistemas Operacionais e Mobile ---');
  
  // 1. Force publish and set status for the target apostila
  const { data: updated, error: updateError } = await supabase
    .from('apostilas')
    .update({ 
      published: true, 
      status: 'liberada',
      semester: 6 
    })
    .ilike('title', '%Sistemas Operacionais e Mobile%')
    .select();

  if (updateError) {
    console.error('Update error:', updateError);
  } else {
    console.log('Updated rows:', updated);
  }

  // 2. Ensure all other apostilas are also published (global rule)
  const { error: globalError } = await supabase
    .from('apostilas')
    .update({ published: true, status: 'liberada' })
    .eq('published', false);

  if (globalError) {
    console.error('Global update error:', globalError);
  } else {
    console.log('Global visibility enforced.');
  }

  console.log('--- Done ---');
}

fixApostilas();
