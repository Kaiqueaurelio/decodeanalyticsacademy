import { supabase } from '../src/integrations/supabase/client';

async function main() {
  const ids = [
    '955b811b-c633-474e-8322-4167e55dfed7', // Mobile
    'd3a7a3cb-d89a-418a-a084-971e9fa4e896'  // Theoretical
  ];

  console.log(`Updating ${ids.length} apostilas to semester 6...`);

  const { data, error } = await supabase
    .from('apostilas')
    .update({ semester: 6 })
    .in('id', ids)
    .select();

  if (error) {
    console.error('Error updating semesters:', error);
    process.exit(1);
  }

  console.log('Update successful:', data);
}

main();
