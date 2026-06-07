import { FileText } from 'lucide-react';
import { getSubjectColor } from '@/lib/subject-colors';
import { getApostilaCover } from '@/lib/apostila-covers';
import type { ApostilaSummary } from '@/hooks/queries/useDashboardData';

interface Props {
  apostila: ApostilaSummary;
  status?: 'em-progresso' | 'concluida' | 'novo';
}

/**
 * Card estilo Notion: capa com imagem temática + título em itálico,
 * faixa colorida da matéria, ícone + título embaixo,
 * badges "Em progresso" e "5º Semestre".
 */
export function ApostilaCoverCard({ apostila, status = 'em-progresso' }: Props) {
  const color = getSubjectColor(apostila.category || 'Geral');
  const cover = (apostila as any).cover_url || getApostilaCover(apostila.category, apostila.id);
  const semester = apostila.semester ? `${apostila.semester}º Semestre` : 'Extracurricular';

  const statusLabel =
    status === 'concluida' ? 'Concluída' : status === 'novo' ? 'Novo' : 'Em progresso';

  return (
    <a
      href={`/apostila/${apostila.id}`}
      className="group flex flex-col rounded-xl overflow-hidden border border-border/60 bg-card hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-300 shadow-sm hover:shadow-lg"
    >
      {/* Cover com imagem temática */}
      <div className="relative h-24 sm:h-28 overflow-hidden bg-muted">
        <img
          src={cover}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Overlay azulado/escuro para contraste com texto */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220_60%_15%/0.65)] via-[hsl(220_60%_15%/0.55)] to-[hsl(220_60%_15%/0.75)]" />

        {/* Título sobre a capa, em itálico serifado */}
        <div className="absolute inset-x-0 top-2 px-3">
          <p className="font-display italic text-white text-[13px] sm:text-sm leading-tight line-clamp-2 drop-shadow-md">
            {apostila.title}
          </p>
        </div>

        {/* Faixa colorida da matéria (estilo accent laranja do Notion) */}
        <div className="absolute left-3 right-3 bottom-3 h-1.5 rounded-full">
          <div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }}
          />
        </div>

        {/* Mini-label do título dentro da capa (estilo Notion) */}
        <div className="absolute left-3 right-3 bottom-5">
          <span
            className="inline-block px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded text-white"
            style={{ backgroundColor: `${color}66` }}
          >
            {apostila.category || 'Geral'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 sm:p-3.5 flex flex-col gap-2 bg-card">
        <div className="flex items-start gap-2">
          <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
          <h3 className="text-[13px] sm:text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {apostila.title}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-[hsl(210_100%_60%/0.18)] text-[hsl(210_100%_70%)]">
            {statusLabel}
          </span>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-[hsl(24_95%_55%/0.18)] text-[hsl(24_95%_65%)]">
            {semester}
          </span>
        </div>
      </div>
    </a>
  );
}
