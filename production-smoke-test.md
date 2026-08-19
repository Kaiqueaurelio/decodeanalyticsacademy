# Smoke test de produção — Decode Analytics Academy

Data do teste: 2026-08-19.

## Autenticação

A sessão restaurada inicialmente abriu o painel administrativo e confirmou a navegação admin → área do aluno. Para validar as credenciais fornecidas, a sessão foi encerrada e o formulário de produção foi preenchido com o identificador `G802144` e a senha fornecida pelo usuário. O consentimento de termos já estava marcado (`aria-checked="true"`), sem necessidade de nova seleção. Após confirmação explícita do usuário, o formulário foi enviado; a autenticação concluiu com sucesso e redirecionou para `/dashboard`.

## Dashboard após login

A produção carregou o dashboard com a indicação “Sessão ativa”, o perfil “Aluno / Administrador” e o selo “Modo Administrador Ativo”. O painel exibiu o CTA “Retomar leitura”, o progresso da apostila, oportunidades de estágio, métricas de disciplinas e exercícios, XP/nível, sequência de estudos, conquistas, frequência, atividades, exercícios recomendados, calendário e disciplinas.

Também foram observados os controles de navegação, busca de apostilas/disciplinas, alternância de tema, notificações, saída e abertura da Ella. Os dados renderizados incluíram 19 disciplinas ativas, 30 exercícios resolvidos, progresso geral de 10%, 52 apostilas cadastradas no acervo e 299 exercícios no painel admin anterior.

Até este ponto, login, redirecionamento e renderização inicial do dashboard funcionaram em produção sem mensagem de erro visível.

## Ella e responsividade

A Ella abriu com sucesso como drawer lateral, exibindo avatar, atalhos e textarea de comando. O envio de uma pergunta segura funcionou no fluxo de interação, mas a resposta de produção retornou erro `404`: o modelo `gemini-1.5-pro` não está disponível para a API version `v1beta`/`generateContent`. A própria interface exibiu a ação “Virar plano de estudos”, indicando que o chat montou corretamente, porém o provedor/modelo configurado está incompatível ou indisponível.

Durante a inspeção, o botão flutuante “Abrir Ella” apareceu fora da largura visível do viewport do navegador de teste, com coordenada DOM aproximada x=1193 em uma viewport visual de 900 px. O drawer abriu quando acionado diretamente, mas isso sugere uma oportunidade de correção de responsividade no ponto de entrada do assistente em larguras menores.

## Painel Admin e checklist de fumaça

A sessão autenticada foi reconhecida como Kaique Aurélio e o Painel Admin abriu corretamente. O resumo operacional carregou 52 apostilas, 299 exercícios, 29 usuários e 9 anúncios; a saúde das apostilas apareceu como 100% OK e a integridade visual como nominal.

O checklist de fumaça terminou com 4 OK, 1 falha e 0 pulados. Login/Sessão passou em 188 ms; Clonagem por link passou em 2082 ms, com aviso da Edge Function; Renderização de apostila passou em 168 ms e validou “APOSTILA BUSCA HEURÍSTICA 22/04/26” com 14.128 caracteres; Dashboard passou em 176 ms e retornou 52 apostilas, 23 concluídas e streak 1. O teste de Exercícios falhou em 171 ms com `permission denied for table exercises`. Isso indica que o checklist administrativo ainda tenta consultar diretamente a tabela protegida, enquanto a aplicação deve usar o fluxo seguro/RPC; não é uma falha do carregamento do dashboard, mas precisa ser corrigida no próprio teste ou na permissão do caminho de verificação.

## Performance e erros observados

O painel de Performance mostrou tempo médio de carregamento de 398 ms em 9 carregamentos, 0 páginas lentas acima de 4 s e 0 requisições acima de 5 s. Contudo, registrou 11 erros de rede. Os eventos relevantes foram: `GET /rest/v1/exercises?...correct_answer...` retornando 403, coerente com a proteção dos dados de exercícios; `POST /functions/v1/extract-content` retornando 429, indicando limite/rate limit da Edge Function; e consultas de `profiles` retornando 400 ao selecionar relações `user_xp` e campos de perfil. Esses registros devem ser tratados como pontos de correção, especialmente a consulta de perfil/gamificação e a estratégia de retry/limite da função de extração.

## Diagnóstico administrativo

A tela de Diagnóstico carregou e exibiu latência de API de 42 ms, uso de CPU de 12%, heap de 256 MB, taxa de erro 5xx de 0,01%, 184 conexões ativas e uptime informado de 99,99%. O painel mostra a infraestrutura conectada e o monitoramento pós-deploy ativo. Esses indicadores são saudáveis, mas são agregados da interface; não anulam os 400/403/429 específicos registrados na tela de Performance.

## Portal de Vagas

Com a sessão autenticada, o Portal de Vagas carregou 28 oportunidades abertas, 20 empresas divulgando e 19 vagas de estágio. A busca e o filtro por tipo apareceram, e os cards exibiram empresa, cidade/modelo, bolsa ou benefícios e uma descrição resumida. Foram observadas vagas de São Paulo, Santos, Guarulhos, Campinas e uma vaga remota; portanto, a base não é exclusivamente de São Paulo.

A listagem exibiu os botões `CANDIDATAR-SE` e `Ver detalhes` em todas as oportunidades visíveis. Os anúncios ativos apareceram com texto limpo e legível, mas a seção inferior de oportunidades pesquisadas/não ativas ainda mostrou marcações literais `\\*\\*` em parte do texto sobre Logicalis/LWSA, o que é uma inconsistência de apresentação fora dos cards ativos. O aviso do portal orienta corretamente que a candidatura ocorre no site oficial da empresa.

## Detalhes de vaga

O modal da primeira vaga abriu corretamente para “Estagiário em TI Global”, exibindo empresa, São Paulo (híbrido), tipo, bolsa/benefícios, descrição e requisitos completos. O requisito foi renderizado como texto normal, sem asteriscos no modal ativo. A ação apresentada foi `CANDIDATAR-SE NO SITE DA EMPRESA`, mantendo a candidatura no canal oficial.

## Busca de vagas

A busca por `desenvolvimento` filtrou corretamente os cards para vagas de desenvolvimento, incluindo Samsung Brasil, Target Sistemas e Tech Solutions BR. O filtro reduziu o conjunto ativo, mas também manteve cards históricos/recomendacionais que contêm o termo em sua descrição; isso é coerente com a busca textual ampla, embora a separação visual entre oportunidades ativas e conteúdo de referência pudesse ser mais explícita.

## CTA de candidatura

Ao acionar `CANDIDATAR-SE` na vaga da Samsung Brasil, a plataforma redirecionou para o anúncio oficial da empresa no LinkedIn (`Estágio em Desenvolvimento de Software`, Campinas e Região). O botão abriu a página do anúncio e não enviou candidatura automaticamente, preservando o comportamento seguro esperado.
