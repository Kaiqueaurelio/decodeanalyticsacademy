import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- RECOVERY START ---');
  
  // 1. Garantir que as categorias no banco batam exatamente com a grade acadêmica para match de folder
  const gradeMapping: Record<string, string[]> = {
    6: [
      'Pesquisa Operacional',
      'Sistemas Operacionais e Mobile',
      'Calculo Numerico Computacional',
      'Aspectos Teoricos da Computacao',
      'Gestao de Projetos I',
      'Processamento de Imagem e Visao Computacional',
      'Ciencia de Dados',
      'Metodos de Pesquisa',
      'Interdisciplinar de Ciencia da Computacao'
    ]
  };

  for (const [sem, subjects] of Object.entries(gradeMapping)) {
    for (const subject of subjects) {
      // Normalizar categoria no banco
      const { data: updated } = await supabase
        .from('apostilas')
        .update({ 
          category: subject,
          semester: parseInt(sem),
          published: true,
          status: 'liberada'
        })
        .ilike('title', `%${subject}%`);
      
      console.log(`Verified/Fixed: ${subject}`);
    }
  }

  // 2. Resolver o erro de "Material em fase de estruturação"
  // O RPC `get_apostila_reader_tree` falha se não houver `apostila_modules`
  // Se não houver módulos, vamos criar uma estrutura básica para cada apostila do 6º semestre
  
  const { data: apostilas } = await supabase.from('apostilas').select('id, title').eq('semester', 6);
  
  for (const ap of (apostilas || [])) {
    const { data: mods } = await supabase.from('apostila_modules').select('id').eq('apostila_id', ap.id).limit(1);
    
    if (!mods || mods.length === 0) {
      console.log(`Creating default structure for: ${ap.title}`);
      
      const { data: newMod } = await supabase.from('apostila_modules').insert({
        apostila_id: ap.id,
        title: 'Módulo 1: Fundamentos',
        order_index: 1
      }).select().single();
      
      if (newMod) {
        const { data: newChap } = await supabase.from('apostila_chapters').insert({
          module_id: newMod.id,
          title: 'Introdução',
          order_index: 1
        }).select().single();
        
        if (newChap) {
          // Vincular as páginas existentes a este capítulo como lições
          const { data: pages } = await supabase.from('apostila_pages').select('id, title, content, position').eq('apostila_id', ap.id);
          
          for (const page of (pages || [])) {
            await supabase.from('apostila_lessons').insert({
              chapter_id: newChap.id,
              title: page.title,
              content_md: page.content,
              order_index: page.position
            });
          }
        }
      }
    }
  }

  console.log('--- RECOVERY END ---');
}
run();
