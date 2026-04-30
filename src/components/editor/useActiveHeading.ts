/**
 * useActiveHeading — detecta o heading "atual" no TipTap conforme o cursor se move.
 *
 * Retorna o slug (mesma fórmula do ApostilaContentRenderer) do último heading
 * encontrado antes (ou na mesma posição) do cursor. Inclui deduplicação de
 * slugs para casar com o que o renderer atribui aos ids dos <h*>.
 */
import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';

function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'secao';
}

export function useActiveHeading(editor: Editor | null): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!editor) return;

    const compute = () => {
      const cursor = editor.state.selection.from;
      const seen = new Map<string, number>();
      let currentId: string | null = null;

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name !== 'heading') return;
        if (pos > cursor) return false; // depois do cursor → para
        const text = (node.textContent || '').trim() || 'secao';
        const base = slugify(text);
        const n = (seen.get(base) || 0) + 1;
        seen.set(base, n);
        currentId = n === 1 ? base : `${base}-${n}`;
      });

      setActiveId((prev) => (prev === currentId ? prev : currentId));
    };

    compute();
    editor.on('selectionUpdate', compute);
    editor.on('update', compute);
    return () => {
      editor.off('selectionUpdate', compute);
      editor.off('update', compute);
    };
  }, [editor]);

  return activeId;
}
