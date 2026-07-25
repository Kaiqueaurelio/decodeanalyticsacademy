// Extrai o conteúdo principal de uma URL de notícia para leitura in-app.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { requireUser } from '../_shared/auth-guard.ts';

// Bloqueia SSRF: só http(s) público, sem IPs privados/link-local/loopback.
function isSafePublicUrl(raw: string): boolean {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  const host = u.hostname.toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) return false;
  // IPv6 literais
  if (host.startsWith('[')) return false;
  // IPv4 numérico
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)];
    if (a === 10 || a === 127 || a === 0) return false;
    if (a === 169 && b === 254) return false; // link-local / metadata
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a >= 224) return false;
  }
  return true;
}

interface ReaderResult {
  ok: boolean;
  url: string;
  title: string;
  byline: string | null;
  siteName: string | null;
  image: string | null;
  publishedAt: string | null;
  contentHtml: string;
  textLength: number;
  error?: string;
}

const cache = new Map<string, { at: number; data: ReaderResult }>();
const CACHE_MS = 60 * 60 * 1000;

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function metaContent(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return decodeEntities(m[1]);
  }
  return null;
}

const NEG = /(comment|share|social|related|recommend|footer|header|nav|sidebar|widget|promo|banner|ad-|advert|newsletter|popup|cookie|breadcrumb|subscribe|author-box|tags|meta|byline)/i;
const POS = /(article|entry|content|main|post|story|body|text)/i;

function scoreBlock(html: string, className: string, id: string): number {
  let score = 0;
  if (POS.test(className) || POS.test(id)) score += 25;
  if (NEG.test(className) || NEG.test(id)) score -= 40;
  const paragraphs = html.match(/<p[\s>]/gi)?.length || 0;
  score += paragraphs * 3;
  const textLen = stripTags(html).length;
  score += Math.min(60, textLen / 80);
  const links = html.match(/<a[\s>]/gi)?.length || 0;
  if (paragraphs > 0) score -= (links / Math.max(1, paragraphs)) * 8;
  return score;
}

function extractCandidates(html: string): string[] {
  const found: string[] = [];
  const semantic = html.match(/<(article|main)[\s>][\s\S]*?<\/\1>/gi) || [];
  found.push(...semantic);
  const divs = html.match(/<div\b[^>]*>[\s\S]*?<\/div>/gi) || [];
  // Só pegamos divs com atributo class ou id para não explodir memória
  for (const d of divs.slice(0, 200)) {
    if (/\b(class|id)=/.test(d.slice(0, 300))) found.push(d);
  }
  return found;
}

function cleanContent(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<button[\s\S]*?<\/button>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/\son\w+=["'][^"']*["']/gi, '')
    .replace(/<(figure|figcaption|blockquote|p|h[1-6]|ul|ol|li|strong|em|b|i|u|a|img|br|hr|table|thead|tbody|tr|td|th|div|span)\b/gi, '<$1')
    .replace(/(<a\b[^>]*)\s+target=["'][^"']*["']/gi, '$1')
    .replace(/(<a\b)([^>]*)>/gi, '$1$2 target="_blank" rel="noopener noreferrer">')
    .replace(/<(?!\/?(figure|figcaption|blockquote|p|h[1-6]|ul|ol|li|strong|em|b|i|u|a|img|br|hr|table|thead|tbody|tr|td|th|div|span)\b)[^>]+>/gi, '');
}

function absolutize(html: string, base: string): string {
  try {
    const baseUrl = new URL(base);
    return html.replace(/(src|href)=["']([^"']+)["']/gi, (m, attr, url) => {
      try {
        if (/^(https?:|data:|mailto:)/i.test(url)) return m;
        return `${attr}="${new URL(url, baseUrl).toString()}"`;
      } catch {
        return m;
      }
    });
  } catch {
    return html;
  }
}

async function readArticle(url: string): Promise<ReaderResult> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;

  const empty: ReaderResult = {
    ok: false, url, title: '', byline: null, siteName: null,
    image: null, publishedAt: null, contentHtml: '', textLength: 0,
  };

  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 10000);
    const res = await fetch(url, {
      signal: ac.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DecodeNewsBot/1.0) AppleWebKit/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.6',
      },
    });
    clearTimeout(t);
    if (!res.ok) return { ...empty, error: `HTTP ${res.status}` };
    const html = await res.text();

    const title =
      metaContent(html, 'og:title') || metaContent(html, 'twitter:title') ||
      stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '') || '';
    const image = metaContent(html, 'og:image') || metaContent(html, 'twitter:image');
    const siteName = metaContent(html, 'og:site_name');
    const byline = metaContent(html, 'article:author') || metaContent(html, 'author');
    const publishedAt = metaContent(html, 'article:published_time') || metaContent(html, 'og:updated_time');

    const candidates = extractCandidates(html);
    let best = '';
    let bestScore = -Infinity;
    for (const c of candidates) {
      const classAttr = c.match(/class=["']([^"']+)["']/i)?.[1] || '';
      const idAttr = c.match(/id=["']([^"']+)["']/i)?.[1] || '';
      const score = scoreBlock(c, classAttr, idAttr);
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }

    let contentHtml = '';
    if (best) {
      contentHtml = cleanContent(best);
      contentHtml = absolutize(contentHtml, url);
    }
    const textLength = stripTags(contentHtml).length;

    if (textLength < 200) {
      return { ...empty, title, byline, siteName, image, publishedAt, error: 'Conteúdo não extraído' };
    }

    const data: ReaderResult = {
      ok: true, url, title, byline, siteName, image, publishedAt, contentHtml, textLength,
    };
    cache.set(url, { at: Date.now(), data });
    return data;
  } catch (e) {
    return { ...empty, error: String(e?.message || e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    let url: string | null = null;
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      url = typeof body.url === 'string' ? body.url : null;
    } else {
      url = new URL(req.url).searchParams.get('url');
    }
    if (!url || !/^https?:\/\//i.test(url)) {
      return new Response(JSON.stringify({ ok: false, error: 'URL inválida' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const result = await readArticle(url);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
