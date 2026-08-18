import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

async function fixUser() {
  const email = 'decoanalytics@outlook.com.br';
  const ra = 'G802144';

  console.log(`Fixing user: ${email} / RA: ${ra}`);

  // 1. Confirm email in auth.users
  const { data: userUpdate, error: authErr } = await admin.auth.admin.updateUserById(
    '1ea75282-cc92-49a2-92a2-4c54344a6d43',
    { email_confirm: true }
  );
  
  if (authErr) console.error("Error confirming email:", authErr);
  else console.log("Email confirmed for 1ea75282-cc92-49a2-92a2-4c54344a6d43");

  // 2. Clear auth attempts
  const { error: delErr } = await admin.from('auth_attempts').delete().or(`identifier.eq.${ra},identifier.eq.${email}`);
  if (delErr) console.error("Error clearing attempts:", delErr);
  else console.log("Auth attempts cleared.");

  // 3. Ensure profile is correct
  const { error: profErr } = await admin.from('profiles').update({ ra, account_type: 'admin' }).eq('user_id', '1ea75282-cc92-49a2-92a2-4c54344a6d43');
  if (profErr) console.error("Error updating profile:", profErr);
  else console.log("Profile updated.");

  // 4. Ensure user_roles is correct
  const { data: roles } = await admin.from('user_roles').select('*').eq('user_id', '1ea75282-cc92-49a2-92a2-4c54344a6d43').eq('role', 'admin');
  if (!roles || roles.length === 0) {
    const { error: roleErr } = await admin.from('user_roles').insert({ user_id: '1ea75282-cc92-49a2-92a2-4c54344a6d43', role: 'admin' });
    if (roleErr) console.error("Error inserting role:", roleErr);
    else console.log("Admin role inserted.");
  } else {
    console.log("Admin role already exists.");
  }
}

fixUser();
