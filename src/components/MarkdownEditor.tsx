/**
 * MarkdownEditor — editor lado-a-lado (texto/preview) com toolbar completa
 * estilo Microsoft Word.
 *
 * Por que markdown e não rich-text WYSIWYG?
 * - O resto do app já consome o conteúdo da apostila como markdown
 *   (parser, PDF, chat, sumário). Mantemos compatibilidade total.
 * - Como o markdown puro não cobre 100% das funcionalidades do Word
 *   (sublinhado, tachado, cor, alinhamento), usamos HTML inline
 *   (<u>, <mark>, <span style="...">, <div align="...">) — react-markdown
 *   renderiza HTML quando rehype-raw está habilitado.
 */
import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Code2, Link as LinkIcon, Image as ImageIcon,
  Eye, Pencil, Columns2, Minus, GripVertical, ArrowUp, ArrowDown,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo2, Redo2,
  Highlighter, Palette, Table as TableIcon, Subscript, Superscript,
  CheckSquare, Eraser, Type, RemoveFormatting,
} from 'lucide-react';
import { ApostilaContentRenderer } from '@/components/ApostilaContentRenderer';
import { ImageUploadButton } from '@/components/ImageUploadButton';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

type ViewMode = 'edit' | 'split' | 'preview';

interface Props {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  showWordCount?: boolean;
}

// Paletas (alinhadas ao tema high-tech do app)
const TEXT_COLORS = [
  { name: 'Padrão', value: '' },
  { name: 'Ciano', value: '#00f0ff' },
  { name: 'Roxo', value: '#a855f7' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Amarelo', value: '#eab308' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Branco', value: '#ffffff' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Amarelo', value: '#fde047' },
  { name: 'Verde', value: '#86efac' },
  { name: 'Ciano', value: '#67e8f9' },
  { name: 'Rosa', value: '#f9a8d4' },
  { name: 'Laranja', value: '#fdba74' },
];

const FONT_SIZES = [
  { label: 'Pequeno', value: '12px' },
  { label: 'Normal', value: '' },
  { label: 'Médio', value: '18px' },
  { label: 'Grande', value: '22px' },
  { label: 'Enorme', value: '28px' },
];

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 18,
  className,
  showWordCount = true,
}: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<ViewMode>('split');

  // ─── Histórico (undo/redo) ────────────────────────────────────────────
  // Mantemos uma pilha simples — o textarea nativo já tem undo, mas perde
  // estado quando alteramos `value` via toolbar. Esta pilha cobre o gap.
  const historyRef = useRef<{ stack: string[]; index: number; lastPush: number }>({
    stack: [value],
    index: 0,
    lastPush: Date.now(),
  });

  // Quando o valor externo muda (via toolbar/IA), agendamos snapshot
  useEffect(() => {
    const h = historyRef.current;
    const top = h.stack[h.index];
    if (top === value) return;
    // Coalesce mudanças rápidas de digitação (<600ms)
    const now = Date.now();
    if (now - h.lastPush < 600 && h.index === h.stack.length - 1) {
      h.stack[h.index] = value;
      h.lastPush = now;
      return;
    }
    // Se estávamos no meio do histórico (após undo), descarta o futuro
    h.stack = h.stack.slice(0, h.index + 1);
    h.stack.push(value);
    h.index = h.stack.length - 1;
    h.lastPush = now;
    // Limita tamanho
    if (h.stack.length > 80) {
      h.stack.shift();
      h.index = h.stack.length - 1;
    }
  }, [value]);

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (h.index > 0) {
      h.index -= 1;
      onChange(h.stack[h.index]);
    }
  }, [onChange]);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (h.index < h.stack.length - 1) {
      h.index += 1;
      onChange(h.stack[h.index]);
    }
  }, [onChange]);

  /** Envolve a seleção com um prefixo/sufixo. */
  const wrap = useCallback(
    (before: string, after: string = before, placeholder = 'texto') => {
      const ta = taRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = value.slice(start, end) || placeholder;
      const next = value.slice(0, start) + before + selected + after + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.focus();
        const cursor = start + before.length + selected.length;
        ta.setSelectionRange(cursor, cursor);
      });
    },
    [value, onChange],
  );

  /** Adiciona prefixo no início de cada linha selecionada. */
  const prefixLines = useCallback(
    (prefix: string) => {
      const ta = taRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const block = value.slice(lineStart, end);
      const replaced = block
        .split('\n')
        .map((l) => (l.trim() ? prefix + l : l))
        .join('\n');
      const next = value.slice(0, lineStart) + replaced + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => ta.focus());
    },
    [value, onChange],
  );

  const insertAtCursor = useCallback(
    (text: string) => {
      const ta = taRef.current;
      if (!ta) {
        onChange(value + text);
        return;
      }
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = value.slice(0, start) + text + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.focus();
        const cursor = start + text.length;
        ta.setSelectionRange(cursor, cursor);
      });
    },
    [value, onChange],
  );

  /** Envolve a seleção com um <div align="..."> em torno do bloco selecionado. */
  const setAlignment = useCallback(
    (align: 'left' | 'center' | 'right' | 'justify') => {
      const ta = taRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      let lineEnd = value.indexOf('\n', end);
      if (lineEnd === -1) lineEnd = value.length;
      const block = value.slice(lineStart, lineEnd);
      // Remove alinhamento prévio se houver
      const cleaned = block
        .replace(/^<div align="(?:left|center|right|justify)">\s*/i, '')
        .replace(/\s*<\/div>$/i, '');
      const wrapped = `<div align="${align}">\n\n${cleaned}\n\n</div>`;
      const next = value.slice(0, lineStart) + wrapped + value.slice(lineEnd);
      onChange(next);
      requestAnimationFrame(() => ta.focus());
    },
    [value, onChange],
  );

  const insertColor = useCallback((color: string) => {
    if (!color) {
      // Remove span de cor da seleção, se houver
      const ta = taRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const sel = value.slice(start, end);
      const cleaned = sel
        .replace(/<span style="color:[^"]+">/gi, '')
        .replace(/<\/span>/gi, '');
      const next = value.slice(0, start) + cleaned + value.slice(end);
      onChange(next);
      return;
    }
    wrap(`<span style="color:${color}">`, '</span>', 'texto');
  }, [value, onChange, wrap]);

  const insertHighlight = useCallback((color: string) => {
    wrap(`<mark style="background:${color}">`, '</mark>', 'texto');
  }, [wrap]);

  const insertFontSize = useCallback((size: string) => {
    if (!size) return;
    wrap(`<span style="font-size:${size}">`, '</span>', 'texto');
  }, [wrap]);

  /** Insere uma tabela markdown padrão (3 colunas x 2 linhas). */
  const insertTable = useCallback(() => {
    const tpl =
      '\n\n| Coluna 1 | Coluna 2 | Coluna 3 |\n' +
      '| --- | --- | --- |\n' +
      '| valor 1 | valor 2 | valor 3 |\n' +
      '| valor 4 | valor 5 | valor 6 |\n\n';
    insertAtCursor(tpl);
  }, [insertAtCursor]);

  const insertCodeBlock = useCallback(() => {
    wrap('\n```\n', '\n```\n', 'código aqui');
  }, [wrap]);

  const insertChecklist = useCallback(() => {
    prefixLines('- [ ] ');
  }, [prefixLines]);

  const clearFormatting = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) return;
    const sel = value.slice(start, end);
    const cleaned = sel
      .replace(/<\/?(?:u|mark|span|sub|sup|div|strong|em|b|i|s)\b[^>]*>/gi, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '$1')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/`([^`]+)`/g, '$1');
    const next = value.slice(0, start) + cleaned + value.slice(end);
    onChange(next);
  }, [value, onChange]);

  const insertLink = useCallback(() => {
    const url = window.prompt('Cole o link (https://...)');
    if (!url) return;
    wrap('[', `](${url})`, 'texto do link');
  }, [wrap]);

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  // ─── Imagens arrastáveis ──────────────────────────────────────────────
  const IMG_RE = /!\[[^\]]*\]\([^)]+\)/g;
  const images = useMemo(() => {
    const matches: { md: string; index: number; alt: string; url: string }[] = [];
    let m: RegExpExecArray | null;
    const re = new RegExp(IMG_RE.source, 'g');
    while ((m = re.exec(value)) !== null) {
      const md = m[0];
      const altMatch = md.match(/!\[([^\]]*)\]/);
      const urlMatch = md.match(/\(([^)]+)\)/);
      matches.push({
        md,
        index: m.index,
        alt: altMatch?.[1] ?? '',
        url: urlMatch?.[1] ?? '',
      });
    }
    return matches;
  }, [value]);

  const moveImage = useCallback((from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= images.length || to >= images.length) return;
    const src = images[from];
    const dst = images[to];
    if (!src || !dst) return;

    let next = value;
    const removeRe = new RegExp(
      src.md.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n?',
    );
    next = next.replace(removeRe, '');

    const dstIndex = next.indexOf(dst.md);
    if (dstIndex === -1) return;
    const insertAt = from < to ? dstIndex + dst.md.length : dstIndex;
    const sep = from < to ? '\n\n' : '';
    const sepEnd = from < to ? '' : '\n\n';
    next = next.slice(0, insertAt) + sep + src.md + sepEnd + next.slice(insertAt);

    onChange(next);
  }, [images, value, onChange]);

  const [dragIdx, setDragIdx] = useState<number | null>(null);

  return (
    <div className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>
      {/* Toolbar — estilo Word, em duas faixas */}
      <div className="border-b border-border bg-muted/40">
        {/* Faixa 1: Histórico, Fonte, Formatação básica, Cores */}
        <div className="flex items-center gap-0.5 px-2 py-1 flex-wrap">
          <ToolBtn title="Desfazer (Ctrl+Z)" onClick={undo}>
            <Undo2 className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Refazer (Ctrl+Y)" onClick={redo}>
            <Redo2 className="h-3.5 w-3.5" />
          </ToolBtn>
          <Sep />

          {/* Tamanho da fonte */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="sm" variant="ghost" className="h-7 px-2 gap-1" title="Tamanho do texto">
                <Type className="h-3.5 w-3.5" />
                <span className="text-[10px]">Tamanho</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover z-50">
              {FONT_SIZES.map((s) => (
                <DropdownMenuItem key={s.label} onClick={() => insertFontSize(s.value)}>
                  <span style={{ fontSize: s.value || '14px' }}>{s.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Sep />

          <ToolBtn title="Negrito (Ctrl+B)" onClick={() => wrap('**')}>
            <Bold className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Itálico (Ctrl+I)" onClick={() => wrap('*')}>
            <Italic className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Sublinhado (Ctrl+U)" onClick={() => wrap('<u>', '</u>')}>
            <Underline className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Tachado" onClick={() => wrap('~~')}>
            <Strikethrough className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Subscrito" onClick={() => wrap('<sub>', '</sub>')}>
            <Subscript className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Sobrescrito" onClick={() => wrap('<sup>', '</sup>')}>
            <Superscript className="h-3.5 w-3.5" />
          </ToolBtn>
          <Sep />

          {/* Cor do texto */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="icon" variant="ghost" className="h-7 w-7" title="Cor do texto">
                <Palette className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover z-50">
              {TEXT_COLORS.map((c) => (
                <DropdownMenuItem key={c.name} onClick={() => insertColor(c.value)}>
                  <span
                    className="inline-block h-3 w-3 rounded mr-2 border border-border"
                    style={{ background: c.value || 'transparent' }}
                  />
                  {c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Realce */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="icon" variant="ghost" className="h-7 w-7" title="Realce">
                <Highlighter className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover z-50">
              {HIGHLIGHT_COLORS.map((c) => (
                <DropdownMenuItem key={c.name} onClick={() => insertHighlight(c.value)}>
                  <span
                    className="inline-block h-3 w-3 rounded mr-2 border border-border"
                    style={{ background: c.value }}
                  />
                  {c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <ToolBtn title="Limpar formatação" onClick={clearFormatting}>
            <RemoveFormatting className="h-3.5 w-3.5" />
          </ToolBtn>

          <div className="ml-auto flex items-center gap-0.5">
            <ModeBtn active={mode === 'edit'} title="Só editor" onClick={() => setMode('edit')}>
              <Pencil className="h-3.5 w-3.5" />
            </ModeBtn>
            <ModeBtn active={mode === 'split'} title="Editor + Preview" onClick={() => setMode('split')}>
              <Columns2 className="h-3.5 w-3.5" />
            </ModeBtn>
            <ModeBtn active={mode === 'preview'} title="Só preview" onClick={() => setMode('preview')}>
              <Eye className="h-3.5 w-3.5" />
            </ModeBtn>
          </div>
        </div>

        {/* Faixa 2: Estrutura, Listas, Alinhamento, Inserção */}
        <div className="flex items-center gap-0.5 px-2 py-1 border-t border-border/60 flex-wrap">
          <ToolBtn title="Título 1" onClick={() => prefixLines('# ')}>
            <Heading1 className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Título 2" onClick={() => prefixLines('## ')}>
            <Heading2 className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Título 3" onClick={() => prefixLines('### ')}>
            <Heading3 className="h-3.5 w-3.5" />
          </ToolBtn>
          <Sep />

          <ToolBtn title="Lista com marcadores" onClick={() => prefixLines('- ')}>
            <List className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Lista numerada" onClick={() => prefixLines('1. ')}>
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Lista de tarefas" onClick={insertChecklist}>
            <CheckSquare className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Citação" onClick={() => prefixLines('> ')}>
            <Quote className="h-3.5 w-3.5" />
          </ToolBtn>
          <Sep />

          <ToolBtn title="Alinhar à esquerda" onClick={() => setAlignment('left')}>
            <AlignLeft className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Centralizar" onClick={() => setAlignment('center')}>
            <AlignCenter className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Alinhar à direita" onClick={() => setAlignment('right')}>
            <AlignRight className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Justificar" onClick={() => setAlignment('justify')}>
            <AlignJustify className="h-3.5 w-3.5" />
          </ToolBtn>
          <Sep />

          <ToolBtn title="Código inline" onClick={() => wrap('`')}>
            <Code className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Bloco de código" onClick={insertCodeBlock}>
            <Code2 className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Tabela" onClick={insertTable}>
            <TableIcon className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Link" onClick={insertLink}>
            <LinkIcon className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Linha horizontal" onClick={() => insertAtCursor('\n\n---\n\n')}>
            <Minus className="h-3.5 w-3.5" />
          </ToolBtn>
          <div className="ml-1">
            <ImageUploadButton onImageInserted={(md) => insertAtCursor('\n' + md + '\n')} />
          </div>
        </div>
      </div>

      {/* Faixa de imagens reordenáveis */}
      {images.length > 1 && (
        <div className="border-b border-border bg-muted/20 px-2 py-1.5">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
            <ImageIcon className="h-3 w-3" />
            <span>Imagens no texto · arraste para reordenar</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {images.map((img, i) => (
              <div
                key={`${img.url}-${i}`}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIdx !== null) moveImage(dragIdx, i);
                  setDragIdx(null);
                }}
                onDragEnd={() => setDragIdx(null)}
                className={cn(
                  'group flex items-center gap-1 rounded border border-border bg-card pl-1 pr-1.5 py-0.5 text-[10px] cursor-grab active:cursor-grabbing transition-opacity',
                  dragIdx === i && 'opacity-40',
                )}
                title={`Imagem ${i + 1}: ${img.alt || img.url}`}
              >
                <GripVertical className="h-3 w-3 text-muted-foreground" />
                <img
                  src={img.url}
                  alt=""
                  className="h-5 w-5 rounded object-cover pointer-events-none"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="font-mono text-foreground/80">#{i + 1}</span>
                <button
                  type="button"
                  className="ml-0.5 p-0.5 rounded hover:bg-muted disabled:opacity-30"
                  title="Mover para cima"
                  disabled={i === 0}
                  onClick={() => moveImage(i, i - 1)}
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  className="p-0.5 rounded hover:bg-muted disabled:opacity-30"
                  title="Mover para baixo"
                  disabled={i === images.length - 1}
                  onClick={() => moveImage(i, i + 1)}
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Área de edição */}
      <div className={cn('grid', mode === 'split' ? 'md:grid-cols-2' : 'grid-cols-1')}>
        {(mode === 'edit' || mode === 'split') && (
          <Textarea
            ref={taRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="rounded-none border-0 border-r-0 focus-visible:ring-0 font-mono text-xs leading-relaxed resize-none min-h-[280px]"
            onKeyDown={(e) => {
              const mod = e.metaKey || e.ctrlKey;
              if (!mod) return;
              const k = e.key.toLowerCase();
              if (k === 'b') { e.preventDefault(); wrap('**'); }
              else if (k === 'i') { e.preventDefault(); wrap('*'); }
              else if (k === 'u') { e.preventDefault(); wrap('<u>', '</u>'); }
              else if (k === 'k') { e.preventDefault(); insertLink(); }
              else if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
              else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); }
            }}
          />
        )}

        {(mode === 'preview' || mode === 'split') && (
          <div
            className={cn(
              'p-4 overflow-auto bg-background prose-sm max-w-none min-h-[280px]',
              mode === 'split' && 'border-t md:border-t-0 md:border-l border-border',
            )}
            style={{ maxHeight: '60vh' }}
          >
            {value.trim() ? (
              <ApostilaContentRenderer content={value} />
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Comece a escrever — o preview aparece aqui.
              </p>
            )}
          </div>
        )}
      </div>

      {showWordCount && (
        <div className="px-3 py-1.5 border-t border-border bg-muted/30 text-[10px] text-muted-foreground flex items-center justify-between gap-2">
          <span>
            {wordCount} {wordCount === 1 ? 'palavra' : 'palavras'} · {charCount} caracteres
          </span>
          <span className="hidden sm:inline">Ctrl+B negrito · Ctrl+I itálico · Ctrl+U sublinhado · Ctrl+K link · Ctrl+Z desfazer</span>
        </div>
      )}
    </div>
  );
}

function ToolBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      title={title}
      onClick={onClick}
      className="h-7 w-7"
    >
      {children}
    </Button>
  );
}

function ModeBtn({ children, title, active, onClick }: { children: React.ReactNode; title: string; active: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      size="icon"
      variant={active ? 'secondary' : 'ghost'}
      title={title}
      onClick={onClick}
      className="h-7 w-7"
    >
      {children}
    </Button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-border mx-0.5" />;
}
