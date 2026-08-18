import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

const targetApostilaId = "955b811b-c633-474e-8322-4167e55dfed7";

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await supabase.auth.signInWithPassword({ email, password });

  // Update title to be exact match for common naming conventions
  await supabase
    .from('apostilas')
    .update({ 
      title: 'Sistemas Operacionais Abertos e Mobile',
      category: 'Sistemas Operacionais Abertos e Mobile',
      semester: 6,
      published: true
    })
    .eq('id', targetApostilaId);
    
  console.log("Apostila title/category synced to 'Sistemas Operacionais Abertos e Mobile'");
}

main().catch(console.error);
