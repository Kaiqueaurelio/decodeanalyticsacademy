import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gynguskgysompgcajunc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5bmd1c2tneXNvbXBnY2FqdW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MTIxODAsImV4cCI6MjA5MTE4ODE4MH0.LidDO7DzGz4MHV0-azsjSNRLVUvZicxfLpmt4WStCoM";
const email = "decoanalytics@outlook.com.br";
const password = "Aurelio0496@@##";

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
