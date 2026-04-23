/**
 * MarkdownEditor — editor lado-a-lado (texto/preview) com toolbar tipo Word.
 *
 * Por que markdown e não rich-text WYSIWYG?
 * - O resto do app já consome o conteúdo da apostila como markdown
 *   (parser, PDF, chat, sumário). Mantemos compatibilidade total.
 * - Toolbar com botões para Negrito / Itálico / Títulos / Listas / Citação
 *   / Código / Link / Imagem permite escrever sem decorar a sintaxe.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code,
  Link as LinkIcon, Image as ImageIcon, Eye, Pencil, Columns2, Minus, GripVertical,
  ArrowUp, ArrowDown,
} from 'lucide-react';
import { ApostilaContentRenderer } from '@/components/ApostilaContentRenderer';
import { ImageUploadButton } from '@/components/ImageUploadButton';
import { cn } from '@/lib/utils';

type ViewMode = 'edit' | 'split' | 'preview';

interface Props {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  /** Mostra contador de palavras */
  showWordCount?: boolean;
}

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

  /** Envolve a seleção com um prefixo/sufixo (ex.: **bold**). */
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

  /** Adiciona prefixo no início de cada linha selecionada (ex.: "- "). */
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

  const insertLink = useCallback(() => {
    const url = window.prompt('Cole o link (https://...)');
    if (!url) return;
    wrap('[', `](${url})`, 'texto do link');
  }, [wrap]);

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  // ─── Imagens arrastáveis ──────────────────────────────────────────────
  // Detecta todas as linhas markdown contendo `![alt](url)` e permite ao admin
  // reordená-las arrastando um chip — útil quando a IA insere a imagem na
  // posição errada dentro do texto.
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

  /** Move a imagem na posição `from` para a posição `to` dentro do texto markdown. */
  const moveImage = useCallback((from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= images.length || to >= images.length) return;
    // Reconstrói o texto removendo a imagem da origem e inserindo no destino
    // baseado na ordem atual (`images` está em ordem de aparição).
    const src = images[from];
    const dst = images[to];
    if (!src || !dst) return;

    let next = value;
    // 1. Remove a imagem de origem (e quebra de linha trailing se houver)
    const removeRe = new RegExp(
      src.md.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n?',
    );
    next = next.replace(removeRe, '');

    // 2. Recalcula a posição do destino no texto modificado
    //    (procurando a ocorrência da imagem-destino).
    const dstIndex = next.indexOf(dst.md);
    if (dstIndex === -1) return;
    // Se mover para baixo (from < to), inserir DEPOIS do destino;
    // se mover para cima (from > to), inserir ANTES do destino.
    const insertAt = from < to ? dstIndex + dst.md.length : dstIndex;
    const sep = from < to ? '\n\n' : '';
    const sepEnd = from < to ? '' : '\n\n';
    next = next.slice(0, insertAt) + sep + src.md + sepEnd + next.slice(insertAt);

    onChange(next);
  }, [images, value, onChange]);

  const [dragIdx, setDragIdx] = useState<number | null>(null);

  return (
    <div className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>
      {/* Toolbar — estilo Word */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/40 flex-wrap">
        <ToolBtn title="Negrito (Ctrl+B)" onClick={() => wrap('**')}>
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn title="Itálico (Ctrl+I)" onClick={() => wrap('*')}>
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <Sep />
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
        <ToolBtn title="Citação" onClick={() => prefixLines('> ')}>
          <Quote className="h-3.5 w-3.5" />
        </ToolBtn>
        <Sep />
        <ToolBtn title="Código inline" onClick={() => wrap('`')}>
          <Code className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn title="Link" onClick={insertLink}>
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn title="Linha horizontal" onClick={() => insertAtCursor('\n\n---\n\n')}>
          <Minus className="h-3.5 w-3.5" />
        </ToolBtn>
        <div className="ml-1">
          {/* Reaproveita o uploader de imagem existente */}
          <ImageUploadButton onImageInserted={(md) => insertAtCursor('\n' + md + '\n')} />
        </div>

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
              if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                wrap('**');
              } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
                e.preventDefault();
                wrap('*');
              }
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
        <div className="px-3 py-1.5 border-t border-border bg-muted/30 text-[10px] text-muted-foreground flex items-center justify-between">
          <span>{wordCount} {wordCount === 1 ? 'palavra' : 'palavras'}</span>
          <span className="hidden sm:inline">Markdown · negrito **assim**, título # assim</span>
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
