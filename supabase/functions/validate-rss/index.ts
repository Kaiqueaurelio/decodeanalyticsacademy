// Valida um feed RSS/Atom: verifica se o endpoint responde e contém itens parseáveis.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface ValidateResult {
  ok: boolean;
  itemCount: number;
  source: string | null;
  error?: string;
}

function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? m[1].trim() : '';
}

async function validate(url: string): Promise<ValidateResult> {
  if (!/^https?:\/\//i.test(url)) return { ok: false, itemCount: 0, source: null, error: 'URL inválida' };
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 7000);
    const res = await fetch(url, {
      signal: ac.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 DecodeNewsBot/1.0',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    });
    clearTimeout(t);
    if (!res.ok) return { ok: false, itemCount: 0, source: null, error: `HTTP ${res.status}` };
    const xml = await res.text();
    if (!xml || xml.length < 40) return { ok: false, itemCount: 0, source: null, error: 'Resposta vazia' };
    if (!/<(rss|feed|channel)\b/i.test(xml)) {
      return { ok: false, itemCount: 0, source: null, error: 'Conteúdo não é RSS/Atom' };
    }
    const isAtom = /<feed[\s>]/i.test(xml);
    const blocks = xml.match(isAtom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi) || [];
    const valid = blocks.filter((b) => pick(b, 'title').length > 0);
    if (valid.length === 0) return { ok: false, itemCount: 0, source: null, error: 'Nenhum item encontrado' };
    const channel = xml.match(/<channel[\s>]([\s\S]*?)<\/channel>/i)?.[1] || xml;
    const source = pick(channel, 'title').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() || null;
    return { ok: true, itemCount: valid.length, source };
  } catch (e) {
    const msg = String(e?.message || e);
    if (/aborted/i.test(msg)) return { ok: false, itemCount: 0, source: null, error: 'Timeout ao acessar o feed' };
    return { ok: false, itemCount: 0, source: null, error: 'Falha de rede' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    let url: string | null = null;
    let urls: string[] | null = null;
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      url = typeof body.url === 'string' ? body.url : null;
      urls = Array.isArray(body.urls) ? body.urls : null;
    } else {
      url = new URL(req.url).searchParams.get('url');
    }
    if (urls && urls.length > 0) {
      const results = await Promise.all(urls.map(async (u) => ({ url: u, ...(await validate(u)) })));
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!url) {
      return new Response(JSON.stringify({ ok: false, error: 'URL obrigatória' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const result = await validate(url);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
