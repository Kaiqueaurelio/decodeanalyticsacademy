import { useState, useMemo, useEffect } from 'react';
import { Check, Copy, Volume2, Info, Lightbulb, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { AppImage } from '@/components/ui/app-image';
import { highlightCode } from '@/lib/shiki-highlighter';
import { cn } from '@/lib/utils';
import { renderMathToHTML } from '@/lib/math-render';

/**
 * Limpa marcadores markdown inline (negrito, itálico, código inline, links etc.)
 * mantendo o texto puro. NÃO toca em blocos especiais (já extraídos antes).
 */
function cleanInlineText(input: string): string {
  if (!input) return '';
  return input
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\*{3}([^*]+)\*{3}/g, '$1')
    .replace(/_{3}([^_]+)_{3}/g, '$1')
    .replace(/\*{2}([^*]+)\*{2}/g, '$1')
    .replace(/_{2}([^_]+)_{2}/g, '$1')
    .replace(/(?<![*\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g, '$1')
    .replace(/(?<![_\w])_(?!\s)([^_\n]+?)_(?!\w)/g, '$1')
    .replace(/==([^=]+)==/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/^\s*#{1,6}\s+/gm, '');
}

/**
 * Renderização inline rica: aceita formatação markdown comum e um subconjunto
 * seguro de HTML inline.
 */
export function safeUrl(raw: string): string {
  const url = String(raw || '')
    .trim()
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/&#(\d+);?/g, (_m, d) => String.fromCharCode(Number(d)));
  if (/^\s*(javascript|data|vbscript|file)\s*:/i.test(url)) return '#';
  if (/^(https?:|mailto:|tel:|\/|#|\.)/i.test(url)) return url;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(url)) return `https://${url}`;
  return '#';
}

/**
 * Sanitização robusta via DOMPurify para evitar XSS em conteúdos dinâmicos.
 */
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'u', 'mark', 'sub', 'sup', 'span', 'div', 'strong', 'em', 'b', 'i', 's', 'small', 'br', 'a', 'p',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'code', 'pre', 'blockquote', 'img', 'hr'
    ],
    ALLOWED_ATTR: ['style', 'class', 'href', 'target', 'rel', 'src', 'alt', 'width', 'height', 'align', 'data-float', 'data-mx', 'data-my', 'data-align', 'border', 'cellpadding', 'cellspacing'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'formaction'],
  });
}

function renderInline(input: string): { __html: string } {
  if (!input) return { __html: '' };

  // Se o input já parece ser HTML sanitizado (com tags span/div/style injetadas pelo editor)
  // precisamos tomar cuidado para não escapar as tags HTML válidas que o editor usa
  // TipTap gera HTML como <span style="font-family: ...; font-size: ...; color: ...">texto</span>
  
  // 0. Extrai fórmulas matemáticas ANTES de qualquer escape
  const mathPlaceholders: string[] = [];
  let safe = input
    .replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex) => {
      mathPlaceholders.push(renderMathToHTML(String(tex).trim(), true));
      return `\u0000MATH${mathPlaceholders.length - 1}\u0000`;
    })
    .replace(/\\\[([\s\S]+?)\\\]/g, (_m, tex) => {
      mathPlaceholders.push(renderMathToHTML(String(tex).trim(), true));
      return `\u0000MATH${mathPlaceholders.length - 1}\u0000`;
    })
    .replace(/\\\(([\s\S]+?)\\\)/g, (_m, tex) => {
      mathPlaceholders.push(renderMathToHTML(String(tex).trim(), false));
      return `\u0000MATH${mathPlaceholders.length - 1}\u0000`;
    })
    .replace(/(^|[^\\$])\$([^\n$]{1,200}?)\$(?!\d)/g, (full, pre, tex) => {
      const t = String(tex).trim();
      const looksMath =
        /[\\^_={}]|\\frac|\\sqrt|\\sum|\\int|\\pi|\\alpha|\\beta|\\theta|\\cdot|\\times|\\div|\\le|\\ge|\\ne|\\to|\\infty/.test(t)
        || /[A-Za-z][\^_]/.test(t)
        || /[\^_]\{?[A-Za-z0-9]/.test(t);
      if (!looksMath) return full;
      mathPlaceholders.push(renderMathToHTML(t, false));
      return `${pre}\u0000MATH${mathPlaceholders.length - 1}\u0000`;
    });

  // 1. Markdown inline → HTML
  safe = safe
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text: string, href: string) =>
      `<a href="${safeUrl(href).replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer" class="text-primary underline">${text}</a>`)
    .replace(/\*{3}([^*\n]+)\*{3}/g, '<strong><em>$1</em></strong>')
    .replace(/\*{2}([^*\n]+)\*{2}/g, '<strong>$1</strong>')
    .replace(/(?<![*\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g, '<em>$1</em>')
    .replace(/~~([^~\n]+)~~/g, '<s>$1</s>')
    .replace(/==([^=\n]+)==/g, '<mark>$1</mark>')
    .replace(/`([^`\n]+)`/g, '<code class="px-1 py-0.5 rounded-md bg-muted text-primary text-[0.92em] font-mono border border-border/20 shadow-sm">$1</code>')
    .replace(/^\s*#{1,6}\s+/gm, '');

  // 2. Sanitização final do HTML gerado (markdown + tags HTML cruas no input)
  safe = sanitizeHtml(safe);

  // 3. Restaura blocos KaTeX (HTML pronto) por último — sem escape/purify (confiável)
  safe = safe.replace(/\u0000MATH(\d+)\u0000/g, (_m, i) => mathPlaceholders[Number(i)] || '');

  return { __html: safe };
}

type Block =
  | { type: 'paragraph'; content: string }
  | { type: 'heading'; level: number; content: string }
  | { type: 'list'; items: string[]; ordered: boolean }
  | { type: 'quote'; content: string }
  | { type: 'callout'; kind: 'info' | 'tip' | 'warning'; title: string; content: string }
  | { type: 'table'; header: string[]; rows: string[][] }
  | { type: 'code'; lang: string; code: string }
  | {
      type: 'image';
      alt: string;
      url: string;
      width?: string | null;
      align?: 'left' | 'center' | 'right';
      float?: 'none' | 'left' | 'right';
      marginX?: number;
      marginY?: number;
    }
  | { type: 'audio'; label: string; url: string }
  | { type: 'divider' };

const AUDIO_RE = /\.(mp3|wav|ogg|m4a|aac|webm)(\?.*)?$/i;

function calloutKind(label: string): { kind: 'info' | 'tip' | 'warning'; title: string } {
  const l = label.toLowerCase();
  if (/(dica|tip)/.test(l)) return { kind: 'tip', title: 'Dica' };
  if (/(atenção|atencao|cuidado|alerta|warning)/.test(l)) return { kind: 'warning', title: 'Atenção' };
  if (/(importante|nota|observa)/.test(l)) return { kind: 'info', title: label };
  return { kind: 'info', title: label };
}

/* ============================================================
 * Detecção de blocos de código SEM cercas markdown.
 * Muitos materiais (ex.: APS) trazem snippets de C#/Unity, Python,
 * JS, SQL etc. apenas como texto. Aqui inferimos o início/fim
 * desses blocos por heurística e os envolvemos em ``` para que
 * o parser principal trate como bloco de código copiável.
 * ============================================================ */

const FILENAME_HEADER_RE = /^\s*(?:\d+[.)]\s*)?([A-Za-z_][\w-]*)\.(cs|js|jsx|ts|tsx|py|java|cpp|c|h|hpp|html?|css|scss|sql|php|rb|go|rs|kt|swift|sh|bash|json|xml|yaml|yml)\b/i;

const EXT_TO_LANG: Record<string, string> = {
  cs: 'csharp', js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
  py: 'python', java: 'java', cpp: 'cpp', c: 'c', h: 'c', hpp: 'cpp',
  html: 'html', htm: 'html', css: 'css', scss: 'scss', sql: 'sql',
  php: 'php', rb: 'ruby', go: 'go', rs: 'rust', kt: 'kotlin',
  swift: 'swift', sh: 'bash', bash: 'bash', json: 'json', xml: 'xml',
  yaml: 'yaml', yml: 'yaml',
};

const CODE_START_RE = /^\s*(using\s+[\w.]+\s*;|import\s+[\w{}\s,*]+\s+from\s+['"]|import\s+[\w.]+\s*;?$|from\s+[\w.]+\s+import\s+|#include\s*[<"]|namespace\s+[\w.]+|public\s+(?:static\s+)?(?:partial\s+)?(?:class|interface|enum|struct|void|int|string|bool|float|double|override|virtual|async|IEnumerator)\b|private\s+(?:static\s+)?(?:class|void|int|string|bool|float|double|readonly)\b|protected\s+(?:class|void|int|string|override)\b|internal\s+(?:class|void|sealed)\b|class\s+[A-Z]\w*\s*[:({]?|interface\s+I?[A-Z]\w*|function\s+\w+\s*\(|def\s+\w+\s*\(|const\s+\w+\s*=\s*(?:\(|function|async)|let\s+\w+\s*=|var\s+\w+\s*=|<\?php|<!DOCTYPE|<html\b|SELECT\s+.+\s+FROM\s+|CREATE\s+TABLE\s+|if\s*\([^)]+\)\s*\{?\s*$|for\s*\(.+;.+;.+\)|while\s*\([^)]+\)|switch\s*\([^)]+\)|[\w.]+\s*=\s*new\s+[A-Z]\w*\s*\(|@[A-Z]\w+\b|\[Serializable\]|\[SerializeField\]|\[RequireComponent\b|void\s+(?:Start|Update|Awake|OnEnable|OnDisable|FixedUpdate|LateUpdate|OnCollisionEnter|OnTriggerEnter)\s*\(\s*\)|Debug\.(?:Log|LogError|LogWarning)\s*\(|(?:Vector[234]|Quaternion|Transform|GameObject|Rigidbody|Color)\s+\w+\s*=|gameObject\.\w+|transform\.\w+|StartCoroutine\s*\(|return\s+new\s+[A-Z]\w*\s*\()/i;

const CODE_LINE_RE = /^(\s{2,}|\t)|[{};]\s*$|=>|^\s*(?:\/\/|\/\*|\*\s|#\s|--\s)|^\s*[\w.]+\s*\([^)]*\)\s*;?\s*$/;

/** Detecta a linguagem a partir das primeiras linhas. */
function guessLang(code: string): string {
  const head = code.slice(0, 400);
  if (/using\s+UnityEngine|MonoBehaviour|public\s+class\s+\w+\s*:/.test(head)) return 'csharp';
  if (/^\s*using\s+[A-Z]\w*(\.[A-Z]\w*)*\s*;/.test(head)) return 'csharp';
  if (/^\s*#include\s*</.test(head)) return 'cpp';
  if (/^\s*(?:from\s+\w+\s+import|def\s+\w+|import\s+\w+\s*$)/m.test(head)) return 'python';
  if (/^\s*(?:import\s+.+from\s+['"]|export\s+(?:default\s+)?(?:function|const|class))/m.test(head)) return 'typescript';
  if (/^\s*(?:function\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=)/m.test(head)) return 'javascript';
  if (/^\s*<\?php/.test(head)) return 'php';
  if (/^\s*<!DOCTYPE|^\s*<html\b/i.test(head)) return 'html';
  if (/^\s*SELECT\s+.+\s+FROM\s+/i.test(head)) return 'sql';
  if (/public\s+(?:static\s+)?void\s+main\s*\(\s*String/.test(head)) return 'java';
  return 'text';
}

/** Pré-processa o markdown injetando ``` em blocos de código sem cercas. */
function wrapInferredCodeBlocks(raw: string): string {
  if (!raw) return raw;
  if (raw.includes('```')) {
    // Divide pelos blocos cercados; processa apenas as partes fora das cercas.
    // Dividimos linha-a-linha para tolerar cercas mal formadas (ímpares).
    const linesAll = raw.split('\n');
    const out: string[] = [];
    let buffer: string[] = [];
    let inFence = false;
    const flush = () => {
      if (!buffer.length) return;
      const text = buffer.join('\n');
      // Sem chamada recursiva: processamos diretamente o segmento sem cercas
      out.push(processUnfenced(text));
      buffer = [];
    };
    for (const l of linesAll) {
      if (/^```/.test(l.trim())) {
        if (inFence) {
          out.push(l);
          inFence = false;
        } else {
          flush();
          out.push(l);
          inFence = true;
        }
        continue;
      }
      if (inFence) out.push(l);
      else buffer.push(l);
    }
    if (inFence) {
      // Cerca não fechada — fecha automaticamente para preservar o restante
      out.push('```');
    }
    flush();
    return out.join('\n');
  }
  return processUnfenced(raw);
}

/** Núcleo da heurística para detectar e cercar blocos de código sem fences. */
function processUnfenced(raw: string): string {

  const lines = raw.split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const prevI = i;
    const line = lines[i];

    // Cabeçalho tipo "1. GameManager.cs" ou "GameManager.cs"
    const fileMatch = line.match(FILENAME_HEADER_RE);
    let forcedLang: string | null = null;
    if (fileMatch) {
      forcedLang = EXT_TO_LANG[fileMatch[2].toLowerCase()] || 'text';
    }

    const looksLikeCodeStart = CODE_START_RE.test(line);
    if (!looksLikeCodeStart && !(fileMatch && i + 1 < lines.length)) {
      out.push(line);
      i++;
      continue;
    }

    // Se foi um cabeçalho de arquivo, mantém o cabeçalho como parágrafo
    // e procura o início real do código nas próximas ~3 linhas.
    let startIdx = i;
    if (fileMatch && !looksLikeCodeStart) {
      out.push(line);
      i++;
      // pula linhas vazias ou descritivas curtas
      let probed = 0;
      while (i < lines.length && probed < 4) {
        const l = lines[i];
        if (CODE_START_RE.test(l)) { startIdx = i; break; }
        if (!l.trim()) { out.push(l); i++; probed++; continue; }
        // descrição curta antes do código
        if (l.trim().length < 80 && !/[.;{}]$/.test(l.trim())) {
          out.push(l); i++; probed++; continue;
        }
        break;
      }
      if (i >= lines.length || !CODE_START_RE.test(lines[i])) {
        continue; // não achou código de fato
      }
    }

    // Coleta linhas do bloco de código
    const codeLines: string[] = [];
    let blankRun = 0;
    let j = startIdx;
    while (j < lines.length) {
      const l = lines[j];
      const trimmed = l.trim();

      if (!trimmed) {
        blankRun++;
        if (blankRun >= 2) break; // duas linhas em branco encerram o bloco
        codeLines.push(l);
        j++;
        continue;
      }
      blankRun = 0;

      // Se a linha parece prosa (sentença com pontuação final, sem sinais de código)
      const looksLikeProse =
        /[.!?]$/.test(trimmed) &&
        !/[;{}=()<>]/.test(trimmed) &&
        !CODE_LINE_RE.test(l) &&
        trimmed.split(' ').length > 5;
      // Cabeçalho de novo arquivo encerra o bloco atual
      const isNewFileHeader = FILENAME_HEADER_RE.test(l) && j !== startIdx;

      if (looksLikeProse || isNewFileHeader) break;

      codeLines.push(l);
      j++;
    }

    // Remove linhas em branco no final
    while (codeLines.length && !codeLines[codeLines.length - 1].trim()) codeLines.pop();

    const hasStrongCodeSignals = codeLines.some((l) => /[{};]|=>|\(\s*\)\s*$/.test(l));
    if (codeLines.length >= 2 || (codeLines.length >= 1 && hasStrongCodeSignals)) {
      const code = codeLines.join('\n');
      const lang = forcedLang || guessLang(code);
      out.push('```' + lang);
      out.push(code);
      out.push('```');
      i = j;
    } else {
      out.push(line);
      i++;
    }

    // Garantia: nunca permitir que `i` fique parado (proteção contra loop infinito)
    if (i <= prevI) i = prevI + 1;
  }

  return out.join('\n');
}

/** Quebra o conteúdo de uma seção em blocos tipados. */
function parseBlocks(rawInput: string): Block[] {
  const blocks: Block[] = [];
  if (!rawInput) return blocks;
  const raw = wrapInferredCodeBlocks(rawInput);

  // 1) Extrai blocos de código triplos
  const codeRe = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  const segments: { text: string; isCode?: { lang: string; code: string } }[] = [];

  while ((m = codeRe.exec(raw)) !== null) {
    if (m.index > lastIdx) segments.push({ text: raw.slice(lastIdx, m.index) });
    segments.push({ text: '', isCode: { lang: (m[1] || 'text').toLowerCase(), code: m[2].replace(/\n$/, '') } });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < raw.length) segments.push({ text: raw.slice(lastIdx) });

  for (const seg of segments) {
    if (seg.isCode) {
      blocks.push({ type: 'code', lang: seg.isCode.lang, code: seg.isCode.code });
      continue;
    }

    const lines = seg.text.split('\n');
    let i = 0;
    let paragraph: string[] = [];

    const flushParagraph = () => {
      const t = paragraph.join('\n').trim();
      if (t) {
        // Se o parágrafo for apenas um link ou texto dentro de um span/div com style, mantemos o HTML
        if (t.startsWith('<') && t.endsWith('>')) {
          blocks.push({ type: 'paragraph', content: t });
        } else {
          blocks.push({ type: 'paragraph', content: t });
        }

      }
      paragraph = [];
    };

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // linha vazia
      if (!trimmed) { flushParagraph(); i++; continue; }

      // divisor horizontal
      if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(trimmed)) {
        flushParagraph();
        blocks.push({ type: 'divider' });
        i++; continue;
      }

      // heading hash residual
      const hMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (hMatch) {
        flushParagraph();
        blocks.push({ type: 'heading', level: hMatch[1].length, content: hMatch[2] });
        i++; continue;
      }

      // imagem ou áudio em linha própria
      // Aceita <img src="..." width="50%" align="left" data-float="left" data-mx="12" data-my="0" /> também
      const htmlImgMatch = trimmed.match(/^<img\b([^>]*)\/?>$/i);
      if (htmlImgMatch) {
        const attrsStr = htmlImgMatch[1];
        const get = (name: string) => {
          const m = attrsStr.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i'));
          return m ? m[1] : '';
        };
        const url = get('src');
        if (url) {
          flushParagraph();
          const alignAttr = (get('align') || get('data-align') || 'center').toLowerCase();
          const floatAttr = (get('data-float') || 'none').toLowerCase();
          const align: 'left' | 'center' | 'right' =
            alignAttr === 'left' || alignAttr === 'right' ? alignAttr : 'center';
          const float: 'none' | 'left' | 'right' =
            floatAttr === 'left' || floatAttr === 'right' ? floatAttr : 'none';
          const widthRaw = get('width');
          const width = widthRaw ? (/^\d+$/.test(widthRaw) ? `${widthRaw}px` : widthRaw) : null;
          const mx = parseInt(get('data-mx') || '0', 10) || 0;
          const my = parseInt(get('data-my') || '0', 10) || 0;
          blocks.push({
            type: 'image',
            alt: get('alt') || '',
            url,
            width,
            align,
            float,
            marginX: mx,
            marginY: my,
          });
          i++; continue;
        }
      }

      const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        flushParagraph();
        const url = imgMatch[2]; const label = imgMatch[1];
        if (AUDIO_RE.test(url)) blocks.push({ type: 'audio', label: label || 'Áudio explicativo', url });
        else blocks.push({ type: 'image', alt: label, url });
        i++; continue;
      }
      const audioMatch = trimmed.match(/^\[(?:áudio|audio)[^\]]*\]\(([^)]+)\)$/i);
      if (audioMatch) {
        flushParagraph();
        blocks.push({ type: 'audio', label: 'Áudio explicativo', url: audioMatch[1] });
        i++; continue;
      }
      if (/^https?:\/\/\S+$/.test(trimmed) && AUDIO_RE.test(trimmed)) {
        flushParagraph();
        blocks.push({ type: 'audio', label: 'Áudio explicativo', url: trimmed });
        i++; continue;
      }

      // tabela markdown: detecta cabeçalho + separador
      if (/^\|.+\|$/.test(trimmed) && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1].trim())) {
        flushParagraph();
        const header = trimmed.slice(1, -1).split('|').map((c) => c.trim());
        i += 2; // pula header + sep
        const rows: string[][] = [];
        while (i < lines.length && /^\|.+\|$/.test(lines[i].trim())) {
          rows.push(lines[i].trim().slice(1, -1).split('|').map((c) => c.trim()));
          i++;
        }
        blocks.push({ type: 'table', header, rows });
        continue;
      }

      // blockquote
      if (/^>\s?/.test(trimmed)) {
        flushParagraph();
        const buf: string[] = [];
        while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
          buf.push(lines[i].trim().replace(/^>\s?/, ''));
          i++;
        }
        blocks.push({ type: 'quote', content: buf.join(' ') });
        continue;
      }

      // lista (não-ordenada ou ordenada)
      const ulMatch = trimmed.match(/^[*+\-•]\s+(.+)$/);
      const olMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
      if (ulMatch || olMatch) {
        flushParagraph();
        const ordered = !!olMatch;
        const items: string[] = [];
        while (i < lines.length) {
          const t = lines[i].trim();
          const u = t.match(/^[*+\-•]\s+(.+)$/);
          const o = t.match(/^\d+[.)]\s+(.+)$/);
          if (ordered && o) { items.push(o[1]); i++; }
          else if (!ordered && u) { items.push(u[1]); i++; }
          else break;
        }
        blocks.push({ type: 'list', items, ordered });
        continue;
      }

      // callout (Importante: / Dica: / Atenção: ...)
      const calloutMatch = trimmed.match(/^\*?\*?(Importante|Dica|Atenção|Atencao|Observação|Observacao|Nota|Cuidado):\*?\*?\s+(.+)$/i);
      if (calloutMatch) {
        flushParagraph();
        const { kind, title } = calloutKind(calloutMatch[1]);
        blocks.push({ type: 'callout', kind, title, content: calloutMatch[2] });
        i++; continue;
      }

      // ==destaque== em linha solta vira callout info
      const highlightMatch = trimmed.match(/^==(.+)==$/);
      if (highlightMatch) {
        flushParagraph();
        blocks.push({ type: 'callout', kind: 'info', title: 'Destaque', content: highlightMatch[1] });
        i++; continue;
      }

      paragraph.push(line);
      i++;
    }
    flushParagraph();
  }

  return blocks;
}

/* ============= Sub-componentes ============= */

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  useEffect(() => {
    // Modo Seguro: pula o highlight (Shiki é pesado) e mostra o code "cru"
    try {
      if (sessionStorage.getItem('decode:safe-mode:enabled:v1') === '1') {
        return;
      }
    } catch { /* noop */ }
    let cancelled = false;
    highlightCode(code, lang).then((html) => {
      if (!cancelled) setHighlighted(html);
    });
    return () => { cancelled = true; };
  }, [code, lang]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Código copiado');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const LANG_LABEL: Record<string, string> = {
    csharp: 'C#', cs: 'C#', javascript: 'JavaScript', js: 'JavaScript',
    typescript: 'TypeScript', ts: 'TypeScript', tsx: 'TSX', jsx: 'JSX',
    python: 'Python', py: 'Python', java: 'Java', cpp: 'C++', c: 'C',
    html: 'HTML', css: 'CSS', scss: 'SCSS', sql: 'SQL', php: 'PHP',
    ruby: 'Ruby', go: 'Go', rust: 'Rust', kotlin: 'Kotlin', swift: 'Swift',
    bash: 'Bash', sh: 'Shell', json: 'JSON', xml: 'XML', yaml: 'YAML',
    text: 'Código',
  };
  const label = LANG_LABEL[(lang || '').toLowerCase()] || (lang ? lang.toUpperCase() : 'Código');
  const lineCount = code.split('\n').length;

  return (
    <figure className="my-6 rounded-xl border border-border/60 bg-[#22272e] overflow-hidden shadow-sm select-text min-w-0 max-w-full">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b border-white/10 bg-black/20">
        <span className="flex items-center gap-2 min-w-0">
          <span className="inline-block h-2 w-2 rounded-full bg-primary/70 flex-shrink-0" />
          <span className="font-mono-label text-[10px] uppercase tracking-wider text-white/60 truncate">
            {label}
          </span>
          <span className="font-mono-label text-[10px] text-white/40 whitespace-nowrap">
            · {lineCount} linha{lineCount > 1 ? 's' : ''}
          </span>
        </span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label="Copiar código"
        >
          {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copiado' : 'Copiar código'}
        </button>
      </figcaption>
      {highlighted ? (
        <div
          data-allow-copy
          className="shiki-wrapper leading-relaxed select-text"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      ) : (
        <pre data-allow-copy className="m-0 p-3 sm:p-4 overflow-x-auto text-[12px] sm:text-[13px] leading-relaxed font-mono text-white/90 select-text max-w-full">
          <code className={`language-${lang}`}>{code}</code>
        </pre>
      )}
    </figure>
  );
}

function isFilenameLikeAlt(alt: string): boolean {
  const t = (alt || '').trim();
  if (!t) return true;
  if (/\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(t)) return true;
  if (/^(IMG[_\-\s]?\d|Screenshot|Captura|Gemini[_ ]Generated|ChatGPT Image|image[_\-\s]?\d|photo[_\-\s]?\d|untitled)/i.test(t)) return true;
  if (/^[a-z0-9_\-]{10,}$/i.test(t)) return true;
  return false;
}

function ImageBlock({
  alt,
  url,
  width,
  align = 'center',
  float = 'none',
  marginX = 0,
  marginY = 0,
}: {
  alt: string;
  url: string;
  width?: string | null;
  align?: 'left' | 'center' | 'right';
  float?: 'none' | 'left' | 'right';
  marginX?: number;
  marginY?: number;
}) {
  const [errored, setErrored] = useState(false);
  const showCaption = !isFilenameLikeAlt(alt);

  // Responsividade: em telas estreitas (sm: <640px) o aluno NÃO vê float — a
  // imagem assume largura total para legibilidade. Implementado via CSS class
  // `student-img-block` (ver index.css) que cancela float em mobile.
  const isFloating = float === 'left' || float === 'right';

  // Wrapper figure usa float quando solicitado; caso contrário, alinhamento via flex.
  const justify =
    align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';

  const figureStyle: React.CSSProperties = isFloating
    ? {
        float,
        width: width || '50%',
        maxWidth: '100%',
        margin:
          float === 'left'
            ? `${marginY}px ${Math.max(16, marginX)}px ${marginY}px 0`
            : `${marginY}px 0 ${marginY}px ${Math.max(16, marginX)}px`,
        shapeOutside: 'margin-box',
      }
    : {
        margin: marginX || marginY ? `${marginY || 16}px ${marginX}px` : undefined,
      };

  // Largura interna quando NÃO está flutuando (centralizado/alinhado)
  const innerWidthStyle: React.CSSProperties = !isFloating && width
    ? { width, maxWidth: '100%' }
    : {};

  return (
    <figure
      className={cn(
        'student-img-block',
        isFloating
          ? 'block clear-none my-2 sm:my-3'
          : cn('my-7 flex flex-col items-center gap-2.5', justify),
      )}
      style={figureStyle}
      data-float={float}
    >
      <div
        className="rounded-xl bg-white p-2 sm:p-3 border border-border/40 shadow-lg shadow-black/20"
        style={isFloating ? { width: '100%' } : { width: '100%', ...innerWidthStyle }}
      >
        {errored ? (
          <div className="flex items-center justify-center min-h-[180px] text-sm text-muted-foreground italic bg-muted/40 rounded-lg">
            Imagem indisponível
          </div>
        ) : (
          <AppImage
            src={url}
            alt={alt}
            loading="lazy"
            onError={() => setErrored(true)}
            className="block w-full h-auto rounded-lg max-h-[520px] object-contain mx-auto"
            fallbackClassName="min-h-[180px] rounded-lg"
          />
        )}
      </div>
      {showCaption && (
        <figcaption className="text-[12px] text-muted-foreground italic text-center max-w-prose leading-snug mt-1.5">
          {alt}
        </figcaption>
      )}
    </figure>
  );
}

function AudioBlock({ label, url }: { label: string; url: string }) {
  return (
    <figure className="my-6 rounded-xl border border-primary/25 bg-primary/5 px-3 py-3 sm:px-4 sm:py-3.5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs font-medium text-primary">
        <Volume2 className="h-3.5 w-3.5" />
        {label}
      </div>
      <audio controls preload="none" src={url} className="w-full h-9">
        Seu navegador não suporta áudio.
      </audio>
    </figure>
  );
}

function CalloutBlock({ kind, title, content }: { kind: 'info' | 'tip' | 'warning'; title: string; content: string }) {
  const Icon = kind === 'tip' ? Lightbulb : kind === 'warning' ? AlertTriangle : Info;
  const colors = 
    kind === 'warning' 
      ? { bg: 'bg-destructive/5', border: 'border-destructive/40', text: 'text-destructive', icon: 'text-destructive' }
      : kind === 'tip'
      ? { bg: 'bg-emerald-500/5', border: 'border-emerald-500/40', text: 'text-emerald-500', icon: 'text-emerald-500' }
      : { bg: 'bg-primary/5', border: 'border-primary/40', text: 'text-foreground', icon: 'text-primary' };

  return (
    <aside className={cn("my-6 p-5 rounded-2xl border flex gap-4 transition-all duration-300 hover:shadow-md", colors.bg, colors.border)}>
      <div className={cn("mt-0.5 h-10 w-10 rounded-xl flex items-center justify-center bg-card shadow-sm shrink-0", colors.border, "border-[0.5px]")}>
        <Icon className={cn("h-5 w-5", colors.icon)} />
      </div>
      <div className="space-y-1.5 flex-1 min-w-0">
        <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] opacity-80", colors.text)}>{title}</p>
        <p className="text-[15px] leading-relaxed text-foreground/90 m-0 font-medium" dangerouslySetInnerHTML={renderInline(content)} />
      </div>
    </aside>

  );
}

function QuoteBlock({ content }: { content: string }) {
  return (
    <blockquote
      className="my-10 pl-8 pr-4 py-2 border-l-4 border-primary/30 italic text-foreground/80 text-[17px] leading-loose font-medium bg-primary/5 rounded-r-2xl"
      dangerouslySetInnerHTML={renderInline(content)}
    />

  );
}

function ListBlock({ items, ordered }: { items: string[]; ordered: boolean }) {
  if (ordered) {
    return (
      <ol className="my-6 ml-2 space-y-3 list-none counter-reset-decode">
        {items.map((it, idx) => (
          <li key={idx} className="pl-12 relative text-[16px] leading-relaxed text-foreground/90 group py-1">
            <span className="absolute left-0 top-[0.1em] w-8 h-8 rounded-xl bg-accent/10 border border-border/40 text-muted-foreground font-display font-black text-[12px] flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300 shadow-sm">
              {idx + 1}

            </span>
            <span dangerouslySetInnerHTML={renderInline(it)} />
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ul className="my-6 ml-2 space-y-3">
      {items.map((it, idx) => (
        <li key={idx} className="pl-10 relative text-[16px] leading-relaxed text-foreground/90 group py-1">
          <span className="absolute left-1 top-[0.6em] w-2.5 h-2.5 rounded-full border-2 border-primary/30 group-hover:bg-primary group-hover:border-primary transition-all duration-300 shadow-sm" />
          <span dangerouslySetInnerHTML={renderInline(it)} className="font-medium" />

        </li>
      ))}
    </ul>
  );
}

function TableBlock({ header, rows }: { header: string[]; rows: string[][] }) {
  return (
    <div className="my-10 overflow-x-auto rounded-2xl border border-border/40 bg-card/40 shadow-xl backdrop-blur-sm">
      <table className="w-full text-[15px] border-collapse">

        <thead>
          <tr className="bg-accent/5">
            {header.map((h, i) => (
              <th
                key={i}
                className="text-left px-4 py-3 font-bold text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border/40"
                dangerouslySetInnerHTML={renderInline(h)}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-accent/5 transition-colors">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-4 py-3 text-foreground/80 border-b border-border/20 align-top leading-relaxed"
                  dangerouslySetInnerHTML={renderInline(cell)}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Slug estável p/ ids de heading (suporta acentos e múltiplas ocorrências). */
function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'secao';
}

function HeadingBlock({ level, content, id, active }: { level: number; content: string; id?: string; active?: boolean }) {
  const text = cleanInlineText(content);
  const activeCls = active ? 'apostila-heading-active' : '';
  if (level === 1) {
    return (
      <h1 id={id} data-active={active || undefined} className={cn('font-display text-4xl sm:text-6xl font-black mt-16 mb-8 text-foreground tracking-tighter leading-tight scroll-mt-24', activeCls)}>
        {text}
      </h1>
    );
  }
  if (level === 2) {
    return (
      <h2 id={id} data-active={active || undefined} className={cn('font-display text-2xl sm:text-4xl font-black mt-12 mb-5 text-foreground tracking-tighter leading-tight scroll-mt-24 border-b-2 border-primary/20 pb-3', activeCls)}>
        {text}
      </h2>

    );
  }
  if (level === 3) {
    return (
      <h3 id={id} data-active={active || undefined} className={cn('font-display text-xl sm:text-2xl font-bold mt-8 mb-3 text-foreground tracking-tight leading-snug scroll-mt-24', activeCls)}>
        {text}
      </h3>
    );
  }
  return (
    <h4 id={id} data-active={active || undefined} className={cn('font-display text-[10px] font-black mt-6 mb-2 text-primary uppercase tracking-[0.2em] scroll-mt-24', activeCls)}>
      {text}
    </h4>
  );
}

/** Sumário clicável com hierarquia (nível 1-2 / 3 / 4+). Colapsável + destaque ativo. */
function ApostilaTOC({ items, activeId }: { items: Array<{ id: string; level: number; text: string; number: string }>; activeId?: string | null }) {
  const [open, setOpen] = useState(true);
  if (items.length < 2) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try { history.replaceState(null, '', `#${id}`); } catch { /* noop */ }
    }
  };

  return (
    <nav
      aria-label="Sumário da apostila"
      className="not-prose mb-8 rounded-xl border border-border/70 bg-muted/30 backdrop-blur-sm overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-[13px] font-semibold text-foreground/90">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Nesta apostila
          <span className="text-[11px] font-normal text-muted-foreground">· {items.length} seções</span>
        </span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={cn('text-muted-foreground transition-transform', open && 'rotate-180')}
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <ol className="px-3 pb-3 pt-1 space-y-0.5 max-h-[60vh] overflow-y-auto">
          {items.map((it) => {
            const isActive = activeId === it.id;
            return (
              <li key={it.id}>
                <a
                  href={`#${it.id}`}
                  onClick={(e) => handleClick(e, it.id)}
                  aria-current={isActive ? 'location' : undefined}
                  className={cn(
                    'flex items-baseline gap-2 px-2 py-1.5 rounded-md text-[13px] leading-snug hover:bg-accent/60 hover:text-foreground transition-colors',
                    it.level <= 2 && 'font-semibold text-foreground',
                    it.level === 3 && 'pl-5 text-foreground/85',
                    it.level >= 4 && 'pl-8 text-[12px] text-muted-foreground',
                    isActive && 'bg-primary/15 text-primary border-l-2 border-primary -ml-px pl-[calc(0.5rem-1px)]',
                    isActive && it.level === 3 && 'pl-[calc(1.25rem-1px)]',
                    isActive && it.level >= 4 && 'pl-[calc(2rem-1px)]',
                  )}
                >
                  <span className={cn('font-mono text-[10px] shrink-0 tabular-nums', isActive ? 'text-primary' : 'text-primary')}>{it.number}</span>
                  <span className="truncate">{it.text}</span>
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
}

interface Props {
  content: string;
  /** Quando informado, destaca o heading correspondente (split-view do editor). */
  activeHeadingId?: string | null;
}

/**
 * Renderizador editorial da apostila com hierarquia tipográfica refinada,
 * blocos especiais (citação, callout, tabela, lista, código, mídia) e
 * ritmo de leitura confortável (~68ch, line-height 1.75).
 */
export function ApostilaContentRenderer({ content, activeHeadingId }: Props) {
  const blocks = useMemo(() => {
    try {
      return parseBlocks(content);
    } catch (err) {
      console.error('[ApostilaContentRenderer] parse error, falling back to plain text:', err);
      // Fallback: renderiza o conteúdo como parágrafos simples para evitar tela preta
      const paragraphs = (content || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
      return paragraphs.map((content) => ({ type: 'paragraph' as const, content }));
    }
  }, [content]);

  // Identifica o índice do primeiro parágrafo "real" (para aplicar drop-cap)
  const firstParagraphIdx = useMemo(
    () => blocks.findIndex((b) => b.type === 'paragraph' && b.content.trim().length > 80),
    [blocks]
  );

  /**
   * Constrói o sumário a partir dos headings, atribuindo ids únicos
   * (slug + sufixo numérico em caso de colisão) e numeração hierárquica
   * estilo 1 / 1.1 / 1.1.1 — alinhada ao padrão usado no TOC do leitor.
   */
  const { tocItems, headingIds } = useMemo(() => {
    const used = new Map<string, number>();
    const counters = [0, 0, 0, 0, 0, 0];
    const items: Array<{ id: string; level: number; text: string; number: string }> = [];
    const ids: Record<number, string> = {};

    blocks.forEach((b, idx) => {
      if (b.type !== 'heading') return;
      const text = cleanInlineText(b.content);
      // Normaliza nível para profundidade do TOC: H1/H2 → 1, H3 → 2, H4+ → 3
      const depth = b.level <= 2 ? 1 : b.level === 3 ? 2 : 3;
      counters[depth - 1] += 1;
      for (let k = depth; k < counters.length; k++) counters[k] = 0;
      const number = counters.slice(0, depth).join('.');

      const base = slugify(text);
      const n = (used.get(base) || 0) + 1;
      used.set(base, n);
      const id = n === 1 ? base : `${base}-${n}`;

      ids[idx] = id;
      items.push({ id, level: b.level, text, number });
    });
    return { tocItems: items, headingIds: ids };
  }, [blocks]);

  return (
    <article className="apostila-prose max-w-[72ch] mx-auto w-full min-w-0 px-1 sm:px-0 text-[16px] sm:text-[17.5px] leading-[1.8] tracking-normal text-foreground/95">
      <ApostilaTOC items={tocItems} activeId={activeHeadingId} />
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'code': return <CodeBlock key={i} lang={b.lang} code={b.code} />;
          case 'image': return (
            <ImageBlock
              key={i}
              alt={b.alt}
              url={b.url}
              width={b.width}
              align={b.align}
              float={b.float}
              marginX={b.marginX}
              marginY={b.marginY}
            />
          );
          case 'audio': return <AudioBlock key={i} label={b.label} url={b.url} />;
          case 'callout': return <CalloutBlock key={i} kind={b.kind} title={b.title} content={b.content} />;
          case 'quote': return <QuoteBlock key={i} content={b.content} />;
          case 'list': return <ListBlock key={i} items={b.items} ordered={b.ordered} />;
          case 'table': return <TableBlock key={i} header={b.header} rows={b.rows} />;
          case 'heading': return <HeadingBlock key={i} level={b.level} content={b.content} id={headingIds[i]} active={!!activeHeadingId && headingIds[i] === activeHeadingId} />;
          case 'divider':
            return (
              <div key={i} className="my-8 flex items-center justify-center" aria-hidden>
                <span className="h-px w-32 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              </div>
            );
          case 'paragraph':
          default: {
            return (
              <p
                key={i}
                className="mb-6 last:mb-0 text-foreground/95 font-medium tracking-tight"
                dangerouslySetInnerHTML={renderInline(b.content)}
              />
            );
          }
        }
      })}
    </article>
  );
}
