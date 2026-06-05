import { FileText } from 'lucide-react';
import { getSubjectColor } from '@/lib/subject-colors';
import type { ApostilaSummary } from '@/hooks/queries/useDashboardData';

interface Props {
  apostila: ApostilaSummary;
  status?: 'em-progresso' | 'concluida' | 'novo';
}

/**
 * Card estilo Notion: capa com gradiente da matéria + título no topo,
 * abaixo: ícone + título, badge de status e badge de semestre.
 */
export function ApostilaCoverCard({ apostila, status = 'em-progresso' }: Props) {
  const color = getSubjectColor(apostila.category || 'Geral');
  const semester = apostila.semester ? `${apostila.semester}º Semestre` : 'Extracurricular';

  const statusLabel =
    status === 'concluida' ? 'Concluída' : status === 'novo' ? 'Novo' : 'Em progresso';

  return (
    <a
      href={`/apostila/${apostila.id}`}
      className="group flex flex-col rounded-xl overflow-hidden border border-border/60 bg-card hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-300 shadow-sm hover:shadow-lg"
    >
      {/* Cover */}
      <div
        className="relative h-24 sm:h-28 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${color}33 0%, ${color}11 60%, hsl(var(--card)) 100%), radial-gradient(circle at 80% 20%, ${color}55, transparent 60%)`,
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,hsl(var(--card)/0.85))]" />
        <div className="absolute inset-x-0 top-2 px-3">
          <p
            className="font-display text-[13px] sm:text-sm leading-tight line-clamp-2 italic drop-shadow"
            style={{ color: 'hsl(var(--foreground) / 0.92)' }}
          >
            {apostila.title}
          </p>
        </div>
        {/* Accent bar */}
        <div
          className="absolute left-3 right-3 bottom-3 h-1 rounded-full opacity-80"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}33)` }}
        />
      </div>

      {/* Body */}
      <div className="p-3 sm:p-3.5 flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
          <h3 className="text-[13px] sm:text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {apostila.title}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: 'hsl(var(--primary) / 0.15)',
              color: 'hsl(var(--primary))',
            }}
          >
            {statusLabel}
          </span>
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: `${color}22`,
              color: color,
            }}
          >
            {semester}
          </span>
        </div>
      </div>
    </a>
  );
}
