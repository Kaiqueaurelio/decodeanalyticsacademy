/**
 * SlashMenu — extensão TipTap que abre um menu de inserção rápida ao digitar "/"
 * (estilo Notion / Docs). Suporta busca e teclado (↑ ↓ Enter Esc).
 */
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy, { type Instance, type GetReferenceClientRect } from 'tippy.js';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import type { Editor, Range } from '@tiptap/core';
import {
  Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code2, Image as ImageIcon,
  Table as TableIcon, Minus, CheckSquare, Pilcrow, type LucideIcon,
} from 'lucide-react';

export interface SlashItem {
  title: string;
  description: string;
  icon: LucideIcon;
  keywords: string[];
  command: (props: { editor: Editor; range: Range }) => void;
}

const items: SlashItem[] = [
  {
    title: 'Texto',
    description: 'Parágrafo simples',
    icon: Pilcrow,
    keywords: ['paragrafo', 'p', 'texto', 'normal'],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: 'Título 1',
    description: 'Título principal',
    icon: Heading1,
    keywords: ['h1', 'titulo', 'heading'],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Título 2',
    description: 'Subseção',
    icon: Heading2,
    keywords: ['h2', 'subtitulo', 'heading'],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Título 3',
    description: 'Sub-subseção',
    icon: Heading3,
    keywords: ['h3', 'heading'],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'Lista com marcadores',
    description: 'Lista não ordenada',
    icon: List,
    keywords: ['lista', 'bullet', 'ul'],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: 'Lista numerada',
    description: '1. 2. 3.',
    icon: ListOrdered,
    keywords: ['lista', 'numero', 'ol', 'numerada'],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: 'Lista de tarefas',
    description: 'Checkboxes',
    icon: CheckSquare,
    keywords: ['todo', 'tarefa', 'checkbox', 'check'],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: 'Citação',
    description: 'Bloco de citação',
    icon: Quote,
    keywords: ['quote', 'citacao'],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: 'Bloco de código',
    description: 'Código com formatação',
    icon: Code2,
    keywords: ['code', 'codigo', 'pre'],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: 'Tabela 3×3',
    description: 'Inserir tabela com cabeçalho',
    icon: TableIcon,
    keywords: ['table', 'tabela', 'grid'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: 'Imagem',
    description: 'Inserir imagem por URL',
    icon: ImageIcon,
    keywords: ['imagem', 'img', 'foto', 'picture'],
    command: ({ editor, range }) => {
      const url = window.prompt('URL da imagem');
      if (!url) return;
      editor.chain().focus().deleteRange(range).insertContent({
        type: 'image',
        attrs: { src: url, alt: '', align: 'center' },
      }).run();
    },
  },
  {
    title: 'Linha horizontal',
    description: 'Divisória',
    icon: Minus,
    keywords: ['hr', 'divisor', 'linha', 'separador'],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
];

interface MenuProps {
  items: SlashItem[];
  command: (item: SlashItem) => void;
}
interface MenuRef { onKeyDown: (props: { event: KeyboardEvent }) => boolean }

export const SlashMenuList = forwardRef<MenuRef, MenuProps>(({ items, command }, ref) => {
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setIndex((i) => (i + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setIndex((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        const item = items[index];
        if (item) command(item);
        return true;
      }
      return false;
    },
  }), [items, index, command]);

  return (
    <div className="z-50 max-h-72 w-72 overflow-auto rounded-lg border border-border bg-popover shadow-xl p-1">
      {items.length === 0 ? (
        <div className="px-3 py-2 text-xs text-muted-foreground">Nenhum bloco encontrado</div>
      ) : (
        items.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              onMouseEnter={() => setIndex(i)}
              onClick={() => command(item)}
              className={
                'w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs ' +
                (i === index ? 'bg-accent text-accent-foreground' : 'hover:bg-muted')
              }
            >
              <span className="h-7 w-7 grid place-items-center rounded border border-border bg-background shrink-0">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="font-medium truncate">{item.title}</span>
                <span className="text-[10px] text-muted-foreground truncate">{item.description}</span>
              </span>
            </button>
          );
        })
      )}
    </div>
  );
});
SlashMenuList.displayName = 'SlashMenuList';

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        allowSpaces: false,
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: SlashItem }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => {
          const q = query.toLowerCase().trim();
          if (!q) return items.slice(0, 10);
          return items
            .filter((it) =>
              it.title.toLowerCase().includes(q) ||
              it.keywords.some((k) => k.includes(q)),
            )
            .slice(0, 10);
        },
        render: () => {
          let component: ReactRenderer<MenuRef, MenuProps> | null = null;
          let popup: Instance[] | null = null;

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashMenuList, {
                props: { items: props.items as SlashItem[], command: props.command as (i: SlashItem) => void },
                editor: props.editor,
              });
              if (!props.clientRect) return;
              popup = tippy('body', {
                getReferenceClientRect: props.clientRect as GetReferenceClientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },
            onUpdate: (props) => {
              component?.updateProps({
                items: props.items as SlashItem[],
                command: props.command as (i: SlashItem) => void,
              });
              if (props.clientRect && popup) {
                popup[0].setProps({ getReferenceClientRect: props.clientRect as GetReferenceClientRect });
              }
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                popup?.[0].hide();
                return true;
              }
              return component?.ref?.onKeyDown({ event: props.event }) || false;
            },
            onExit: () => {
              popup?.[0].destroy();
              component?.destroy();
              popup = null;
              component = null;
            },
          };
        },
      }),
    ];
  },
});
