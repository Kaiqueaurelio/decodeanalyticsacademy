import { FileText, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
  const navigate = useNavigate();
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
            teacher: (apostila as any).teacher ?? null,
          },
          theme,
        ) || getApostilaCover(apostila.category, apostila.id);
  const semester = apostila.semester ? `${apostila.semester}º Semestre` : 'Extracurricular';


  const statusLabel =
    status === 'concluida' ? 'Concluída' : status === 'novo' ? 'Novo' : 'Em progresso';

  const isPlaceholder = (apostila as any).isPlaceholder === true || !apostila.source_type;

  const handleClick = (e: React.MouseEvent) => {
    if (isPlaceholder) {
      e.preventDefault();
      toast.info("Sem material disponível por enquanto", {
        description: "Esta apostila ainda está sendo preparada pela nossa equipe pedagógica.",
        icon: <Lock className="h-4 w-4 text-primary" />,
      });
      return;
    }
    navigate(`/apostila/${apostila.id}`);
  };

  return (
    <div
      onClick={handleClick}
      data-testid="apostila-cover-card"
      className={`group flex flex-col rounded-xl overflow-hidden border border-border/60 bg-card transition-all duration-300 shadow-sm active:scale-[0.98] cursor-pointer ${
        isPlaceholder 
          ? 'opacity-80 grayscale-[0.3] hover:border-border' 
          : 'hover:border-primary/50 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(168,85,247,0.12)]'
      }`}
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
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 ${!isPlaceholder ? 'group-hover:scale-[1.03]' : ''}`}
        />
        {isPlaceholder && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[1px]">
            <div className="bg-background/80 p-2 rounded-full border border-border/50 shadow-sm">
              <Lock className="h-5 w-5 text-muted-foreground/60" />
            </div>
          </div>
        )}
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
          <h3 className="text-[13px] sm:text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors group-hover:underline decoration-primary/30 underline-offset-2">
            {apostila.title}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-[hsl(210_100%_60%/0.18)] text-[hsl(210_100%_70%)]">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
            {statusLabel}
          </span>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-[hsl(24_95%_55%/0.18)] text-[hsl(24_95%_65%)]">
            {semester}
          </span>
        </div>
      </div>

    </div>
  );
}
