import { useState, useMemo } from 'react';
import { Check, Copy, Volume2, Info, Lightbulb, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { AppImage } from '@/components/ui/app-image';

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

type Block =
  | { type: 'paragraph'; content: string }
  | { type: 'heading'; level: number; content: string }
  | { type: 'list'; items: string[]; ordered: boolean }
  | { type: 'quote'; content: string }
  | { type: 'callout'; kind: 'info' | 'tip' | 'warning'; title: string; content: string }
  | { type: 'table'; header: string[]; rows: string[][] }
  | { type: 'code'; lang: string; code: string }
  | { type: 'image'; alt: string; url: string }
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

const CODE_START_RE = /^\s*(using\s+[\w.]+\s*;|import\s+[\w{}\s,*]+\s+from\s+['"]|import\s+[\w.]+\s*;?$|from\s+[\w.]+\s+import\s+|#include\s*[<"]|public\s+(?:static\s+)?(?:class|interface|enum|void|int|string|bool|float|double)\b|private\s+(?:static\s+)?(?:class|void|int|string|bool|float|double)\b|protected\s+(?:class|void|int|string)\b|class\s+[A-Z]\w*\s*[:({]?|function\s+\w+\s*\(|def\s+\w+\s*\(|const\s+\w+\s*=\s*(?:\(|function|async)|let\s+\w+\s*=|var\s+\w+\s*=|<\?php|<!DOCTYPE|<html\b|SELECT\s+.+\s+FROM\s+|CREATE\s+TABLE\s+)/i;

const CODE_LINE_RE = /^(\s{2,}|\t)|[{};]\s*$|^\s*(?:\/\/|\/\*|\*\s|#\s|--\s)/;

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
  if (!raw || raw.includes('```')) {
    // Se já tem fences, ainda assim tentamos detectar trechos NÃO cercados,
    // mas para evitar romper blocos existentes, dividimos pelos fences.
    const parts = raw.split(/(```[\s\S]*?```)/g);
    return parts.map((p) => (p.startsWith('```') ? p : wrapInferredCodeBlocks(p))).join('');
  }

  const lines = raw.split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
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

    if (codeLines.length >= 2) {
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
      if (t) blocks.push({ type: 'paragraph', content: t });
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

  return (
    <figure className="my-6 rounded-xl border border-border/60 bg-[hsl(var(--muted))] overflow-hidden shadow-sm select-text">
      <figcaption className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-border/50 bg-background/40">
        <span className="font-mono-label text-[10px] uppercase tracking-wider text-muted-foreground">
          {lang || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Copiar código"
        >
          {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copiado' : 'Copiar código'}
        </button>
      </figcaption>
      <pre data-allow-copy className="m-0 p-3 sm:p-4 overflow-x-auto text-[12px] sm:text-[13px] leading-relaxed font-mono text-foreground/90 select-text">
        <code className={`language-${lang}`}>{code}</code>
      </pre>
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

function ImageBlock({ alt, url }: { alt: string; url: string }) {
  const [errored, setErrored] = useState(false);
  const showCaption = !isFilenameLikeAlt(alt);

  return (
    <figure className="my-7 flex flex-col items-center gap-2.5">
      <div className="w-full sm:max-w-[90%] rounded-xl bg-white p-2 sm:p-3 border border-border/40 shadow-lg shadow-black/20">
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
        <figcaption className="text-[12px] text-muted-foreground italic text-center max-w-prose leading-snug">
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
  const tone =
    kind === 'warning'
      ? 'border-l-destructive bg-destructive/5 text-destructive'
      : kind === 'tip'
      ? 'border-l-accent bg-accent/10 text-accent-foreground'
      : 'border-l-primary bg-primary/5 text-foreground/90';
  const labelTone =
    kind === 'warning' ? 'text-destructive' : kind === 'tip' ? 'text-accent-foreground' : 'text-primary';

  return (
    <aside className={`my-5 rounded-r-lg border-l-4 ${tone} px-4 py-3 flex gap-3`}>
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${labelTone}`} />
      <div className="flex-1 min-w-0">
        <div className={`font-mono-label text-[10px] uppercase tracking-wider mb-1 ${labelTone}`}>
          {title}
        </div>
        <p className="text-[14px] leading-[1.7] text-foreground/85 m-0">{cleanInlineText(content)}</p>
      </div>
    </aside>
  );
}

function QuoteBlock({ content }: { content: string }) {
  return (
    <blockquote className="my-6 pl-5 border-l-4 border-primary/50 italic text-foreground/75 text-[15px] leading-[1.75]">
      {cleanInlineText(content)}
    </blockquote>
  );
}

function ListBlock({ items, ordered }: { items: string[]; ordered: boolean }) {
  if (ordered) {
    return (
      <ol className="my-4 ml-1 space-y-2 list-none counter-reset-decode">
        {items.map((it, idx) => (
          <li key={idx} className="pl-8 relative text-[15px] leading-[1.75] text-foreground/85">
            <span className="absolute left-0 top-0 w-6 h-6 rounded-full bg-primary/10 text-primary font-mono-label text-[11px] flex items-center justify-center">
              {idx + 1}
            </span>
            {cleanInlineText(it)}
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ul className="my-4 ml-1 space-y-2">
      {items.map((it, idx) => (
        <li key={idx} className="pl-5 relative text-[15px] leading-[1.75] text-foreground/85">
          <span className="absolute left-0 top-[0.6em] w-1.5 h-1.5 rounded-full bg-primary" />
          {cleanInlineText(it)}
        </li>
      ))}
    </ul>
  );
}

function TableBlock({ header, rows }: { header: string[]; rows: string[][] }) {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border border-border/50">
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr className="bg-muted/60">
            {header.map((h, i) => (
              <th key={i} className="text-left px-3 py-2 font-semibold text-foreground/90 border-b border-border/50">
                {cleanInlineText(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-foreground/80 border-b border-border/30 align-top">
                  {cleanInlineText(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HeadingBlock({ level, content }: { level: number; content: string }) {
  const text = cleanInlineText(content);
  if (level <= 2) {
    return (
      <h3 className="font-display text-[22px] sm:text-[26px] font-bold mt-12 mb-4 text-foreground tracking-tight leading-[1.25] flex items-center gap-3">
        <span className="inline-block w-1 h-7 bg-gradient-to-b from-primary to-primary/40 rounded-full shrink-0" />
        <span className="flex-1">{text}</span>
      </h3>
    );
  }
  if (level === 3) {
    return (
      <h4 className="font-display text-[17px] sm:text-[18px] font-semibold mt-8 mb-3 text-primary tracking-tight leading-snug">
        {text}
      </h4>
    );
  }
  return (
    <h5 className="font-display text-[15px] sm:text-[16px] font-semibold mt-6 mb-2 text-foreground/90 uppercase tracking-wider text-[13px]">
      {text}
    </h5>
  );
}

interface Props {
  content: string;
}

/**
 * Renderizador editorial da apostila com hierarquia tipográfica refinada,
 * blocos especiais (citação, callout, tabela, lista, código, mídia) e
 * ritmo de leitura confortável (~68ch, line-height 1.75).
 */
export function ApostilaContentRenderer({ content }: Props) {
  const blocks = useMemo(() => parseBlocks(content), [content]);
  // Identifica o índice do primeiro parágrafo "real" (para aplicar drop-cap)
  const firstParagraphIdx = useMemo(
    () => blocks.findIndex((b) => b.type === 'paragraph' && b.content.trim().length > 80),
    [blocks]
  );

  return (
    <article className="apostila-prose max-w-[70ch] mx-auto text-[15.5px] sm:text-[16.5px] leading-[1.85] tracking-[0.005em] text-foreground/90">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'code': return <CodeBlock key={i} lang={b.lang} code={b.code} />;
          case 'image': return <ImageBlock key={i} alt={b.alt} url={b.url} />;
          case 'audio': return <AudioBlock key={i} label={b.label} url={b.url} />;
          case 'callout': return <CalloutBlock key={i} kind={b.kind} title={b.title} content={b.content} />;
          case 'quote': return <QuoteBlock key={i} content={b.content} />;
          case 'list': return <ListBlock key={i} items={b.items} ordered={b.ordered} />;
          case 'table': return <TableBlock key={i} header={b.header} rows={b.rows} />;
          case 'heading': return <HeadingBlock key={i} level={b.level} content={b.content} />;
          case 'divider':
            return (
              <div key={i} className="my-10 flex items-center justify-center gap-2" aria-hidden>
                <span className="h-px w-12 bg-gradient-to-r from-transparent to-border" />
                <span className="text-primary/60 text-xs tracking-[0.5em]">◆</span>
                <span className="h-px w-12 bg-gradient-to-l from-transparent to-border" />
              </div>
            );
          case 'paragraph':
          default: {
            const isFirst = i === firstParagraphIdx;
            return (
              <p
                key={i}
                className={`mb-6 last:mb-0 text-foreground/85 ${
                  isFirst ? 'first-letter:font-display first-letter:text-[3.4em] first-letter:font-bold first-letter:text-primary first-letter:float-left first-letter:mr-2 first-letter:leading-[0.9] first-letter:mt-1' : ''
                }`}
              >
                {cleanInlineText(b.content)}
              </p>
            );
          }
        }
      })}
    </article>
  );
}
