import React, { useState } from 'react';
import { Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BuyMeCoffeeButtonProps {
  variant?: 'default' | 'minimal' | 'accent';
  size?: 'small' | 'medium' | 'large';
  text?: string;
  showText?: boolean;
  className?: string;
}

export default function BuyMeCoffeeButton({ 
  variant = 'default', 
  size = 'medium',
  text = 'Compre-me um café',
  showText = true,
  className
}: BuyMeCoffeeButtonProps) {
  const [imageUnavailable, setImageUnavailable] = useState(false);
  
  const sizeClasses = {
    small: 'max-w-[150px]',
    medium: 'max-w-[217px]',
    large: 'max-w-[280px]'
  };

  const variantClasses = {
    default: '',
    minimal: 'px-4 py-2 bg-[#f0f4ff] rounded-lg border border-[#5F7FFF]',
    accent: 'px-5 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg shadow-[0_4px_15px_rgba(102,126,234,0.4)] hover:brightness-110'
  };

  return (
    <div className={cn("inline-flex items-center justify-center gap-2", variantClasses[variant], className)}>
      <a 
        href="https://www.buymeacoffee.com/decodeanalyticsacademy" 
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 no-underline transition-all hover:-translate-y-0.5 active:translate-y-0 opacity-100 hover:opacity-90 relative z-[100]"
        title="Apoie nosso projeto no Buy Me a Coffee"
      >
        {!imageUnavailable ? (
          <img
            src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png"
            alt={text}
            className={cn("h-auto block", sizeClasses[size])}
            loading="lazy"
            onError={() => setImageUnavailable(true)}
          />
        ) : (
          <span className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#5F7FFF] px-4 py-2 text-sm font-semibold text-white shadow-sm">
            <Coffee className="h-4 w-4" aria-hidden="true" />
            {text}
          </span>
        )}
        {showText && !imageUnavailable && (
          <span className={cn(
            "text-sm font-semibold text-foreground",
            variant === 'accent' && "text-white"
          )}>
            {text}
          </span>
        )}
      </a>
    </div>
  );
}
