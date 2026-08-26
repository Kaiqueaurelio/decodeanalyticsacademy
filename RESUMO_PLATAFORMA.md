# Resumo da Decode Analytics Academy

## Visão geral

A **Decode Analytics Academy** é uma plataforma educacional digital para estudantes de Ciência da Computação, Sistemas de Informação, Engenharia da Computação e áreas relacionadas. Ela reúne conteúdo acadêmico, apostilas, exercícios, simulados, acompanhamento de progresso e ferramentas de apoio em um único ambiente.

O aluno acessa a plataforma por login, entra no dashboard e navega pelas disciplinas organizadas por curso, semestre e matéria. A interface foi projetada para funcionar em desktop e celular, com sidebar responsiva, topbar móvel e tema escuro com identidade tecnológica.

## Principais recursos

| Área | Função |
|---|---|
| Dashboard | Resume os estudos, materiais e progresso do aluno. |
| Apostilas | Organiza os materiais por curso, semestre e disciplina. |
| Leitor | Exibe conteúdo clássico ou estruturado em módulos, capítulos e lições. |
| Exercícios e simulados | Permitem praticar e avaliar o conhecimento. |
| Gabaritos | Apresentam respostas e explicações. |
| Desempenho | Mostra a evolução acadêmica. |
| Plano de estudos | Ajuda a organizar a rotina de aprendizagem. |
| Flashcards e caderno | Apoiam revisão, memorização e anotações. |
| Biblioteca e vídeos | Reúnem materiais complementares. |
| Ella | Assistente virtual para dúvidas e apoio nos estudos. |
| Área administrativa | Permite criar, editar, organizar e publicar conteúdos. |

## Apostilas

O leitor suporta textos, títulos, listas, tabelas, imagens, links, fórmulas matemáticas, blocos de código, citações, avisos e conteúdos multimídia. Ele também registra progresso, conclusão, favoritos, notas e o ponto em que o aluno parou.

O sistema possui fallback entre conteúdo estruturado, páginas salvas e conteúdo principal. Assim, uma falha pontual em uma consulta não deve deixar o leitor preso no carregamento nem apagar o material disponível.

A apostila de **Cálculo Numérico**, vinculada à matéria **Cálculo Computacional**, foi publicada no Supabase novo com a data de **25/08/2026**, curso `CC`, escopo completo e classificação no **6º semestre**.

## Ella

A Ella é a assistente virtual da plataforma. Seu avatar foi padronizado para usar um asset local e versionado, garantindo a mesma aparência no chat, na sidebar e na landing page. O funcionamento completo depende do frontend, das funções de backend e da configuração correta do Supabase no ambiente publicado.

## Tecnologia e segurança

| Camada | Tecnologia ou recurso |
|---|---|
| Frontend | React, TypeScript e Vite |
| Estilos | Tailwind CSS |
| Componentes | Lucide React e componentes próprios |
| Animações | Framer Motion |
| Dados | TanStack Query e hooks personalizados |
| Backend | Supabase Edge Functions |
| Banco e autenticação | Supabase Auth e PostgreSQL |
| Segurança | RLS, autorização por perfil e escopo |
| Publicação | Vercel |
| Versionamento | GitHub |

A plataforma utiliza autenticação, políticas RLS, separação entre aluno e administrador, controle de publicação, escopos de conteúdo e validações de segurança. Operações sensíveis exigem usuário autenticado.

## Correções realizadas

Foram corrigidos o autosave da data da aula, a persistência da sidebar, a organização do dashboard, os layouts das abas autenticadas, os botões de ícone achatados, o avatar da Ella, a classificação da apostila, o trigger de cronologia e o carregamento resiliente do leitor.

Também foi removido o temporizador agressivo que apresentava falso erro de cache. A recuperação agora deve ocorrer somente diante de falhas reais de importação ou de chunks antigos, preservando o service worker de push e caches não relacionados.

## Estado atual

| Item | Estado |
|---|---|
| Código no GitHub | Atualizado no branch `main` |
| Desenvolvimento | Branch `develop/v1.1.0-dev` |
| Supabase | Projeto novo `wxkkpjpqyrygglbuogsd` |
| Testes | 126 aprovados em 21 arquivos |
| TypeScript | Sem erros |
| Apostila de Cálculo Numérico | Publicada e classificada corretamente |
| Avatar da Ella | Asset local corrigido no código |
| Vercel pública | Pode continuar servindo deployment antigo |

## Pendência principal

O maior problema restante é operacional: o domínio público da Vercel chegou a continuar servindo um deployment antigo, identificado pelo status **Blocked** no painel e por headers antigos na URL pública. Esse deployment ainda pode usar o Supabase legado, mostrar a mensagem antiga de cache e exibir o avatar anterior.

O código corrigido está no GitHub, mas a Vercel precisa estar conectada ao repositório `Kaiqueaurelio/decodeanalyticsacademy`, com `main` definido como branch de produção e o deployment liberado. Depois disso, o fluxo esperado é:

> **Lovable → GitHub → Vercel → aluno**

Cada atualização publicada pela Lovable no GitHub deverá gerar automaticamente um novo deploy na Vercel.

## Links

- [Repositório no GitHub](https://github.com/Kaiqueaurelio/decodeanalyticsacademy)
- [Domínio público da Vercel](https://decodeanalyticsacademy.vercel.app)
- [Apostila de Cálculo Numérico](https://decodeanalyticsacademy.vercel.app/apostila/38deb8b2-4b6a-437d-a148-526cab61508e)

> **Resumo final:** a plataforma possui uma base completa de estudos, com conteúdo acadêmico, ferramentas de revisão, assistente virtual, autenticação e controle de acesso. O código e o banco foram corrigidos; a pendência decisiva é liberar e atualizar o deployment correto na Vercel para que o ambiente público reflita as alterações do GitHub e do Supabase novo.
