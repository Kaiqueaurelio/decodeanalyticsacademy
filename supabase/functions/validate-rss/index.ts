// Valida um feed RSS/Atom: verifica se o endpoint responde e contém itens parseáveis.
// Agora também registra o histórico de validações para auditoria.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireUser } from '../_shared/auth-guard.ts';
import { isSafePublicUrl } from '../_shared/ssrf.ts';


interface ValidateResult {
  ok: boolean;
  itemCount: number;
  source: string | null;
  error?: string;
  statusCode?: number;
  responseTime?: number;
}

function pick(block: string, tag: string): string {
  const safeTag = tag.replace(/[^A-Za-z0-9:_-]/g, '').slice(0, 64);
  if (!safeTag) return '';
  const m = block.match(new RegExp(`<${safeTag}[^>]*>([\\s\\S]*?)</${safeTag}>`, 'i'));
  return m ? m[1].trim() : '';
}

const MAX_XML_BYTES = 1_500_000;
const MAX_REDIRECTS = 3;

async function readXmlWithLimit(response: Response): Promise<string> {
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_XML_BYTES) throw new Error('Feed muito grande');
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let xml = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_XML_BYTES) {
      await reader.cancel();
      throw new Error('Feed muito grande');
    }
    xml += decoder.decode(value, { stream: true });
  }
  return xml + decoder.decode();
}

async function fetchPublicFeed(rawUrl: string, signal: AbortSignal): Promise<Response> {
  if (!isSafePublicUrl(rawUrl)) throw new Error('URL inválida');
  let currentUrl = rawUrl;
  for (let attempt = 0; attempt <= MAX_REDIRECTS; attempt += 1) {
    const response = await fetch(currentUrl, {
      signal,
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 DecodeNewsBot/1.0',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get('location');
    if (!location) throw new Error('Redirecionamento sem destino');
    const nextUrl = new URL(location, currentUrl).toString();
    if (!isSafePublicUrl(nextUrl)) throw new Error('Redirecionamento bloqueado');
    currentUrl = nextUrl;
  }
  throw new Error('Muitos redirecionamentos');
}

async function validate(url: string): Promise<ValidateResult> {
  if (!isSafePublicUrl(url)) return { ok: false, itemCount: 0, source: null, error: 'URL inválida', statusCode: 0, responseTime: 0 };
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 7000);
  try {
    const startTime = Date.now();
    const res = await fetchPublicFeed(url, ac.signal);
    const responseTime = Date.now() - startTime;
    if (!res.ok) return { ok: false, itemCount: 0, source: null, error: `HTTP ${res.status}`, statusCode: res.status, responseTime };
    const xml = await readXmlWithLimit(res);
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
    return { ok: false, itemCount: 0, source: null, error: /muito grande/i.test(msg) ? 'Feed muito grande' : 'Falha de rede' };
  } finally {
    clearTimeout(t);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = await requireUser(req, corsHeaders, { requireAdmin: true });
    if (!auth.ok) return auth.response;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    let url: string | null = null;
    let urls: string[] | null = null;
    let feedId: string | null = null;

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      url = typeof body.url === 'string' ? body.url : null;
      urls = Array.isArray(body.urls)
        ? body.urls.filter((item: unknown): item is string => typeof item === 'string').slice(0, 20)
        : null;
      feedId = typeof body.feedId === 'string' && /^[0-9a-f-]{36}$/i.test(body.feedId) ? body.feedId : null;
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
    console.error('validate-rss failed', e);
    return new Response(JSON.stringify({ ok: false, error: 'Não foi possível validar o feed.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
});

