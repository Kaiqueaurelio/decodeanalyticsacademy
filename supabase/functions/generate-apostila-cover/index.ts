// Gera uma capa para uma apostila usando Lovable AI (image generation)
// e salva no bucket `apostila-covers`, atualizando `apostilas.cover_url`.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BUCKET = 'apostila-covers';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      return json({ error: 'LOVABLE_API_KEY não configurada' }, 500);
    }

    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing Authorization' }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: 'Invalid session' }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: isAdmin } = await admin.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'admin',
    });
    if (!isAdmin) return json({ error: 'Apenas administradores' }, 403);

    const body = await req.json().catch(() => ({}));
    const apostilaId = String(body?.apostilaId || '').trim();
    const extraHint = String(body?.hint || '').trim();
    if (!apostilaId) return json({ error: 'apostilaId é obrigatório' }, 400);

    const { data: ap, error: apErr } = await admin
      .from('apostilas')
      .select('id, title, category, content')
      .eq('id', apostilaId)
      .maybeSingle();
    if (apErr || !ap) return json({ error: 'Apostila não encontrada' }, 404);

    // Resumo curto do conteúdo (primeiros ~600 chars de texto puro)
    const plain = String(ap.content || '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[#>*_`~\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 600);

    const prompt =
      `Capa de apostila acadêmica universitária para a disciplina "${ap.category}". ` +
      `Título: "${ap.title}". Tema: ${plain || ap.title}. ` +
      (extraHint ? `Direção: ${extraHint}. ` : '') +
      `Estilo: ilustração editorial moderna high-tech, paleta escura com acentos ciano (#00f0ff) e roxo (#a855f7), ` +
      `composição minimalista, profundidade, elementos abstratos que remetam ao tema, ` +
      `sem texto, sem letras, sem logotipos, sem marcas d'água. ` +
      `Formato landscape adequado para card de apostila.`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        prompt,
        // sem stream: buffer único
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      if (aiResp.status === 429) return json({ error: 'Limite de uso atingido. Tente novamente em alguns instantes.' }, 429);
      if (aiResp.status === 402) return json({ error: 'Créditos do AI Gateway esgotados.' }, 402);
      return json({ error: 'Falha na geração de imagem: ' + t.slice(0, 400) }, 500);
    }

    const aiJson = await aiResp.json();
    const b64: string | undefined = aiJson?.data?.[0]?.b64_json;
    if (!b64) return json({ error: 'Resposta da IA sem imagem' }, 500);

    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const filePath = `${apostilaId}/${Date.now()}.png`;

    const { error: upErr } = await admin.storage.from(BUCKET).upload(filePath, bytes, {
      contentType: 'image/png',
      cacheControl: '31536000',
      upsert: true,
    });
    if (upErr) return json({ error: 'Falha ao subir capa: ' + upErr.message }, 500);

    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(filePath);
    const coverUrl = pub.publicUrl;

    const { error: updErr } = await admin
      .from('apostilas')
      .update({ cover_url: coverUrl })
      .eq('id', apostilaId);
    if (updErr) return json({ error: 'Falha ao salvar URL: ' + updErr.message }, 500);

    return json({ ok: true, cover_url: coverUrl });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro desconhecido' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
