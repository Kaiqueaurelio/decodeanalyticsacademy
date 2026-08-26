# Relatório da Plataforma Decode Analytics Academy

**Data do relatório:** 26/08/2026  
**Repositório:** [Kaiqueaurelio/decodeanalyticsacademy](https://github.com/Kaiqueaurelio/decodeanalyticsacademy)  
**Branch principal:** `main`  
**Linha de desenvolvimento:** `develop/v1.1.0-dev`  
**Versão estável registrada:** `v1.0.0`

## 1. Resumo executivo

A Decode Analytics Academy é uma plataforma educacional digital voltada principalmente para estudantes de Ciência da Computação, Sistemas de Informação, Engenharia da Computação e áreas relacionadas. O sistema combina autenticação, dashboard acadêmico, organização de disciplinas por semestre, apostilas, leitor estruturado, exercícios, simulados, progresso, notas, flashcards, materiais complementares e uma assistente virtual chamada Ella.

A aplicação utiliza React, Vite, TypeScript, Tailwind CSS, Lucide React, Framer Motion e Supabase. O Supabase concentra autenticação, banco de dados, políticas de segurança, funções de backend, registros de auditoria e dados acadêmicos. A Vercel é o ambiente previsto para publicação web, enquanto o GitHub funciona como fonte de controle de versão.

O código passou pelas validações técnicas mais recentes com TypeScript sem erros e **126 testes aprovados em 21 arquivos**. O principal problema operacional ainda identificado é a divergência entre o código atualizado no GitHub e o deployment público antigo da Vercel. O domínio público chegou a continuar servindo um bundle anterior, razão pela qual a apostila e o avatar da Ella não refletiam as correções mais recentes.

## 2. Objetivo da plataforma

A plataforma foi projetada para oferecer um ambiente de estudos completo e centralizado. O aluno pode acessar materiais organizados por curso, semestre e disciplina, estudar apostilas em diferentes formatos, acompanhar seu progresso, revisar assuntos e utilizar ferramentas de apoio durante a preparação acadêmica.

A proposta combina conteúdo didático e acompanhamento de aprendizagem em uma experiência única, com foco em estudantes de tecnologia. A estrutura permite que conteúdos criados por administradores sejam publicados de forma controlada e que cada aluno visualize somente os materiais compatíveis com seu curso, semestre e escopo de acesso.

## 3. Fluxo de utilização pelo aluno

O fluxo principal começa pelo login. Depois de autenticado, o aluno acessa o dashboard e visualiza os materiais disponíveis, seus indicadores de estudo e os atalhos para as áreas mais importantes.

A navegação principal utiliza uma sidebar responsiva. No desktop, ela pode ser expandida ou recolhida. No celular, o app utiliza topbar e navegação adaptadas à tela. A preferência de recolhimento da sidebar é mantida entre as abas para evitar que o layout mude inesperadamente durante a navegação.

O conteúdo é filtrado de acordo com curso, semestre, matéria, publicação e escopo. Uma apostila publicada no curso `CC`, por exemplo, deve aparecer para alunos compatíveis com esse curso e com o semestre classificado para o material.

## 4. Módulos principais

| Módulo | Função |
|---|---|
| Dashboard | Apresenta resumo dos estudos, atalhos, materiais e progresso. |
| Apostilas | Lista materiais acadêmicos por curso, semestre e disciplina. |
| Leitor clássico | Exibe o conteúdo principal salvo na apostila. |
| Leitor estruturado | Organiza módulos, capítulos e lições com progresso individual. |
| Aula do Dia | Destaca conteúdos associados a uma data de aula. |
| Exercícios | Permite praticar conteúdos e consultar explicações. |
| Simulados | Reúne avaliações para testar conhecimento. |
| Gabaritos | Exibe respostas e comentários dos exercícios ou simulados. |
| Desempenho | Mostra indicadores e evolução do aluno. |
| Plano de Estudos | Auxilia na organização da rotina de estudo. |
| Flashcards | Apoia revisão e memorização de conceitos. |
| Caderno e notas | Permite registrar observações e anotações pessoais. |
| Biblioteca | Reúne livros, materiais e conteúdos complementares. |
| Vídeos e cursos | Disponibiliza recursos audiovisuais e trilhas de aprendizagem. |
| Perfil | Exibe e permite gerenciar dados do usuário. |
| Ella | Assistente virtual para dúvidas e apoio durante os estudos. |
| Painel administrativo | Permite criar, editar, organizar e publicar materiais. |

## 5. Apostilas e conteúdo acadêmico

As apostilas podem conter conteúdo textual simples ou uma estrutura mais detalhada. O leitor estruturado trabalha com módulos, capítulos e lições. Quando não existe uma árvore estruturada completa, o sistema tenta usar páginas salvas pelo editor ou o conteúdo principal da apostila como fallback.

O renderer compartilhado foi preparado para preservar diferentes tipos de conteúdo:

- títulos e subtítulos;
- parágrafos e blocos de texto;
- listas numeradas e listas com marcadores;
- tabelas Markdown e tabelas HTML;
- imagens e links;
- fórmulas matemáticas;
- blocos de código;
- citações e caixas de aviso;
- áudio e conteúdos multimídia;
- conteúdo legado com HTML e marcadores escapados.

O leitor também registra progresso, conclusão de lições, favoritos, notas e retomada do ponto em que o aluno parou. As datas de aula podem ser extraídas dos registros e usadas para filtrar o conteúdo.

## 6. Apostila de Cálculo Numérico

A apostila enviada foi registrada no Supabase novo e teve sua classificação corrigida para ser reconhecida pelos filtros do dashboard.

| Campo | Valor |
|---|---|
| Título | Apostila de Cálculo Numérico |
| Matéria informada | Cálculo Computacional |
| Categoria canônica | Cálculo Numérico Computacional |
| Semestre | 6 |
| Curso | `CC` |
| Escopo | `full` |
| Publicada | Sim |
| Status | `liberada` |
| Data da aula | 25/08/2026 |
| ID | `38deb8b2-4b6a-437d-a148-526cab61508e` |

O conteúdo publicado foi comparado com o arquivo enviado. O tamanho e o hash do conteúdo gravado foram conferidos, preservando aproximadamente 1.384 linhas e 29.963 caracteres, além de títulos, tabelas, blocos de código e exercícios.

O link previsto para a apostila é:

[**Abrir Apostila de Cálculo Numérico**](https://decodeanalyticsacademy.vercel.app/apostila/38deb8b2-4b6a-437d-a148-526cab61508e)

A rota é protegida e exige autenticação. Além disso, o domínio público precisa estar servindo o deployment atualizado para consultar o Supabase novo.

## 7. Painel administrativo

O painel administrativo permite criar e editar apostilas, organizar páginas e controlar a publicação dos materiais. O editor possui autosave e trabalha com campos como título, categoria, curso, semestre, status e data da aula.

O campo **Data da Aula** recebeu correções para ser restaurado a partir do banco, marcar o editor como alterado e salvar automaticamente, inclusive quando o usuário sai do campo. A data também é usada na organização temporal do leitor e da Aula do Dia.

A criação da apostila de Cálculo Numérico revelou um problema no trigger de validação de cronologia. A função tentava ler `NEW.apostila_id` quando era acionada na tabela principal `apostilas`. O trigger foi corrigido para tratar corretamente registros de apostilas e páginas, e a correção foi registrada em migração.

## 8. Assistente Ella

A Ella é a assistente virtual da plataforma. Ela aparece como um elemento flutuante e pode ser utilizada para apoiar o aluno com dúvidas, explicações e orientação sobre o conteúdo.

O funcionamento depende do frontend, que exibe o avatar e a interface de conversa, e das funções de backend/Edge Functions, que processam as solicitações e respeitam regras de autorização e escopo.

O avatar foi padronizado para utilizar o asset local e versionado `src/assets/ella-avatar-v5.png`. Isso evita diferenças entre Lovable, Vercel, landing page, sidebar e chat causadas por um asset remoto antigo do Lovable Cloud ou por um fallback público com proporção diferente.

No entanto, o domínio Vercel verificado anteriormente ainda chegou a servir um bundle antigo que exibia o avatar anterior. A correção está no GitHub, mas somente será visível publicamente quando o deployment atualizado for liberado e publicado.

## 9. Segurança e autorização

O sistema utiliza autenticação e políticas de Row Level Security para controlar acesso aos dados. A separação entre aluno, administrador e escopos específicos é importante para evitar exposição de conteúdos restritos.

As principais camadas de proteção são:

| Camada | Finalidade |
|---|---|
| Autenticação | Identificar o usuário e estabelecer a sessão. |
| Perfil e função | Diferenciar alunos, administradores e permissões especiais. |
| RLS | Restringir linhas consultadas ou alteradas por usuário e escopo. |
| Publicação | Impedir que materiais não liberados apareçam para alunos. |
| Curso e semestre | Controlar a visibilidade acadêmica dos materiais. |
| Escopo de conteúdo | Restringir materiais completos, ENEM ou grupos específicos. |
| Edge Functions | Processar operações de backend com validação de autorização. |
| Auditoria | Registrar eventos relevantes e inconsistências. |
| Sanitização | Reduzir risco de XSS em HTML e conteúdo dinâmico. |

Funções sensíveis, como exclusão de conta e operações administrativas, exigem autenticação. Conteúdos públicos devem ser deliberadamente marcados como públicos, e não expostos por ausência de política.

## 10. Supabase e banco de dados

O Supabase novo utilizado pela plataforma é o projeto `wxkkpjpqyrygglbuogsd`. Ele substituiu a instância antiga que ainda era referenciada por deployments anteriores da Vercel.

O banco concentra tabelas e funções para usuários, perfis, apostilas, páginas, módulos, capítulos, lições, progresso, favoritos, notas, exercícios, registros de auditoria e configurações de acesso.

Foram implantadas ou revisadas funções de backend como autenticação RA, chat da apostila, MCP e geração de exercícios. Também foram aplicados ajustes de segurança em políticas RLS, funções `SECURITY DEFINER` e handlers relacionados à Ella.

## 11. Cache, PWA e atualização do app

A aplicação pode funcionar como PWA e utiliza service workers. Esse recurso exige cuidado porque HTML, JavaScript e service workers antigos podem continuar sendo servidos pelo navegador.

Foram aplicadas as seguintes medidas:

- HTML e rotas SPA configurados para não serem armazenados em cache;
- `sw.js`, `sw-push.js` e manifesto configurados para revalidação adequada;
- assets versionados mantidos com cache de longa duração;
- recuperação de chunks antigos centralizada no ErrorBoundary;
- remoção do temporizador agressivo que confundia carregamento lento com erro de cache;
- limpeza seletiva dos caches do app-shell;
- preservação do service worker de push;
- fallback manual mantido apenas para falhas reais de importação ou carregamento.

O fluxo desejado de atualização é:

> Lovable → GitHub → Vercel → usuário final

Cada atualização publicada pela Lovable deve chegar ao GitHub e, com o projeto Vercel corretamente conectado, disparar um novo deployment automaticamente.

## 12. Interface e experiência do aluno

A interface utiliza tema escuro, contraste alto e detalhes em verde-limão, com identidade visual tecnológica. A sidebar compartilhada foi criada para manter consistência entre as abas autenticadas do aluno.

As principais melhorias aplicadas foram:

- sidebar consistente entre as telas autenticadas;
- topbar padronizado para desktop e mobile;
- preferência de sidebar preservada durante a navegação;
- conteúdo respeitando a largura da sidebar expandida ou recolhida;
- botões de ícone com dimensões mínimas e proporção circular;
- layouts específicos preservados para dashboard e painel administrativo;
- suporte a modo de foco no leitor;
- navegação móvel mais previsível.

## 13. Estrutura técnica

| Camada | Tecnologia ou recurso |
|---|---|
| Frontend | React, TypeScript e Vite |
| Estilos | Tailwind CSS |
| Componentes | Componentes próprios e Lucide React |
| Animações | Framer Motion |
| Estado de dados | TanStack Query e hooks próprios |
| Autenticação | Supabase Auth |
| Banco de dados | PostgreSQL gerenciado pelo Supabase |
| Segurança de dados | RLS e funções autorizadas |
| Backend | Supabase Edge Functions |
| Publicação prevista | Vercel |
| Controle de versão | GitHub |
| PWA | Manifesto e service workers |
| Testes | Vitest, Testing Library e TypeScript |

## 14. Histórico de versões e commits relevantes

| Referência | Alteração |
|---|---|
| `v1.0.0` | Primeira versão estável registrada. |
| `25c77baf` | Correção do autosave da data da aula. |
| `5fb365b2` | Melhoria do layout do dashboard do aluno. |
| `27c66b95` | Padronização do layout das abas autenticadas. |
| `2f8c7a59` | Persistência da preferência da sidebar. |
| `46b0cf77` | Uso do avatar local da Ella nos ambientes. |
| `479a5049` | Headers contra entrypoints antigos em cache. |
| `12017c04` | Alinhamento da fonte de dados Vercel e controles móveis. |
| `44f0b9f1` | Registro da preparação `v1.1.0-dev`. |
| `35787cc9` | Correção do teste de lista numerada e estado atual do `main`. |

A linha `develop/v1.1.0-dev` também contém as correções de leitor, cache seletivo e carregamento resiliente, com o commit `7313bfae`.

## 15. Validações realizadas

As validações mais recentes produziram os seguintes resultados:

| Verificação | Resultado |
|---|---:|
| TypeScript (`tsc --noEmit`) | Aprovado |
| Testes automatizados | 126 aprovados em 21 arquivos |
| Checagem de diferenças (`git diff --check`) | Aprovado |
| Teste da apostila | Conteúdo publicado e íntegro |
| Teste de classificação | Categoria e semestre corrigidos |
| Teste de cache | Headers e recuperação revisados |
| Teste do avatar | Asset local versionado no código |
| Estado do GitHub | `main` limpo e sincronizado |

Há avisos antigos de ESLint relacionados a usos de `any` em partes do leitor e a uma dependência de hook. Eles não impediram o TypeScript nem os testes, mas representam uma oportunidade de limpeza técnica posterior.

O build de produção do sandbox também enfrentou encerramento por pressão de memória durante a minificação de milhares de módulos. Esse comportamento foi de infraestrutura do ambiente de validação, não uma falha de TypeScript detectada.

## 16. Situação Lovable e Vercel

O GitHub contém o código atualizado, mas o domínio `decodeanalyticsacademy.vercel.app` foi verificado servindo um deployment antigo. A resposta HTTP manteve o mesmo `ETag` e o mesmo horário de publicação anterior, enquanto o bundle ainda continha referências do Supabase antigo e o texto antigo de cache.

Os deployments exibidos no painel apareceram como **Blocked** em vários branches, incluindo `main` e `develop/v1.1.0-dev`. A integração disponível não tinha acesso à equipe proprietária do projeto, e o painel da Vercel abriu repetidamente na tela de login.

Isso significa que existem duas realidades no momento:

| Ambiente | Situação |
|---|---|
| GitHub `main` | Código atualizado e publicado. |
| Supabase novo | Apostila criada, publicada e classificada. |
| Lovable/GitHub | Alterações presentes nos branches disponíveis. |
| Vercel pública | Pode continuar servindo deployment antigo até liberação do projeto. |
| Projeto Vercel | Requer conta/equipe correta e desbloqueio do deployment. |

A correção definitiva no ambiente público exige autenticar na conta proprietária da Vercel, conectar o repositório correto, usar `main` como branch de produção, liberar a proteção se necessário e executar o redeploy. Sem essa autorização externa, não é possível substituir remotamente o deployment antigo.

## 17. Procedimento recomendado para publicação automática

O procedimento recomendado é conectar o projeto Vercel ao repositório GitHub oficial. No painel Vercel, deve-se abrir o projeto, acessar a configuração de integração Git, autorizar o repositório `Kaiqueaurelio/decodeanalyticsacademy` e definir `main` como branch de produção.

Depois dessa configuração inicial, o fluxo normal será automático: uma alteração publicada pela Lovable no GitHub atualizará o `main`, a Vercel detectará o novo commit, executará o build e publicará um deployment. O domínio só deve ser considerado atualizado quando o deployment aparecer como `Ready` e o HTML público apresentar o novo identificador de asset.

## 18. Conclusão

A Decode Analytics Academy possui uma base funcional ampla, com organização acadêmica, leitores de conteúdo, ferramentas de estudo, assistente virtual, painel administrativo e camadas relevantes de autenticação e segurança.

As correções mais importantes de conteúdo, cache, classificação da apostila, avatar da Ella, responsividade e carregamento resiliente já foram feitas no código e no banco. A principal pendência não é mais de implementação local: é a liberação e sincronização do projeto Vercel que atende o domínio público.

Enquanto o deployment correto não for liberado, o usuário final poderá continuar vendo a apostila ausente, o avatar antigo ou a mensagem de cache, mesmo que o GitHub e o Supabase já estejam corrigidos. Após o redeploy do `main`, o link da apostila e as demais correções deverão refletir o estado atual do projeto.

## Referências internas

1. Repositório do projeto: [Kaiqueaurelio/decodeanalyticsacademy](https://github.com/Kaiqueaurelio/decodeanalyticsacademy)
2. Domínio público verificado: [decodeanalyticsacademy.vercel.app](https://decodeanalyticsacademy.vercel.app)
3. Projeto Supabase ativo: `wxkkpjpqyrygglbuogsd`
4. Apostila publicada: `38deb8b2-4b6a-437d-a148-526cab61508e`
