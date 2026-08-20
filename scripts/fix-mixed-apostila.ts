import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixApostila() {
  const pageId = '812c2375-dc09-460e-a964-1bba36d586ba';
  
  // 1. Get the mixed content
  const { data: page, error: fetchError } = await supabase
    .from('apostila_pages')
    .select('content, apostila_id')
    .eq('id', pageId)
    .single();
    
  if (fetchError || !page) {
    console.error('Error fetching page:', fetchError);
    return;
  }
  
  const content = page.content;
  const marker = '## **Parte 2 - Continuação**';
  
  if (!content.includes(marker)) {
    console.log('Marker not found in content.');
    return;
  }
  
  const [part1, part2Raw] = content.split(marker);
  const part2 = marker + part2Raw;
  
  console.log('Split complete. Part 1 length:', part1.length, 'Part 2 length:', part2.length);
  
  // 2. Update existing page with Part 1 (19/08)
  const { error: updateError } = await supabase
    .from('apostila_pages')
    .update({ 
      content: part1.trim(),
      title: 'Aula - 19/08/2026 (Parte 1)'
    })
    .eq('id', pageId);
    
  if (updateError) {
    console.error('Error updating page 1:', updateError);
    return;
  }
  
  // 3. Create new page with Part 2 (Continuação)
  const { error: insertError } = await supabase
    .from('apostila_pages')
    .insert({
      apostila_id: page.apostila_id,
      title: 'Aula - 19/08/2026 (Continuação)',
      content: part2.trim(),
      position: 1.5 // Will be between 1 and 2
    });
    
  if (insertError) {
    console.error('Error inserting page 2:', insertError);
    return;
  }
  
  console.log('Apostila content separated successfully.');
}

fixApostila();
