import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ShieldBan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlitchLoader } from '@/components/GlitchLoader';

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isAdmin, isBlocked, loading, roleChecked, signOut } = useAuth();

  if (loading || (user && !roleChecked)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <GlitchLoader text="Carregando..." />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (isBlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center max-w-sm space-y-4">
          <div className="mx-auto rounded-full bg-destructive/15 p-4 w-fit">
            <ShieldBan className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Acesso Bloqueado</h1>
          <p className="text-sm text-muted-foreground">
            Sua conta foi bloqueada pelo administrador. Entre em contato com o suporte para mais informações.
          </p>
          <Button variant="outline" onClick={() => signOut()} className="mt-4">
            Sair da conta
          </Button>
        </div>
      </div>
    );
  }

  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
