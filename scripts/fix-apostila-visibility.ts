import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gynguskgysompgcajunc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5bmd1c2tneXNvbXBnY2FqdW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MTIxODAsImV4cCI6MjA5MTE4ODE4MH0.LidDO7DzGz4MHV0-azsjSNRLVUvZicxfLpmt4WStCoM";
const email = "decoanalytics@outlook.com.br";
const password = "Aurelio0496@@##";

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
