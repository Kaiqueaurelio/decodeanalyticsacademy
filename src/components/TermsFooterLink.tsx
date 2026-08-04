import { Link, useLocation } from 'react-router-dom';
import { FileText, ShieldCheck } from 'lucide-react';


const HIDDEN_ROUTES = ['/login', '/reset-password'];

type TermsFooterLinkProps = {
  variant?: 'floating' | 'inline';
};

export function TermsFooterLink({ variant = 'floating' }: TermsFooterLinkProps) {
  const location = useLocation();

  if (HIDDEN_ROUTES.includes(location.pathname) || location.pathname === '/termos') return null;
  if (variant === 'floating' && location.pathname !== '/') return null;

  const linkClass =
    variant === 'inline'
      ? 'inline-flex h-8 items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 text-[11px] font-semibold text-muted-foreground shadow-sm transition-colors hover:border-primary/50 hover:text-foreground'
      : 'inline-flex h-8 items-center gap-1.5 rounded-full border border-border/70 bg-background/85 px-3 text-[11px] font-semibold text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground';

  const link = (
    <div className="flex items-center gap-2">
      <Link to="/transparencia" className={linkClass} aria-label="Abrir transparência de dados">
        <ShieldCheck className="h-3.5 w-3.5" /> Transparência
      </Link>
      <Link to="/termos" className={linkClass} aria-label="Abrir termos de uso">
        <FileText className="h-3.5 w-3.5" /> Termos
      </Link>
    </div>
  );


  if (variant === 'inline') return link;

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-20 hidden md:block">
      {link}
    </div>
  );
}
