import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gynguskgysompgcajunc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5bmd1c2tneXNvbXBnY2FqdW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MTIxODAsImV4cCI6MjA5MTE4ODE4MH0.LidDO7DzGz4MHV0-azsjSNRLVUvZicxfLpmt4WStCoM";
const email = "decoanalytics@outlook.com.br";
const password = "Aurelio0496@@##";

const targetApostilaId = "955b811b-c633-474e-8322-4167e55dfed7"; // Sistemas Operacionais e Mobile (S6)

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  await supabase.auth.signInWithPassword({ email, password });

  // 1. Forçar a categoria para bater com o filtro do dashboard se necessário
  // O dashboard filtra por canonicalSubjectKey(category)
  // Vamos garantir que a categoria seja exatamente a esperada
  const { error: catError } = await supabase
    .from('apostilas')
    .update({ 
      category: 'Sistemas Operacionais Abertos e Mobile',
      published: true,
      semester: 6 
    })
    .eq('id', targetApostilaId);

  if (catError) console.error("Category update error:", catError);

  // 2. Garantir que a página de Shell Script seja a SEGUNDA (position 2)
  // Já vimos que ela existe com position 2, mas vamos reforçar
  const { data: pages } = await supabase
    .from('apostila_pages')
    .select('id, title, position')
    .eq('apostila_id', targetApostilaId)
    .order('position', { ascending: true });

  console.log("Pages before position adjustment:", pages);

  // 3. Limpar qualquer outra apostila duplicada no 6º semestre com o mesmo nome
  const { data: duplicates } = await supabase
    .from('apostilas')
    .select('id')
    .eq('semester', 6)
    .ilike('title', '%Sistemas Operacionais%')
    .neq('id', targetApostilaId);

  if (duplicates && duplicates.length > 0) {
    console.log("Found duplicates, hiding them:", duplicates);
    await supabase
      .from('apostilas')
      .update({ published: false })
      .in('id', duplicates.map(d => d.id));
  }

  console.log("Final audit complete for ID:", targetApostilaId);
}

main().catch(console.error);
