/**
 * OverallProgressCard — Indicador de progresso para o topo do dashboard.
 *
 * Mostra:
 *  - Aproveitamento geral em destaque (anel circular)
 *  - Progresso por grupo canônico em barras horizontais (Programação, Redes,
 *    IA, Segurança, Cloud, Outros) — só renderiza grupos com pelo menos uma
 *    apostila publicada
 *  - Mini insight: ponto forte / foco recomendado
 *
 * Recebe props já calculadas pelo DashboardPage para evitar nova consulta.
 */
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Wand2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  CANONICAL_GROUPS,
  GROUP_META,
  type CanonicalGroup,
} from '@/lib/subjectGroups';
import { cn } from '@/lib/utils';

interface Props {
  overallProgress: number; // 0..100 (exercícios respondidos / total)
  overallAccuracy: number; // 0..100 (acertos / respondidos)
  groupProgress: Record<CanonicalGroup, number>;
  groupCounts: Record<CanonicalGroup, number>;
  totalApostilas: number;
}

function CircularProgress({ value, label, sublabel }: { value: number; label: string; sublabel: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg className="-rotate-90" width="92" height="92">
        <circle cx="46" cy="46" r={radius} stroke="hsl(var(--muted))" strokeWidth="7" fill="none" />
        <circle
          cx="46"
          cy="46"
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums">{value}<span className="text-xs">%</span></span>
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <span className="text-[10px] text-muted-foreground mt-1">{sublabel}</span>
    </div>
  );
}

export function OverallProgressCard({
  overallProgress,
  overallAccuracy,
  groupProgress,
  groupCounts,
  totalApostilas,
}: Props) {
  // Filtra grupos com apostilas
  const visibleGroups = CANONICAL_GROUPS.filter((g) => groupCounts[g] > 0);

  // Insights
  const groupsWithProgress = visibleGroups.filter((g) => groupProgress[g] > 0);
  const strongest = groupsWithProgress.length > 0
    ? groupsWithProgress.reduce((a, b) => (groupProgress[a] >= groupProgress[b] ? a : b))
    : null;
  const weakest = groupsWithProgress.length > 1
    ? groupsWithProgress.reduce((a, b) => (groupProgress[a] <= groupProgress[b] ? a : b))
    : null;

  return (
    <Card className="p-5 mb-6 overflow-hidden relative bg-gradient-to-br from-card via-card to-primary/5 border-primary/20">
      {/* Decorative glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-tight">Seu progresso</h2>
              <p className="text-[10px] text-muted-foreground">{totalApostilas} apostilas disponíveis</p>
            </div>
          </div>
          <Link
            to="/desempenho"
            className="text-[11px] text-primary hover:underline flex items-center gap-1"
          >
            Detalhes <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-[auto_1fr] gap-5 items-center">
          {/* Anel geral */}
          <div className="flex justify-center sm:justify-start gap-4">
            <CircularProgress value={overallProgress} label="Conteúdo" sublabel="respondido" />
            <CircularProgress value={overallAccuracy} label="Acerto" sublabel="aproveitamento" />
          </div>

          {/* Barras por grupo */}
          <div className="space-y-2 min-w-0">
            {visibleGroups.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                Comece estudando uma apostila para ver seu progresso por área.
              </p>
            ) : (
              visibleGroups.map((g) => {
                const meta = GROUP_META[g];
                const prog = groupProgress[g] || 0;
                return (
                  <div key={g} className="flex items-center gap-2">
                    <span className="text-base w-5 text-center">{meta.icon}</span>
                    <span className="text-xs font-medium w-20 sm:w-24 truncate" style={{ color: meta.color }}>{g}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(2, prog)}%`,
                          background: `linear-gradient(90deg, ${meta.color}, ${meta.color}aa)`,
                          boxShadow: prog > 5 ? `0 0 8px ${meta.color}55` : undefined,
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground tabular-nums w-8 text-right">{prog}%</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Insights */}
        {(strongest || weakest) && (
          <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap gap-2">
            {strongest && (
              <Badge variant="outline" className={cn('gap-1 text-[10px] py-1 border-success/40 text-success bg-success/5')}>
                <Wand2 className="h-3 w-3" />
                Mandando bem em <strong className="ml-0.5">{strongest}</strong>
              </Badge>
            )}
            {weakest && weakest !== strongest && (
              <Badge variant="outline" className={cn('gap-1 text-[10px] py-1 border-warning/40 text-warning bg-warning/5')}>
                <Target className="h-3 w-3" />
                Foque em <strong className="ml-0.5">{weakest}</strong>
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
