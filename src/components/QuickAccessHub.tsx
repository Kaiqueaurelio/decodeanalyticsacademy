import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Calendar, Library, Users, Megaphone, User, type LucideIcon
} from 'lucide-react';

interface Tile {
  icon: LucideIcon;
  label: string;
  sub: string;
  hue: string; // hsl color
  to?: string;
  scrollTo?: string;
}

interface QuickAccessHubProps {
  onJumpToSection?: (id: string) => void;
}

export function QuickAccessHub({ onJumpToSection }: QuickAccessHubProps) {
  const navigate = useNavigate();

  const tiles: Tile[] = [
    { icon: BookOpen, label: 'Conteúdos Acadêmicos', sub: 'Disciplinas', hue: '189 100% 50%', scrollTo: 'minhas-disciplinas' },
    { icon: Calendar, label: 'Calendário', sub: 'Provas & prazos', hue: '270 91% 65%', scrollTo: 'calendario' },
    { icon: Library, label: 'Biblioteca', sub: 'Materiais', hue: '142 76% 55%', to: '/materials' },
    { icon: Users, label: 'Comunidade', sub: 'Avisos', hue: '24 95% 60%', scrollTo: 'comunidade' },
    { icon: Megaphone, label: 'Mural do Aluno', sub: 'Atividades', hue: '330 90% 60%', scrollTo: 'mural' },
    { icon: User, label: 'Meu Perfil', sub: 'Conta', hue: '210 100% 60%', to: '/profile' },
  ];

  const handleClick = (tile: Tile) => {
    if (tile.to) navigate(tile.to);
    else if (tile.scrollTo) {
      const el = document.getElementById(tile.scrollTo);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      onJumpToSection?.(tile.scrollTo);
    }
  };

  return (
    <div className="mb-8 animate-content-show">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono-label text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Acesso Rápido
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-border via-border/40 to-transparent" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {tiles.map((t, i) => {
          const Icon = t.icon;
          const color = `hsl(${t.hue})`;
          return (
            <button
              key={t.label}
              onClick={() => handleClick(t)}
              className="group relative overflow-hidden rounded-xl bg-card border border-border/60 p-4 sm:p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-transparent animate-card-enter"
              style={{
                animationDelay: `${i * 60}ms`,
                ['--tile-color' as any]: color,
              }}
            >
              {/* Gradient overlay on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, hsl(${t.hue} / 0.18) 0%, transparent 70%)`,
                  boxShadow: `inset 0 0 0 1px hsl(${t.hue} / 0.5), 0 0 30px hsl(${t.hue} / 0.25)`,
                }}
              />
              {/* Icon */}
              <div
                className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: `hsl(${t.hue} / 0.12)`,
                  color,
                  boxShadow: `0 0 20px hsl(${t.hue} / 0.15)`,
                }}
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
              </div>
              {/* Label */}
              <p className="relative font-mono-label text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-foreground leading-tight">
                {t.label}
              </p>
              <p className="relative text-[10px] text-muted-foreground mt-0.5">{t.sub}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
