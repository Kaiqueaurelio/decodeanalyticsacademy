import { FileText } from 'lucide-react';
import { getSubjectColor } from '@/lib/subject-colors';
import { getApostilaCover } from '@/lib/apostila-covers';
import { useCoverTheme } from '@/lib/cover-theme';
import { buildCoverDataUri } from '@/lib/cover-render';
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
  const theme = useCoverTheme();
  const uploaded = (apostila as any).cover_url as string | undefined;
  const cover =
    theme.preferUploaded && uploaded
      ? uploaded
      : buildCoverDataUri(
          {
            title: apostila.title,
            category: apostila.category,
            semester: (apostila as any).semester ?? null,
          },
          theme,
        ) || getApostilaCover(apostila.category, apostila.id);
  const semester = apostila.semester ? `${apostila.semester}º Semestre` : 'Extracurricular';


  const statusLabel =
    status === 'concluida' ? 'Concluída' : status === 'novo' ? 'Novo' : 'Em progresso';

  return (
    <a
      href={`/apostila/${apostila.id}`}
      data-testid="apostila-cover-card"
      className="group flex flex-col rounded-xl overflow-hidden border border-border/60 bg-card hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-300 shadow-sm hover:shadow-lg"
    >
      {/* Cover editorial (a própria capa já traz título/tipografia) */}
      <div
        data-testid="apostila-cover-media"
        className="relative w-full overflow-hidden bg-muted aspect-[2/3] sm:aspect-[3/4]"
      >
        <img
          src={cover}
          alt={apostila.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 h-1.5">
          <div
            className="h-full w-full"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}55)` }}
          />
        </div>
      </div>


      {/* Body */}
      <div
        data-testid="apostila-cover-body"
        className="p-2 sm:p-3.5 flex flex-col gap-1.5 sm:gap-2 bg-card"
      >
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
