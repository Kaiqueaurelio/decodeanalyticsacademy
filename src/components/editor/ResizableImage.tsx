/**
 * ResizableImage — extensão TipTap que substitui a imagem padrão por uma
 * versão WYSIWYG estilo Word/Google Docs:
 *  - Mostra a imagem real (preview), nunca blank
 *  - Pode ser arrastada para outra posição no documento (drag handle nativo do PM)
 *  - Pode ser redimensionada com handle no canto inferior direito
 *  - Pode ser alinhada (esquerda / centro / direita) via toolbar flutuante
 *  - Suporta atributos width e align que sobrevivem no HTML salvo
 */
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { useRef, useState, useCallback } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Align = 'left' | 'center' | 'right';

function ImageView({ node, updateAttributes, deleteNode, selected, editor }: NodeViewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);
  const src = (node.attrs.src as string) || '';
  const alt = (node.attrs.alt as string) || '';
  const width = (node.attrs.width as string | null) || null;
  const align: Align = (node.attrs.align as Align) || 'center';
  const isEditable = editor.isEditable;

  const startResize = useCallback(
    (e: React.PointerEvent) => {
      if (!isEditable) return;
      e.preventDefault();
      e.stopPropagation();
      const wrapper = wrapperRef.current;
      const img = wrapper?.querySelector('img');
      if (!img) return;
      const startX = e.clientX;
      const startWidth = img.getBoundingClientRect().width;
      const parentWidth = wrapper?.parentElement?.getBoundingClientRect().width ?? 800;
      setResizing(true);

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const next = Math.max(80, Math.min(parentWidth, startWidth + dx));
        const pct = Math.round((next / parentWidth) * 100);
        updateAttributes({ width: `${pct}%` });
      };
      const onUp = () => {
        setResizing(false);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [isEditable, updateAttributes],
  );

  const setAlign = (a: Align) => updateAttributes({ align: a });

  const justify =
    align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';

  return (
    <NodeViewWrapper
      as="div"
      data-drag-handle
      className={cn('group relative my-3 flex w-full', justify, isEditable && 'cursor-grab active:cursor-grabbing')}
      title={isEditable ? 'Arraste para mover · clique para selecionar e redimensionar' : undefined}
    >
      <div
        ref={wrapperRef}
        className={cn(
          'relative inline-block max-w-full transition-shadow',
          selected && 'outline outline-2 outline-primary rounded-sm shadow-lg',
          isEditable && !selected && 'hover:outline hover:outline-1 hover:outline-primary/40 hover:rounded-sm',
        )}
        style={{ width: width || 'auto' }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="block max-w-full h-auto rounded-sm select-none pointer-events-none"
          style={{ width: width ? '100%' : undefined }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.outline = '2px dashed hsl(var(--destructive))';
          }}
        />
        {/* Hint visual de "arrastável" no hover */}
        {isEditable && !selected && (
          <div
            contentEditable={false}
            className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground pointer-events-none"
          >
            ✥ Arraste para mover
          </div>
        )}

        {/* Toolbar flutuante (aparece ao selecionar) */}
        {selected && isEditable && (
          <div
            contentEditable={false}
            className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-md border border-border bg-popover shadow-md px-1 py-0.5 z-10"
          >
            <button
              type="button"
              title="Alinhar à esquerda"
              onClick={() => setAlign('left')}
              className={cn(
                'h-6 w-6 grid place-items-center rounded hover:bg-muted',
                align === 'left' && 'bg-muted text-primary',
              )}
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Centralizar"
              onClick={() => setAlign('center')}
              className={cn(
                'h-6 w-6 grid place-items-center rounded hover:bg-muted',
                align === 'center' && 'bg-muted text-primary',
              )}
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Alinhar à direita"
              onClick={() => setAlign('right')}
              className={cn(
                'h-6 w-6 grid place-items-center rounded hover:bg-muted',
                align === 'right' && 'bg-muted text-primary',
              )}
            >
              <AlignRight className="h-3.5 w-3.5" />
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            {[33, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                title={`${pct}% da largura`}
                onClick={() => updateAttributes({ width: `${pct}%` })}
                className="h-6 px-1.5 text-[10px] rounded hover:bg-muted font-mono"
              >
                {pct}%
              </button>
            ))}
            <div className="w-px h-4 bg-border mx-1" />
            <button
              type="button"
              title="Remover imagem"
              onClick={() => deleteNode()}
              className="h-6 w-6 grid place-items-center rounded hover:bg-destructive/10 text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Handle de redimensionar */}
        {selected && isEditable && (
          <div
            contentEditable={false}
            onPointerDown={startResize}
            className={cn(
              'absolute -bottom-1 -right-1 h-4 w-4 rounded-sm bg-primary border-2 border-background cursor-nwse-resize z-10',
              resizing && 'scale-125',
            )}
            title="Arraste para redimensionar"
          />
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const ResizableImage = Node.create({
  name: 'image',
  group: 'block',
  draggable: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
      align: { default: 'center' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (el) => {
          const node = el as HTMLElement;
          const align = (node.getAttribute('align') as Align) || node.dataset.align || 'center';
          const width = node.getAttribute('width') || node.style.width || null;
          return {
            src: node.getAttribute('src'),
            alt: node.getAttribute('alt'),
            title: node.getAttribute('title'),
            width,
            align,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { width, align, ...rest } = HTMLAttributes;
    const style = width ? `width:${width}` : undefined;
    return [
      'img',
      mergeAttributes(rest, {
        'data-align': align,
        align,
        ...(width ? { width } : {}),
        ...(style ? { style } : {}),
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
});
