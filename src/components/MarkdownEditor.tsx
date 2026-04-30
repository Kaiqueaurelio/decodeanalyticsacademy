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
import { useEditorOutline } from '@/components/editor/useEditorOutline';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Eye, Pencil, ListTree, Wand2, Columns2 } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
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
      // Em desktop largo sem split, deixa o usuário controlar o zoom
      if (w >= 1024 && viewMode !== 'split') { setAutoFit(null); return; }
      const canvasW = canvasRef.current?.clientWidth ?? w;
      // No modo split, o canvas já ocupa metade — usa essa largura
      const available = Math.max(280, canvasW - 24);
      const fit = Math.min(1, available / 794);
      setAutoFit(Math.max(0.45, fit));
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

      {/* Toggle Editar / Split / Visualizar como aluno */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-muted/40 overflow-x-auto">
        <button
          type="button"
          onClick={() => setViewMode('edit')}
          className={cn(
            'inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors shrink-0',
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
          onClick={() => setViewMode('split')}
          className={cn(
            'hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors shrink-0',
            viewMode === 'split'
              ? 'bg-background text-primary shadow-sm border border-primary/40'
              : 'text-muted-foreground hover:text-foreground',
          )}
          title="Editar e visualizar lado a lado"
        >
          <Columns2 className="h-3 w-3" /> Lado a lado
        </button>
        <button
          type="button"
          onClick={() => setViewMode('preview')}
          className={cn(
            'inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors shrink-0',
            viewMode === 'preview'
              ? 'bg-background text-primary shadow-sm border border-primary/40'
              : 'text-muted-foreground hover:text-foreground',
          )}
          title="Ver como o aluno"
        >
          <Eye className="h-3 w-3" /> Visualizar como aluno
        </button>
      </div>

      {(viewMode === 'edit' || viewMode === 'split') && !focusMode && (
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
              style={{ maxHeight: 'calc(100vh - 220px)', minHeight: rows ? `${rows * 26}px` : '520px' }}
            >
              <StudentPreview content={value} />
            </div>
          ) : (
            <>
              {/* Régua superior estilo Word — escondida em <1024px via CSS */}
              {!focusMode && viewMode === 'edit' && (
                <div className="word-ruler">
                  <div className="word-ruler-marks">
                    <div className="word-ruler-inner" style={{ width: `${794 * effectiveZoom}px` }} />
                  </div>
                </div>
              )}

              {/* Wrapper: split coloca editor + preview lado a lado */}
              <div className={cn(
                'flex flex-1 min-h-0',
                viewMode === 'split' ? 'flex-col sm:flex-row' : 'flex-col',
              )}>
                {/* Canvas com folha A4 + paginação. */}
                <div
                  ref={canvasRef}
                  className={cn(
                    'flex-1 overflow-auto editor-canvas relative min-w-0',
                    viewMode === 'split' && 'sm:border-r border-border',
                  )}
                  style={{
                    maxHeight: viewMode === 'split' ? 'calc(100vh - 260px)' : 'calc(100vh - 220px)',
                    minHeight: rows ? `${rows * 26}px` : '520px',
                  }}
                  onClick={() => editor.commands.focus()}
                >
                  <div
                    className="px-2 sm:px-4 py-2 mx-auto"
                    style={{
                      // Em mobile/tablet/split, usa largura escalada para evitar scroll horizontal
                      width: autoFit !== null ? '100%' : `calc(${794 * effectiveZoom}px + 2rem)`,
                      minWidth: '100%',
                    }}
                  >
                    <div
                      className="editor-page-shell mx-auto"
                      style={{
                        transform: `scale(${effectiveZoom})`,
                        transformOrigin: 'top center',
                      }}
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

                  {/* FAB mobile/tablet: abre Sumário e Inspector via Sheet */}
                  {viewMode === 'edit' && !focusMode && (
                    <div className="lg:hidden fixed bottom-20 right-4 z-30 flex flex-col gap-2">
                      <Sheet open={mobileTocOpen} onOpenChange={setMobileTocOpen}>
                        <SheetTrigger asChild>
                          <button
                            type="button"
                            className="h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
                            title="Sumário"
                            aria-label="Abrir sumário"
                          >
                            <ListTree className="h-5 w-5" />
                          </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72 p-0 flex flex-col">
                          <SheetHeader className="px-4 py-3 border-b">
                            <SheetTitle className="text-sm flex items-center gap-2">
                              <ListTree className="h-4 w-4" /> Sumário
                            </SheetTitle>
                          </SheetHeader>
                          <div className="flex-1 overflow-auto">
                            <MobileToc editor={editor} onNavigate={() => setMobileTocOpen(false)} />
                          </div>
                        </SheetContent>
                      </Sheet>

                      <Sheet open={mobileInspectorOpen} onOpenChange={setMobileInspectorOpen}>
                        <SheetTrigger asChild>
                          <button
                            type="button"
                            className="h-11 w-11 rounded-full bg-card border border-border text-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
                            title="Inspector"
                            aria-label="Abrir inspector"
                          >
                            <Wand2 className="h-5 w-5" />
                          </button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-80 p-0 flex flex-col">
                          <SheetHeader className="px-4 py-3 border-b">
                            <SheetTitle className="text-sm flex items-center gap-2">
                              <Wand2 className="h-4 w-4" /> Inspector
                            </SheetTitle>
                          </SheetHeader>
                          <div className="flex-1 overflow-auto p-3 space-y-4">
                            <MobileInspector editor={editor} stats={stats} />
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  )}
                </div>

                {/* Painel de preview ao vivo no modo split */}
                {viewMode === 'split' && (
                  <div
                    className="flex-1 overflow-auto bg-background min-w-0 border-t sm:border-t-0 border-border"
                    style={{
                      maxHeight: 'calc(100vh - 260px)',
                      minHeight: '320px',
                    }}
                    aria-label="Pré-visualização ao vivo"
                  >
                    <div className="sticky top-0 z-10 px-3 py-1.5 text-[11px] font-medium text-muted-foreground bg-muted/70 backdrop-blur border-b border-border flex items-center gap-1.5">
                      <Eye className="h-3 w-3" /> Pré-visualização ao vivo
                    </div>
                    <StudentPreview content={value} />
                  </div>
                )}
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
          <span className="truncate">
            Pág. {totalPages > 0 ? 1 : 0}/{totalPages} · {stats.words.toLocaleString('pt-BR')} palavras
          </span>
          <span className="hidden md:inline opacity-90">
            Digite <code>/</code> para inserir blocos · {Math.round(effectiveZoom * 100)}%
            {autoFit !== null && <span className="ml-1 opacity-75">(auto)</span>}
          </span>
        </div>
      )}
    </div>
  );
}

/** Sumário mobile (renderiza dentro de Sheet). */
function MobileToc({ editor, onNavigate }: { editor: any; onNavigate: () => void }) {
  const items = useEditorOutline(editor);
  if (!items.length) {
    return (
      <p className="text-xs text-muted-foreground p-4 leading-relaxed">
        Use os títulos (H1, H2, H3) para criar a estrutura. Eles aparecerão aqui.
      </p>
    );
  }
  return (
    <ul className="p-2 space-y-0.5">
      {items.map((it, i) => (
        <li key={i}>
          <button
            type="button"
            onClick={() => {
              if (!editor) return;
              editor.chain().focus().setTextSelection(it.pos + 1).run();
              const dom = editor.view.domAtPos(it.pos + 1).node as HTMLElement;
              const el = dom?.nodeType === 1 ? dom : dom?.parentElement;
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              onNavigate();
            }}
            className={cn(
              'w-full text-left text-xs rounded px-2 py-1.5 hover:bg-accent flex gap-2',
              it.level === 1 && 'font-semibold',
              it.level === 2 && 'pl-4',
              it.level === 3 && 'pl-6 text-[11px] text-muted-foreground',
            )}
          >
            <span className="font-mono text-[10px] text-primary shrink-0">{it.number}</span>
            <span className="truncate">{it.text}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Inspector mobile (renderiza dentro de Sheet). */
function MobileInspector({ editor, stats }: { editor: any; stats: { words: number; chars: number; minutes: number } }) {
  const sel = useEditorSelection(editor);
  return <EditorInspectorBody editor={editor} stats={stats} sel={sel} />;
}
