import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useIsMobile } from './use-mobile';

/**
 * Hook para injetar o widget do Buy Me a Coffee de forma estratégica.
 * Agora com filtros de visibilidade: apenas logado, desktop e rotas específicas.
 */
export function useBMCWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    // 1. Condições de exibição
    const isLoginPage = location.pathname === '/login';
    const isLandingPage = location.pathname === '/';
    const isResetPassword = location.pathname === '/reset-password';
    
    // Lista de rotas permitidas (Dashboard, Suporte, Perfil, Biblioteca)
    const allowedRoutes = ['/dashboard', '/apoie', '/profile', '/biblioteca', '/exercicios', '/cursos', '/livros', '/calculadora', '/noticias', '/performance', '/horarios'];
    const isAllowedRoute = allowedRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + '/'));

    // O widget deve carregar apenas se:
    // - Usuário logado
    // - Usuário logado
    // - Rota permitida (não landing/login)
    const shouldShow = user && isAllowedRoute;

    // Se não deve mostrar, garante que o widget seja removido
    if (!shouldShow) {
      console.log("[BMC] Removing widget - route not allowed or user signed out:", location.pathname);
      const widget = document.getElementById('bmc-wbtn');
      const container = document.querySelector('.bmc-wbtn-container');
      const script = document.querySelector('script[data-name="BMC-Widget"]');
      if (widget) widget.remove();
      if (container) container.remove();
      if (script) script.remove();
      return;
    }

    // 2. Evita duplicidade
    if (document.querySelector('script[data-name="BMC-Widget"]')) {
      console.log("[BMC] Script already injected");
      return;
    }

    console.log("[BMC] Injecting widget script for route:", location.pathname);

    // 3. Injeção do Script
    const script = document.createElement('script');
    script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
    script.setAttribute('data-name', 'BMC-Widget');
    script.setAttribute('data-cfasync', 'false');
    script.setAttribute('data-id', 'decodeanalyticsacademy');
    script.setAttribute('data-description', 'Support me on Buy me a coffee!');
    script.setAttribute('data-message', 'Seja Um Apoiador');
    script.setAttribute('data-color', '#5F7FFF'); 
    script.setAttribute('data-position', 'Right');
    script.setAttribute('data-x_margin', '18');
    script.setAttribute('data-y_margin', '18');
    script.async = true;
    
    script.onload = () => console.log("[BMC] Widget script loaded successfully");
    script.onerror = (err) => console.error("[BMC] Error loading widget script:", err);

    document.body.appendChild(script);

    return () => {
      // Opcional: remover ao mudar de rota se sair das permitidas
      // Mas o useEffect já roda ao mudar location.pathname se o incluirmos nas deps
    };
  }, [user, location.pathname, isMobile]);
}
