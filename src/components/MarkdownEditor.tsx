/**
 * MarkdownEditor — Editor WYSIWYG estilo Microsoft Word / Google Docs
 * baseado em TipTap. Mantém API compatível (value/onChange) com o componente
 * antigo: recebe e devolve Markdown, mas internamente trabalha em HTML rico.
 *
 * Recursos principais:
 *  - Imagens com preview real, drag-to-reorder no documento, redimensionar
 *    com handle, alinhar (esquerda/centro/direita) — igual Word
 *  - Toolbar dupla com formatação completa
 *  - Tabelas, listas, checkboxes, código, citação
 *  - Cor do texto, realce, tamanho de fonte, sublinhado, tachado, sub/sup
 *  - Atalhos: Ctrl+B/I/U, Ctrl+K (link), Ctrl+Z/Y (undo/redo)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
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

import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Code2,
  Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo2, Redo2, Highlighter, Palette, Table as TableIcon,
  Subscript as SubIcon, Superscript as SupIcon, CheckSquare,
  RemoveFormatting, Minus, Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageUploadButton } from '@/components/ImageUploadButton';
import { ResizableImage } from '@/components/editor/ResizableImage';
import { markdownToHtml, htmlToMarkdown } from '@/lib/markdown-html';

interface Props {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  showWordCount?: boolean;
}

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

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Comece a escrever sua apostila…',
  rows = 18,
  className,
  showWordCount = true,
}: Props) {
  // Evita loop: só atualizamos o externo quando a edição partiu daqui.
  const externalRef = useRef(value);

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
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
          'min-h-[400px] px-6 sm:px-12 py-8 bg-background',
          'prose-headings:font-semibold prose-headings:text-foreground',
          'prose-p:my-2 prose-p:leading-relaxed',
          'prose-img:my-3 prose-img:rounded-sm',
          'prose-table:border prose-th:bg-muted prose-th:p-2 prose-td:p-2 prose-td:border prose-th:border',
        ),
        spellcheck: 'true',
      },
      handleDrop: () => false, // deixa o TipTap padrão lidar (drag de imagem dentro do doc)
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const md = htmlToMarkdown(html);
      externalRef.current = md;
      onChange(md);
    },
  });

  // Sincroniza quando o value externo muda (ex: IA preenche, reset, carregar nova apostila)
  useEffect(() => {
    if (!editor) return;
    if (value === externalRef.current) return;
    externalRef.current = value;
    const html = markdownToHtml(value);
    if (html !== editor.getHTML()) {
      editor.commands.setContent(html, { emitUpdate: false });
    }
  }, [value, editor]);

  // Word count
  const stats = useMemo(() => {
    const text = editor?.getText() || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return { words, chars: text.length };
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

  const insertLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL do link', previous || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  }, [editor]);

  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className={cn('rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground', className)}>
        Carregando editor…
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border border-border bg-card overflow-hidden flex flex-col', className)}>
      {/* Toolbar — duas faixas estilo Word */}
      <div className="border-b border-border bg-muted/40 sticky top-0 z-20">
        {/* Faixa 1 */}
        <div className="flex items-center gap-0.5 px-2 py-1 flex-wrap">
          <ToolBtn title="Desfazer (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo2 className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Refazer (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo2 className="h-3.5 w-3.5" />
          </ToolBtn>
          <Sep />

          {/* Estilo */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="sm" variant="ghost" className="h-7 px-2 gap-1" title="Estilo do parágrafo">
                <Type className="h-3.5 w-3.5" />
                <span className="text-[10px]">Estilo</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover z-50">
              <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
                Texto normal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                <Heading1 className="h-3.5 w-3.5 mr-2" /> Título 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <Heading2 className="h-3.5 w-3.5 mr-2" /> Título 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                <Heading3 className="h-3.5 w-3.5 mr-2" /> Título 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Sep />

          <ToolBtn title="Negrito (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Itálico (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Sublinhado (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Tachado" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Subscrito" active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()}>
            <SubIcon className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Sobrescrito" active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
            <SupIcon className="h-3.5 w-3.5" />
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
                <DropdownMenuItem
                  key={c.name}
                  onClick={() =>
                    c.value
                      ? editor.chain().focus().setColor(c.value).run()
                      : editor.chain().focus().unsetColor().run()
                  }
                >
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
              <DropdownMenuItem onClick={() => editor.chain().focus().unsetHighlight().run()}>
                Sem realce
              </DropdownMenuItem>
              {HIGHLIGHT_COLORS.map((c) => (
                <DropdownMenuItem
                  key={c.name}
                  onClick={() => editor.chain().focus().toggleHighlight({ color: c.value }).run()}
                >
                  <span
                    className="inline-block h-3 w-3 rounded mr-2 border border-border"
                    style={{ background: c.value }}
                  />
                  {c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <ToolBtn title="Limpar formatação" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
            <RemoveFormatting className="h-3.5 w-3.5" />
          </ToolBtn>
        </div>

        {/* Faixa 2 */}
        <div className="flex items-center gap-0.5 px-2 py-1 border-t border-border/60 flex-wrap">
          <ToolBtn title="Lista com marcadores" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Lista numerada" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Lista de tarefas" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}>
            <CheckSquare className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Citação" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="h-3.5 w-3.5" />
          </ToolBtn>
          <Sep />

          <ToolBtn title="Alinhar à esquerda" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
            <AlignLeft className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Centralizar" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
            <AlignCenter className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Alinhar à direita" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
            <AlignRight className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Justificar" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
            <AlignJustify className="h-3.5 w-3.5" />
          </ToolBtn>
          <Sep />

          <ToolBtn title="Código inline" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Bloco de código" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <Code2 className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Tabela" onClick={insertTable}>
            <TableIcon className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Link (Ctrl+K)" active={editor.isActive('link')} onClick={insertLink}>
            <LinkIcon className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Linha horizontal" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus className="h-3.5 w-3.5" />
          </ToolBtn>
          <div className="ml-1">
            <ImageUploadButton onImageInserted={insertImage} />
          </div>
        </div>
      </div>

      {/* Folha de edição estilo Word/Docs */}
      <div
        className="overflow-auto bg-muted/20"
        style={{ maxHeight: '70vh', minHeight: rows ? `${rows * 24}px` : '400px' }}
        onClick={() => editor.commands.focus()}
      >
        <div className="mx-auto my-4 max-w-[820px] shadow-md ring-1 ring-border bg-background">
          <EditorContent editor={editor} />
        </div>
      </div>

      {showWordCount && (
        <div className="px-3 py-1.5 border-t border-border bg-muted/30 text-[10px] text-muted-foreground flex items-center justify-between gap-2">
          <span>
            {stats.words} {stats.words === 1 ? 'palavra' : 'palavras'} · {stats.chars} caracteres
          </span>
          <span className="hidden sm:inline">
            Ctrl+B negrito · Ctrl+I itálico · Ctrl+U sublinhado · Clique numa imagem para alinhar / redimensionar
          </span>
        </div>
      )}
    </div>
  );
}

function ToolBtn({
  children, title, onClick, active, disabled,
}: { children: React.ReactNode; title: string; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return (
    <Button
      type="button"
      size="icon"
      variant={active ? 'secondary' : 'ghost'}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn('h-7 w-7', active && 'text-primary')}
    >
      {children}
    </Button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-border mx-0.5" />;
}
