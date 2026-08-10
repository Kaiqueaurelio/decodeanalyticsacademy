import { useEffect } from 'react';

/**
 * Hook para injetar o widget do Buy Me a Coffee de forma estratégica.
 */
export function useBMCWidget() {
  useEffect(() => {
    // Evita duplicidade
    if (document.querySelector('script[data-name="BMC-Widget"]')) return;

    const script = document.createElement('script');
    script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
    script.setAttribute('data-name', 'BMC-Widget');
    script.setAttribute('data-cfasync', 'false');
    script.setAttribute('data-id', 'decodeanalyticsacademy');
    script.setAttribute('data-description', 'Support me on Buy me a coffee!');
    script.setAttribute('data-message', 'Seja Um Apoiador');
    script.setAttribute('data-color', '#5F7FFF'); // Azul conforme solicitado
    script.setAttribute('data-position', 'Right');
    script.setAttribute('data-x_margin', '18');
    script.setAttribute('data-y_margin', '18');
    script.async = true;

    document.body.appendChild(script);

    return () => {
      // Remove o widget ao desmontar, se necessário (opcional para apps SPA)
      const widget = document.getElementById('bmc-wbtn');
      const container = document.querySelector('.bmc-wbtn-container');
      if (widget) widget.remove();
      if (container) container.remove();
    };
  }, []);
}
