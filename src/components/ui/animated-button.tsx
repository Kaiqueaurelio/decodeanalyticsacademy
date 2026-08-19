import * as React from 'react';

import { cn } from '@/lib/utils';
import { motionTokens } from '@/lib/motion';
import { Button, type ButtonProps } from './button';

export type AnimatedButtonProps = ButtonProps;

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, style, ...props }, ref) => (
    <Button
      ref={ref}
      className={cn(
        'active:scale-[0.98] motion-safe:hover:-translate-y-px motion-safe:hover:shadow-[0_8px_24px_rgba(0,0,0,0.14)]',
        'transition-[transform,box-shadow,background-color,border-color,color,opacity] ease-out',
        className,
      )}
      style={{ transitionDuration: `${motionTokens.duration.fast}ms`, ...style }}
      {...props}
    />
  ),
);

AnimatedButton.displayName = 'AnimatedButton';

export { AnimatedButton };
