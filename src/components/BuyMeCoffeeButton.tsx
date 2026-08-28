import { Coffee, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BuyMeCoffeeButtonProps {
  variant?: 'default' | 'minimal' | 'accent';
  size?: 'small' | 'medium' | 'large';
  text?: string;
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  small: 'min-h-9 gap-1.5 px-3 text-xs',
  medium: 'min-h-10 gap-2 px-4 text-sm',
  large: 'min-h-12 gap-2.5 px-5 text-base',
};

const iconClasses = {
  small: 'h-4 w-4',
  medium: 'h-[18px] w-[18px]',
  large: 'h-5 w-5',
};

const variantClasses = {
  default: 'border-border/70 bg-card text-foreground hover:border-primary/45 hover:bg-primary/5',
  minimal: 'border-primary/25 bg-primary/10 text-foreground hover:border-primary/50 hover:bg-primary/15',
  accent: 'border-[#5F7FFF]/70 bg-[#5F7FFF] text-white shadow-[0_8px_24px_rgba(95,127,255,0.24)] hover:bg-[#526ff0]',
};

export default function BuyMeCoffeeButton({
  variant = 'default',
  size = 'medium',
  text = 'Seja um apoiador',
  showText = true,
  className,
}: BuyMeCoffeeButtonProps) {
  return (
    <a
      href="https://www.buymeacoffee.com/decodeanalyticsacademy"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Apoiar a Decode Analytics Academy no Buy Me a Coffee"
      className={cn(
        'inline-flex max-w-full items-center justify-center rounded-xl border font-semibold no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
    >
      <Coffee className={cn('shrink-0', iconClasses[size])} aria-hidden="true" />
      {showText ? <span className="truncate">{text}</span> : <span className="sr-only">{text}</span>}
      {showText ? <Heart className="h-3.5 w-3.5 shrink-0 opacity-75" aria-hidden="true" /> : null}
    </a>
  );
}
