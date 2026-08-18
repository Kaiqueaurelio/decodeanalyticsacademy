import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

const targetApostilaId = "955b811b-c633-474e-8322-4167e55dfed7"; // Sistemas Operacionais e Mobile (S6)

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  await supabase.auth.signInWithPassword({ email, password });

  // Update status for ALL S6 subjects to be safe
  const { error: bulkError } = await supabase
    .from('apostilas')
    .update({ published: true })
    .eq('semester', 6);

  if (bulkError) console.error("Bulk error:", bulkError);

  // Check the folder/category mapping
  const { data: apostila } = await supabase
    .from('apostilas')
    .select('*')
    .eq('id', targetApostilaId)
    .single();

  console.log("Current state of target apostila:", apostila);
}

main().catch(console.error);
