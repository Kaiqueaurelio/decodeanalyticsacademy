/**
 * MarkdownEditor — Editor WYSIWYG estilo Microsoft Word / Google Docs (versão Pro).
 *
 * Arquitetura:
 *   ┌──────────────── Topbar (status, zoom, foco, imprimir) ────────────────┐
 *   │ Ribbon (Início / Inserir / Layout / Revisão)                         │
 *   ├────────┬───────────────────────────────────────────┬─────────────────┤
 *   │  TOC   │  Folha A4 (com quebras de página visuais) │   Inspector     │
 *   ├────────┴───────────────────────────────────────────┴─────────────────┤
 *   │ Status bar                                                           │
 *   └──────────────────────────────────────────────────────────────────────┘
 *
 * Recursos:
 * - Slash menu "/" para inserir blocos rápido
 * - Link bubble menu (estilo Docs) ao posicionar cursor sobre links
 * - Inspector contextual à direita (imagem, link, tabela, heading)
 * - Paginação visual com linhas de quebra A4 + impressão fiel
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
import { EditorInspector, EditorInspectorBody } from '@/components/editor/EditorInspector';
import { LinkBubbleMenu } from '@/components/editor/LinkBubbleMenu';
import { SlashCommands } from '@/components/editor/SlashMenu';
import { usePageBreaks } from '@/components/editor/usePageBreaks';
import { StudentPreview } from '@/components/editor/StudentPreview';
import { useEditorSelection } from '@/components/editor/useEditorSelection';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Eye, Pencil, ListTree, Wand2 } from 'lucide-react';

interface Props {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  showWordCount?: boolean;
  /** Callback chamado ao Ctrl+S ou clique em Salvar no ribbon. */
  onSave?: () => void;
}

const ZOOM_KEY = 'apostila-editor:zoom';
const TOC_KEY = 'apostila-editor:toc-collapsed';
const INSPECTOR_KEY = 'apostila-editor:inspector-collapsed';

// Constantes da folha A4 a 96dpi — DEVEM bater com :root no index.css
// 210mm × 297mm = 794×1123px; padding 1in = 96px (25.4mm) → conteúdo útil = 931px
const PAGE_TOP_PADDING = 96;
const PAGE_HEIGHT = 1123;
const PAGE_CONTENT_HEIGHT = 931; // 1123 - 96 - 96

export function MarkdownEditor({
  value,
  onChange,
  rows = 18,
  className,
  showWordCount = true,
  onSave,
}: Props) {
  const externalRef = useRef(value);
  const pageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [zoom, setZoomState] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    const v = parseFloat(window.localStorage.getItem(ZOOM_KEY) || '1');
    return Number.isFinite(v) && v > 0.4 && v < 2.5 ? v : 1;
  });
  const [autoFit, setAutoFit] = useState<number | null>(null);
  const [tocCollapsed, setTocCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(TOC_KEY) === '1';
  });
  const [inspectorCollapsed, setInspectorCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(INSPECTOR_KEY) === '1';
  });
  const [focusMode, setFocusMode] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);

  const setZoom = useCallback((z: number) => {
    setZoomState(z);
    try { window.localStorage.setItem(ZOOM_KEY, String(z)); } catch { /* noop */ }
  }, []);
  const toggleToc = useCallback(() => {
    setTocCollapsed((p) => {
      const n = !p;
      try { window.localStorage.setItem(TOC_KEY, n ? '1' : '0'); } catch { /* noop */ }
      return n;
    });
  }, []);
  const toggleInspector = useCallback(() => {
    setInspectorCollapsed((p) => {
      const n = !p;
      try { window.localStorage.setItem(INSPECTOR_KEY, n ? '1' : '0'); } catch { /* noop */ }
      return n;
    });
  }, []);

  /**
   * Auto-fit: em telas <1024px ajusta o zoom da folha A4 (794px) para caber
   * na largura do canvas, evitando scroll horizontal feio em mobile/tablet.
   */
  useEffect(() => {
    const computeFit = () => {
      if (typeof window === 'undefined') return;
      const w = window.innerWidth;
      if (w >= 1024) { setAutoFit(null); return; }
      const canvasW = canvasRef.current?.clientWidth ?? w;
      const available = Math.max(280, canvasW - 32);
      const fit = Math.min(1, available / 794);
      setAutoFit(Math.max(0.5, fit));
    };
    computeFit();
    window.addEventListener('resize', computeFit);
    return () => window.removeEventListener('resize', computeFit);
  }, [viewMode, focusMode]);

  const effectiveZoom = autoFit ?? zoom;

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
      SlashCommands,
    ],
    content: markdownToHtml(value),
    editorProps: {
      attributes: { class: 'focus:outline-none', spellcheck: 'true' },
      handleDrop: () => false,
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const md = htmlToMarkdown(html);
      externalRef.current = md;
      setStatus('unsaved');
      onChange(md);
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

  /**
   * Insere/atualiza imagem no editor.
   * - md preenchido + tempUrl ausente → inserção normal.
   * - md preenchido + tempUrl presente → preview otimista (insere com blob URL).
   * - md vazio + tempUrl + finalUrl → troca todas as ocorrências do blob URL
   *   pela URL pública após o upload concluir.
   */
  const insertImage = useCallback(
    (md: string, opts?: { tempUrl?: string; finalUrl?: string }) => {
      if (!editor) return;
      // Caso de troca: blob URL → URL pública
      if (opts?.tempUrl && opts.finalUrl) {
        const { tempUrl, finalUrl } = opts;
        const { state } = editor;
        const tr = state.tr;
        let changed = false;
        state.doc.descendants((node, pos) => {
          if (node.type.name === 'image' && (node.attrs.src as string) === tempUrl) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: finalUrl });
            changed = true;
          }
        });
        if (changed) editor.view.dispatch(tr);
        try { URL.revokeObjectURL(tempUrl); } catch { /* noop */ }
        return;
      }
      const m = md.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (!m) return;
      editor.chain().focus().insertContent({
        type: 'image',
        attrs: { src: m[2], alt: m[1], align: 'center' },
      }).run();
    },
    [editor],
  );

  const { breaks, totalPages } = usePageBreaks(editor, pageRef, {
    pageContentHeight: PAGE_CONTENT_HEIGHT,
    topPadding: PAGE_TOP_PADDING,
  });

  // ── Atalhos de teclado estilo Office ──────────────────────────────
  // Ctrl+S salvar · Ctrl+P imprimir · Ctrl+K link
  // (B/I/U/L/E/R/J já são tratados pelo TipTap StarterKit + extensions)
  useEffect(() => {
    if (!editor) return;
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      // Só intercepta quando o foco está dentro do editor (ou no body)
      const inside = document.activeElement?.closest('.editor-page') !== null
        || document.activeElement === document.body;
      if (!inside) return;

      if (key === 's') {
        e.preventDefault();
        onSave?.();
        setStatus('saved');
      } else if (key === 'p') {
        e.preventDefault();
        window.print();
      } else if (key === 'k') {
        e.preventDefault();
        const previous = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Endereço do link', previous || 'https://');
        if (url === null) return;
        if (url === '') editor.chain().focus().unsetLink().run();
        else editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editor, onSave]);

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

      {/* Toggle Editar / Visualizar como aluno */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-muted/40">
        <button
          type="button"
          onClick={() => setViewMode('edit')}
          className={cn(
            'inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors',
            viewMode === 'edit'
              ? 'bg-background text-foreground shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground',
          )}
          title="Editar conteúdo"
        >
          <Pencil className="h-3 w-3" /> Editar
        </button>
        <button
          type="button"
          onClick={() => setViewMode('preview')}
          className={cn(
            'inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors',
            viewMode === 'preview'
              ? 'bg-background text-primary shadow-sm border border-primary/40'
              : 'text-muted-foreground hover:text-foreground',
          )}
          title="Ver como o aluno"
        >
          <Eye className="h-3 w-3" /> Visualizar como aluno
        </button>
      </div>

      {viewMode === 'edit' && !focusMode && (
        <EditorRibbon editor={editor} onInsertImage={insertImage} onSave={onSave} saveStatus={status} />
      )}

      <div className="flex flex-1 min-h-0">
        {viewMode === 'edit' && !focusMode && (
          <EditorTOC editor={editor} collapsed={tocCollapsed} onToggle={toggleToc} />
        )}

        <div className="flex-1 flex flex-col min-w-0">
          {viewMode === 'preview' ? (
            <div
              className="flex-1 overflow-auto"
              style={{ maxHeight: '78vh', minHeight: rows ? `${rows * 26}px` : '420px' }}
            >
              <StudentPreview content={value} />
            </div>
          ) : (
            <>
              {/* Régua superior estilo Word */}
              {!focusMode && (
                <div className="word-ruler">
                  <div className="word-ruler-marks">
                    <div className="word-ruler-inner" style={{ width: `${794 * zoom}px` }} />
                  </div>
                </div>
              )}

              {/* Canvas com folha A4 + paginação. */}
              <div
                className="flex-1 overflow-auto editor-canvas relative"
                style={{ maxHeight: '78vh', minHeight: rows ? `${rows * 26}px` : '420px' }}
                onClick={() => editor.commands.focus()}
              >
                <div
                  className="px-2 sm:px-4 py-2 mx-auto"
                  style={{
                    width: `calc(${794 * zoom}px + 2rem)`,
                    minWidth: '100%',
                  }}
                >
                  <div
                    className="editor-page-shell"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div ref={pageRef} className="editor-page">
                      <EditorContent editor={editor} />
                      <LinkBubbleMenu editor={editor} />

                      {breaks.map((top, i) => (
                        <div
                          key={i}
                          className="page-break-overlay"
                          data-page={i + 2}
                          style={{ top }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {viewMode === 'edit' && !focusMode && (
          <EditorInspector
            editor={editor}
            collapsed={inspectorCollapsed}
            onToggle={toggleInspector}
          />
        )}
      </div>

      {showWordCount && (
        <div className="word-statusbar">
          <span>
            Página {totalPages > 0 ? 1 : 0} de {totalPages}  ·  {stats.words.toLocaleString('pt-BR')} palavras  ·  Português (Brasil)
          </span>
          <span className="hidden md:inline opacity-90">
            Digite <code>/</code> para inserir blocos  ·  {Math.round(zoom * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
