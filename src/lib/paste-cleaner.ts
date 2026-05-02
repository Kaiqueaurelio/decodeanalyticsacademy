/**
 * paste-cleaner — normaliza texto colado de qualquer fonte (Notion, Word,
 * Google Docs, sites, PDFs) para o padrão markdown da apostila.
 *
 * Heurísticas aplicadas:
 *  - Remove zero-width chars, BOM, smart quotes
 *  - Converte numeração "1.", "1.1", "1.1.1" em headings ##/###/####
 *  - Converte "TÍTULO EM CAIXA ALTA" curto em ##
 *  - Limpa rastreadores de URL (utm_*, fbclid, ref=, etc.)
 *  - Normaliza listas (•, ●, ▪, ■, –, —) em "- "
 *  - Remove linhas de "navegação" típicas do Notion ("Última edição em...",
 *    breadcrumbs com ›, "Compartilhar", etc.)
 *  - Compacta múltiplas linhas em branco em 1
 *  - Mantém blocos ``` intactos
 */

const ZERO_WIDTH = /[\u200B-\u200D\uFEFF\u2060]/g;
const SMART_QUOTES: Array<[RegExp, string]> = [
  [/[\u2018\u2019\u201A\u201B]/g, "'"],
  [/[\u201C\u201D\u201E\u201F]/g, '"'],
  [/\u2013/g, '-'],
  [/\u2014/g, '—'], // em-dash mantém
  [/\u00A0/g, ' '], // nbsp
];

const URL_TRACKING_PARAMS = /([?&])(utm_[^=]+|fbclid|gclid|mc_eid|mc_cid|ref|ref_src|ref_url|igshid|si|spm)=[^&#]*/gi;

const NOTION_NOISE = [
  /^Última edição.*$/im,
  /^Created by.*$/im,
  /^Edited by.*$/im,
  /^\s*Compartilhar\s*$/im,
  /^\s*Duplicar\s*$/im,
  /^\s*Comentar\s*$/im,
];

const BULLET_CHARS = /^[\s]*[•●○◦▪■◆►‣⁃·]\s+/;

interface CleanOptions {
  /** Se true, tenta inferir títulos a partir de numeração e caixa alta. */
  smartHeadings?: boolean;
  /** Se true, limpa rastreadores de URL. */
  cleanUrls?: boolean;
}

export interface CleanResult {
  cleaned: string;
  changes: string[];
}

function detectNumberedHeading(line: string): { level: number; text: string } | null {
  // Ex: "1. Introdução", "2.1 Conceitos", "3.1.2. Detalhes"
  const m = line.match(/^\s*(\d+(?:\.\d+){0,3})[.\s\-–]+\s*(.+?)\s*$/);
  if (!m) return null;
  const depth = m[1].split('.').length;
  // Texto não pode ser longo demais (não é heading se for parágrafo)
  if (m[2].length > 120 || m[2].split(/\s+/).length > 18) return null;
  return { level: Math.min(depth + 1, 4), text: m[2].trim() }; // 1. → ##, 1.1 → ###
}

function looksLikeAllCapsHeading(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 4 || trimmed.length > 80) return false;
  if (trimmed.split(/\s+/).length > 12) return false;
  // Pelo menos 70% letras maiúsculas e sem ponto final
  const letters = trimmed.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (letters.length < 3) return false;
  const upper = letters.replace(/[^A-ZÀ-Ý]/g, '');
  return upper.length / letters.length >= 0.7 && !/[.!?]$/.test(trimmed);
}

function stripTrackers(text: string): string {
  return text.replace(/(https?:\/\/[^\s)]+)/g, (url) => {
    let cleaned = url.replace(URL_TRACKING_PARAMS, '$1');
    // limpa "?&" ou "?" sobrando
    cleaned = cleaned.replace(/\?&/, '?').replace(/[?&]$/, '');
    return cleaned;
  });
}

export function cleanPastedContent(raw: string, opts: CleanOptions = {}): CleanResult {
  const { smartHeadings = true, cleanUrls = true } = opts;
  const changes: string[] = [];
  if (!raw) return { cleaned: '', changes };

  let text = raw.replace(/\r\n?/g, '\n');

  // 1) Caracteres invisíveis e aspas inteligentes
  const beforeSmart = text;
  text = text.replace(ZERO_WIDTH, '');
  for (const [re, sub] of SMART_QUOTES) text = text.replace(re, sub);
  if (text !== beforeSmart) changes.push('Removeu caracteres invisíveis e normalizou aspas');

  // 2) Limpar rastreadores em URLs
  if (cleanUrls) {
    const beforeUrl = text;
    text = stripTrackers(text);
    if (text !== beforeUrl) changes.push('Removeu rastreadores de URLs (utm_, fbclid, etc.)');
  }

  // 3) Linha-a-linha (preservando blocos de código)
  const lines = text.split('\n');
  const out: string[] = [];
  let inFence = false;
  let listConverted = 0;
  let headingsInferred = 0;
  let noiseRemoved = 0;

  for (let line of lines) {
    if (/^(```|~~~)/.test(line.trim())) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }

    // Filtra ruído de Notion
    let isNoise = false;
    for (const re of NOTION_NOISE) {
      if (re.test(line)) { isNoise = true; break; }
    }
    if (isNoise) { noiseRemoved++; continue; }

    // Bullets exóticos → "- "
    if (BULLET_CHARS.test(line)) {
      line = line.replace(BULLET_CHARS, '- ');
      listConverted++;
    }

    if (smartHeadings) {
      // Já é heading markdown? deixa.
      if (/^#{1,6}\s/.test(line.trim())) {
        out.push(line);
        continue;
      }
      // Numeração 1.1 → heading
      const numbered = detectNumberedHeading(line);
      if (numbered) {
        out.push(`${'#'.repeat(numbered.level)} ${numbered.text}`);
        headingsInferred++;
        continue;
      }
      // CAIXA ALTA → ##
      if (looksLikeAllCapsHeading(line)) {
        out.push(`## ${line.trim().replace(/[:：]$/, '')}`);
        headingsInferred++;
        continue;
      }
    }

    out.push(line);
  }

  if (listConverted > 0) changes.push(`Normalizou ${listConverted} item(ns) de lista`);
  if (headingsInferred > 0) changes.push(`Inferiu ${headingsInferred} título(s) a partir de numeração/caixa alta`);
  if (noiseRemoved > 0) changes.push(`Removeu ${noiseRemoved} linha(s) de ruído (Notion/breadcrumbs)`);

  // 4) Compactar múltiplas linhas em branco
  let result = out.join('\n');
  const beforeBlank = result;
  result = result.replace(/\n{3,}/g, '\n\n').replace(/^\s+|\s+$/g, '');
  if (result !== beforeBlank) changes.push('Compactou linhas em branco extras');

  return { cleaned: result, changes };
}
