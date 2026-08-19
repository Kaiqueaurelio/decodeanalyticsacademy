import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { getCorsHeaders } from '../_shared/cors.ts';

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function json(body: Record<string, unknown>, status: number, req: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

function cleanBase64(value: string) {
  return value.trim().replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
}

function base64ToBytes(value: string) {
  const decoded = atob(value);
  if (decoded.length > MAX_BYTES) throw new Error('A imagem excede o limite de 8 MB.');
  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}

function bytesToBase64(bytes: Uint8Array) {
  let output = '';
  const chunkSize = 8192;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    output += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(output);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: getCorsHeaders(req) });
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405, req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const photoroomKey = Deno.env.get('PHOTOROOM_API_KEY');

    if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: 'Configuração de autenticação indisponível.' }, 500, req);
    if (!photoroomKey) return json({ error: 'Processamento de imagem indisponível no momento.' }, 503, req);

    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Sessão necessária.' }, 401, req);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) return json({ error: 'Sessão inválida.' }, 401, req);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin, error: roleError } = await adminClient.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'admin',
    });
    if (roleError || !isAdmin) return json({ error: 'Acesso restrito a administradores.' }, 403, req);

    const body = await req.json();
    const contentType = String(body?.contentType || '').toLowerCase();
    const base64Data = cleanBase64(String(body?.base64Data || ''));
    if (!ALLOWED_TYPES.has(contentType)) return json({ error: 'Formato não suportado. Use JPG, PNG ou WEBP.' }, 415, req);
    if (!base64Data || base64Data.length > Math.ceil(MAX_BYTES * 1.4)) return json({ error: 'Imagem inválida ou acima do limite de 8 MB.' }, 400, req);

    const bytes = base64ToBytes(base64Data);
    const form = new FormData();
    form.append('image_file', new Blob([bytes], { type: contentType }), 'image');

    const response = await fetch('https://sdk.photoroom.com/v1/segment', {
      method: 'POST',
      headers: { 'x-api-key': photoroomKey },
      body: form,
    });

    if (!response.ok) {
      const providerMessage = (await response.text()).slice(0, 300);
      console.error('[photoroom-segment] provider error', response.status, providerMessage);
      return json({ error: 'O provedor de imagem recusou o processamento.' }, response.status >= 500 ? 502 : 400, req);
    }

    const output = new Uint8Array(await response.arrayBuffer());
    if (output.length > MAX_BYTES) return json({ error: 'Resultado acima do limite permitido.' }, 502, req);

    return json({
      dataUrl: `data:image/png;base64,${bytesToBase64(output)}`,
    }, 200, req);
  } catch (error) {
    console.error('[photoroom-segment] unexpected error', error);
    return json({ error: error instanceof Error ? error.message : 'Falha no processamento de imagem.' }, 500, req);
  }
});
