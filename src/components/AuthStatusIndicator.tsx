import { ShieldCheck, RefreshCw, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function AuthStatusIndicator({ className }: { className?: string }) {
  const { status, isRefreshingToken, user } = useAuth();

  if (!user) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 text-[11px] font-semibold text-destructive',
              className,
            )}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Desconectado</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">Você não está autenticado</TooltipContent>
      </Tooltip>
    );
  }

  if (isRefreshingToken) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 text-[11px] font-semibold text-primary',
              className,
            )}
          >
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span className="hidden sm:inline">Renovando...</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">Renovando token de acesso automaticamente</TooltipContent>
      </Tooltip>
    );
  }

  if (status === 'authenticated') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 text-[11px] font-semibold text-emerald-400',
              className,
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sessão ativa</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">Você está autenticado. O token será renovado automaticamente.</TooltipContent>
      </Tooltip>
    );
  }

  return null;
}
