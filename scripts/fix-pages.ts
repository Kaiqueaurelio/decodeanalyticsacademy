import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const apostilaId = 'b132f212-5ede-4522-92d3-b0ead2cd8ce2';
  
  // 1. Get the current pages
  const { data: pages } = await supabase
    .from('apostila_pages')
    .select('*')
    .eq('apostila_id', apostilaId)
    .order('position', { ascending: true });

  if (!pages) return;

  // We want to keep page 1 (Aula 19/08) and repurpose page 2 (Empty)
  // or create a new one if needed.
  
  const page19 = pages.find(p => p.id === '812c2375-dc09-460e-a964-1bba36d586ba');
  const page20 = pages.find(p => p.id === 'e9923dc3-33be-4023-9567-ed7c9726caf6');

  if (page19) {
    await supabase.from('apostila_pages').update({
      title: 'Aula - 19/08/2026 (Pesquisa Operacional & Modelagem)',
      position: 1
    }).eq('id', page19.id);
  }

  if (page20) {
    // If it's empty, let's give it a placeholder for the next class
    await supabase.from('apostila_pages').update({
      title: 'Aula - 20/08/2026 (Conteúdo em Breve)',
      content: '> O conteúdo desta aula será inserido em breve pelo administrador.',
      position: 2
    }).eq('id', page20.id);
  }

  console.log('Pages updated.');
}
run();
