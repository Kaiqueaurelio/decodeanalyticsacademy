/**
 * useEditorOutline — extrai sumário hierárquico (H1/H2/H3) do TipTap em tempo real,
 * com numeração 1.1.1 automática e posição do nó para scroll/foco.
 */
import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';

export interface OutlineItem {
  level: 1 | 2 | 3;
  text: string;
  pos: number;
  number: string; // "1.2.1"
}

export function useEditorOutline(editor: Editor | null): OutlineItem[] {
  const [items, setItems] = useState<OutlineItem[]>([]);

  useEffect(() => {
    if (!editor) return;
    const compute = () => {
      const out: OutlineItem[] = [];
      const counters = [0, 0, 0];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          const level = Math.min(Math.max(node.attrs.level || 1, 1), 3) as 1 | 2 | 3;
          counters[level - 1] += 1;
          for (let i = level; i < 3; i++) counters[i] = 0;
          const number = counters.slice(0, level).join('.');
          out.push({ level, text: node.textContent || '(sem título)', pos, number });
        }
      });
      setItems(out);
    };
    compute();
    editor.on('update', compute);
    editor.on('selectionUpdate', compute);
    return () => {
      editor.off('update', compute);
      editor.off('selectionUpdate', compute);
    };
  }, [editor]);

  return items;
}
