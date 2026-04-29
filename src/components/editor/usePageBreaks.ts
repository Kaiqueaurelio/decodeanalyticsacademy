/**
 * usePageBreaks — calcula posições verticais (em px) onde uma folha A4 deve
 * "quebrar" baseado na altura útil da página e no scrollHeight do conteúdo.
 *
 * Funciona em sincronia com o conteúdo do editor: cada vez que o editor
 * atualiza ou redimensiona, recalculamos. Devolve a quantidade total de
 * páginas e um array de offsets onde desenhar a linha de quebra.
 */
import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';

interface Options {
  /** Altura útil de uma página (descontando padding superior+inferior). px. */
  pageContentHeight: number;
  /** Padding interno superior da .editor-page (para alinhar quebras). px. */
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
      // scrollHeight inclui padding; descontamos top+bottom para obter conteúdo útil
      const totalContent = el.scrollHeight - topPadding * 2;
      const pages = Math.max(1, Math.ceil(totalContent / pageContentHeight));
      setTotalPages(pages);
      const arr: number[] = [];
      for (let i = 1; i < pages; i++) {
        // offset relativo ao topo da .editor-page
        arr.push(topPadding + i * pageContentHeight);
      }
      setBreaks(arr);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(pageRef.current);
    editor.on('update', compute);
    editor.on('selectionUpdate', compute);
    window.addEventListener('resize', compute);

    return () => {
      ro.disconnect();
      editor.off('update', compute);
      editor.off('selectionUpdate', compute);
      window.removeEventListener('resize', compute);
    };
  }, [editor, pageRef, pageContentHeight, topPadding]);

  return { breaks, totalPages };
}
