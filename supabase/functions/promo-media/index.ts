import { getCorsHeaders } from "../_shared/cors.ts";
// Proxy neutro para imagens promocionais.
// GET ?b=bucket&p=path  -> retorna a imagem (público, sem auth) com caminho que não dispara ad-blockers.
// POST { fileName, contentType, base64Data } -> faz upload (admin) no bucket 'announcements/promos/'.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_BASE64_CHARS = Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 4;
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

const FILE_SIGNATURES: Record<string, (bytes: Uint8Array) => boolean> = {
  'image/png': (bytes) =>
    bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e &&
    bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a,
  'image/jpeg': (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  'image/gif': (bytes) => bytes.length >= 6 &&
    (String.fromCharCode(...bytes.slice(0, 6)) === 'GIF87a' || String.fromCharCode(...bytes.slice(0, 6)) === 'GIF89a'),
  'image/webp': (bytes) => bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP',
};

function isSafeFileName(value: string): boolean {
  return value.length > 0 &&
    value.length <= 120 &&
    !value.includes('/') &&
    !value.includes('\\') &&
    !value.includes('..') &&
    !/[\u0000-\u001f\u007f]/.test(value);
}

function decodeBase64Image(base64: string): Uint8Array {
  if (
    !base64 ||
    base64.length > MAX_BASE64_CHARS ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(base64) ||
    base64.length % 4 === 1
  ) {
    throw new Error('Imagem inválida ou maior que o limite de 5 MB.');
  }

  const binary = atob(base64);
  if (binary.length > MAX_IMAGE_BYTES) {
    throw new Error('Imagem maior que o limite de 5 MB.');
  }
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}


const ALLOWED_BUCKETS = new Set(['announcements', 'ads']);

function jsonResponse(body: unknown, status = 200, req?: Request) {
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
        return jsonResponse({ error: 'invalid params' }, 400, req);
      }


      const { data, error } = await admin.storage.from(bucket).download(path);
      if (error || !data) {
        return jsonResponse({ error: error?.message || 'not found' }, 404, req);
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
        return jsonResponse({ error: 'Missing Authorization header' }, 401, req);
      }
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userErr } = await userClient.auth.getUser();
      if (userErr || !userData?.user) return jsonResponse({ error: 'Invalid session' }, 401, req);

      const { data: isAdmin, error: roleErr } = await admin.rpc('has_role', {
        _user_id: userData.user.id,
        _role: 'admin',
      });
      if (roleErr || !isAdmin) return jsonResponse({ error: 'admin only' }, 403, req);

      const contentLength = Number(req.headers.get('content-length') || 0);
      if (contentLength > 7_500_000) {
        return jsonResponse({ error: 'Imagem maior que o limite permitido.' }, 413, req);
      }

      const body = await req.json();
      const fileName = String(body?.fileName || '').trim();
      const contentType = String(body?.contentType || 'image/png').trim().toLowerCase();
      const base64Data = cleanBase64(String(body?.base64Data || ''));

      if (!fileName || !base64Data) {
        return jsonResponse({ error: 'fileName e base64Data são obrigatórios' }, 400, req);
      }
      if (!isSafeFileName(fileName)) {
        return jsonResponse({ error: 'Nome de arquivo inválido.' }, 400, req);
      }
      if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
        return jsonResponse({ error: 'Tipo de imagem não permitido.' }, 400, req);
      }

      let bytes: Uint8Array;
      try {
        bytes = decodeBase64Image(base64Data);
      } catch (error) {
        return jsonResponse({ error: error instanceof Error ? error.message : 'Imagem inválida.' }, 400, req);
      }

      const signatureCheck = FILE_SIGNATURES[contentType];
      if (!signatureCheck(bytes)) {
        return jsonResponse({ error: 'O conteúdo do arquivo não corresponde ao tipo de imagem informado.' }, 400, req);
      }

      const objectPath = `promos/${fileName}`;

      const { error: uploadError } = await admin.storage
        .from('announcements')
        .upload(objectPath, bytes, { contentType, cacheControl: '3600', upsert: true });
      if (uploadError) return jsonResponse({ error: 'Não foi possível enviar a imagem.' }, 500, req);

      const publicUrl = `${SUPABASE_URL}/functions/v1/promo-media?b=announcements&p=${encodeURIComponent(objectPath)}`;
      return jsonResponse({ publicUrl, bucket: 'announcements', path: objectPath }, 200, req);
    }

    return jsonResponse({ error: 'method not allowed' }, 405, req);
  } catch (e) {
    console.error('promo-media failed', e);
    return jsonResponse({ error: 'Não foi possível concluir a operação de mídia.' }, 500, req);
  }

});
