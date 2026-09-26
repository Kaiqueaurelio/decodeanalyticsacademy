import { FileText, Lock, PenTool, Edit3, Settings, CheckCircle2, Circle, ShieldAlert, Clock } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getSubjectColor } from '@/lib/subject-colors';
import { getApostilaCover } from '@/lib/apostila-covers';
import { useCoverTheme } from '@/lib/cover-theme';
import { buildCoverDataUri } from '@/lib/cover-render';
import { useAuth } from '@/hooks/useAuth';
import type { ApostilaSummary } from '@/hooks/queries/useDashboardData';

import { ensureApostilaExists } from '@/lib/create-placeholder-apostila';
import { NewApostilaPageButton } from '@/components/NewApostilaPageButton';
import { Badge } from '@/components/ui/badge';


interface Props {
  apostila: ApostilaSummary;
  status?: 'em-progresso' | 'concluida' | 'novo';
  /** Percentual real de lições concluídas (0-100). */
  progress?: number;
}



/**
 * Card estilo Notion: capa com imagem temática + título em itálico,
 * faixa colorida da matéria, ícone + título embaixo,
 * badges "Em progresso" e "5º Semestre".
 */
export function ApostilaCoverCard({ apostila, status = 'em-progresso', progress }: Props) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const color = getSubjectColor(apostila.category || 'Geral');
  const theme = useCoverTheme();
  const uploaded = (apostila as any).cover_url as string | undefined;
  
  // Prioriza URL subida (IA ou manual), depois tenta gerar SVG dinâmico, por fim fallback de imagem estática.
  const cover = useMemo(() => {
    if (uploaded) return uploaded;
    
    const dynamicSvg = buildCoverDataUri(
      {
        title: apostila.title,
        category: apostila.category,
        semester: (apostila as any).semester ?? null,
        teacher: (apostila as any).teacher ?? null,
      },
      theme,
    );
    
    return dynamicSvg || getApostilaCover(apostila.category, apostila.id);
  }, [uploaded, apostila.title, apostila.category, apostila.id, (apostila as any).semester, (apostila as any).teacher, theme]);
  const semester = apostila.semester ? `${apostila.semester}º Semestre` : 'Extracurricular';


  const statusLabel =
    status === 'concluida' ? 'Concluída' : status === 'novo' ? 'Não iniciada' : 'Em andamento';

  const percent =
    typeof progress === 'number'
      ? Math.max(0, Math.min(100, Math.round(progress)))
      : typeof (apostila as any).progress === 'number'
        ? Math.max(0, Math.min(100, Math.round((apostila as any).progress)))
        : null;

  const isPlaceholder = (apostila as any).isPlaceholder === true || !apostila.source_type;
  const statusApostila = (apostila as any).status || (apostila.published ? 'liberada' : 'bloqueada');
  
  // Data prevista se for placeholder
  const availabilityDate = (apostila as any).availability_date || "Em breve";

  const handleClick = (e: React.MouseEvent) => {
    if (isPlaceholder) {
      e.preventDefault();
      toast.info(`Disponível: ${availabilityDate}`, {
        description: "Material ainda não disponível. Aguarde o início do semestre ou das aulas.",
        icon: <Lock className="h-4 w-4 text-primary" />,
      });
      return;
    }
    
    if (statusApostila === 'bloqueada' && !isAdmin) {
      e.preventDefault();
      toast.error("Conteúdo Bloqueado", {
        description: "Este material foi bloqueado temporariamente para revisão de integridade.",
        icon: <Lock className="h-4 w-4" />,
      });
      return;
    }

    navigate(`/reader/${apostila.id}`);
  };


  return (
    <div
      onClick={handleClick}
      data-testid="apostila-cover-card"
      className={`group flex flex-col rounded-lg overflow-hidden border border-border bg-card transition-all duration-300 active:scale-[0.99] cursor-pointer ${
        isPlaceholder 
          ? 'opacity-70 grayscale-[0.5]' 
          : 'hover:border-primary/50 hover:-translate-y-0.5'
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
          onError={(e) => {
            // Se a imagem falhar (404/broken), tenta o fallback SVG dinâmico via data URI
            const target = e.currentTarget;
            const dynamicSvg = buildCoverDataUri(
              {
                title: apostila.title,
                category: apostila.category,
                semester: (apostila as any).semester ?? null,
                teacher: (apostila as any).teacher ?? null,
              },
              theme,
            );
            if (target.src !== dynamicSvg) {
              target.src = dynamicSvg;
            }
          }}
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 ${!isPlaceholder ? 'group-hover:scale-[1.03]' : ''}`}
        />
        {isPlaceholder && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[1px]">
            <div className="bg-background/90 p-2.5 rounded-xl border border-primary/30 shadow-none flex flex-col items-center gap-1.5 animate-in fade-in zoom-in duration-300">
              <Lock className="h-5 w-5 text-primary" />
              <span className="text-[9px] font-black uppercase tracking-tighter text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                {availabilityDate}
              </span>
            </div>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-border" />

        {isAdmin && (
          <div className="absolute top-2 right-2 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[10px] group-hover:translate-x-0">
            <NewApostilaPageButton
              apostilaId={apostila.id}
              compact
              className="z-30 !h-10 !w-10 rounded-full !border-emerald-500/50 !bg-emerald-500 text-white shadow-none hover:scale-110 hover:!bg-emerald-500 active:scale-95"
            />
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const realId = await ensureApostilaExists(apostila as any);
                  navigate(`/admin/apostilas/${realId}`);
                } catch (err: any) {
                  toast.error('Erro ao abrir apostila: ' + (err?.message || 'Tente novamente.'));
                }
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary border border-primary/50 text-white hover:scale-110 active:scale-95 transition-all shadow-none"
              title="Editar Conteúdo (Somente Administrador)"
            >
              <PenTool className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const realId = await ensureApostilaExists(apostila as any);
                  navigate(`/admin/apostilas/${realId}`, { state: { editMetadata: true } });
                } catch (err: any) {
                  toast.error('Erro ao abrir configurações: ' + (err?.message || 'Tente novamente.'));
                }
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-accent hover:border-accent hover:scale-110 active:scale-95 transition-all shadow-none"
              title="Configurações do Material (Somente Administrador)"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
          </div>
        )}


      </div>


      {/* Body */}
      <div
        data-testid="apostila-cover-body"
        className="p-2 sm:p-3.5 flex flex-col gap-1.5 sm:gap-2 bg-card"
      >
        <div className="flex items-start gap-2 h-[2.8rem] sm:h-[3.2rem]">
          <div className="flex flex-col flex-1 min-w-0">
            <h3 className="text-[13px] sm:text-[14px] font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors group-hover:underline decoration-primary/30 underline-offset-2">
              {apostila.title}
            </h3>
            {(apostila.updated_at || (apostila as any).saved_date) && (
              <div className="flex items-center gap-1 mt-1 opacity-60 text-[8px] uppercase font-bold tracking-widest text-muted-foreground">
                <Clock className="w-2.5 h-2.5" />
                <span>
                  {new Date((apostila as any).saved_date || apostila.updated_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-1.5 mt-auto">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                status === 'concluida'
                  ? 'bg-[hsl(142_70%_45%/0.18)] text-[hsl(142_70%_55%)]'
                  : status === 'novo'
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-[hsl(210_100%_60%/0.18)] text-[hsl(210_100%_70%)]'
              }`}
            >
              {status === 'concluida' ? (
                <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
              ) : status === 'em-progresso' ? (
                <span className="flex h-1.5 w-1.5 rounded-full bg-primary mr-1.5" />
              ) : (
                <Circle className="h-2.5 w-2.5 mr-1" />
              )}
              {statusLabel}
            </span>
            <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold bg-primary/10 text-primary uppercase tracking-tight">
              {semester}
            </span>
            {statusApostila === 'em_manutencao' && (
              <Badge variant="outline" className="h-5 text-[8px] border-amber-500/30 bg-amber-500/10 text-amber-500 font-black">
                EM VALIDAÇÃO
              </Badge>
            )}
            {statusApostila === 'bloqueada' && (
              <Badge variant="outline" className="h-5 text-[8px] border-red-500/30 bg-red-500/10 text-red-500 font-black">
                BLOQUEADO
              </Badge>
            )}
          </div>
          {percent !== null && (
            <span className="text-[10px] font-black text-primary/80">{percent}%</span>
          )}

        </div>

        {percent !== null && !isPlaceholder && (
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progresso da apostila ${apostila.title}`}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                status === 'concluida' ? 'bg-[hsl(142_70%_45%)]' : 'bg-primary'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        )}

      </div>

    </div>
  );
}
