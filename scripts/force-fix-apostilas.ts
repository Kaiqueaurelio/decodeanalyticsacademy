import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

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
