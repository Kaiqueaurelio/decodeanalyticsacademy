import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface PasswordInputProps extends React.ComponentPropsWithoutRef<'input'> {
  containerClassName?: string;
  toggleClassName?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, containerClassName, toggleClassName, id, 'aria-label': ariaLabel, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const selectionRef = React.useRef<{ start: number | null; end: number | null }>({ start: null, end: null });
    const [showPassword, setShowPassword] = React.useState(false);

    const setRefs = React.useCallback((node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    }, [ref]);

    React.useLayoutEffect(() => {
      const input = inputRef.current;
      const selection = selectionRef.current;
      if (!input || selection.start === null || document.activeElement !== input) return;
      input.setSelectionRange(selection.start, selection.end ?? selection.start);
    }, [showPassword]);

    const toggleVisibility = () => {
      const input = inputRef.current;
      if (input) {
        selectionRef.current = {
          start: input.selectionStart,
          end: input.selectionEnd,
        };
      }
      setShowPassword((current) => !current);
    };

    return (
      <div className={cn('relative', containerClassName)}>
        <input
          {...props}
          ref={setRefs}
          id={id}
          type={showPassword ? 'text' : 'password'}
          aria-label={ariaLabel ?? 'Senha'}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-4 py-2 pr-12 text-sm text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground/85',
            'transition-[border-color,box-shadow,background-color] duration-200 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
            'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            className,
          )}
        />
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={toggleVisibility}
          className={cn(
            'absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            toggleClassName,
          )}
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={showPassword}
        >
          {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
