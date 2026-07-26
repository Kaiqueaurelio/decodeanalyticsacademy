import { useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildCoverDataUri, COVER_H, COVER_W, type CoverSubject } from '@/lib/cover-render';
import type { CoverTheme } from '@/lib/cover-theme';

interface SizeSpec {
  id: string;
  label: string;
  note: string;
  /** largura real em px do contêiner onde a capa aparece */
  width: number;
  /** proporção do recorte (largura/altura) */
  ratio: number;
}

const SIZES: SizeSpec[] = [
  { id: 'card-mobile', label: 'Card · celular', note: '~160px · recorte 2:3', width: 160, ratio: 2 / 3 },
  { id: 'card-desktop', label: 'Card · desktop', note: '~220px · recorte 3:4', width: 220, ratio: 3 / 4 },
  { id: 'reader', label: 'Capa do leitor', note: '360px · proporção original 2:3', width: 360, ratio: COVER_W / COVER_H },
  { id: 'print', label: 'Impressão / PDF', note: 'A4 a 96dpi (≈794px) reduzido a 40%', width: 794 * 0.4, ratio: 210 / 297 },
];

/**
 * Pré-visualização das capas em tamanhos reais, com marcação de área segura
 * para checar legibilidade e recortes antes de publicar.
 */
export function CoverPreviewSizes({ samples, theme }: { samples: CoverSubject[]; theme: CoverTheme }) {
  const [sampleIdx, setSampleIdx] = useState(0);
  const [showSafeArea, setShowSafeArea] = useState(true);

  const subject = samples[Math.min(sampleIdx, samples.length - 1)];
  const uri = useMemo(() => buildCoverDataUri(subject, theme), [subject, theme]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1 space-y-1.5">
          <Label className="text-xs">Apostila de referência</Label>
          <Select value={String(sampleIdx)} onValueChange={(v) => setSampleIdx(Number(v))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {samples.map((s, i) => (
                <SelectItem key={s.title} value={String(i)}>{s.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pb-1.5">
          <Switch id="safe-area" checked={showSafeArea} onCheckedChange={setShowSafeArea} />
          <Label htmlFor="safe-area" className="text-xs">Área segura</Label>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        {SIZES.map((size) => {
          const height = Math.round(size.width / size.ratio);
          return (
            <figure key={size.id} className="space-y-2">
              <div
                data-testid={`cover-size-${size.id}`}
                className="relative overflow-hidden rounded-lg border border-border/60 bg-muted shadow-sm"
                style={{ width: size.width, height }}
              >
                <img
                  src={uri}
                  alt={`Prévia ${size.label}: ${subject.title}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {showSafeArea && (
                  <div
                    className="pointer-events-none absolute rounded-[2px] border border-dashed border-primary/70"
                    style={{
                      inset: `${Math.max(4, Math.round((theme.grid.margin / COVER_H) * height * 0.7))}px ${Math.max(4, Math.round((theme.grid.margin / COVER_W) * size.width * 0.7))}px`,
                    }}
                  />
                )}
              </div>
              <figcaption className="w-[--w] space-y-0.5" style={{ ['--w' as any]: `${size.width}px` }}>
                <p className="text-xs font-medium">{size.label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {size.note} · {Math.round(size.width)}×{height}px
                </p>
              </figcaption>
            </figure>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Se algum texto sair da linha tracejada (área segura) ou ficar ilegível no card do celular,
        reduza o tamanho do título ou aumente a margem na aba Grade antes de publicar.
      </p>
    </div>
  );
}
