import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  console.log('--- Iniciando Auditoria e Restauração de Visibilidade ---');

  // 1. Forçar semestre 6 e published=true para apostilas conhecidas da grade
  const subjects6 = [
    'Sistemas Operacionais e Mobile',
    'Aspectos Teoricos da Computacao',
    'Aspectos Teóricos da Computação',
    'Calculo Numerico Computacional',
    'Pesquisa Operacional',
    'Gestao de Projetos I',
    'Processamento de Imagem e Visao Computacional',
    'Ciencia de Dados',
    'Metodos de Pesquisa',
    'Interdisciplinar de Ciencia da Computacao'
  ];

  for (const subject of subjects6) {
    const { data, error } = await supabase
      .from('apostilas')
      .update({ 
        semester: 6, 
        published: true, 
        status: 'liberada' 
      })
      .ilike('title', `%${subject}%`);
    
    if (error) console.error(`Erro ao atualizar ${subject}:`, error.message);
    else console.log(`Atualizado (ou verificado): ${subject}`);
  }

  // 2. Garantir que as páginas existam para essas apostilas
  // Se uma apostila não tem páginas, ela cai no fallback de "Material em fase de estruturação"
  const { data: apostilas } = await supabase
    .from('apostilas')
    .select('id, title')
    .in('semester', [6]);

  for (const ap of (apostilas || [])) {
    const { count } = await supabase
      .from('apostila_pages')
      .select('*', { count: 'exact', head: true })
      .eq('apostila_id', ap.id);

    if (count === 0) {
      console.log(`Criando página inicial para: ${ap.title} (${ap.id})`);
      await supabase.from('apostila_pages').insert({
        apostila_id: ap.id,
        title: 'Introdução e Guia de Estudo',
        content: '# Introdução\n\nBem-vindo ao material de ' + ap.title + '.\n\nEste conteúdo está sendo estruturado para o semestre letivo.',
        position: 1
      });
    }
  }

  console.log('--- Restauração Concluída ---');
}

fix();
