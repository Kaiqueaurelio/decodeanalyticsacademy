# Diagnóstico — Pesquisa Operacional

Data: 19/08/2026.

## Identificação

A apostila foi localizada pelo registro referenciado nas migrações: `b132f212-5ede-4522-92d3-b0ead2cd8ce2`. O título exibido na publicação é `Introdução às Ferramentas de Análise de Dados e Gestão de Projetos Operacionais`, com categoria `Pesquisa Operacional`.

## Evidências na Vercel

Na rota `https://decodeanalyticsacademy.vercel.app/apostila/b132f212-5ede-4522-92d3-b0ead2cd8ce2`, a página de detalhes monta, mas o conteúdo principal exibido é apenas `Conteúdo em processamento para Introdução às Ferramentas de Análise de Dados e Gestão de Projetos Operacionais.`. O índice mostra `1 Introdução` e `1.1 Introdução e Resumo`, e a página informa `2 seções` e `2 exercícios`.

A tentativa de abrir `/apostila/{id}/read` voltou para a landing page porque essa rota não existe no roteador atual. A rota declarada no código é `/reader/:id`.

Na rota correta `https://decodeanalyticsacademy.vercel.app/reader/b132f212-5ede-4522-92d3-b0ead2cd8ce2`, o leitor estruturado montou conteúdo real e extenso: `Visão geral`, índice com capítulos de Excel, Power BI, Pesquisa Operacional, Gestão de Projetos, Projeto E-commerce e Resolução de Problemas; também exibiu texto detalhado sobre propósito, estrutura, competências, fórmulas e aplicações. A árvore mostrou `Progresso 0/3 · 0%`, um módulo de conteúdo, capítulo de introdução e páginas da apostila.

## Diagnóstico provisório

O conteúdo não foi perdido no banco/leitor estruturado. O problema observado é de **apresentação/rota na página de detalhes**: o campo principal `apostilas.content` está servindo um placeholder, enquanto o conteúdo real está nas lições/páginas retornadas pelo leitor estruturado. Além disso, o botão da página de detalhes deve apontar para `/reader/{id}`, não para `/apostila/{id}/read`.

A consulta REST anônima ao Supabase retornou zero linhas para o ID devido às políticas de acesso; isso não foi tratado como prova de ausência de dados. A confirmação veio pela sessão autenticada no leitor publicado, que exibiu o conteúdo completo.

## Correção implementada

A página `src/pages/ApostilaPage.tsx` agora identifica placeholders no campo principal, consulta a árvore segura do leitor e carrega o conteúdo de `apostila_lessons` para montar as seções da página de detalhes. O conteúdo real é usado também no preview, no cálculo do tempo de leitura e no botão de leitura em voz. O botão `Modo estudo` foi corrigido de `/apostila/{id}/read` para a rota declarada `/reader/{id}`.

O estado do fallback é limpo a cada troca de apostila para impedir que conteúdo antigo apareça durante a hidratação.

## Validação local

`npx tsc --noEmit --pretty false`: aprovado.

`./node_modules/.bin/vite build`: aprovado; PWA gerado com 28 arquivos precache e 569,18 KiB. O aviso de chunks acima de 500 KiB já existia na arquitetura do bundle e não impediu a compilação.

A validação autenticada da página local ficou limitada porque a sessão do domínio publicado não é compartilhada com `localhost`; a confirmação visual do conteúdo estruturado foi feita na rota publicada `/reader/{id}` antes da correção, demonstrando que as lições existem e podem ser reutilizadas pela página de detalhes.
