import { getCorsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth-guard.ts";
// Proxy neutro para imagens promocionais.
// GET ?b=bucket&p=path  -> retorna a imagem (público, sem auth) com caminho que não dispara ad-blockers.
// POST { fileName, contentType, base64Data } -> faz upload (admin) no bucket 'announcements/promos/'.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';


const ALLOWED_BUCKETS = new Set(['announcements', 'ads']);
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function jsonResponse(body: unknown, status = 200, req?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

function cleanBase64(base64: string) {
  return base64.trim().replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
}

function exceedsBase64Limit(value: string) {
  return value.length > Math.ceil(MAX_UPLOAD_BYTES * 4 / 3) + 8;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(req) });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const bucket = (url.searchParams.get('b') || 'announcements').trim();
      const path = (url.searchParams.get('p') || '').trim().replace(/^\/+/, '');
      if (!ALLOWED_BUCKETS.has(bucket) || !path) {
        return jsonResponse({ error: 'invalid params' }, 400, req);
      }


      const { data, error } = await admin.storage.from(bucket).download(path);
      if (error || !data) {
        return jsonResponse({ error: 'not found' }, 404, req);
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
      const auth = await requireUser(req, getCorsHeaders(req), { requireAdmin: true });
      if (!auth.ok) return auth.response;

      const body = await req.json();
      const fileName = String(body?.fileName || '').trim().replace(/[^a-zA-Z0-9._-]/g, '_');
      const contentType = String(body?.contentType || 'image/png').trim();
      const base64Data = cleanBase64(String(body?.base64Data || ''));
      if (!fileName || !base64Data) return jsonResponse({ error: 'fileName e base64Data são obrigatórios' }, 400, req);
      if (!ALLOWED_IMAGE_TYPES.has(contentType)) return jsonResponse({ error: 'Tipo de imagem não suportado.' }, 400, req);
      if (exceedsBase64Limit(base64Data)) return jsonResponse({ error: 'A imagem excede o limite de 8 MB.' }, 413, req);

      const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      if (bytes.byteLength > MAX_UPLOAD_BYTES) return jsonResponse({ error: 'A imagem excede o limite de 8 MB.' }, 413, req);
      const objectPath = `promos/${fileName}`;

      const { error: uploadError } = await admin.storage
        .from('announcements')
        .upload(objectPath, bytes, { contentType, cacheControl: '3600', upsert: true });
      if (uploadError) {
        console.error('promo-media upload failed', uploadError.name || 'storage_error');
        return jsonResponse({ error: 'Não foi possível enviar a imagem.' }, 500, req);
      }

      const publicUrl = `${SUPABASE_URL}/functions/v1/promo-media?b=announcements&p=${encodeURIComponent(objectPath)}`;
      return jsonResponse({ publicUrl, bucket: 'announcements', path: objectPath }, 200, req);
    }

    return jsonResponse({ error: 'method not allowed' }, 405, req);
  } catch (e) {
    console.error('promo-media failed', e instanceof Error ? e.name : 'unknown');
    return jsonResponse({ error: 'Não foi possível processar a imagem.' }, 500, req);
  }

});
