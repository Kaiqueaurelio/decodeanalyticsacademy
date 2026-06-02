import { Link, useLocation } from 'react-router-dom';
import { FileText } from 'lucide-react';

const HIDDEN_ROUTES = ['/login', '/reset-password'];

export function TermsFooterLink() {
  const location = useLocation();

  if (HIDDEN_ROUTES.includes(location.pathname) || location.pathname === '/termos') return null;

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-3 z-30 hidden md:block">
      <Link
        to="/termos"
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border/70 bg-background/85 px-3 text-[11px] font-semibold text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground"
        aria-label="Abrir termos de uso"
      >
        <FileText className="h-3.5 w-3.5" /> Termos de uso
      </Link>
    </div>
  );
}
