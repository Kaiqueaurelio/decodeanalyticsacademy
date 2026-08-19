# Auditoria inicial — Dashboard do Aluno

Data: 2026-08-19

## Fonte de verdade

- Repositório autorizado da aplicação: `Kaiqueaurelio/decodeanalyticsacademy`
- Cópia local: `/home/ubuntu/decodeanalyticsacademy-correct`
- Branch: `main`
- Commit inicial verificado: `6a36c3f6` (`perf: optimize route loading and PWA precache`)
- Domínio de produção verificado anteriormente: `https://decodeanalyticsacademy.vercel.app`
- Stack identificada: React 18, Vite, TypeScript, React Router, TanStack Query, Supabase, Tailwind/shadcn.

## Escopo desta alteração

Melhorar a experiência visual e a hierarquia do Dashboard do Aluno, preservando a navegação retrátil, as consultas existentes, a gamificação server-side, o acesso à Ella e os fluxos de apostilas, exercícios, vagas e administração.

## Observações iniciais

- `DashboardPage.tsx` já reúne muitas funcionalidades, mas a hierarquia da primeira dobra é fragmentada: retomar estudo, vagas, sincronização, resumo, anúncio e saudação aparecem em blocos separados.
- `OverallProgressCard.tsx` já existe e está pronto para ser montado, recebendo dados calculados pela página sem adicionar consulta.
- `GamificationWidget.tsx` já exibe XP, streak e badges, mas pode ser apresentado dentro de uma sequência visual mais clara.
- As consultas do dashboard usam colunas leves e RPCs agregadas, portanto a melhoria deve ser aditiva e não baixar conteúdo pesado.

## Critérios de validação

1. `git diff --check` sem erros.
2. Build TypeScript/Vite concluído.
3. Verificação de imports e ausência de branding não autorizado no trecho alterado.
4. Smoke test visual em desktop e mobile, mantendo sidebar e rotas existentes.
5. Commit focado no repositório correto; publicação em produção será reportada separadamente.

## Alterações implementadas

A primeira dobra agora prioriza o estudo: o aluno encontra a retomada de leitura, oportunidades, saudação e progresso antes da publicidade. O cartão de saudação foi refinado para usar um nome de fallback, uma motivação baseada no progresso real, foco diário e próximo passo coerentes, além de CTAs acessíveis para abrir a trilha de estudo e conversar com Ella.

O `OverallProgressCard` existente foi integrado ao DashboardPage. Ele mostra progresso geral, aproveitamento, progresso por grupos canônicos e insights de ponto forte/foco, usando apenas `apostilas`, `exerciseCounts` e as estatísticas agregadas já carregadas. A gamificação continua server-side e aparece logo após o progresso.

O anúncio e o botão de apoio foram mantidos, mas movidos para depois dos blocos de aprendizagem. O progresso geral passou a ser limitado a 100%. O validador de RA também foi endurecido para rejeitar caracteres extras, corrigindo o teste de login que falhava com `G802144!`.

## Validação

- `git diff --check`: aprovado.
- `npm test`: aprovado — 9 arquivos de teste e 60 testes.
- `npm run build`: aprovado; PWA gerado com aproximadamente 562,59 KiB de precache.
- ESLint focado nos arquivos do dashboard: nenhum erro; permanecem apenas dois avisos preexistentes de dependências de hooks no `DashboardPage.tsx`.
- ESLint global: permanece com erros preexistentes fora do escopo, não corrigidos para evitar uma alteração ampla e arriscada.
- Rota local `/dashboard`: proteção de autenticação preservada; sem sessão, redireciona para `/login?next=%2Fdashboard`.
- Produção: sessão ativa/restaurada foi observada em `https://decodeanalyticsacademy.vercel.app/dashboard`; a versão observada ainda é a anterior ao novo commit.
