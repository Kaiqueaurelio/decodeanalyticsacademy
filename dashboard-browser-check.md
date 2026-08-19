# Validação em navegador — Dashboard

Data: 2026-08-19

- A prévia local inicialmente bloqueou o host temporário do proxy; a configuração Vite foi ajustada com `server.allowedHosts: [".manus.computer"]` apenas para permitir a inspeção local.
- Após reiniciar a prévia, a rota `/dashboard` carregou corretamente o app e redirecionou para `/login?next=%2Fdashboard` quando não havia sessão local, confirmando que a proteção de rota permanece ativa.
- A tela de login local renderizou sem erro aparente, mantendo a identidade independente da Decode Analytics Academy.
- A produção foi aberta em `https://decodeanalyticsacademy.vercel.app/dashboard`; o navegador encontrou uma sessão ativa/restaurada, mas a captura inicial ainda estava na tela de carregamento/splash e aguarda nova leitura.
