import { useNavigate } from 'react-router-dom';
import { BookOpen, Presentation, Play, ClipboardCheck, type LucideIcon } from 'lucide-react';

export interface UnitResource {
  icon: LucideIcon;
  label: string;
  hue: string;
  onClick: () => void;
  disabled?: boolean;
}

interface UnitTilesGridProps {
  unitNumber: string; // "I", "II", "III"
  unitTitle: string;
  resources: UnitResource[];
}

export function UnitTilesGrid({ unitNumber, unitTitle, resources }: UnitTilesGridProps) {
  return (
    <div className="my-10 animate-content-show">
      {/* Unit header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-base"
          style={{
            backgroundColor: 'hsl(var(--primary) / 0.12)',
            color: 'hsl(var(--primary))',
            boxShadow: '0 0 20px hsl(var(--primary) / 0.2)',
          }}
        >
          {unitNumber}
        </div>
        <div>
          <p className="font-mono-label text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Unidade {unitNumber}
          </p>
          <h3 className="font-display text-lg sm:text-xl text-foreground leading-tight">
            {unitTitle}
          </h3>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-border via-border/40 to-transparent" />
      </div>

      {/* Tiles grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {resources.map((r, i) => {
          const Icon = r.icon;
          const color = `hsl(${r.hue})`;
          return (
            <button
              key={i}
              onClick={r.onClick}
              disabled={r.disabled}
              className="group relative overflow-hidden rounded-xl bg-card border border-border/60 p-4 text-center transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{ ['--tile-color' as any]: color }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, hsl(${r.hue} / 0.18) 0%, transparent 70%)`,
                  boxShadow: `inset 0 0 0 1px hsl(${r.hue} / 0.5), 0 0 25px hsl(${r.hue} / 0.25)`,
                }}
              />
              <div
                className="relative w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2.5 transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: `hsl(${r.hue} / 0.12)`,
                  color,
                  boxShadow: `0 0 15px hsl(${r.hue} / 0.15)`,
                }}
              >
                <Icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <p className="relative font-mono-label text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-foreground leading-tight">
                {r.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Helpers para criar conjuntos padrão de recursos
export function buildUnitResources(opts: {
  onOpenContent: () => void;
  onOpenSlides?: () => void;
  onOpenVideos?: () => void;
  onOpenActivity: () => void;
  hasSlides?: boolean;
  hasVideos?: boolean;
}): UnitResource[] {
  return [
    { icon: BookOpen, label: 'Livro-Texto', hue: '189 100% 50%', onClick: opts.onOpenContent },
    { icon: Presentation, label: 'Slides', hue: '142 76% 55%', onClick: opts.onOpenSlides || (() => {}), disabled: !opts.hasSlides },
    { icon: Play, label: 'Videoaulas', hue: '270 91% 65%', onClick: opts.onOpenVideos || (() => {}), disabled: !opts.hasVideos },
    { icon: ClipboardCheck, label: 'Atividade', hue: '24 95% 60%', onClick: opts.onOpenActivity },
  ];
}
