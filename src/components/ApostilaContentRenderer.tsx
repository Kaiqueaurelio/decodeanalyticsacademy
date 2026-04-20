import { useState, useMemo } from 'react';
import { Check, Copy, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Remove sintaxe markdown residual (negrito, itálico, código inline, links etc.)
 * para renderizar texto puro com fonte unificada.
 * NÃO toca em blocos de código (```), imagens (![...]) ou áudios — esses são
 * extraídos antes pelo parser de blocos.
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
    .replace(/`([^`]+)`/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/^\s*[*+-]\s+/gm, '• ')
    .replace(/^\s*#{1,6}\s+/gm, '');
}

type Block =
  | { type: 'text'; content: string }
  | { type: 'code'; lang: string; code: string }
  | { type: 'image'; alt: string; url: string }
  | { type: 'audio'; label: string; url: string };

const AUDIO_RE = /\.(mp3|wav|ogg|m4a|aac|webm)(\?.*)?$/i;

/** Quebra o conteúdo de uma seção em blocos (texto / código / imagem / áudio). */
function parseBlocks(raw: string): Block[] {
  const blocks: Block[] = [];
  if (!raw) return blocks;

  // Primeiro extrai blocos de código triplos para não conflitar com o resto
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

  // Para cada segmento de texto, varre linha-a-linha extraindo imagens/áudios isolados
  // e ainda aceita imagens "no meio" de linhas curtas (![...](url) numa linha própria).
  for (const seg of segments) {
    if (seg.isCode) {
      blocks.push({ type: 'code', lang: seg.isCode.lang, code: seg.isCode.code });
      continue;
    }
    const lines = seg.text.split('\n');
    let buffer: string[] = [];
    const flushText = () => {
      const t = buffer.join('\n').trim();
      if (t) blocks.push({ type: 'text', content: t });
      buffer = [];
    };
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(trimmed)) continue;

      // ![alt](url) numa linha própria → imagem ou áudio
      const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        const url = imgMatch[2];
        const label = imgMatch[1];
        if (AUDIO_RE.test(url)) {
          flushText();
          blocks.push({ type: 'audio', label: label || 'Áudio explicativo', url });
        } else {
          flushText();
          blocks.push({ type: 'image', alt: label, url });
        }
        continue;
      }

      // [audio: rótulo](url) ou [áudio](url.mp3)
      const audioMatch = trimmed.match(/^\[(?:áudio|audio)[^\]]*\]\(([^)]+)\)$/i);
      if (audioMatch) {
        flushText();
        blocks.push({ type: 'audio', label: 'Áudio explicativo', url: audioMatch[1] });
        continue;
      }

      // Link cru pra arquivo de áudio numa linha própria
      if (/^https?:\/\/\S+$/.test(trimmed) && AUDIO_RE.test(trimmed)) {
        flushText();
        blocks.push({ type: 'audio', label: 'Áudio explicativo', url: trimmed });
        continue;
      }

      buffer.push(line);
    }
    flushText();
  }

  return blocks;
}

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
    <figure className="my-5 rounded-xl border border-border/60 bg-[hsl(var(--muted))] overflow-hidden shadow-sm select-text">
      <figcaption className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-border/50 bg-background/40">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {lang || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Copiar código"
        >
          {copied ? <Check className="h-3 w-3 text-[hsl(var(--success,142_76%_36%))]" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copiado' : 'Copiar código'}
        </button>
      </figcaption>
      {/* Apenas o <pre><code> é selecionável/copiável visualmente — mantém o resto da apostila com proteção */}
      <pre className="m-0 p-3 sm:p-4 overflow-x-auto text-[12px] sm:text-[13px] leading-relaxed font-mono text-foreground/90">
        <code className={`language-${lang}`}>{code}</code>
      </pre>
    </figure>
  );
}

function ImageBlock({ alt, url }: { alt: string; url: string }) {
  return (
    <figure className="my-6 flex flex-col items-center gap-2">
      <img
        src={url}
        alt={alt}
        loading="lazy"
        className="max-w-full sm:max-w-[80%] rounded-xl border border-border/40 shadow-md"
      />
      {alt && (
        <figcaption className="text-[11px] text-muted-foreground italic text-center max-w-prose">
          {alt}
        </figcaption>
      )}
    </figure>
  );
}

function AudioBlock({ label, url }: { label: string; url: string }) {
  return (
    <figure className="my-5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-3 sm:px-4 sm:py-3.5 flex flex-col gap-2">
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

interface Props {
  content: string;
}

/**
 * Renderiza o conteúdo de uma seção da apostila com suporte a blocos especiais:
 * - Código triplo crase (```lang ... ```) → caixa com botão "Copiar código"
 * - Imagens ![alt](url) → centralizadas com legenda, no meio do texto
 * - Áudios (.mp3/.wav/.ogg) → player nativo inline
 * O texto comum permanece com proteção de cópia (herdada do ScreenshotGuard).
 */
export function ApostilaContentRenderer({ content }: Props) {
  const blocks = useMemo(() => parseBlocks(content), [content]);

  return (
    <div className="text-sm leading-[1.85] text-foreground/75">
      {blocks.map((b, i) => {
        if (b.type === 'code') return <CodeBlock key={i} lang={b.lang} code={b.code} />;
        if (b.type === 'image') return <ImageBlock key={i} alt={b.alt} url={b.url} />;
        if (b.type === 'audio') return <AudioBlock key={i} label={b.label} url={b.url} />;
        // Texto: respeita quebras de linha, limpa markdown inline
        return (
          <p key={i} className="whitespace-pre-wrap mb-4 last:mb-0">
            {cleanInlineText(b.content)}
          </p>
        );
      })}
    </div>
  );
}
