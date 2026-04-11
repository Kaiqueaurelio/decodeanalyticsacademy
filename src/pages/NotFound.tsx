import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-extrabold text-gradient">404</h1>
        <p className="text-lg text-muted-foreground">Página não encontrada</p>
        <a href="/" className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline underline-offset-4">
          Voltar ao início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
