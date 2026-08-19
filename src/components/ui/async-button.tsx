import * as React from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { AnimatedButton, type AnimatedButtonProps } from './animated-button';
import type { AsyncStatus } from '@/lib/motion';

export interface AsyncButtonProps extends Omit<AnimatedButtonProps, 'children'> {
  status?: AsyncStatus;
  idleLabel: React.ReactNode;
  loadingLabel?: React.ReactNode;
  successLabel?: React.ReactNode;
  errorLabel?: React.ReactNode;
  showStatusIcon?: boolean;
}

const AsyncButton = React.forwardRef<HTMLButtonElement, AsyncButtonProps>(
  (
    {
      status = 'idle',
      idleLabel,
      loadingLabel = 'Processando…',
      successLabel = 'Concluído',
      errorLabel = 'Tentar novamente',
      showStatusIcon = true,
      className,
      disabled,
      'aria-live': ariaLive = 'polite',
      ...props
    },
    ref,
  ) => {
    const isUnavailable = disabled || status === 'loading' || status === 'success' || status === 'disabled';
    const label = status === 'loading'
      ? loadingLabel
      : status === 'success'
        ? successLabel
        : status === 'error'
          ? errorLabel
          : idleLabel;

    return (
      <AnimatedButton
        ref={ref}
        className={cn(
          'min-w-[10rem] justify-center',
          status === 'success' && 'bg-emerald-500 text-white hover:bg-emerald-500',
          status === 'error' && 'border-red-400/60 text-red-100 hover:border-red-300',
          className,
        )}
        disabled={isUnavailable}
        aria-live={ariaLive}
        aria-busy={status === 'loading'}
        data-async-status={status}
        {...props}
      >
        <span className="inline-flex min-w-0 items-center justify-center gap-2" key={status}>
          {showStatusIcon && status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {showStatusIcon && status === 'success' && <Check className="h-4 w-4" aria-hidden="true" />}
          {showStatusIcon && status === 'error' && <AlertCircle className="h-4 w-4" aria-hidden="true" />}
          <span className="truncate">{label}</span>
        </span>
      </AnimatedButton>
    );
  },
);

AsyncButton.displayName = 'AsyncButton';

export { AsyncButton };
