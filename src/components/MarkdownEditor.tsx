/**
 * MarkdownEditor — Editor WYSIWYG estilo Microsoft Word / Google Docs (versão Pro).
 *
 * Arquitetura em 5 zonas:
 *   ┌──────────────── Topbar (status, zoom, foco, imprimir) ────────────────┐
 *   │ Ribbon com abas (Início / Inserir / Layout / Revisão)                 │
 *   ├──────┬─────────────────────────────────────────────────────────────────┤
 *   │ TOC  │  Página A4 branca, centralizada (folha estilo Word)             │
 *   ├──────┴─────────────────────────────────────────────────────────────────┤
 *   │ Status bar (palavras, caracteres, dicas)                               │
 *   └────────────────────────────────────────────────────────────────────────┘
 *
 * - Persistência continua em Markdown (compatível com renderer do aluno e PDF).
 * - HTML rico só vive em memória.
 * - Imagens, tabelas, listas, links, cor, realce, sub/sup, código — tudo WYSIWYG.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';

import { cn } from '@/lib/utils';
import { ResizableImage } from '@/components/editor/ResizableImage';
import { markdownToHtml, htmlToMarkdown } from '@/lib/markdown-html';
import { EditorTopbar, type SaveStatus } from '@/components/editor/EditorTopbar';
import { EditorRibbon } from '@/components/editor/EditorRibbon';
import { EditorTOC } from '@/components/editor/EditorTOC';

interface Props {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  showWordCount?: boolean;
}

const ZOOM_KEY = 'apostila-editor:zoom';
const TOC_KEY = 'apostila-editor:toc-collapsed';

export function MarkdownEditor({
  value,
  onChange,
  rows = 18,
  className,
  showWordCount = true,
}: Props) {
  const externalRef = useRef(value);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [zoom, setZoomState] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    const v = parseFloat(window.localStorage.getItem(ZOOM_KEY) || '1');
    return Number.isFinite(v) && v > 0.4 && v < 2.5 ? v : 1;
  });
  const [tocCollapsed, setTocCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(TOC_KEY) === '1';
  });
  const [focusMode, setFocusMode] = useState(false);

  const setZoom = useCallback((z: number) => {
    setZoomState(z);
    try { window.localStorage.setItem(ZOOM_KEY, String(z)); } catch { /* noop */ }
  }, []);

  const toggleToc = useCallback(() => {
    setTocCollapsed((prev) => {
      const next = !prev;
      try { window.localStorage.setItem(TOC_KEY, next ? '1' : '0'); } catch { /* noop */ }
      return next;
    });
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'rounded bg-muted p-3 font-mono text-sm' } },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { class: 'text-primary underline' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Subscript,
      Superscript,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      ResizableImage,
    ],
    content: markdownToHtml(value),
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
        spellcheck: 'true',
      },
      handleDrop: () => false,
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const md = htmlToMarkdown(html);
      externalRef.current = md;
      setStatus('unsaved');
      onChange(md);
      // Marca como salvo após pequeno debounce visual (a persistência real é feita pelo pai)
      window.clearTimeout((window as unknown as { __apsTimer?: number }).__apsTimer);
      (window as unknown as { __apsTimer?: number }).__apsTimer = window.setTimeout(
        () => setStatus('saved'),
        800,
      );
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value === externalRef.current) return;
    externalRef.current = value;
    const html = markdownToHtml(value);
    if (html !== editor.getHTML()) {
      editor.commands.setContent(html, { emitUpdate: false });
    }
  }, [value, editor]);

  const stats = useMemo(() => {
    const text = editor?.getText() || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.round(words / 200));
    return { words, chars: text.length, minutes };
  }, [editor, value]);

  const insertImage = useCallback(
    (md: string) => {
      const m = md.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (!m || !editor) return;
      editor.chain().focus().insertContent({
        type: 'image',
        attrs: { src: m[2], alt: m[1], align: 'center' },
      }).run();
    },
    [editor],
  );

  if (!editor) {
    return (
      <div className={cn('rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground', className)}>
        Carregando editor…
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border border-border bg-card overflow-hidden flex flex-col', className)}>
      <EditorTopbar
        words={stats.words}
        zoom={zoom}
        setZoom={setZoom}
        status={status}
        focusMode={focusMode}
        onToggleFocus={() => setFocusMode((f) => !f)}
      />

      {!focusMode && <EditorRibbon editor={editor} onInsertImage={insertImage} />}

      <div className="flex flex-1 min-h-0">
        {!focusMode && (
          <EditorTOC editor={editor} collapsed={tocCollapsed} onToggle={toggleToc} />
        )}

        {/* Canvas com folha A4 */}
        <div
          className="flex-1 overflow-auto editor-canvas"
          style={{ maxHeight: '78vh', minHeight: rows ? `${rows * 26}px` : '420px' }}
          onClick={() => editor.commands.focus()}
        >
          <div className="px-2 sm:px-4">
            <div
              className="editor-page"
              style={{
                transform: `scale(${zoom})`,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>

      {showWordCount && (
        <div className="px-3 py-1.5 border-t border-border bg-muted/30 text-[10px] text-muted-foreground flex items-center justify-between gap-2">
          <span>
            {stats.words.toLocaleString('pt-BR')} {stats.words === 1 ? 'palavra' : 'palavras'} ·{' '}
            {stats.chars.toLocaleString('pt-BR')} caracteres · leitura ~{stats.minutes} min
          </span>
          <span className="hidden md:inline">
            Ctrl+B negrito · Ctrl+I itálico · Ctrl+U sublinhado · Clique numa imagem para alinhar / redimensionar
          </span>
        </div>
      )}
    </div>
  );
}
