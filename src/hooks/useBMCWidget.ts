import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useIsMobile } from './use-mobile';

const BMC_SCRIPT_SELECTOR = 'script[data-name="BMC-Widget"]';
const BMC_STYLE_ID = 'decode-bmc-responsive-style';
const ALLOWED_ROUTES = [
  '/dashboard', '/apoio', '/profile', '/biblioteca', '/exercicios', '/cursos',
  '/livros', '/calculadora', '/noticias', '/performance', '/horarios', '/reader', '/apostila',
];

function removeBMCWidget() {
  document.querySelectorAll('#bmc-wbtn, .bmc-wbtn-container, iframe[title*="Buy Me a Coffee" i]')
    .forEach((element) => element.remove());
  document.querySelector(BMC_SCRIPT_SELECTOR)?.remove();
  document.getElementById(BMC_STYLE_ID)?.remove();
}

/** Exibe o widget apenas onde ele não disputa espaço com a navegação móvel. */
export function useBMCWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    const isAllowedRoute = ALLOWED_ROUTES.some((route) => (
      location.pathname === route || location.pathname.startsWith(`${route}/`)
    ));
    const shouldShow = Boolean(user && isAllowedRoute && !isMobile);

    if (!shouldShow) {
      removeBMCWidget();
      return;
    }

    if (document.querySelector(BMC_SCRIPT_SELECTOR)) return removeBMCWidget;

    const style = document.createElement('style');
    style.id = BMC_STYLE_ID;
    style.textContent = `
      .bmc-wbtn-container { z-index: 45 !important; max-width: calc(100vw - 32px) !important; }
      #bmc-wbtn { max-width: calc(100vw - 32px) !important; }
      @media (max-width: 767px) {
        .bmc-wbtn-container, #bmc-wbtn { display: none !important; }
      }
    `;
    document.head.appendChild(style);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
    script.setAttribute('data-name', 'BMC-Widget');
    script.setAttribute('data-cfasync', 'false');
    script.setAttribute('data-id', 'decodeanalyticsacademy');
    script.setAttribute('data-description', 'Apoie a Decode Analytics Academy');
    script.setAttribute('data-message', 'Seja um apoiador');
    script.setAttribute('data-color', '#5F7FFF');
    script.setAttribute('data-position', 'Right');
    script.setAttribute('data-x_margin', '18');
    script.setAttribute('data-y_margin', '92');
    script.async = true;
    document.body.appendChild(script);

    return removeBMCWidget;
  }, [user, location.pathname, isMobile]);
}
