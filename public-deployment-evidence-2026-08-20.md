# Evidências públicas de deployment — 2026-08-20

## URLs verificadas

- Lovable: https://decodeanalyticsacademy.lovable.app/
- Vercel: https://decodeanalyticsacademy.vercel.app/

Ambas responderam HTTP 200 na verificação realizada em 20/08/2026.

## Bundles públicos

Lovable carregou `https://decodeanalyticsacademy.lovable.app/assets/index-CgbQBGQN.js` e o chunk do Workbench `https://decodeanalyticsacademy.lovable.app/assets/AdminApostilaWorkbench-BIpX5f3B.js` (53.958 bytes).

Vercel carregou `https://decodeanalyticsacademy.vercel.app/assets/index-DiN1PBWL.js` e o chunk do Workbench `https://decodeanalyticsacademy.vercel.app/assets/AdminApostilaWorkbench-C0PXx_Vn.js` (53.167 bytes).

Os dois chunks públicos contêm o label `+ PÁGINA`, `expanded=1` e `type=button`, mas não contêm as strings `createApostilaPage`, `createPersistedPage` ou `Nova página criada`. O trecho público de carregamento ainda contém o comportamento antigo que, quando a página selecionada não é localizada, remove o parâmetro `page` com `history.replaceState`, em vez de aguardar/recarregar a página recém-criada. O Workbench público também não contém um `insert` de `apostila_pages`; o `insert` encontrado refere-se ao upload de materiais.

## Projeto Vercel

A integração Vercel identificou o time `Decode Analytics 's projects`, ID `team_LnkDNL4ePqO2htyZHAaWSqPT`, e o projeto `decodeanalyticsacademy`, ID `prj_IHMPtZYFNAwnEU5Hn4Pj2P9yEGd2`.

O projeto informa `framework: vite`, `live: false`, e deployment de produção mais recente `dpl_C6WCzVEEfRU3EnM3EbNddhyGUV7J`, URL `decodeanalyticsacademy-d1kjnss1c-decode-analytics-s-projects.vercel.app`, estado `BLOCKED`, associado ao commit `fe2d6f8359db385c97bd2c8a33b804b0b830e617` (`docs: add apostila verification proof`).

Os deployments anteriores associados aos commits `a334fc3a` e `8cc354d4` também aparecem como `BLOCKED`. O deployment associado ao commit `bc025533` (`fix: harden apostila page creation and content isolation`) aparece como `BLOCKED`.

## Reprodução local autenticada

No Workbench local em `http://localhost:4175`, o clique real no botão `+ PÁGINA` foi reproduzido. Antes havia 1 página; depois houve 2. Foi criado o registro:

- ID: `e9923dc3-33be-4023-9567-ed7c9726caf6`
- Título: `Nova Página — 20/08/2026`
- Posição: `2`
- Conteúdo inicial: vazio
- URL aberta: `http://localhost:4175/admin/apostilas/b132f212-5ede-4522-92d3-b0ead2cd8ce2?page=e9923dc3-33be-4023-9567-ed7c9726caf6&expanded=1`

O botão identificado tinha texto `+ PÁGINA`, `disabled: false` e `type: button`. A tela mostrou `Nova página criada. Você já está editando a página nova.`

## Preview Vercel criado para validação

Foi criado no projeto existente um preview a partir do commit `fe2d6f8359db385c97bd2c8a33b804b0b830e617`:

- Deployment: `dpl_DuttCguz5oqQGrbnV6uHArYQ5xqL`
- URL: `https://decodeanalyticsacademy-3ahm4fmdb-decode-analytics-s-projects.vercel.app`
- Estado final: `READY`
- Chunk do Workbench: `assets/AdminApostilaWorkbench-BWkuxeiM.js`
- Tamanho do chunk: 55.764 bytes
- Marcadores encontrados no chunk: `Nova página criada`, `apostila_pages`, `A criação de páginas não está habilitada` e `type:"button"`.

Isso comprova que o checkout corrigido constrói e é servido corretamente no preview. O domínio de produção continua apontando para deployments `BLOCKED`; o erro oficial do deployment bloqueado direciona à documentação de configuração de conta da Vercel (`account-configuration`). A proteção de senha, SSO e IP do projeto está desativada, portanto o bloqueio não é causado por essas proteções do projeto.

## Estado atual dos dados da apostila alvo

- Apostila `b132f212-5ede-4522-92d3-b0ead2cd8ce2`: conteúdo principal com 52.798 caracteres e sem `19/08/2026`.
- Página de aula `812c2375-dc09-460e-a964-1bba36d586ba`: `Parte 2 — Continuação (19/08/2026)`, 49.879 caracteres, com todos os marcadores da aula de 19/08.
- Página de teste criada pela reprodução local: `e9923dc3-33be-4023-9567-ed7c9726caf6`, título `Nova Página — 20/08/2026`, posição 2, conteúdo vazio, criada em `2026-08-20T04:05:11.088349+00:00`.
