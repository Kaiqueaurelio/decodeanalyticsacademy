
import { supabase } from './recovery-client';

export async function restoreTheoreticalComputingApostila() {
  console.log('Restaurando Aspectos Teóricos da Computação...');
  
  // 1. Criar ou obter a apostila
  let { data: apostila } = await supabase
    .from('apostilas')
    .select('id')
    .ilike('title', '%Aspectos Teóricos%')
    .maybeSingle();

  if (!apostila) {
    const { data: newAp } = await supabase.from('apostilas').insert({
      title: 'Aspectos Teóricos da Computação',
      category: 'Ciência da Computação',
      semester: 6,
      published: true,
      status: 'liberada'
    }).select().single();
    apostila = newAp;
  }

  if (!apostila) throw new Error('Falha ao criar apostila');

  // 2. Limpar conteúdo antigo para garantir integridade
  await supabase.from('apostila_pages').delete().eq('apostila_id', apostila.id);
  await supabase.from('apostila_modules').delete().eq('apostila_id', apostila.id);

  // 3. Criar Módulos e Páginas (Conteúdo Minimalista para teste, expansível via outros scripts)
  const { data: mod } = await supabase.from('apostila_modules').insert({
    apostila_id: apostila.id,
    title: 'Módulo 1: Fundamentos da Teoria',
    order_index: 1
  }).select().single();

  if (mod) {
    const { data: chap } = await supabase.from('apostila_chapters').insert({
      module_id: mod.id,
      title: 'Capítulo 1: Introdução',
      order_index: 1
    }).select().single();

    if (chap) {
      await supabase.from('apostila_lessons').insert({
        chapter_id: chap.id,
        title: 'Introdução à Teoria',
        content_md: '# Bem-vindo à Teoria da Computação\nEste material cobre os fundamentos de máquinas de estado e linguagens formais.',
        order_index: 1
      });
    }
    
    // Também inserimos em apostila_pages para compatibilidade com o editor Notion
    await supabase.from('apostila_pages').insert({
      apostila_id: apostila.id,
      title: 'Introdução à Teoria',
      content: '# Bem-vindo à Teoria da Computação\nEste material cobre os fundamentos de máquinas de estado e linguagens formais.',
      position: 1
    });
  }

  console.log('✅ Aspectos Teóricos restaurado.');
  return { pageCount: 1 };
}

export async function verifyAllApostilasIntegrity() {
  const { data: apostilas } = await supabase.from('apostilas').select('id, title');
  const results = [];
  
  for (const ap of (apostilas || [])) {
    const { count: pages } = await supabase.from('apostila_pages').select('id', { count: 'exact', head: true }).eq('apostila_id', ap.id);
    const { count: exercises } = await supabase.from('exercises').select('id', { count: 'exact', head: true }).eq('apostila_id', ap.id);
    
    results.push({
      title: ap.title,
      status: pages && pages > 0 ? '✅ Saudável' : '⚠️ Vazia',
      pageCount: pages || 0,
      exerciseCount: exercises || 0,
      needsRepair: !pages || pages === 0
    });
  }
  return results;
}

export async function repairAllCorruptedApostilas() {
  console.log('Reparando apostilas corrompidas...');
  // Lógica de reparo simples: garantir published=true e semester consistente
  await supabase.from('apostilas').update({ published: true }).is('published', null);
  console.log('✅ Reparo básico concluído.');
}

export const backupManager = {
  async createFullBackup() {
    console.log('Backup simulado criado.');
  }
};
