import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
    authHeader.replace("Bearer ", "")
  );

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const tablesToExport = [
      'profiles',
      'answers',
      'planos_estudo',
      'study_plans',
      'study_streaks',
      'user_xp',
      'user_badges',
      'flashcards',
      'annotations',
      'apostila_comments',
      'apostila_likes',
      'apostila_favorites',
      'community_posts',
      'community_replies',
      'reading_progress',
      'playbooks_highlights',
      'playbooks_notes',
      'playbooks_bookmarks',
      'notifications'
    ];

    const exportData: Record<string, any> = {
      user_info: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      }
    };

    // Parallel fetch of user data from all related tables
    const fetchPromises = tablesToExport.map(async (table) => {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .eq('user_id', user.id);
      
      if (!error && data) {
        exportData[table] = data;
      }
    });

    await Promise.all(fetchPromises);

    return new Response(JSON.stringify(exportData), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="decode_data_export_${user.id}.json"`
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
