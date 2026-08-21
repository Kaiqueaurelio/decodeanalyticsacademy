import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth-guard.ts";

const TABLE_COLUMNS: Record<string, string> = {
  profiles: "id,user_id,email,full_name,course,semester,account_type,content_scope,avatar_url,created_at",
  answers: "id,user_id,exercise_id,selected_answer,is_correct,created_at",
  planos_estudo: "id,user_id,title,area,goal,level,deadline,days_per_week,hours_per_day,subjects,priorities,plan,status,version,created_at,updated_at",
  study_plans: "id,user_id,apostila_id,apostila_title,subject,reason,plan_date,completed,completed_at,pomodoros,sort_order,related_event_id,related_event_title,related_event_date,created_at",
  study_streaks: "id,user_id,current_streak,longest_streak,last_study_date,created_at,updated_at",
  user_xp: "id,user_id,xp_points,level,created_at,updated_at",
  user_badges: "id,user_id,badge_id,earned_at",
  flashcards: "id,user_id,apostila_id,front,back,difficulty,ease_factor,interval_days,last_reviewed,next_review,repetitions,created_at",
  annotations: "id,user_id,apostila_id,content,color,position,created_at,updated_at",
  apostila_comments: "id,user_id,apostila_id,content,likes_count,created_at,updated_at",
  apostila_likes: "id,user_id,apostila_id,created_at",
  apostila_favorites: "id,user_id,apostila_id,created_at",
  community_posts: "id,user_id,created_at",
  community_replies: "id,user_id,created_at",
  reading_progress: "id,user_id,book_id,file_type,current_page,location,progress_percentage,updated_at",
  playbooks_highlights: "id,user_id,book_id,color,text,page,start_location,end_location,created_at",
  playbooks_notes: "id,user_id,book_id,content,highlight_id,page,created_at,updated_at",
  playbooks_bookmarks: "id,user_id,book_id,label,location,page,created_at",
  notifications: "id,user_id,title,body,link,type,read,created_at",
};

const SENSITIVE_KEY = /^(password|password_hash|access_token|refresh_token|token|secret|api_key|private_key|auth|p256dh)$/i;

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

function redact(value: unknown): JsonValue {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const output: Record<string, JsonValue> = {};
    for (const [key, child] of Object.entries(value)) {
      if (!SENSITIVE_KEY.test(key)) output[key] = redact(child);
    }
    return output;
  }
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return value;
  }
  return null;
}

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
    },
  });
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, {
      ...corsHeaders,
      Allow: "POST, OPTIONS",
    });
  }

  const auth = await requireUser(req, corsHeaders);
  if (!auth.ok) return auth.response;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("User export is not configured");
    return jsonResponse({ error: "Export unavailable" }, 503, corsHeaders);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const exportData: Record<string, JsonValue> = {
      user_info: redact({
        id: auth.userId,
        email: auth.user.email,
        created_at: auth.user.created_at,
        last_sign_in_at: auth.user.last_sign_in_at,
      }),
    };

    await Promise.all(Object.entries(TABLE_COLUMNS).map(async ([table, columns]) => {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select(columns)
        .eq("user_id", auth.userId);
      if (error) {
        console.error("User export table failed", table, error.code ?? "unknown");
        return;
      }
      exportData[table] = redact(data ?? []);
    }));

    return new Response(JSON.stringify(exportData), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="decode_data_export_${auth.userId}.json"`,
      },
    });
  } catch (error) {
    console.error("User export failed", error instanceof Error ? error.name : "UnknownError");
    return jsonResponse({ error: "Não foi possível exportar os dados." }, 500, corsHeaders);
  }
});
