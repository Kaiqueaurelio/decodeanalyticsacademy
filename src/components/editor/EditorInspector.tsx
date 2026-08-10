/**
 * EditorInspector — painel lateral direito contextual estilo Word/Docs.
 * Mostra controles diferentes conforme o elemento selecionado:
 *   - Imagem: largura %, alinhamento, alt-text, substituir, remover
 *   - Link: editar URL, abrir em nova aba, remover
 *   - Tabela: adicionar/remover linha/coluna, header, excluir
 *   - Heading: nível, alinhamento
 *   - Paragraph: alinhamento, espaçamento
 *   - Nada: estatísticas gerais
 */
import { useMemo, useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ChevronRight, ChevronLeft, Image as ImageIcon, Link as LinkIcon, Table as TableIcon,
  Type, Heading1, Heading2, Heading3, Trash2, ExternalLink, Wand2,
  WrapText, Square,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useEditorSelection } from './useEditorSelection';
import { isValidUrl } from './link-utils';

/* Presets de layout para imagem (largura + alinhamento numa ação) */
type ImageAlign = 'left' | 'center' | 'right';
interface ImagePreset {
  id: string;
  label: string;
  title: string;
  width: number;
  align: ImageAlign;
}
const IMAGE_PRESETS: ImagePreset[] = [
  { id: 'full',    label: '100%',     title: 'Largura total',          width: 100, align: 'center' },
  { id: 'big-c',   label: '75% C',    title: '75% centralizado',       width: 75,  align: 'center' },
  { id: 'half-l',  label: '50% E',    title: '50% à esquerda',         width: 50,  align: 'left'   },
  { id: 'half-c',  label: '50% C',    title: '50% centralizado',       width: 50,  align: 'center' },
  { id: 'half-r',  label: '50% D',    title: '50% à direita',          width: 50,  align: 'right'  },
  { id: 'small-c', label: '25% C',    title: '25% — miniatura central',width: 25,  align: 'center' },
];

/** Glyph SVG que mostra a "página" com a imagem do preset desenhada dentro */
function PresetGlyph({ width, align, active }: { width: number; align: ImageAlign; active?: boolean }) {
  const PAGE_W = 28;
  const PAGE_H = 16;
  const imgW = (width / 100) * (PAGE_W - 4);
  const imgH = 6;
  const y = 5;
  const x = align === 'left' ? 2 : align === 'right' ? PAGE_W - 2 - imgW : (PAGE_W - imgW) / 2;
  const stroke = active ? 'currentColor' : 'hsl(var(--muted-foreground))';
  const fill = active ? 'currentColor' : 'hsl(var(--muted-foreground) / 0.5)';
  return (
    <svg width={PAGE_W} height={PAGE_H} viewBox={`0 0 ${PAGE_W} ${PAGE_H}`} aria-hidden>
      <rect x={0.5} y={0.5} width={PAGE_W - 1} height={PAGE_H - 1} rx={1.5} fill="none" stroke={stroke} strokeOpacity={0.4} />
      <line x1={2} y1={2.5} x2={PAGE_W - 2} y2={2.5} stroke={stroke} strokeOpacity={0.3} />
      <rect x={x} y={y} width={imgW} height={imgH} rx={0.5} fill={fill} />
      <line x1={2} y1={PAGE_H - 2.5} x2={PAGE_W - 2} y2={PAGE_H - 2.5} stroke={stroke} strokeOpacity={0.3} />
    </svg>
  );
}


interface Props {
  editor: Editor | null;
  collapsed: boolean;
  onToggle: () => void;
}

export function EditorInspector({ editor, collapsed, onToggle }: Props) {
  const sel = useEditorSelection(editor);

  const stats = useMemo(() => {
    const text = editor?.getText() || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.round(words / 200));
    return { words, chars: text.length, minutes };
  }, [editor, sel]);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggle}
        title="Mostrar inspector"
        className="hidden lg:flex w-7 shrink-0 items-center justify-center border-l border-border bg-muted/30 hover:bg-muted text-muted-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    );
  }

  return (
    <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 flex-col border-l border-border bg-muted/20">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40">
        <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
          <Wand2 className="h-3.5 w-3.5" />
          Inspector
        </div>
        <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={onToggle} title="Recolher">
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-4">
        <EditorInspectorBody editor={editor} stats={stats} sel={sel} />
      </div>
    </aside>
  );
}

/**
 * Corpo do Inspector — exportado para ser reusado em Sheet mobile.
 * Renderiza o painel contextual conforme a seleção atual.
 */
export function EditorInspectorBody({
  editor,
  stats,
  sel,
}: {
  editor: Editor | null;
  stats: { words: number; chars: number; minutes: number };
  sel: ReturnType<typeof useEditorSelection>;
}) {
  return (
    <>
      {!editor && <p className="text-xs text-muted-foreground">Carregando…</p>}
      {editor && sel.type === 'none' && <StatsPanel stats={stats} />}
      {editor && sel.type === 'image' && <ImagePanel editor={editor} attrs={sel.attrs} />}
      {editor && sel.type === 'link' && <LinkPanel editor={editor} attrs={sel.attrs} text={sel.text} />}
      {editor && sel.type === 'table' && <TablePanel editor={editor} />}
      {editor && sel.type === 'heading' && <HeadingPanel editor={editor} level={sel.level} />}
      {editor && sel.type === 'paragraph' && <ParagraphPanel editor={editor} attrs={sel.attrs} />}
    </>
  );
}

/* ============== Panels ============== */

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-2">
      <Icon className="h-3 w-3" />
      {label}
    </div>
  );
}

function StatsPanel({ stats }: { stats: { words: number; chars: number; minutes: number } }) {
  return (
    <div>
      <SectionTitle icon={Type} label="Estatísticas" />
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Palavras" value={stats.words.toLocaleString('pt-BR')} />
        <StatCard label="Caracteres" value={stats.chars.toLocaleString('pt-BR')} />
        <StatCard label="Leitura" value={`~${stats.minutes} min`} />
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
        Selecione uma <strong className="text-foreground">imagem</strong>, <strong className="text-foreground">link</strong>,
        <strong className="text-foreground"> tabela</strong> ou <strong className="text-foreground">título</strong> para editar suas propriedades.
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
        Dica: digite <code className="px-1 rounded bg-muted text-foreground">/</code> no início de uma linha para abrir o menu rápido de blocos.
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-2 py-2">
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-mono font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function ImagePanel({
  editor,
  attrs,
}: {
  editor: Editor;
  attrs: {
    src?: string;
    alt?: string;
    width?: string | null;
    align?: 'left' | 'center' | 'right';
    float?: 'none' | 'left' | 'right';
    marginX?: number;
    marginY?: number;
  };
}) {
  const widthNum = useMemo(() => {
    if (!attrs.width) return 100;
    const n = parseInt(String(attrs.width).replace('%', ''), 10);
    return Number.isFinite(n) ? Math.max(20, Math.min(100, n)) : 100;
  }, [attrs.width]);

  const float = attrs.float || 'none';
  const marginX = Number(attrs.marginX ?? 0);
  const marginY = Number(attrs.marginY ?? 0);
  const isFloating = float === 'left' || float === 'right';

  const setWidth = (w: number) => editor.chain().focus().updateAttributes('image', { width: `${w}%` }).run();
  const setAlign = (a: 'left' | 'center' | 'right') =>
    editor.chain().focus().updateAttributes('image', { align: a, float: 'none' }).run();
  const setFloat = (f: 'none' | 'left' | 'right') => {
    if (f === 'none') {
      editor.chain().focus().updateAttributes('image', { float: 'none' }).run();
    } else {
      editor.chain().focus().updateAttributes('image', { float: f, align: f }).run();
    }
  };
  const setMarginX = (n: number) =>
    editor.chain().focus().updateAttributes('image', { marginX: n }).run();
  const setMarginY = (n: number) =>
    editor.chain().focus().updateAttributes('image', { marginY: n }).run();

  return (
    <div className="space-y-4">
      <div>
        <SectionTitle icon={ImageIcon} label="Imagem" />
        {attrs.src && (
          <div className="rounded-md border border-border overflow-hidden bg-background">
            <img src={attrs.src} alt={attrs.alt || ''} className="w-full h-24 object-contain bg-checker" />
          </div>
        )}
      </div>

      <div>
        <Label className="text-[11px] text-muted-foreground">Texto alternativo (alt)</Label>
        <Input
          value={attrs.alt || ''}
          onChange={(e) => editor.chain().focus().updateAttributes('image', { alt: e.target.value }).run()}
          placeholder="Descreva a imagem…"
          className="mt-1 h-8 text-xs"
          maxLength={200}
        />
        {!attrs.alt && (
          <p className="mt-1 text-[10px] text-amber-500">⚠ Sem alt-text — ruim para acessibilidade.</p>
        )}
      </div>

      {/* Presets de layout — combinam largura + alinhamento numa ação */}
      <div>
        <Label className="text-[11px] text-muted-foreground">Layout rápido</Label>
        <div className="grid grid-cols-3 gap-1 mt-1">
          {IMAGE_PRESETS.map((p) => {
            const active = widthNum === p.width && attrs.align === p.align;
            return (
              <button
                key={p.id}
                type="button"
                title={p.title}
                onClick={() =>
                  editor.chain().focus().updateAttributes('image', {
                    width: `${p.width}%`,
                    align: p.align,
                  }).run()
                }
                className={cn(
                  'group flex flex-col items-center gap-1 rounded border px-1.5 py-1.5 transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background hover:bg-muted',
                )}
              >
                <PresetGlyph width={p.width} align={p.align} active={active} />
                <span className="text-[9px] font-mono leading-none">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Largura</span>
          <span className="font-mono">{widthNum}%</span>
        </Label>
        <Slider
          value={[widthNum]}
          min={20}
          max={100}
          step={5}
          onValueChange={(v) => setWidth(v[0])}
          className="mt-2"
        />
        <div className="flex gap-1 mt-2">
          {[25, 50, 75, 100].map((p) => (
            <Button
              key={p}
              type="button"
              size="sm"
              variant={widthNum === p ? 'secondary' : 'outline'}
              className="h-6 px-2 text-[10px] flex-1"
              onClick={() => setWidth(p)}
            >
              {p}%
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-[11px] text-muted-foreground">Alinhamento (bloco)</Label>
        <div className="grid grid-cols-3 gap-1 mt-1">
          <AlignBtn active={!isFloating && attrs.align === 'left'} onClick={() => setAlign('left')} icon={AlignLeft} label="Esq." />
          <AlignBtn active={!isFloating && attrs.align === 'center'} onClick={() => setAlign('center')} icon={AlignCenter} label="Centro" />
          <AlignBtn active={!isFloating && attrs.align === 'right'} onClick={() => setAlign('right')} icon={AlignRight} label="Dir." />
        </div>
      </div>

      <div>
        <Label className="text-[11px] text-muted-foreground">Texto envolvendo (float)</Label>
        <div className="grid grid-cols-3 gap-1 mt-1">
          <AlignBtn active={float === 'none'} onClick={() => setFloat('none')} icon={Square} label="Em linha" />
          <AlignBtn active={float === 'left'} onClick={() => setFloat('left')} icon={WrapText} label="Esq." />
          <AlignBtn active={float === 'right'} onClick={() => setFloat('right')} icon={WrapText} label="Dir." />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
          {isFloating ? 'Texto envolve a imagem. No celular vira bloco cheio.' : 'Imagem ocupa linha própria.'}
        </p>
      </div>

      <div>
        <Label className="text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Margem horizontal</span>
          <span className="font-mono">{marginX}px</span>
        </Label>
        <Slider value={[marginX]} min={0} max={48} step={2} onValueChange={(v) => setMarginX(v[0])} className="mt-2" />
      </div>

      <div>
        <Label className="text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Margem vertical</span>
          <span className="font-mono">{marginY}px</span>
        </Label>
        <Slider value={[marginY]} min={0} max={48} step={2} onValueChange={(v) => setMarginY(v[0])} className="mt-2" />
      </div>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="w-full h-8 text-destructive hover:bg-destructive/10"
        onClick={() => editor.chain().focus().deleteSelection().run()}
      >
        <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Remover imagem
      </Button>
    </div>
  );
}

function LinkPanel({
  editor,
  attrs,
  text,
}: {
  editor: Editor;
  attrs: { href?: string; target?: string };
  text: string;
}) {
  const [url, setUrl] = useState(attrs.href || '');
  const [target, setTarget] = useState(attrs.target === '_blank');
  const valid = !url || isValidUrl(url);

  const apply = () => {
    if (!valid || !url) return;
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url, target: target ? '_blank' : null })
      .run();
  };

  return (
    <div className="space-y-3">
      <SectionTitle icon={LinkIcon} label="Link" />

      <div>
        <Label className="text-[11px] text-muted-foreground">Texto</Label>
        <div className="mt-1 px-2 py-1.5 rounded border border-border bg-background text-xs truncate">
          {text || <span className="text-muted-foreground italic">(sem texto)</span>}
        </div>
      </div>

      <div>
        <Label className="text-[11px] text-muted-foreground">URL</Label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={apply}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }}
          placeholder="https://exemplo.com"
          className={cn('mt-1 h-8 text-xs', !valid && 'border-destructive focus-visible:ring-destructive')}
        />
        {!valid && <p className="mt-1 text-[10px] text-destructive">URL inválida.</p>}
      </div>

      <label className="flex items-center gap-2 text-[11px] cursor-pointer">
        <input
          type="checkbox"
          checked={target}
          onChange={(e) => { setTarget(e.target.checked); setTimeout(apply, 0); }}
          className="h-3.5 w-3.5"
        />
        Abrir em nova aba
      </label>

      <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
        {attrs.href && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            asChild
          >
            <a href={attrs.href} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Visitar link
            </a>
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 text-xs text-destructive hover:bg-destructive/10"
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Remover link
        </Button>
      </div>
    </div>
  );
}

function TablePanel({ editor }: { editor: Editor }) {
  const btn = (label: string, fn: () => void, danger = false) => (
    <Button
      type="button"
      size="sm"
      variant={danger ? 'ghost' : 'outline'}
      className={cn('h-8 text-[11px]', danger && 'text-destructive hover:bg-destructive/10')}
      onClick={() => { fn(); }}
    >
      {label}
    </Button>
  );

  return (
    <div className="space-y-3">
      <SectionTitle icon={TableIcon} label="Tabela" />
      <div className="grid grid-cols-2 gap-1.5">
        {btn('+ Linha acima', () => editor.chain().focus().addRowBefore().run())}
        {btn('+ Linha abaixo', () => editor.chain().focus().addRowAfter().run())}
        {btn('+ Coluna esq.', () => editor.chain().focus().addColumnBefore().run())}
        {btn('+ Coluna dir.', () => editor.chain().focus().addColumnAfter().run())}
        {btn('− Linha', () => editor.chain().focus().deleteRow().run(), true)}
        {btn('− Coluna', () => editor.chain().focus().deleteColumn().run(), true)}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {btn('Mesclar', () => editor.chain().focus().mergeCells().run())}
        {btn('Dividir', () => editor.chain().focus().splitCell().run())}
        {btn('Cabeçalho', () => editor.chain().focus().toggleHeaderRow().run())}
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="w-full h-8 text-destructive hover:bg-destructive/10 text-xs"
        onClick={() => editor.chain().focus().deleteTable().run()}
      >
        <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir tabela
      </Button>
    </div>
  );
}

function HeadingPanel({ editor, level }: { editor: Editor; level: 1 | 2 | 3 }) {
  const setLevel = (l: 1 | 2 | 3) => editor.chain().focus().toggleHeading({ level: l }).run();
  return (
    <div className="space-y-3">
      <SectionTitle icon={Type} label={`Título ${level}`} />
      <div>
        <Label className="text-[11px] text-muted-foreground">Nível</Label>
        <div className="grid grid-cols-3 gap-1 mt-1">
          <AlignBtn active={level === 1} onClick={() => setLevel(1)} icon={Heading1} label="H1" />
          <AlignBtn active={level === 2} onClick={() => setLevel(2)} icon={Heading2} label="H2" />
          <AlignBtn active={level === 3} onClick={() => setLevel(3)} icon={Heading3} label="H3" />
        </div>
      </div>
      <AlignmentRow editor={editor} />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-full h-8 text-xs"
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        Converter para texto normal
      </Button>
    </div>
  );
}

function ParagraphPanel({ editor }: { editor: Editor }) {
  return (
    <div className="space-y-3">
      <SectionTitle icon={Type} label="Parágrafo" />
      <AlignmentRow editor={editor} />
      <div>
        <Label className="text-[11px] text-muted-foreground">Converter em</Label>
        <div className="grid grid-cols-3 gap-1 mt-1">
          <AlignBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} icon={Heading1} label="H1" />
          <AlignBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} icon={Heading2} label="H2" />
          <AlignBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} icon={Heading3} label="H3" />
        </div>
      </div>
    </div>
  );
}

function AlignmentRow({ editor }: { editor: Editor }) {
  const set = (a: 'left' | 'center' | 'right' | 'justify') =>
    editor.chain().focus().setTextAlign(a).run();
  const is = (a: string) => editor.isActive({ textAlign: a });
  return (
    <div>
      <Label className="text-[11px] text-muted-foreground">Alinhamento</Label>
      <div className="grid grid-cols-4 gap-1 mt-1">
        <AlignBtn active={is('left')} onClick={() => set('left')} icon={AlignLeft} />
        <AlignBtn active={is('center')} onClick={() => set('center')} icon={AlignCenter} />
        <AlignBtn active={is('right')} onClick={() => set('right')} icon={AlignRight} />
        <AlignBtn active={is('justify')} onClick={() => set('justify')} icon={AlignJustify} />
      </div>
    </div>
  );
}

function AlignBtn({
  active, onClick, icon: Icon, label,
}: { active?: boolean; onClick: () => void; icon: React.ElementType; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-8 rounded border flex items-center justify-center gap-1 text-[10px] transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-background hover:bg-muted',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label && <span>{label}</span>}
    </button>
  );
}
