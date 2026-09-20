import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_BASE64_CHARS = Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 4;

const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

const FILE_SIGNATURES: Record<string, (bytes: Uint8Array) => boolean> = {
  'image/png': (bytes) =>
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a,
  'image/jpeg': (bytes) =>
    bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  'image/gif': (bytes) =>
    bytes.length >= 6 && (
      String.fromCharCode(...bytes.slice(0, 6)) === 'GIF87a' ||
      String.fromCharCode(...bytes.slice(0, 6)) === 'GIF89a'
    ),
  'image/webp': (bytes) =>
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP',
};

function cleanBase64(base64: string) {
  return base64.trim().replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
}

function isSafeFileName(fileName: string): boolean {
  if (!fileName || fileName.length > 120) return false;
  if (fileName.includes('/') || fileName.includes('\\')) return false;
  if (fileName.includes('..')) return false;
  return !/[\u0000-\u001f\u007f]/.test(fileName);
}

function decodeBase64Image(base64Data: string): Uint8Array {
  if (
    !base64Data ||
    base64Data.length > MAX_BASE64_CHARS ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data) ||
    base64Data.length % 4 === 1
  ) {
    throw new Error('Imagem inválida ou maior que o limite de 5 MB.');
  }

  const binary = atob(base64Data);
  if (binary.length > MAX_IMAGE_BYTES) {
    throw new Error('Imagem maior que o limite de 5 MB.');
  }

  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const fileName = String(body?.fileName || '').trim();
    const contentType = String(body?.contentType || 'image/png').trim().toLowerCase();
    const base64Data = cleanBase64(String(body?.base64Data || ''));

    if (!fileName || !base64Data) {
      return new Response(JSON.stringify({ error: 'fileName e base64Data são obrigatórios' }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    if (!isSafeFileName(fileName)) {
      return new Response(JSON.stringify({ error: 'Nome de arquivo inválido.' }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      return new Response(JSON.stringify({ error: 'Tipo de imagem não permitido.' }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    let bytes: Uint8Array;
    try {
      bytes = decodeBase64Image(base64Data);
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Imagem inválida.',
      }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const signatureCheck = FILE_SIGNATURES[contentType];
    if (!signatureCheck(bytes)) {
      return new Response(JSON.stringify({ error: 'O conteúdo do arquivo não corresponde ao tipo de imagem informado.' }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: isAdmin, error: roleErr } = await admin.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'admin',
    });

    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Permission denied: admin only' }), {
        status: 403,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const objectPath = `ads/${fileName}`;

    const { error: uploadError } = await admin.storage.from('ads').upload(objectPath, bytes, {
      contentType,
      cacheControl: '3600',
      upsert: true,
    });

    if (uploadError) {
      return new Response(JSON.stringify({ error: 'Não foi possível enviar a imagem.' }), {
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const { data } = admin.storage.from('ads').getPublicUrl(objectPath);
    return new Response(JSON.stringify({ publicUrl: data.publicUrl, path: objectPath }), {
      status: 200,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('admin-upload-ad-image failed', e);
    return new Response(JSON.stringify({ error: 'Não foi possível concluir o upload da imagem.' }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});