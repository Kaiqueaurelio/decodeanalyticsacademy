import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gynguskgysompgcajunc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5bmd1c2tneXNvbXBnY2FqdW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MTIxODAsImV4cCI6MjA5MTE4ODE4MH0.LidDO7DzGz4MHV0-azsjSNRLVUvZicxfLpmt4WStCoM";

const email = "decoanalytics@outlook.com.br";
const password = "Aurelio0496@@##";

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

  if (authError) {
    console.error("Erro na autenticação:", authError);
    process.exit(1);
  }

  const ids = [
    '955b811b-c633-474e-8322-4167e55dfed7', // Mobile
    'd3a7a3cb-d89a-418a-a084-971e9fa4e896'  // Theoretical
  ];

  console.log(`Forçando semestre 6 e visibilidade total para ${ids.length} apostilas...`);

  const { data, error } = await supabase
    .from('apostilas')
    .update({ 
      semester: 6, 
      published: true, 
      status: 'liberada' 
    })
    .in('id', ids)
    .select();

  if (error) {
    console.error('Erro na atualização:', error);
    process.exit(1);
  }

  console.log('Atualização concluída com sucesso:', data);
}

main();
