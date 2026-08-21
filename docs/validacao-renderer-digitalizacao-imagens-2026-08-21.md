# Validação do renderer — digitalização de imagens

Data: 21/08/2026
Rota local: `/reader/244d7b3f-f4eb-492c-8e12-12c87b8f6e17?lesson=page:5089d90c-4f3f-4624-9014-b655136ec3f1`

## Evidências observadas

Após recarga com cache-busting, o leitor passou a mostrar **7 seções** no sumário, em vez de 12. As linhas técnicas `1 bit: 2¹`, `2 bits: 2²`, `3 bits: 2³`, `8 bits: 2⁸` e `12 bits: 2¹²` deixaram de ser headings e não aparecem mais como itens do sumário.

Os headings editoriais foram renderizados como `H2`, com títulos normalizados: `Resolução Espacial: Quantos Pixels Formam a Foto`, `Resolução de Intensidade: Quantos Níveis de Brilho Cada Pixel Pode Ter`, `Redução de Níveis de Cinza: Efeitos da Quantização`, `Palavras-Chave e Definições Importantes`, `Tabela e Resumo: Comparando as Duas Resoluções`, `Pontos Essenciais para Estudo e Revisão` e `4 Aplicação em Radiologia e Exames de Raio‑X`.

A checagem do DOM confirmou **9 imagens**, **1 elemento de áudio** e um controle de reprodução. O conteúdo salvo não foi alterado; a transformação ocorre somente na apresentação feita pelo renderer.

A separação de prefixos numéricos colados funcionou após o recarregamento: os links do sumário passaram a conter `1 Resolução...`, `2 Resolução...` etc. Foi adicionada uma separação explícita entre o contador e o texto para que extratores e leitores de tela não concatenem os valores.

## Observação pendente

A captura imediata após navegação pode mostrar a tela de carregamento por alguns instantes; a validação final deve ser feita após a renderização completa. O servidor local continua servindo a versão atualizada, sem service worker controlador (`navigator.serviceWorker.controller === null`).

## Gates já executados

- TypeScript: aprovado.
- Vitest: aprovado (saída completa preservada no terminal).
- Vite build/PWA: aprovado; há apenas avisos preexistentes de chunks acima de 500 kB.
- `git diff --check`: executado sem erro na cadeia de gates.
