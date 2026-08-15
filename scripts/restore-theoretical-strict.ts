import { supabase } from "../src/lib/content-recovery/recovery-client";

/**
 * Script de restauração de segurança para Aspectos Teóricos da Computação.
 * Garante que a versão MAIS COMPLETA seja a única presente.
 */
async function restoreTheoreticalStrict() {
  console.log("🛡️ Iniciando Restauração Estrita: Aspectos Teóricos da Computação");

  const { data: existing } = await supabase
    .from('apostilas')
    .select('id, title')
    .ilike('title', '%Aspectos Teóricos%');

  if (existing && existing.length > 1) {
    console.log(`Encontradas ${existing.length} instâncias. Removendo duplicatas...`);
    // Removemos todas menos uma
    const toDelete = existing.slice(1);
    for (const item of toDelete) {
      await supabase.from('apostila_pages').delete().eq('apostila_id', item.id);
      await supabase.from('exercises').delete().eq('apostila_id', item.id);
      await supabase.from('apostilas').delete().eq('id', item.id);
    }
  }

  // Agora re-executamos a restauração profunda para garantir conteúdo full
  const { restoreTheoreticalComputingApostila } = await import('../src/lib/content-recovery/recovery');
  await restoreTheoreticalComputingApostila();
  
  console.log("✅ Restauração Estrita Concluída.");
}

restoreTheoreticalStrict().catch(console.error);
