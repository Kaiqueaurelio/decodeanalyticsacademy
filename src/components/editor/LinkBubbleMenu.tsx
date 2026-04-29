/**
 * LinkBubbleMenu — toolbar flutuante que aparece ao posicionar o cursor sobre
 * um link (estilo Google Docs). Permite editar URL, abrir em nova aba e remover.
 */
import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { ExternalLink, Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isValidUrl, normalizeUrl } from './link-utils';

interface Props { editor: Editor | null }

export function LinkBubbleMenu({ editor }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState('');
  const [href, setHref] = useState('');

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      if (!editor.isActive('link')) {
        setPos(null);
        setEditing(false);
        return;
      }
      const attrs = editor.getAttributes('link');
      setHref(attrs.href || '');
      setUrl((prev) => (editing ? prev : attrs.href || ''));

      // Posiciona perto do link selecionado
      const { from, to } = editor.state.selection;
      const start = editor.view.coordsAtPos(from);
      const end = editor.view.coordsAtPos(to);
      const editorRect = editor.view.dom.getBoundingClientRect();
      const top = start.bottom - editorRect.top + 6;
      const left = (start.left + end.right) / 2 - editorRect.left;
      setPos({ top, left });
    };

    editor.on('selectionUpdate', update);
    editor.on('transaction', update);
    update();
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor, editing]);

  if (!editor || !pos) return null;

  const valid = !url || isValidUrl(url);

  const save = () => {
    if (!valid || !url) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href: normalizeUrl(url), target: '_blank' }).run();
    setEditing(false);
  };

  return (
    <div
      ref={ref}
      contentEditable={false}
      className="absolute z-30 -translate-x-1/2 flex items-center gap-1 rounded-md border border-border bg-popover shadow-lg px-1.5 py-1 text-xs"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {editing ? (
        <>
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); save(); }
              if (e.key === 'Escape') { e.preventDefault(); setEditing(false); }
            }}
            placeholder="https://exemplo.com"
            className={cn(
              'h-7 w-56 px-2 rounded border bg-background outline-none',
              valid ? 'border-border focus:border-primary' : 'border-destructive',
            )}
          />
          <button
            type="button"
            disabled={!valid || !url}
            onClick={save}
            title="Salvar (Enter)"
            className="h-7 w-7 grid place-items-center rounded hover:bg-muted disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5 text-primary" />
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            title="Cancelar (Esc)"
            className="h-7 w-7 grid place-items-center rounded hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 max-w-[220px] truncate text-primary hover:underline"
            title={href}
          >
            {href || '(sem URL)'}
          </a>
          <div className="w-px h-4 bg-border mx-0.5" />
          <button
            type="button"
            onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
            title="Abrir em nova aba"
            className="h-7 w-7 grid place-items-center rounded hover:bg-muted"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => { setUrl(href); setEditing(true); }}
            title="Editar"
            className="h-7 w-7 grid place-items-center rounded hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}
            title="Remover link"
            className="h-7 w-7 grid place-items-center rounded hover:bg-destructive/10 text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
