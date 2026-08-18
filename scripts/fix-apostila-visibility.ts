import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

const targetApostilaId = "955b811b-c633-474e-8322-4167e55dfed7"; // Sistemas Operacionais e Mobile

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) throw authError;

  console.log("Authenticated as:", user.email);

  // Garantir visibilidade e semestre correto
  const { error: apostilaError } = await supabase
    .from('apostilas')
    .update({ 
      published: true, 
      semester: 6
    })
    .eq('id', targetApostilaId);
    
  if (apostilaError) {
    console.error("Erro ao atualizar apostila:", apostilaError);
  } else {
    console.log("Apostila 'Sistemas Operacionais e Mobile' marcada como publicada no 6º semestre.");
  }

  // Verificar se a página de Shell Script está lá
  const { data: pages, error: pageError } = await supabase
    .from('apostila_pages')
    .select('id, title, position')
    .eq('apostila_id', targetApostilaId)
    .order('position', { ascending: true });

  if (pageError) throw pageError;
  console.log("Páginas na apostila:", pages.map(p => `[Pos ${p.position}] ${p.title}`).join(', '));
}

main().catch(console.error);
