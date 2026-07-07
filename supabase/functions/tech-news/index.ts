// Edge function: agrega feeds RSS de tecnologia e devolve JSON unificado.
// Isolado — não altera nenhuma função/rota existente.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const DEFAULT_FEEDS: { url: string; source: string }[] = [
  { url: 'https://feeds.feedburner.com/canaltechbr', source: 'Canaltech' },
  { url: 'https://tecnoblog.net/feed/', source: 'Tecnoblog' },
  { url: 'https://openrss.org/https://olhardigital.com.br', source: 'Olhar Digital' },
  { url: 'https://www.tudocelular.com/feed', source: 'TudoCelular' },
  { url: 'https://diolinux.com.br/feed', source: 'Diolinux' },
  { url: 'https://sempreupdate.com.br/feed/', source: 'SempreUpdate' },
  { url: 'https://www.hardware.com.br/feed/', source: 'Hardware.com.br' },
  { url: 'https://www.baguete.com.br/rss', source: 'Baguete' },
];

async function loadFeeds(): Promise<{ url: string; source: string }[]> {
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return DEFAULT_FEEDS;
    const client = createClient(url, key);
    const { data } = await client
      .from('rss_feeds')
      .select('url, source, enabled, sort_order')
      .eq('enabled', true)
      .order('sort_order', { ascending: true });
    if (data && data.length > 0) return data.map((r: any) => ({ url: r.url, source: r.source }));
    return DEFAULT_FEEDS;
  } catch {
    return DEFAULT_FEEDS;
  }
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  link: string;
  image: string | null;
  source: string;
  publishedAt: string;
  category: string;
}

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

function stripHtml(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? decodeEntities(m[1]).trim() : '';
}

function pickAttr(block: string, tag: string, attr: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["']`, 'i'));
  return m ? m[1] : '';
}

function extractImage(block: string): string | null {
  const media =
    pickAttr(block, 'media:content', 'url') ||
    pickAttr(block, 'media:thumbnail', 'url') ||
    pickAttr(block, 'enclosure', 'url');
  if (media) return media;
  const html = pick(block, 'content:encoded') || pick(block, 'description');
  const img = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return img ? img[1] : null;
}

const CATEGORIES: { name: string; kws: RegExp }[] = [
  { name: 'Inteligência Artificial', kws: /\b(ia|inteligência artificial|chatgpt|gpt|gemini|claude|llm|openai|copilot|ai\b)/i },
  { name: 'Windows', kws: /\bwindows\b|microsoft/i },
  { name: 'Linux', kws: /\blinux\b|ubuntu|fedora|debian|kernel|gnome|kde|open source|software livre/i },
  { name: 'Apple', kws: /\bapple|iphone|ipad|macos|mac os|macbook|ios\b/i },
  { name: 'Android', kws: /\bandroid\b|google pixel|samsung galaxy/i },
  { name: 'Smartphones', kws: /\bsmartphone|celular|xiaomi|motorola|nokia|realme/i },
  { name: 'Hardware', kws: /\bhardware|processador|gpu|placa|nvidia|amd|intel|ssd|ram\b/i },
  { name: 'Segurança', kws: /\bsegurança|hacker|malware|vírus|ransomware|phishing|vazamento|cyber/i },
  { name: 'Programação', kws: /\bprogramação|desenvolvedor|javascript|python|typescript|framework|github|api\b/i },
  { name: 'Computadores', kws: /\bnotebook|computador|desktop|pc gamer/i },
];

function categorize(title: string, summary: string, rawCat: string): string {
  const text = `${rawCat} ${title} ${summary}`;
  for (const c of CATEGORIES) if (c.kws.test(text)) return c.name;
  return 'Geral';
}

async function fetchFeed(url: string, source: string): Promise<NewsItem[]> {
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 8000);
    const res = await fetch(url, {
      signal: ac.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 DecodeNewsBot/1.0', Accept: 'application/rss+xml, application/xml, text/xml, */*' },
    });
    clearTimeout(t);
    if (!res.ok) return [];
    const xml = await res.text();
    const items: NewsItem[] = [];
    const isAtom = /<feed[\s>]/i.test(xml);
    const blocks = xml.match(isAtom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi) || [];
    for (const block of blocks) {
      const title = stripHtml(pick(block, 'title'));
      const link = isAtom ? pickAttr(block, 'link', 'href') : stripHtml(pick(block, 'link'));
      const desc = pick(block, 'description') || pick(block, 'summary') || pick(block, 'content:encoded') || pick(block, 'content');
      const summary = stripHtml(desc).slice(0, 280);
      const pubRaw = pick(block, 'pubDate') || pick(block, 'published') || pick(block, 'updated') || pick(block, 'dc:date');
      const publishedAt = pubRaw ? new Date(pubRaw).toISOString() : new Date().toISOString();
      const rawCat = stripHtml(pick(block, 'category'));
      if (!title || !link) continue;
      items.push({
        id: link,
        title,
        summary,
        link,
        image: extractImage(block),
        source,
        publishedAt,
        category: categorize(title, summary, rawCat),
      });
    }
    return items;
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const FEEDS = await loadFeeds();
    const results = await Promise.all(FEEDS.map((f) => fetchFeed(f.url, f.source)));
    // Feeds vazios/quebrados são silenciosamente ignorados — sem banner de erro na UI.
    const all = results.flat();
    const seen = new Map<string, NewsItem>();
    for (const item of all) {
      const key = item.link.split('?')[0].replace(/\/$/, '');
      if (!seen.has(key)) seen.set(key, item);
    }
    const items = Array.from(seen.values()).sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
    return new Response(JSON.stringify({ items, errors, fetchedAt: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ items: [], errors: ['fatal'], message: String(e) }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
