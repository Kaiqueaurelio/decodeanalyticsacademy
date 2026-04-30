/**
 * ResizableImage — extensão TipTap WYSIWYG estilo Word/Google Docs.
 *
 * Atributos persistidos no HTML/Markdown:
 *  - src, alt, title
 *  - width: "60%" ou "320px"
 *  - align: 'left' | 'center' | 'right'   → quando float = 'none'
 *  - float: 'none' | 'left' | 'right'     → faz texto envolver
 *  - marginX, marginY: number (px)        → respiro ao redor
 *
 * Comportamento:
 *  - Drag com handle nativo do ProseMirror (move o bloco no documento)
 *  - Resize por handle no canto inferior direito (% da coluna)
 *  - Toolbar flutuante para alinhamento, float, presets e remover
 *  - Float left/right faz `shape-outside` natural com texto envolvendo
 */
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { useRef, useState, useCallback } from 'react';
import {
  AlignLeft, AlignCenter, AlignRight, Trash2,
  WrapText, Square,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Align = 'left' | 'center' | 'right';
type Float = 'none' | 'left' | 'right';

function ImageView({ node, updateAttributes, deleteNode, selected, editor }: NodeViewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);
  const src = (node.attrs.src as string) || '';
  const alt = (node.attrs.alt as string) || '';
  const width = (node.attrs.width as string | null) || null;
  const align: Align = (node.attrs.align as Align) || 'center';
  const float: Float = (node.attrs.float as Float) || 'none';
  const marginX = Number(node.attrs.marginX ?? 0);
  const marginY = Number(node.attrs.marginY ?? 0);
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

  const setAlign = (a: Align) => updateAttributes({ align: a, float: 'none' });
  const setFloat = (f: Float) => {
    // Quando ativa float, alinhamento de bloco perde sentido; mantemos 'left'/'right'
    if (f === 'none') updateAttributes({ float: 'none' });
    else updateAttributes({ float: f, align: f });
  };

  const isFloating = float === 'left' || float === 'right';

  // Wrapper: usa flex (justify) quando NÃO está flutuando; caso contrário, usa float CSS.
  const justify = isFloating
    ? ''
    : align === 'left'
    ? 'justify-start'
    : align === 'right'
    ? 'justify-end'
    : 'justify-center';

  // Estilo aplicado no wrapper interno para implementar float + margens
  const innerStyle: React.CSSProperties = {
    width: width || 'auto',
    float: isFloating ? float : 'none',
    margin: isFloating
      ? float === 'left'
        ? `${marginY}px ${Math.max(12, marginX)}px ${marginY}px 0`
        : `${marginY}px 0 ${marginY}px ${Math.max(12, marginX)}px`
      : `${marginY}px ${marginX}px`,
    shapeOutside: isFloating ? 'margin-box' : undefined,
  };

  return (
    <NodeViewWrapper
      as="div"
      data-drag-handle
      data-float={float}
      className={cn(
        'group relative my-3',
        isFloating ? 'block clear-none' : cn('flex w-full', justify),
        isEditable && 'cursor-grab active:cursor-grabbing',
      )}
      title={isEditable ? 'Arraste para mover · clique para selecionar e ajustar' : undefined}
    >
      <div
        ref={wrapperRef}
        className={cn(
          'relative inline-block max-w-full transition-shadow',
          selected && 'outline outline-2 outline-primary rounded-sm shadow-lg',
          isEditable && !selected && 'hover:outline hover:outline-1 hover:outline-primary/40 hover:rounded-sm',
        )}
        style={innerStyle}
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

        {/* Toolbar flutuante */}
        {selected && isEditable && (
          <div
            contentEditable={false}
            className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-md border border-border bg-popover shadow-md px-1 py-0.5 z-10 whitespace-nowrap"
          >
            {/* Alinhamento de bloco */}
            <button
              type="button"
              title="Bloco — alinhar à esquerda"
              onClick={() => setAlign('left')}
              className={cn(
                'h-6 w-6 grid place-items-center rounded hover:bg-muted',
                !isFloating && align === 'left' && 'bg-muted text-primary',
              )}
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Bloco — centralizar"
              onClick={() => setAlign('center')}
              className={cn(
                'h-6 w-6 grid place-items-center rounded hover:bg-muted',
                !isFloating && align === 'center' && 'bg-muted text-primary',
              )}
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Bloco — alinhar à direita"
              onClick={() => setAlign('right')}
              className={cn(
                'h-6 w-6 grid place-items-center rounded hover:bg-muted',
                !isFloating && align === 'right' && 'bg-muted text-primary',
              )}
            >
              <AlignRight className="h-3.5 w-3.5" />
            </button>

            <div className="w-px h-4 bg-border mx-1" />

            {/* Modo de envolvimento de texto (float) */}
            <button
              type="button"
              title="Texto envolvendo à esquerda da imagem"
              onClick={() => setFloat('right')}
              className={cn(
                'h-6 px-1.5 grid place-items-center rounded hover:bg-muted',
                float === 'right' && 'bg-muted text-primary',
              )}
            >
              <WrapText className="h-3.5 w-3.5 -scale-x-100" />
            </button>
            <button
              type="button"
              title="Texto envolvendo à direita da imagem"
              onClick={() => setFloat('left')}
              className={cn(
                'h-6 px-1.5 grid place-items-center rounded hover:bg-muted',
                float === 'left' && 'bg-muted text-primary',
              )}
            >
              <WrapText className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Em linha (sem envolver texto)"
              onClick={() => setFloat('none')}
              className={cn(
                'h-6 px-1.5 grid place-items-center rounded hover:bg-muted',
                float === 'none' && 'bg-muted text-primary',
              )}
            >
              <Square className="h-3 w-3" />
            </button>

            <div className="w-px h-4 bg-border mx-1" />

            {/* Largura rápida */}
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
  // Float só funciona quando o nó é inline-block dentro de um parágrafo,
  // mas mantemos como `block` + draggable para preservar drag handle do PM.
  // O float é aplicado via CSS no wrapper interno e o renderer do aluno
  // também respeita o atributo via classe.
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
      float: { default: 'none' },
      marginX: { default: 0 },
      marginY: { default: 0 },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (el) => {
          const node = el as HTMLElement;
          const align = (node.getAttribute('align') as Align) || (node.dataset.align as Align) || 'center';
          const width = node.getAttribute('width') || node.style.width || null;
          const float =
            (node.dataset.float as Float) ||
            (['left', 'right', 'none'].includes(node.style.float) ? (node.style.float as Float) : 'none');
          const mx = parseInt(node.dataset.mx || '0', 10);
          const my = parseInt(node.dataset.my || '0', 10);
          return {
            src: node.getAttribute('src'),
            alt: node.getAttribute('alt'),
            title: node.getAttribute('title'),
            width,
            align,
            float,
            marginX: Number.isFinite(mx) ? mx : 0,
            marginY: Number.isFinite(my) ? my : 0,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { width, align, float, marginX, marginY, ...rest } = HTMLAttributes;
    const styleParts: string[] = [];
    if (width) styleParts.push(`width:${width}`);
    if (float && float !== 'none') styleParts.push(`float:${float}`);
    const mx = Number(marginX) || 0;
    const my = Number(marginY) || 0;
    if (float === 'left') styleParts.push(`margin:${my}px ${Math.max(12, mx)}px ${my}px 0`);
    else if (float === 'right') styleParts.push(`margin:${my}px 0 ${my}px ${Math.max(12, mx)}px`);
    else if (mx || my) styleParts.push(`margin:${my}px ${mx}px`);
    const style = styleParts.join(';');
    return [
      'img',
      mergeAttributes(rest, {
        'data-align': align,
        'data-float': float || 'none',
        'data-mx': String(mx),
        'data-my': String(my),
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
