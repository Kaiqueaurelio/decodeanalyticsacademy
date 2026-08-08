import { getCorsHeaders } from "../_shared/cors.ts";
// Proxy neutro para imagens promocionais.
// GET ?b=bucket&p=path  -> retorna a imagem (público, sem auth) com caminho que não dispara ad-blockers.
// POST { fileName, contentType, base64Data } -> faz upload (admin) no bucket 'announcements/promos/'.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';


const ALLOWED_BUCKETS = new Set(['announcements', 'ads']);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

function cleanBase64(base64: string) {
  return base64.trim().replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(req) });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const bucket = (url.searchParams.get('b') || 'announcements').trim();
      const path = (url.searchParams.get('p') || '').trim().replace(/^\/+/, '');
      if (!ALLOWED_BUCKETS.has(bucket) || !path) {
        return jsonResponse({ error: 'invalid params' }, 400);
      }

      const { data, error } = await admin.storage.from(bucket).download(path);
      if (error || !data) {
        return jsonResponse({ error: error?.message || 'not found' }, 404);
      }
      const contentType = data.type || 'image/png';
      const buffer = await data.arrayBuffer();
      return new Response(buffer, {
        status: 200,
        headers: {
          ...getCorsHeaders(req),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    if (req.method === 'POST') {
      const authHeader = req.headers.get('Authorization') || '';
      if (!authHeader.startsWith('Bearer ')) {
        return jsonResponse({ error: 'Missing Authorization header' }, 401);
      }
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userErr } = await userClient.auth.getUser();
      if (userErr || !userData?.user) return jsonResponse({ error: 'Invalid session' }, 401);

      const { data: isAdmin, error: roleErr } = await admin.rpc('has_role', {
        _user_id: userData.user.id,
        _role: 'admin',
      });
      if (roleErr || !isAdmin) return jsonResponse({ error: 'admin only' }, 403);

      const body = await req.json();
      const fileName = String(body?.fileName || '').trim().replace(/[^a-zA-Z0-9._-]/g, '_');
      const contentType = String(body?.contentType || 'image/png').trim();
      const base64Data = cleanBase64(String(body?.base64Data || ''));
      if (!fileName || !base64Data) return jsonResponse({ error: 'fileName e base64Data são obrigatórios' }, 400);

      const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const objectPath = `promos/${fileName}`;

      const { error: uploadError } = await admin.storage
        .from('announcements')
        .upload(objectPath, bytes, { contentType, cacheControl: '3600', upsert: true });
      if (uploadError) return jsonResponse({ error: uploadError.message }, 500);

      const publicUrl = `${SUPABASE_URL}/functions/v1/promo-media?b=announcements&p=${encodeURIComponent(objectPath)}`;
      return jsonResponse({ publicUrl, bucket: 'announcements', path: objectPath });
    }

    return jsonResponse({ error: 'method not allowed' }, 405);
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
