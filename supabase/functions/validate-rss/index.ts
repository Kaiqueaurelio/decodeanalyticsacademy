// Valida um feed RSS/Atom: verifica se o endpoint responde e contém itens parseáveis.
// Agora também registra o histórico de validações para auditoria.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireUser } from '../_shared/auth-guard.ts';

function isSafePublicUrl(raw: string): boolean {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  const host = u.hostname.toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) return false;
  if (host.startsWith('[')) return false;
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)];
    if (a === 10 || a === 127 || a === 0) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a >= 224) return false;
  }
  return true;
}

interface ValidateResult {
  ok: boolean;
  itemCount: number;
  source: string | null;
  error?: string;
  statusCode?: number;
  responseTime?: number;
}

function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? m[1].trim() : '';
}

async function validate(url: string): Promise<ValidateResult> {
  if (!isSafePublicUrl(url)) return { ok: false, itemCount: 0, source: null, error: 'URL inválida', statusCode: 0, responseTime: 0 };
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 7000);
    const startTime = Date.now();
    const res = await fetch(url, {
      signal: ac.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 DecodeNewsBot/1.0',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    });
    const responseTime = Date.now() - startTime;
    clearTimeout(t);
    if (!res.ok) return { ok: false, itemCount: 0, source: null, error: `HTTP ${res.status}`, statusCode: res.status, responseTime };
    const xml = await res.text();
    if (!xml || xml.length < 40) return { ok: false, itemCount: 0, source: null, error: 'Resposta vazia', statusCode: 200, responseTime };
    if (!/<(rss|feed|channel)\b/i.test(xml)) {
      return { ok: false, itemCount: 0, source: null, error: 'Conteúdo não é RSS/Atom', statusCode: 200, responseTime };
    }
    const isAtom = /<feed[\s>]/i.test(xml);
    const blocks = xml.match(isAtom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi) || [];
    const valid = blocks.filter((b) => pick(b, 'title').length > 0);
    if (valid.length === 0) return { ok: false, itemCount: 0, source: null, error: 'Nenhum item encontrado', statusCode: 200, responseTime };
    const channel = xml.match(/<channel[\s>]([\s\S]*?)<\/channel>/i)?.[1] || xml;
    const source = pick(channel, 'title').replace(/<![\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() || null;
    return { ok: true, itemCount: valid.length, source, statusCode: 200, responseTime };
  } catch (e) {
    const msg = String(e?.message || e);
    if (/aborted/i.test(msg)) return { ok: false, itemCount: 0, source: null, error: 'Timeout ao acessar o feed', responseTime: 7000 };
    return { ok: false, itemCount: 0, source: null, error: 'Falha de rede' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    let url: string | null = null;
    let urls: string[] | null = null;
    let feedId: string | null = null;

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      url = typeof body.url === 'string' ? body.url : null;
      urls = Array.isArray(body.urls) ? body.urls : null;
      feedId = typeof body.feedId === 'string' ? body.feedId : null;
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

    // Registra o histórico de validação se feedId foi fornecido
    if (feedId) {
      try {
        await supabase.from('rss_validation_history').insert({
          feed_id: feedId,
          is_valid: result.ok,
          error_reason: result.error || null,
          item_count: result.itemCount,
          response_time_ms: result.responseTime || null,
          status_code: result.statusCode || null,
        });
      } catch (e) {
        console.error('Erro ao registrar histórico:', e);
        // Não falha a validação se o histórico não for registrado
      }
    }

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

