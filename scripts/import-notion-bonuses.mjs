/*
 * Importa páginas públicas do Notion como apostilas da categoria Bônus.
 *
 * Uso (as credenciais nunca são gravadas no repositório):
 *   $env:DECODE_ADMIN_RA = '...'
 *   $env:DECODE_ADMIN_PASSWORD = '...'
 *   node scripts/import-notion-bonuses.mjs
 */
import fs from 'node:fs/promises';

const pages = [
  {
    id: '21d5eda6-d8da-8115-a01c-e31caa3897fd',
    url: 'https://decodeanalytiicsacademy.notion.site/Canivete-su-o-do-estudante-21d5eda6d8da8115a01ce31caa3897fd?pvs=74',
    fallbackTitle: 'Canivete suíço do estudante',
  },
  {
    id: '21d5eda6-d8da-81a3-aa1c-ea9715613e75',
    url: 'https://decodeanalytiicsacademy.notion.site/Dicion-rio-do-programador-21d5eda6d8da81a3aa1cea9715613e75?source=copy_link',
    fallbackTitle: 'Dicionário do programador',
  },
];

const env = Object.fromEntries(
  (await fs.readFile('.env', 'utf8')).split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    const value = match?.[2]?.trim().replace(/^(?:"|')|(?:"|')$/g, '');
    return match ? [[match[1], value]] : [];
  }),
);
const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !anonKey) throw new Error('Configuração do Supabase ausente no .env.');
if (!process.env.DECODE_ADMIN_RA || !process.env.DECODE_ADMIN_PASSWORD) {
  throw new Error('Defina DECODE_ADMIN_RA e DECODE_ADMIN_PASSWORD somente para a execução deste importador.');
}

function unwrap(record) {
  return record?.value?.value ?? record?.value ?? null;
}

function richText(properties, key = 'title') {
  const parts = properties?.[key] ?? [];
  return parts.map((part) => {
    const value = String(part?.[0] ?? '');
    const annotations = Array.isArray(part?.[1]) ? part[1] : [];
    const href = annotations.find((annotation) => Array.isArray(annotation) && annotation[0] === 'a')?.[1];
    if (href) return `[${value}](${href})`;
    return value;
  }).join('');
}

async function loadNotionPage(id) {
  const blocks = new Map();
  let cursor = { stack: [] };
  const seenCursors = new Set();

  for (let page = 0; page < 50; page += 1) {
    const cursorKey = JSON.stringify(cursor);
    if (seenCursors.has(cursorKey)) throw new Error(`Paginação repetida no Notion para ${id}.`);
    seenCursors.add(cursorKey);

    const response = await fetch('https://www.notion.so/api/v3/loadCachedPageChunk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://www.notion.so',
        'User-Agent': 'DecodeAnalyticsAcademy Notion importer',
      },
      body: JSON.stringify({ pageId: id, limit: 100, cursor, chunkNumber: page, verticalColumns: false }),
    });
    if (!response.ok) throw new Error(`Notion retornou HTTP ${response.status} para ${id}.`);
    const chunk = await response.json();
    for (const [blockId, record] of Object.entries(chunk.recordMap?.block ?? {})) {
      const block = unwrap(record);
      if (block?.alive !== false) blocks.set(blockId, block);
    }
    cursor = chunk.cursor ?? { stack: [] };
    if (!Array.isArray(cursor.stack) || cursor.stack.length === 0) break;
  }

  const root = blocks.get(id);
  if (!root) throw new Error(`A página raiz ${id} não foi retornada pelo Notion.`);
  return { root, blocks };
}

function renderMarkdown(root, blocks, sourceUrl) {
  const rendered = new Set();
  const render = (id, depth = 0) => {
    if (rendered.has(id) || depth > 30) return '';
    rendered.add(id);
    const block = blocks.get(id);
    if (!block) return '';

    const text = richText(block.properties);
    const children = (block.content ?? []).map((childId) => render(childId, depth + 1)).filter(Boolean).join('\n\n');
    let body = '';
    switch (block.type) {
      case 'header': body = `# ${text}`; break;
      case 'sub_header': body = `## ${text}`; break;
      case 'sub_sub_header': body = `### ${text}`; break;
      case 'bulleted_list': body = `- ${text}`; break;
      case 'numbered_list': body = `1. ${text}`; break;
      case 'to_do': body = `- [${block.properties?.checked?.[0]?.[0] === 'Yes' ? 'x' : ' '}] ${text}`; break;
      case 'quote': body = `> ${text}`; break;
      case 'code': body = `\`\`\`${block.format?.code_language ?? ''}\n${text}\n\`\`\``; break;
      case 'divider': body = '---'; break;
      case 'bookmark': {
        const title = richText(block.properties, 'title') || richText(block.properties, 'link');
        const link = richText(block.properties, 'link');
        const description = richText(block.properties, 'description');
        body = link ? `[${title}](${link})${description ? ` — ${description}` : ''}` : title;
        break;
      }
      case 'image': {
        const source = block.properties?.source?.[0]?.[0] || block.format?.display_source;
        body = source ? `![${text || 'Imagem'}](${source})` : text;
        break;
      }
      case 'toggle': body = `### ${text}`; break;
      case 'page': body = text ? `## ${text}` : ''; break;
      case 'text': body = text; break;
      default: body = text;
    }
    return [body, children].filter(Boolean).join('\n\n');
  };

  const title = richText(root.properties).trim();
  rendered.add(root.id);
  const content = (root.content ?? []).map((id) => render(id)).filter(Boolean).join('\n\n');
  const normalized = content.replace(/^([^\n]+)\n\n/, (first) => first.trim() === title ? '' : first).trim();
  return `# ${title}\n\n> Material bônus importado da base acadêmica. [Abrir fonte original](${sourceUrl})\n\n${normalized}`.trim();
}

async function signIn() {
  const response = await fetch(`${supabaseUrl}/functions/v1/ra-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ mode: 'signin', ra: process.env.DECODE_ADMIN_RA, password: process.env.DECODE_ADMIN_PASSWORD }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body?.session?.access_token) throw new Error(body?.error || 'Não foi possível autenticar o administrador para importar.');
  return { accessToken: body.session.access_token, userId: body.session.user?.id };
}

async function rest(path, options, accessToken) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Supabase retornou HTTP ${response.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

const { accessToken, userId } = await signIn();
const results = [];
for (const page of pages) {
  const { root, blocks } = await loadNotionPage(page.id);
  const title = richText(root.properties).trim() || page.fallbackTitle;
  const content = renderMarkdown(root, blocks, page.url);
  const payload = {
    title,
    content,
    category: 'Bônus',
    source_type: 'notion',
    file_url: page.url,
    cover_url: root.format?.page_cover ?? null,
    created_by: userId ?? null,
    published: true,
    // Bônus não pertence a um semestre; a restrição do banco aceita apenas 1..12.
    semester: null,
    status: 'liberada',
  };
  const existing = await rest(`apostilas?select=id,title&title=eq.${encodeURIComponent(title)}&category=eq.B%C3%B4nus`, { method: 'GET' }, accessToken);
  if (existing.length > 0) {
    await rest(`apostilas?id=eq.${existing[0].id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(payload) }, accessToken);
    results.push({ title, action: 'updated', blocks: blocks.size, characters: content.length });
  } else {
    await rest('apostilas', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(payload) }, accessToken);
    results.push({ title, action: 'created', blocks: blocks.size, characters: content.length });
  }
}

console.log(JSON.stringify({ ok: true, results }, null, 2));
