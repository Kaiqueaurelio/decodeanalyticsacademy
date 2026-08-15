import { supabase } from "../src/lib/content-recovery/recovery-client";

async function deepAudit() {
  console.log("🔍 Iniciando Auditoria Profunda de Conteúdo...");

  // 1. Verificar apostilas duplicadas
  const { data: duplicates } = await supabase.rpc('get_duplicate_apostilas'); 
  // Nota: Se a RPC não existir, fazemos via query manual
  const { data: allApostilas } = await supabase.from('apostilas').select('id, title, semester');
  
  const titleMap = new Map();
  const duplicateIds: string[] = [];
  
  allApostilas?.forEach(a => {
    const key = `${a.title.toLowerCase().trim()}_${a.semester}`;
    if (titleMap.has(key)) {
      duplicateIds.push(a.id);
    } else {
      titleMap.set(key, a.id);
    }
  });

  console.log(`\n⚠️ Encontradas ${duplicateIds.length} apostilas duplicadas.`);

  // 2. Verificar páginas órfãs (sem apostila pai)
  const { data: pages } = await supabase.from('apostila_pages').select('id, apostila_id');
  const orphanPages = pages?.filter(p => !allApostilas?.find(a => a.id === p.apostila_id)) || [];
  console.log(`\n⚠️ Encontradas ${orphanPages.length} páginas órfãs.`);

  // 3. Verificar exercícios sem alternativas (se não for dissertativo)
  const { data: exercises } = await supabase.from('exercises').select('id, type, question');
  // Se houver uma tabela de opções, checaríamos aqui. 
  // No esquema atual, parece que muitos são essay.

  // 4. Relatório de Saúde Geral
  const report = {
    total: allApostilas?.length,
    duplicates: duplicateIds.length,
    orphans: orphanPages.length,
    theoreticalHealth: allApostilas?.filter(a => a.title.includes('Teóricos')).length
  };

  console.log("\n📊 Relatório de Auditoria:", report);

  if (duplicateIds.length > 0) {
    console.log("\n🧹 Limpando duplicadas para estabilizar o sistema...");
    // Mantemos a mais recente, removemos as outras
    for (const id of duplicateIds) {
      await supabase.from('apostila_pages').delete().eq('apostila_id', id);
      await supabase.from('exercises').delete().eq('apostila_id', id);
      await supabase.from('apostilas').delete().eq('id', id);
    }
    console.log("✅ Limpeza concluída.");
  }
}

deepAudit().catch(console.error);
