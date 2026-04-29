/**
 * EditorTOC — sumário lateral colapsável estilo Word/Docs.
 * Clique navega até o título correspondente.
 */
import { ChevronLeft, ChevronRight, ListTree } from 'lucide-react';
import type { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { useEditorOutline } from './useEditorOutline';
import { Button } from '@/components/ui/button';

interface Props {
  editor: Editor | null;
  collapsed: boolean;
  onToggle: () => void;
}

export function EditorTOC({ editor, collapsed, onToggle }: Props) {
  const items = useEditorOutline(editor);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggle}
        title="Mostrar sumário"
        className="hidden md:flex w-7 shrink-0 items-center justify-center border-r border-border bg-muted/30 hover:bg-muted text-muted-foreground"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    );
  }

  return (
    <aside className="hidden md:flex w-56 lg:w-64 shrink-0 flex-col border-r border-border bg-muted/20">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40">
        <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
          <ListTree className="h-3.5 w-3.5" />
          Sumário
        </div>
        <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={onToggle} title="Recolher">
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {items.length === 0 ? (
          <p className="text-[11px] text-muted-foreground px-2 py-3 leading-relaxed">
            Use os títulos (H1, H2, H3) para criar a estrutura da apostila. Os títulos aparecerão aqui.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {items.map((it, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => {
                    if (!editor) return;
                    editor.chain().focus().setTextSelection(it.pos + 1).run();
                    const dom = editor.view.domAtPos(it.pos + 1).node as HTMLElement;
                    const el = dom.nodeType === 1 ? dom : dom.parentElement;
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={cn(
                    'w-full text-left text-xs rounded px-2 py-1 hover:bg-accent hover:text-accent-foreground transition-colors flex gap-2',
                    it.level === 1 && 'font-semibold',
                    it.level === 2 && 'pl-4',
                    it.level === 3 && 'pl-6 text-[11px] text-muted-foreground',
                  )}
                  title={it.text}
                >
                  <span className="font-mono text-[10px] text-primary shrink-0">{it.number}</span>
                  <span className="truncate">{it.text}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
