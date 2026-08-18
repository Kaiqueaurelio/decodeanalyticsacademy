import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gynguskgysompgcajunc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5bmd1c2tneXNvbXBnY2FqdW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MTIxODAsImV4cCI6MjA5MTE4ODE4MH0.LidDO7DzGz4MHV0-azsjSNRLVUvZicxfLpmt4WStCoM";
const email = "decoanalytics@outlook.com.br";
const password = "Aurelio0496@@##";

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
