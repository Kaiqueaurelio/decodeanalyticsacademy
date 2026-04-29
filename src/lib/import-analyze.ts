/**
 * import-analyze — analisa Markdown extraído de um link/arquivo e devolve
 * uma estrutura útil para pré-visualização: seções (H1/H2/H3), glossário
 * (linhas no padrão "Termo: definição") e perguntas/exercícios detectados
 * heuristicamente. Usado pelo ImportPreviewPanel.
 */

export interface PreviewSection {
  level: 1 | 2 | 3;
  title: string;
  number: string;     // "1.2.1"
  bodyPreview: string; // primeiras ~140 chars do corpo da seção
  wordCount: number;
}

export interface PreviewGlossaryItem {
  term: string;
  definition: string;
}

export interface PreviewQuestion {
  question: string;
  hasOptions: boolean;
}

export interface ImportAnalysis {
  sections: PreviewSection[];
  glossary: PreviewGlossaryItem[];
  questions: PreviewQuestion[];
  totals: {
    words: number;
    chars: number;
    headings: number;
    images: number;
    links: number;
    minutes: number;
  };
}

/* ============== Detectores ============== */

const HEADING_RE = /^(#{1,3})\s+(.+?)\s*$/gm;
const IMAGE_RE = /!\[[^\]]*\]\(([^)]+)\)|<img\s+[^>]*src=["']([^"']+)["']/gi;
const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;
const QUESTION_RE = /^\s*(?:\d+\s*[).:-]|Q\d+[.:)]?|Pergunta\s*\d*[.:]?)\s+(.{8,})/gim;
const QUESTION_MARK_RE = /^([^?\n]{12,200}\?)\s*$/gm;
const GLOSS_RE = /^[\s•\-*]*([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÀ-ÿ\s\-/()]{1,40}?)\s*[:—–-]\s+(.{15,400})$/gm;
// Lista de palavras a ignorar como falso glossário
const GLOSS_BLACKLIST = new Set([
  'http', 'https', 'fonte', 'autor', 'observacao', 'observação', 'nota', 'data',
  'titulo', 'título', 'capitulo', 'capítulo', 'introducao', 'introdução',
  'resumo', 'conclusao', 'conclusão', 'referencias', 'referências',
]);

function buildSections(md: string): PreviewSection[] {
  const sections: PreviewSection[] = [];
  const counters = [0, 0, 0];
  const matches: { level: 1 | 2 | 3; title: string; index: number; end: number }[] = [];

  let m: RegExpExecArray | null;
  HEADING_RE.lastIndex = 0;
  while ((m = HEADING_RE.exec(md)) !== null) {
    const level = m[1].length as 1 | 2 | 3;
    matches.push({ level, title: m[2].trim(), index: m.index, end: m.index + m[0].length });
  }

  matches.forEach((h, i) => {
    counters[h.level - 1] += 1;
    for (let j = h.level; j < 3; j++) counters[j] = 0;
    const number = counters.slice(0, h.level).join('.');
    const bodyEnd = matches[i + 1]?.index ?? md.length;
    const body = md.slice(h.end, bodyEnd).trim().replace(/[#*_>`]/g, '').replace(/\s+/g, ' ');
    const bodyPreview = body.length > 140 ? body.slice(0, 137) + '…' : body;
    const wordCount = body ? body.split(/\s+/).length : 0;
    sections.push({ level: h.level, title: h.title, number, bodyPreview, wordCount });
  });

  return sections;
}

function buildGlossary(md: string): PreviewGlossaryItem[] {
  const out: PreviewGlossaryItem[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  GLOSS_RE.lastIndex = 0;
  while ((m = GLOSS_RE.exec(md)) !== null) {
    const term = m[1].trim();
    const def = m[2].trim().replace(/[*_`]/g, '');
    if (term.length > 60 || term.split(/\s+/).length > 6) continue;
    const k = term.toLowerCase();
    if (seen.has(k) || GLOSS_BLACKLIST.has(k)) continue;
    if (def.endsWith('?')) continue; // provavelmente é pergunta
    seen.add(k);
    out.push({ term, definition: def.length > 240 ? def.slice(0, 237) + '…' : def });
  }
  return out.slice(0, 25);
}

function buildQuestions(md: string): PreviewQuestion[] {
  const out: PreviewQuestion[] = [];
  const seen = new Set<string>();

  const push = (q: string, hasOptions: boolean) => {
    const clean = q.trim().replace(/\s+/g, ' ');
    if (clean.length < 10) return;
    const k = clean.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ question: clean, hasOptions });
  };

  // Perguntas com numeração (1. Qual é..., Q1) ...)
  let m: RegExpExecArray | null;
  QUESTION_RE.lastIndex = 0;
  while ((m = QUESTION_RE.exec(md)) !== null) {
    // Verifica se há opções a/b/c logo abaixo
    const tail = md.slice(m.index, m.index + 600);
    const hasOptions = /\n\s*[a-eA-E][.):-]\s+/m.test(tail);
    push(m[1], hasOptions);
  }
  // Frases que terminam com '?'
  QUESTION_MARK_RE.lastIndex = 0;
  while ((m = QUESTION_MARK_RE.exec(md)) !== null) {
    push(m[1], false);
  }
  return out.slice(0, 30);
}

export function analyzeImport(md: string): ImportAnalysis {
  const safe = md || '';
  const sections = buildSections(safe);
  const glossary = buildGlossary(safe);
  const questions = buildQuestions(safe);

  // Totais
  const text = safe.replace(/[#*_>`~\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text ? text.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.round(words / 200));
  let images = 0;
  IMAGE_RE.lastIndex = 0;
  while (IMAGE_RE.exec(safe) !== null) images += 1;
  let links = 0;
  LINK_RE.lastIndex = 0;
  while (LINK_RE.exec(safe) !== null) links += 1;

  return {
    sections,
    glossary,
    questions,
    totals: {
      words,
      chars: safe.length,
      headings: sections.length,
      images,
      links,
      minutes,
    },
  };
}
