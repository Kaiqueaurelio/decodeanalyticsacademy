/**
 * useEditorSelection — observa o que está selecionado no TipTap e devolve
 * um descritor tipado: imagem, link, tabela, heading, paragraph ou nada.
 * Usado pelo Inspector lateral para mostrar controles contextuais.
 */
import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';

export type SelectionInfo =
  | { type: 'image'; attrs: { src?: string; alt?: string; width?: string | null; align?: 'left' | 'center' | 'right' } }
  | { type: 'link'; attrs: { href?: string; target?: string }; text: string }
  | { type: 'table' }
  | { type: 'heading'; level: 1 | 2 | 3 }
  | { type: 'paragraph' }
  | { type: 'none' };

export function useEditorSelection(editor: Editor | null): SelectionInfo {
  const [info, setInfo] = useState<SelectionInfo>({ type: 'none' });

  useEffect(() => {
    if (!editor) return;

    const compute = () => {
      if (editor.isActive('image')) {
        const a = editor.getAttributes('image');
        setInfo({
          type: 'image',
          attrs: { src: a.src, alt: a.alt, width: a.width ?? null, align: (a.align as 'left' | 'center' | 'right') || 'center' },
        });
        return;
      }
      if (editor.isActive('link')) {
        const a = editor.getAttributes('link');
        const { from, to } = editor.state.selection;
        const text = editor.state.doc.textBetween(from, to, ' ');
        setInfo({ type: 'link', attrs: { href: a.href, target: a.target }, text });
        return;
      }
      if (editor.isActive('table')) {
        setInfo({ type: 'table' });
        return;
      }
      if (editor.isActive('heading')) {
        const a = editor.getAttributes('heading');
        setInfo({ type: 'heading', level: (a.level as 1 | 2 | 3) || 1 });
        return;
      }
      if (editor.isActive('paragraph')) {
        setInfo({ type: 'paragraph' });
        return;
      }
      setInfo({ type: 'none' });
    };

    compute();
    editor.on('selectionUpdate', compute);
    editor.on('transaction', compute);
    return () => {
      editor.off('selectionUpdate', compute);
      editor.off('transaction', compute);
    };
  }, [editor]);

  return info;
}
