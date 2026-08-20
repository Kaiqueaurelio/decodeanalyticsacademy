import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixApostila() {
  const pageId = '812c2375-dc09-460e-a964-1bba36d586ba';
  const apostilaId = 'b132f212-5ede-4522-92d3-b0ead2cd8ce2';
  
  const { data: page } = await supabase
    .from('apostila_pages')
    .select('content')
    .eq('id', pageId)
    .single();
    
  if (!page) return;

  const content = page.content;
  // Based on the previous read, I saw the content starting with "# **Programação linear & Métodos Gráficos**"
  // The user says it "misturou com-- do dia-- a aula do dia 19 com a aula do outro dia".
  // Let's look for a specific marker or date change within that content string if it exists.
  // If not found in this specific page, maybe it was in the main apostila content.
  
  console.log('Checking content for mixed dates...');
  // Actually, I already fixed the pages earlier but the script said "Marker not found".
  // Let me look at the content again carefully from the logs.
}
fixApostila();
