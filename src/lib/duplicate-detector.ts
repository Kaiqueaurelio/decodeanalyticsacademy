/**
 * Detector de apostilas duplicadas com escolha pela "melhor formatação".
 *
 * Estratégia:
 * 1) Normalizamos os textos (lowercase, sem acentos, sem markdown/HTML, sem
 *    espaços extras) e calculamos a similaridade por bigrams (Sørensen-Dice).
 * 2) Se a similaridade for ≥ 0.82 entre o novo conteúdo e alguma apostila
 *    existente, consideramos duplicata.
 * 3) Damos uma "nota de formatação" para cada versão (markdown + HTML) e
 *    mantemos a melhor — atualizando a apostila existente quando o novo
 *    conteúdo for mais bem formatado, ou descartando o novo caso contrário.
 */
import { supabase } from '@/integrations/supabase/client';

export interface ApostilaLite {
  id: string;
  title: string;
  content: string | null;
  category: string;
  source_type: string | null;
}

/* ───────────────────────── normalização e similaridade ──────────────────── */

function normalize(text: string): string {
  return (text || '')
    // remove fences/inline code para não enviesar
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    // remove imagens/links markdown mantendo o texto
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // remove HTML inline
    .replace(/<[^>]+>/g, ' ')
    // remove marcas md
    .replace(/[*_~>#`|-]+/g, ' ')
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function bigrams(s: string): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 0; i < s.length - 1; i++) {
    const bg = s.slice(i, i + 2);
    map.set(bg, (map.get(bg) ?? 0) + 1);
  }
  return map;
}

/** Similaridade Sørensen-Dice por bigramas. Retorna 0..1. */
export function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  // Curto-circuito para textos muito diferentes em tamanho
  const ratio = Math.min(na.length, nb.length) / Math.max(na.length, nb.length);
  if (ratio < 0.35) return 0;
  const A = bigrams(na);
  const B = bigrams(nb);
  let inter = 0;
  let totalA = 0;
  let totalB = 0;
  A.forEach((v) => { totalA += v; });
  B.forEach((v) => { totalB += v; });
  A.forEach((v, k) => {
    const w = B.get(k);
    if (w) inter += Math.min(v, w);
  });
  return (2 * inter) / (totalA + totalB || 1);
}

/* ───────────────────────── score de formatação ──────────────────────────── */

/**
 * Avalia a "qualidade" da formatação. Quanto maior, mais estruturado.
 * Considera: títulos, listas, tabelas, ênfases, blocos de código, links,
 * imagens, parágrafos quebrados e densidade de marcação.
 */
export function formattingScore(content: string): number {
  if (!content || !content.trim()) return 0;
  const text = content;
  const len = text.length;
  let score = 0;

  // Títulos (markdown # / HTML h1-h6)
  const headings = (text.match(/^#{1,6}\s+\S/gm) || []).length
                 + (text.match(/<h[1-6][\s>]/gi) || []).length;
  score += Math.min(headings, 30) * 4;

  // Listas
  const bullets = (text.match(/^\s*[-*+]\s+\S/gm) || []).length;
  const ordered = (text.match(/^\s*\d+\.\s+\S/gm) || []).length;
  score += Math.min(bullets + ordered, 50) * 2;

  // Tabelas markdown
  const tableRows = (text.match(/^\s*\|.+\|\s*$/gm) || []).length;
  score += Math.min(tableRows, 30) * 3;

  // Ênfases (negrito / itálico / tachado / sublinhado / mark)
  const bold = (text.match(/\*\*[^*\n]+\*\*/g) || []).length
             + (text.match(/<(?:b|strong)[\s>]/gi) || []).length;
  const italic = (text.match(/(?<!\*)\*(?!\*)[^*\n]+\*(?!\*)/g) || []).length
               + (text.match(/<(?:i|em)[\s>]/gi) || []).length;
  const marks = (text.match(/<(?:u|mark|sub|sup)[\s>]/gi) || []).length;
  score += Math.min(bold, 40) * 1.5;
  score += Math.min(italic, 40) * 1;
  score += Math.min(marks, 20) * 1.5;

  // Blocos de código e código inline
  const codeBlocks = (text.match(/```[\s\S]*?```/g) || []).length;
  const inlineCode = (text.match(/`[^`\n]+`/g) || []).length;
  score += codeBlocks * 5 + Math.min(inlineCode, 20) * 0.5;

  // Imagens e links
  const images = (text.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length
               + (text.match(/<img\s/gi) || []).length;
  const links = (text.match(/(?<!\!)\[[^\]]+\]\([^)]+\)/g) || []).length;
  score += images * 4 + Math.min(links, 20) * 1;

  // Parágrafos bem separados (linhas em branco)
  const paragraphs = (text.match(/\n\s*\n/g) || []).length;
  score += Math.min(paragraphs, 50) * 0.8;

  // Citações
  const quotes = (text.match(/^\s*>\s+\S/gm) || []).length;
  score += Math.min(quotes, 20) * 1;

  // Densidade: evita inflar score em textos enormes mas pouco formatados.
  // Bônus modesto por tamanho razoável (300..15000 chars).
  if (len >= 300 && len <= 15000) score += 5;
  if (len > 15000) score += 8;

  // Penalização: blocos gigantes sem quebras (parede de texto)
  const longestLine = text.split('\n').reduce((m, l) => Math.max(m, l.length), 0);
  if (longestLine > 1200) score -= 10;

  return Math.max(0, Math.round(score));
}

/* ───────────────────────── busca de duplicatas ──────────────────────────── */

export interface DuplicateMatch {
  apostila: ApostilaLite;
  similarity: number;
  existingScore: number;
  newScore: number;
  /** true → o novo conteúdo está melhor formatado; false → existente está melhor. */
  newIsBetter: boolean;
}

/**
 * Procura uma apostila existente cujo conteúdo seja muito parecido com o novo.
 * Considera apenas as 80 mais recentes (rápido o suficiente para o admin).
 */
export async function findDuplicateApostila(
  newContent: string,
  newTitle: string,
  options: { threshold?: number; ignoreId?: string } = {},
): Promise<DuplicateMatch | null> {
  const threshold = options.threshold ?? 0.82;
  const normalized = normalize(newContent);
  const normalizedTitle = normalize(newTitle);
  if (normalized.length < 200 || !normalizedTitle) return null;

  const { data, error } = await supabase
    .from('apostilas')
    .select('id, title, content, category, source_type')
    .order('created_at', { ascending: false })
    .limit(80);
  if (error || !data) return null;

  let best: DuplicateMatch | null = null;
  for (const row of data) {
    if (options.ignoreId && row.id === options.ignoreId) continue;
    if (normalize(row.title) !== normalizedTitle) continue;
    if (!row.content || row.content.length < 200) continue;
    const sim = similarity(newContent, row.content);
    if (sim < threshold) continue;
    const existingScore = formattingScore(row.content);
    const newScore = formattingScore(newContent);
    const candidate: DuplicateMatch = {
      apostila: row as ApostilaLite,
      similarity: sim,
      existingScore,
      newScore,
      newIsBetter: newScore > existingScore,
    };
    if (!best || sim > best.similarity) best = candidate;
  }
  return best;
}
