/**
 * usePageBreaks — calcula posições verticais (em px, no espaço da própria
 * .editor-page sem zoom) onde a folha A4 deve ser dividida em páginas.
 *
 * O overlay é renderizado DENTRO do .editor-page-shell, então escala com
 * o zoom automaticamente (transform aplicado no shell). Os valores devolvidos
 * são offsets relativos ao topo da .editor-page.
 */
import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';

interface Options {
  /** Altura útil de uma página (descontando padding superior+inferior). px. */
  pageContentHeight: number;
  /** Padding interno superior da .editor-page. px. */
  topPadding: number;
}

export function usePageBreaks(
  editor: Editor | null,
  pageRef: React.RefObject<HTMLElement>,
  { pageContentHeight, topPadding }: Options,
) {
  const [breaks, setBreaks] = useState<number[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!editor || !pageRef.current) return;

    const compute = () => {
      const el = pageRef.current;
      if (!el) return;
      const proseMirror = el.querySelector('.ProseMirror') as HTMLElement | null;
      // Mede a altura real do conteúdo (não inclui padding da page)
      const contentH = proseMirror ? proseMirror.scrollHeight : el.scrollHeight - topPadding * 2;
      const pages = Math.max(1, Math.ceil(contentH / pageContentHeight));
      setTotalPages(pages);
      const arr: number[] = [];
      for (let i = 1; i < pages; i++) {
        // Offset desde o topo da .editor-page (inclui o padding-top + N páginas de conteúdo)
        arr.push(topPadding + i * pageContentHeight);
      }
      setBreaks(arr);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(pageRef.current);
    const proseMirror = pageRef.current.querySelector('.ProseMirror');
    if (proseMirror) ro.observe(proseMirror);
    editor.on('update', compute);
    window.addEventListener('resize', compute);

    return () => {
      ro.disconnect();
      editor.off('update', compute);
      window.removeEventListener('resize', compute);
    };
  }, [editor, pageRef, pageContentHeight, topPadding]);

  return { breaks, totalPages };
}
