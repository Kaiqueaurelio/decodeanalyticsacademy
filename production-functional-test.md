# Verificação funcional em produção

Data: 19/08/2026.

## Fase 1 — disponibilidade e autenticação

Ao abrir `https://decodeanalyticsacademy.vercel.app/login`, a Vercel exibiu temporariamente um Security Checkpoint. Após aguardar a hidratação, a sessão persistida foi restaurada automaticamente e o app redirecionou para `/admin`.

O Painel Admin carregou com o cabeçalho Decode Analytics Academy, menu lateral completo, contagens de apostilas/exercícios/usuários e botão de retorno à área do aluno. Foi exibido o toast “Sessão restaurada — Você continua conectado”.

A inspeção do console do navegador após a montagem inicial não apresentou mensagens de erro.

## Fase 2 — dashboard e Ella

O dashboard carregou em `/dashboard` com modo administrador ativo, botão de retorno ao painel, busca, sessão ativa, conteúdo de retomada, vagas em destaque, métricas de disciplinas/exercícios/progresso, gamificação, atividades recomendadas, calendário e disciplinas.

A interface da Ella abriu corretamente pelo botão acessível e montou o drawer com avatar, Nova conversa, Virar plano de estudos, textarea e controles do chat.

Falha funcional observada: a Ella exibiu `Assistente indisponível (404)` informando que o modelo `gemini-1.5-flash` não está disponível para `generateContent` na API `v1beta`. Portanto, a interface funciona, mas a resposta da IA não funciona em produção com a configuração atual do provedor/modelo. Isso também impede validar a voz de forma completa.

Foi observado um toast de onboarding no dashboard, porém não bloqueou a navegação.

## Continuação da fase 2

O botão `Retomar leitura` abriu corretamente a rota `/apostila/2f3019d1-2ce9-4fa7-9e54-5d0f7c605915`. O leitor carregou o título da apostila, índice com muitos capítulos, modo estudo, flashcards, conversa com a apostila, modo foco e ações administrativas, sem crash.

De volta ao dashboard, o campo de busca aceitou o termo `computadores`. No estado observado, o restante do conteúdo visível permaneceu igual e não apareceu uma lista de resultados ou indicação de filtragem imediata. Isso deve ser classificado como comportamento a investigar, não como falha definitiva, pois o componente pode filtrar outra seção ou exigir uma ação adicional.

## Tema e navegação

O alternador de tema funcionou: o dashboard mudou para o modo escuro e retornou ao modo claro sem erro visual ou de runtime aparente. O valor digitado na busca permaneceu no campo durante a alternância.

## Portal de Vagas

O Portal de Vagas carregou em produção com 28 oportunidades abertas, 20 empresas e 19 vagas de estágio. A busca por `desenvolvimento` filtrou corretamente os cards ativos para Samsung Brasil, Target Sistemas e Tech Solutions BR. Também permaneceu visível uma seção histórica com conteúdo `Decode Analytics Partner` e marcações literais como `\\*\\*Logicalis\\*\\*`; isso é um problema de apresentação/texto, não de carregamento.

## Detalhes e filtros

O modal da vaga Samsung abriu corretamente e exibiu empresa, localização, modalidade, bolsa/benefícios, descrição, requisitos e CTA oficial. O requisito apareceu como `Cursando CC, EC, SI, ou ADS. Conhecimento em alguma linguagem de programação.`; funcionalmente legível, embora ainda use abreviações de cursos.

Após manter a busca `desenvolvimento` e selecionar o tipo `Estágio`, o portal reduziu o resultado para quatro oportunidades compatíveis, confirmando que os filtros podem ser combinados.

## Candidatura externa

O botão de candidatura da vaga Samsung redirecionou para o anúncio oficial do LinkedIn, que apresentou uma tela pública de autenticação (`https://www.linkedin.com/authwall?...`) antes do conteúdo da vaga. Nenhum formulário foi preenchido e nenhuma candidatura foi enviada. O redirecionamento da Decode funcionou; a exigência de login é do LinkedIn.

## Painel Admin e Performance

O Painel Admin carregou com a versão `v4.1.0`, exibindo 52 apostilas, 299 exercícios, 29 usuários e 9 anúncios. A saúde das apostilas apareceu como `100% OK`, com integridade visual nominal e nenhum alerta crítico no resumo.

A seção Performance, porém, registrou 33 eventos no navegador, tempo médio de 340 ms em 15 carregamentos, 0 páginas lentas, 0 requisições acima de 5 s e 18 erros de rede. Foram observados: `400` em consultas de `profiles` com relações de `user_xp`, `406` em `apostila_likes`, `403` no RPC `increment_xp` e no acesso direto a `exercises`, e `429` na Edge Function `extract-content`. Esses erros devem ser classificados como pendências funcionais/integração, embora os 403 de dados protegidos estejam alinhados ao RLS endurecido.

## Diagnóstico de produção

O Diagnóstico carregou e exibiu latência de API de 42 ms, CPU de 12%, heap de 256 MB, taxa de erro 5xx de 0,01%, 184 conexões ativas e uptime de 99,99%. A infraestrutura foi mostrada como conectada, na região AWS sa-east-1, com SSL/TLS 1.3 e conexões Supabase em 78%. O painel também apresentou um log de estabilidade sem falhas críticas, incluindo handshake Supabase validado, asset principal cacheado, uma latência de 180 ms em `/apoie` marcada como resolvida e varredura de segurança sem vulnerabilidades. Esses indicadores são dados apresentados pelo próprio painel; devem ser confrontados com os erros reais registrados na aba Performance.

## Checklist de fumaça

A seção Testes carregou corretamente e identificou a sessão administrativa de teste. O checklist apresentou cinco verificações aguardando: Login/Sessão, Clonagem por link, Renderização de apostila, Exercícios e Dashboard. O botão `RODAR TODOS` está disponível; a execução ainda não foi iniciada neste registro para separar a montagem da tela da execução das chamadas de diagnóstico.

## Resultado do checklist de fumaça

A execução terminou às 21:18:36 com **4 OK, 1 falha e 0 pulados**. Login/Sessão passou em 408 ms, confirmando a sessão administrativa de teste autenticada. Clonagem por link passou em 2508 ms, mas com aviso da Edge Function. Renderização de apostila passou em 222 ms e carregou `APOSTILA BUSCA HEURÍSTICA 22/04/26` com 14.128 caracteres. Exercícios falhou em 175 ms com `permission denied for table exercises`. Dashboard passou em 204 ms, retornando 52 apostilas, 23 concluídas e streak 1. A falha de exercícios confirma que o checklist ainda tenta acesso direto a uma tabela protegida e deve ser adaptado a uma RPC/view segura, sem enfraquecer o RLS.
