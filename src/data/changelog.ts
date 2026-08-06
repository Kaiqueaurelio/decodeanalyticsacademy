/**
 * Histórico de versões da plataforma.
 *
 * Cada release fica registrada aqui e aparece na aba "Histórico" do painel
 * administrativo — independente de onde o app está publicado (preview, Vercel
 * ou instalação PWA), pois o arquivo viaja junto com o build.
 *
 * Ao concluir uma alteração relevante, adicione uma nova entrada no TOPO.
 */

export type ChangeKind = 'feature' | 'fix' | 'improvement' | 'security' | 'content';

export type ChangelogEntry = {
  version: string;
  date: string; // ISO (YYYY-MM-DD)
  title: string;
  changes: { kind: ChangeKind; text: string }[];
};

export const CHANGE_KIND_LABEL: Record<ChangeKind, string> = {
  feature: 'Novidade',
  fix: 'Correção',
  improvement: 'Melhoria',
  security: 'Segurança',
  content: 'Conteúdo',
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "3.54.0",
    date: "2026-08-06",
    title: "Auditoria de Estabilidade e Refinamento de UI",
    changes: [
      { kind: 'improvement', text: 'Sincronizada a lógica de mapeamento para a área de gestão de apostilas e estruturação de conteúdo.' },
      { kind: 'improvement', text: 'Realizada auditoria completa de fluxo para detecção e mitigação de bugs residuais.' },
      { kind: 'fix', text: 'Correção de inconsistências visuais e sincronização de rótulos globais.' },
    ],
  },
  {
    version: "3.52.0",
    date: "2026-08-06",
    title: "Ella: Excelência Operacional e Mitigação de Erros",
    changes: [
      { kind: 'improvement', text: 'Ella aprimorada para detecção proativa e correção de inconsistências no ecossistema do app.' },
      { kind: 'security', text: 'Reforço na camada de mitigação de erros e auditoria de ferramentas críticas.' },
    ],
  },
  {
    version: "3.51.0",
    date: "2026-08-06",
    title: "Ella 5.0: Inteligência e Integração Total",
    changes: [
      { kind: 'improvement', text: 'Ella 5.0 lançada com foco em melhoria contínua e feedback operacional direto.' },
      { kind: 'improvement', text: 'Otimização das diretrizes de resposta para integração profunda com materiais e mídias.' },
    ],
  },

  {
    version: "3.50.0",
    date: "2026-08-06",
    title: "Ella: Automação de Conteúdo e Mídia",
    changes: [
      { kind: 'feature', text: 'Ella agora pode editar apostilas, acrescentar conteúdos, áudios, vídeos e imagens via chat.' },
      { kind: 'improvement', text: 'Melhoria na autorização de ferramentas Ella para suporte a gestão multisseção.' },
    ],
  },
  {
    version: "3.49.3",
    date: "2026-08-06",
    title: "Histórico de Versões em Apostilas",
    changes: [
      { kind: 'feature', text: 'Implementado sistema de histórico de versões no Workbench Administrativo, permitindo comparar e restaurar edições anteriores.' },
    ],
  },
  {
    version: "3.49.2",
    date: "2026-08-06",
    title: "Gestão Avançada de Arquivos",
    changes: [
      { kind: 'feature', text: 'Adicionado suporte para anexar PDFs, planilhas e documentos diretamente no Workbench Administrativo com upload otimizado.' },
      { kind: 'improvement', text: 'Refinamento visual da zona de arraste de arquivos para melhor orientação do usuário.' },
    ],
  },
  {
    version: "3.49.1",
    date: "2026-08-06",
    title: "Estabilização da Edição de Apostilas",
    changes: [
      { kind: 'improvement', text: 'Implementação de persistência garantida e carregamento de conteúdo legado no Workbench Administrativo.' },
      { kind: 'fix', text: 'Correção de mapeamento de texto para garantir a integridade da funcionalidade de edição segura.' },
    ],
  },
  {
    version: "3.49.0",
    date: "2026-08-06",
    title: "Facilitação de Conteúdo Multimídia",
    changes: [
      { kind: 'feature', text: 'Inserção rápida de vídeo (YouTube/Vimeo/MP4) diretamente na barra de atalhos do editor.' },
      { kind: 'feature', text: 'Atalho de upload de imagem um-clique no editor com suporte a drag-and-drop global.' },
      { kind: 'improvement', text: 'Painel de materiais renomeado para "Materiais & Mídia" com texto orientador para drag-and-drop de vídeos e arquivos.' },
      { kind: 'improvement', text: 'Simplificação de rótulos no gerenciador de questões do Workbench.' },
    ],
  },
  {
    version: "3.48.4",
    date: "2026-08-06",
    title: "Estabilização Crítica de Edge Functions",
    changes: [
      { kind: 'fix', text: 'Correção definitiva do erro "non-2xx status code" na estruturação de lições através da implementação de retry e tratamento de concorrência na limpeza de módulos.' },
      { kind: 'improvement', text: 'Otimização do fluxo de deleção em cascata para conteúdos de grande volume.' },
    ],
  },
  {
    version: "3.48.3",
    date: "2026-08-06",
    title: "Otimização de Estruturação de Lições",
    changes: [
      { kind: 'fix', text: 'Resolvido erro de timeout (2xx status code) na estruturação de apostilas grandes através da otimização da limpeza de módulos.' },
      { kind: 'improvement', text: 'Aprimorada a resiliência do parser de markdown para conteúdos extensos.' },
    ],
  },
  {
    version: "3.48.2",
    date: "2026-08-06",
    title: "Estabilidade da Estrutura de Lições",
    changes: [
      { kind: 'fix', text: 'Corrigida a lógica de parsing e estruturação automática de lições no Admin Workbench para evitar erros de duplicidade e timeout.' },
      { kind: 'improvement', text: 'Refinamento do mapeamento de metadados para auditoria visual e segurança.' },
    ],
  },
  {
    version: "3.48.1",
    date: "2026-08-06",
    title: "Métricas e Desempenho",
    changes: [
      { kind: 'feature', text: 'Implementação de gráficos e métricas detalhadas no dashboard (aluno/admin) para acompanhamento de desempenho por matéria e evolução temporal.' },
      { kind: 'improvement', text: 'Sincronização de metadados de auditoria visual no sistema de mapeamento dinâmico.' },
    ],
  },
  {
    version: "3.48.0",
    date: "2026-08-06",
    title: "Otimização TanStack & Estabilidade",
    changes: [
      { kind: 'improvement', text: 'Unificação da infraestrutura de dados para TanStack Query (v4+), otimizando o cache e a velocidade de resposta do dashboard.' },
      { kind: 'improvement', text: 'Melhoria na estabilidade das requisições e redução de latência no carregamento de apostilas.' },
    ],
  },
  {
    version: "3.47.0",
    date: "2026-08-06",
    title: "Atualização da Grade do 6º Semestre",
    changes: [
      { kind: 'feature', text: 'Atualização das disciplinas canônicas do 6º semestre (Sistemas Operacionais, Cálculo Numérico, Pesquisa Operacional, Ciência de Dados, etc.) para garantir visibilidade no dashboard.' },
      { kind: 'improvement', text: 'Adicionados professores padrão para as novas disciplinas do 6º semestre.' },
    ],
  },
  {
    version: "3.46.0",
    date: "2026-08-05",
    title: "Progresso das apostilas no dashboard",
    changes: [
      { kind: 'feature', text: 'Cada apostila agora mostra "Em andamento", "Concluída" ou "Não iniciada" com barra de progresso e contagem de lições concluídas.' },
      { kind: 'fix', text: 'Corrigida a resolução do index.html no build removendo a configuração manual de root/entrada do Vite.' },
    ],
  },
  {
    version: "3.45.7",
    date: "2026-08-05",
    title: "Gestão de Conteúdo e UX",
    changes: [
      { kind: 'improvement', text: 'Sincronizada a lógica de mapeamento para a listagem protegida de apostilas com filtros e busca.' },
    ],
  },
  {
    version: "3.45.6",
    date: "2026-08-05",
    title: "Recuperação de Senha e Segurança",
    changes: [
      { kind: 'security', text: 'Sincronizada a lógica de mapeamento para o fluxo de recuperação de senha e redefinição segura.' },
    ],
  },
  {
    version: "3.45.5",
    date: "2026-08-05",
    title: "Segurança de Rotas e UX de Erros",
    changes: [
      { kind: 'security', text: 'Sincronizada a lógica de mapeamento para guards de autenticação globais e páginas de erro (403/404) aprimoradas.' },
    ],
  },
  {
    version: "3.45.4",
    date: "2026-08-05",
    title: "Sincronização de Rota de Erro 404",
    changes: [
      { kind: 'fix', text: 'Sincronizada a lógica de mapeamento para a página de erro 404 protegida e limpeza de rotas obsoletas.' },
    ],
  },
  {
    version: "3.45.3",
    date: "2026-08-05",
    title: "Sincronização de Correção de Build",
    changes: [
      { kind: 'fix', text: 'Atualizado o sistema de mapeamento dinâmico para garantir a integridade da mensagem de correção de build.' },
      { kind: 'improvement', text: 'Limpeza de definições de rotas fantasmas para otimizar o bundle do aplicativo.' },
    ],
  },
  {
    version: "3.45.2",
    date: "2026-08-05",
    title: "Logo responsiva no leitor",
    changes: [
      { kind: 'fix', text: 'Logo da barra de leitura ajustada para celular, tablet e desktop sem comprimir os controles ou quebrar o layout.' },
      { kind: 'improvement', text: 'Selo flutuante da marca agora aparece somente em telas amplas e respeita a largura disponível.' },
    ],
  },
  {
    version: "3.45.1",
    date: "2026-08-05",
    title: "Estabilidade do build",
    changes: [
      { kind: 'fix', text: 'A raiz do projeto e a entrada index.html agora são resolvidas por caminho absoluto no Vite, inclusive em ambientes de CI.' },
      { kind: 'fix', text: 'Ordem das diretivas CSS corrigida para eliminar avisos de importação durante a compilação.' },
    ],
  },
  {
    version: "3.45.0",
    date: "2026-08-04",
    title: "Branding de Alta Visibilidade",
    changes: [
      { kind: 'improvement', text: 'Logo expandido na tela de leitura: selo flutuante agora atinge 128px em telas grandes para máxima presença de marca.' },
      { kind: 'improvement', text: 'Topbar responsiva com logo ampliado (h-32) e efeitos de brilho neon reforçados para melhor contraste em fundos escuros.' },
      { kind: 'improvement', text: 'Ajuste fino de hierarquia tipográfica no selo persistente.' },
    ],
  },
  {
    version: "3.44.0",
    date: "2026-08-04",
    title: "Retomada de leitura e marca persistente",
    changes: [
      { kind: 'feature', text: 'Novo card no topo do dashboard mostra o último tópico lido, o progresso da apostila e permite retomar exatamente de onde o aluno parou.' },
      { kind: 'improvement', text: 'A marca Decode Analytics Academy permanece visível na barra superior em telas móveis e desktop.' },
      { kind: 'fix', text: 'O leitor estruturado agora reconhece links diretos para o último tópico acessado.' },
    ],
  },
  {
    version: "3.43.0",
    date: "2026-08-04",
    title: "Rolagem infinita no acervo (aluno e admin)",
    changes: [
      { kind: 'improvement', text: 'Dashboard do aluno carrega novas disciplinas automaticamente conforme a rolagem, em blocos leves.' },
      { kind: 'improvement', text: 'Painel administrativo passou a carregar mais apostilas automaticamente, mantendo o botão manual como alternativa.' },
      { kind: 'fix', text: 'Corrigido travamento da rolagem infinita que parava após o primeiro lote de conteúdos.' },
    ],
  },
  {
    version: "3.42.0",
    date: "2026-08-04",
    title: "Central Operacional do Administrador",
    changes: [
      { kind: 'feature', text: 'Nova Central de Pendências com acesso direto a rascunhos, conteúdos antigos e itens sem categoria.' },
      { kind: 'feature', text: 'Indicador de saúde do acervo e atalho seguro para visualizar a experiência como aluno.' },
      { kind: 'improvement', text: 'Ações frequentes e histórico foram concentrados no início do painel administrativo.' },
      { kind: 'fix', text: 'Validada a entrada index.html do Vite para impedir falha de resolução no build.' },
    ],
  },
  {
    version: "3.41.0",
    date: "2026-08-04",
    title: "Performance e Otimização de Renderização",
    changes: [
      { kind: 'improvement', text: 'Sincronização de diretrizes de performance para aceleração da renderização da Landing Page.' },
      { kind: 'improvement', text: 'Refinamento da lógica de DeferredSection para garantir LCP (Largest Contentful Paint) otimizado.' },
    ],
  },
  {
    version: "3.40.0",
    date: "2026-08-04",
    title: "Otimização de Landing Page e Feedback Visual",
    changes: [
      { kind: 'improvement', text: 'Sincronização de diretrizes para melhorias profundas na Landing Page via mapeamento dinâmico.' },
      { kind: 'improvement', text: 'Refinamento do sistema de auditoria visual para suporte a sugestões de design em tempo real.' },
    ],
  },
  {
    version: "3.39.0",
    date: "2026-08-04",
    title: "Sistema de Monitoramento e Depuração",
    changes: [
      { kind: 'improvement', text: 'Implementação de mapeamento dinâmico para logs detalhados com stack trace e versionamento do build.' },
      { kind: 'improvement', text: 'Refinamento do sistema de auditoria visual para captura de erros em tempo real.' },
    ],
  },
  {
    version: "3.38.2",
    date: "2026-08-04",
    title: "Estabilidade e Auditoria Contínua",
    changes: [
      { kind: 'improvement', text: 'Sincronização de diretrizes de auditoria no sistema de mapeamento dinâmico para estabilidade visual.' },
      { kind: 'improvement', text: 'Limpeza de strings residuais e otimização da lógica de substituição dinâmica.' },
    ],
  },
  {
    version: "3.38.1",
    date: "2026-08-04",
    title: "Sincronização Visual e Estabilidade",
    changes: [
      { kind: 'improvement', text: 'Correção de mapeamento de texto residual nas rotas de sistema para garantir estabilidade visual.' },
      { kind: 'improvement', text: 'Refinamento da lógica de substituição dinâmica de strings.' },
    ],
  },
  {
    version: "3.37.0",
    date: "2026-08-04",
    title: "Landing Page: Dinâmica e Inteligente",
    changes: [
      { kind: 'improvement', text: 'Hero Section: Implementado efeito Typewriter dinâmico no título principal para destacar os pilares da plataforma.' },
      { kind: 'improvement', text: 'Branding: Adicionado badge dedicado à Ella Ribeiro na seção hero para destacar o suporte da assistente.' },
      { kind: 'improvement', text: 'UX: Otimizada a transição visual entre palavras-chave para maior fluidez e engajamento na primeira dobra.' },
    ],
  },
  {
    version: "3.36.0",
    date: "2026-08-04",
    title: "Experiência do Aluno e Fluidez de Carregamento",
    changes: [
      { kind: 'improvement', text: 'Percepção de Performance: Implementado DashboardSkeleton para um carregamento visual instantâneo e profissional.' },
      { kind: 'feature', text: 'Ella Ribeiro: Adicionada mensagem de boas-vindas contextual para novos alunos e melhoria na persistência de mensagens.' },
      { kind: 'improvement', text: 'Sincronização Acadêmica: Otimizada a invalidação de cache ao concluir lições no leitor estruturado, atualizando o progresso no dashboard em tempo real.' },
      { kind: 'improvement', text: 'Filtro Inteligente: O dashboard agora seleciona automaticamente o semestre correto baseado no perfil acadêmico do aluno no primeiro acesso.' },
    ],
  },


  {
    version: "3.35.0",
    date: "2026-08-04",
    title: "Segurança e Auditoria Administrativa",
    changes: [
      { kind: 'security', text: 'Reforçada a blindagem dos recursos administrativos no dashboard do aluno.' },
      { kind: 'improvement', text: 'Implementado indicador visual explícito "Modo Administrador" para evitar confusões de contexto.' },
      { kind: 'improvement', text: 'Atualizados tooltips e rótulos de ferramentas de gestão para clareza sobre permissões.' },
      { kind: 'security', text: 'Auditoria completa de componentes híbridos (ApostilaCoverCard, SubjectFolderGrid e ApostilaPage).' },
    ],
  },
  {
    version: "3.34.0",

    date: "2026-08-04",
    title: "Administração Omnipresente (UX Híbrida)",
    changes: [
      { kind: 'feature', text: 'Topbar Híbrida: Adicionados controles rápidos de gestão (Conteúdo e Alunos) diretamente na barra superior para administradores.' },
      { kind: 'improvement', text: 'Acesso Rápido: Otimizado o fluxo de criação com botão "Novo Material" por disciplina no dashboard.' },
      { kind: 'improvement', text: 'Interface: Padronização dos ícones de gestão em todo o ecossistema do aluno para maior clareza.' },
    ],
  },
  {
    version: "3.33.0",
    date: "2026-08-04",
    title: "Dashboard Administrativa Híbrida",
    changes: [
      { kind: 'feature', text: 'Dashboard Híbrido: Unificação total da visão do aluno com controles administrativos integrados.' },
      { kind: 'feature', text: 'Gestão Direta: Adicionado painel de controle rápido no HeroGreetingCard para acesso instantâneo a Conteúdo e Alunos.' },
      { kind: 'improvement', text: 'UX Admin: Atalhos de configuração e edição de material agora utilizam ícones intuitivos e estados de hover refinados.' },
    ],
  },
  {
    version: "3.32.0",
    date: "2026-08-04",
    title: "UX: Dashboard Infinito e Gestão Direta",
    changes: [
      { kind: 'improvement', text: 'Rolagem Infinita: Implementado Intersection Observer com sentinel visual e skeletons para uma experiência de "feed infinito" real.' },
      { kind: 'feature', text: 'Admin: Adicionado botão "Gerenciar Matéria" diretamente nos cabeçalhos das disciplinas no dashboard do aluno.' },
      { kind: 'improvement', text: 'Performance: Ajustado o buffer de carregamento para antecipar a renderização de novos blocos antes que o usuário atinja o fim da página.' },
    ],
  },
  {
    version: "3.31.0",
    date: "2026-08-04",
    title: "Rolagem Infinita e Edição Direta",
    changes: [
      { kind: 'feature', text: 'Dashboard: Implementada rolagem infinita nas disciplinas para navegação mais fluida.' },
      { kind: 'feature', text: 'Admin: Atalhos rápidos de edição agora aparecem diretamente nos cards do dashboard para administradores.' },
      { kind: 'improvement', text: 'Performance: Otimizado o carregamento inicial do dashboard com renderização progressiva de matérias.' },
    ],
  },
  {
    version: "3.30.0",
    date: "2026-08-04",
    title: "Transparência e Privacidade",
    changes: [
      { kind: 'feature', text: 'Privacidade: Implementada nova página de Transparência detalhando o tratamento de dados dos alunos.' },
      { kind: 'improvement', text: 'Interface: Rodapé atualizado com acesso rápido às políticas de dados e termos de uso.' },
    ],
  },
  {
    version: "3.29.0",

    date: "2026-08-04",
    title: "UX: Atalhos de Edição para Administradores",
    changes: [
      { kind: 'feature', text: 'Navegação: Adicionado atalho direto de edição (ícone PenTool) nos cards de apostilas para usuários administradores.' },
      { kind: 'improvement', text: 'UX: Otimizado o grid de disciplinas para permitir acesso rápido ao editor sem necessidade de múltiplos cliques.' },
    ],
  },
  {
    version: "3.28.0",
    date: "2026-08-04",
    title: "UX: Dashboard de Alta Performance",
    changes: [
      { kind: 'improvement', text: 'Interface: Redesign do HeroGreetingCard com foco em motivação e estatísticas rápidas.' },
      { kind: 'feature', text: 'Navegação: Adicionada barra de resumo estatístico no topo do dashboard para acompanhamento rápido de progresso.' },
      { kind: 'improvement', text: 'Visual: Refinamento estético dos widgets de XP e progressão no menu lateral.' },
    ],
  },
  {
    version: "3.27.0",
    date: "2026-08-04",
    title: "Sessão Persistente e 'Permanecer Conectado'",
    changes: [
      { kind: 'feature', text: 'Auth: Adicionada opção "Permanecer conectado" na tela de login, garantindo que o usuário não seja deslogado ao fechar o navegador.' },
      { kind: 'improvement', text: 'Persistência: Refinada a lógica de keepalive e restauração de sessão para respeitar a escolha de privacidade do usuário.' },
    ],
  },
  {
    version: "3.26.0",
    date: "2026-08-04",
    title: "Editor de Material em Modal",
    changes: [
      { kind: 'feature', text: 'UX Administrativa: O botão "Editar Material" agora abre o Workbench em um modal (Sheet) diretamente na página da apostila, permitindo edições rápidas sem perder o contexto de leitura.' },
      { kind: 'improvement', text: 'Workbench Versátil: O editor administrativo foi refatorado para suportar tanto uso em rota própria quanto embutido em modais com controle de fechamento customizado.' },
    ],
  },
  {
    version: "3.25.0",
    date: "2026-08-04",
    title: "Refinamento do Atalho de Edição",
    changes: [
      { kind: 'improvement', text: 'Interface Administrativa: O botão de edição direta agora utiliza o termo "Editar Material" para maior clareza contextual ao visualizar apostilas.' },
      { kind: 'fix', text: 'Limpeza de Metadados: Removidas referências de texto residuais em arquivos de configuração de rotas.' },
    ],
  },
  {
    version: "3.24.0",
    date: "2026-08-04",
    title: "Edição Direta e Atalhos Administrativos",
    changes: [
      { kind: 'feature', text: 'Gestão Inteligente: Adicionado atalho direto da Apostila para o Editor Admin, facilitando a atualização rápida de materiais sem navegação manual.' },
      { kind: 'improvement', text: 'Fluxo de Trabalho: Otimizada a transição entre visão de aluno e painel de controle para administradores.' },
    ],
  },
  {
    version: "3.23.0",
    date: "2026-08-04",
    title: "Estabilidade de Build e Resiliência do Sistema",
    changes: [
      { kind: 'fix', text: 'Integridade de Build: Removidos arquivos JavaScript residuais (.js) que causavam conflitos de sintaxe no pipeline de transformação do Vite.' },
      { kind: 'fix', text: 'Interface do Aluno: Sanada falha de sintaxe JSX em ApostilaPage.tsx, garantindo a renderização correta de feedbacks de indisponibilidade.' },
      { kind: 'improvement', text: 'Performance: Limpeza de diretórios de código fonte para evitar ambiguidades no carregamento de módulos e HMR.' },
    ],
  },
  {
    version: "3.22.0",
    date: "2026-08-04",
    title: "Aprimoramento de Feedbacks e Bloqueios",
    changes: [
      { kind: 'improvement', text: 'Status de Apostila: Adicionado aviso claro de "Material ainda não disponível" ao tentar acessar conteúdos em preparação, orientando sobre o início das aulas.' },
      { kind: 'fix', text: 'Navegação Admin: Corrigida a compatibilidade de tipos e mapeamento de rotas para garantir transição suave entre edição e visualização.' },
      { kind: 'improvement', text: 'Estabilidade: Refinada a lógica de observação de seções no leitor de apostilas para evitar falhas silenciosas de compilação.' },
    ],
  },

  {
    version: "3.21.0",
    date: "2026-08-04",
    title: "Refinamento de UX e Vocabulário Acadêmico",
    changes: [
      { kind: 'improvement', text: 'Vocabulário Acadêmico: Substituído o termo "conteúdo pedagógico" por termos mais diretos como "material" e "conteúdo" em todo o app.' },
      { kind: 'improvement', text: 'Interface do Aluno: Ajustado o aviso de apostilas em preparação para ser mais claro e direto.' },
      { kind: 'fix', text: 'Leitor Estruturado: Corrigido aviso de conteúdo ausente para refletir o status de estruturação do material.' },
    ],
  },
  {
    version: "3.20.0",
    date: "2026-08-04",
    title: "Novas funcionalidades e melhorias acadêmicas",
    changes: [
      { kind: 'feature', text: 'Central de Disciplinas (6º ao 8º Semestre): Estrutura pronta para recebimento de materiais das disciplinas de Ciência da Computação.' },
      { kind: 'improvement', text: 'Filtro de Semestres Inteligente: Agora sua seleção de semestre fica salva automaticamente mesmo após fechar o navegador.' },
      { kind: 'feature', text: 'Gamificação Avançada: Novo sistema de XP, medalhas e ofensiva de estudos para acompanhar seu progresso diário.' },
      { kind: 'improvement', text: 'Navegação Unificada: Menu lateral redesenhado para acesso rápido a todas as ferramentas acadêmicas em celulares e computadores.' },
      { kind: 'improvement', text: 'Interface Acadêmica: Melhoria na visualização das apostilas estilo Notion com capas personalizadas por matéria.' },
    ],
  },
  {
    version: "3.19.0",
    date: "2026-08-04",
    title: "Expansão da Central de Notificações e Diagnóstico",
    changes: [
      { kind: 'feature', text: 'Novo pop-up de novidades detalhado: agora você vê exatamente o que mudou (Melhorias, Correções, Novidades) direto ao entrar no app.' },
      { kind: 'improvement', text: 'Gamificação Administrador: Seus níveis de XP, Streak e conquistas foram restaurados ao patamar máximo de excelência.' },
      { kind: 'fix', text: 'Estabilidade do Admin: Corrigido erro "BY_SEMESTER is not defined" no painel de diagnóstico e filtros de semestre.' },
      { kind: 'improvement', text: 'Otimização Mobile: Drawer lateral e menus administrativos refinados para toque e visualização em telas pequenas.' },
    ],
  },
  {
    version: "3.18.1",
    date: "2026-08-04",
    title: "Consolidação de Segurança e Tratamento de Erros",
    changes: [
      { kind: 'security', text: 'Padronização do tratamento de erros no Chat da Apostila e no Gerenciador de Anúncios para prevenir vazamento de esquema de banco de dados.' },
      { kind: 'improvement', text: 'Limpeza de logs de console em ambiente de produção para reforçar a privacidade dos dados de depuração.' },
      { kind: 'fix', text: 'Correção de inconsistência na sanitização de conteúdos markdown que permitiam tags HTML obsoletas.' },
    ],
  },
  {
    version: "3.18.0",
    date: "2026-08-04",
    title: "Reforço de Segurança e Sanitização",
    changes: [
      { kind: 'security', text: 'Implementação de sanitização robusta via DOMPurify no renderizador de apostilas para prevenir XSS.' },
      { kind: 'security', text: 'Melhoria no tratamento de erros com novo sistema de logs seguros (safeLog) para evitar vazamento de dados técnicos.' },
      { kind: 'improvement', text: 'Otimização da Edge Function de autenticação (ra-auth) com rate limiting básico e limpeza de logs.' },
    ],
  },

  {
    version: "3.17.0",
    date: "2026-08-02",

    title: "Painel administrativo reorganizado (celular e computador)",
    changes: [
      { kind: 'improvement', text: 'Todas as seções do admin agora ficam agrupadas por área: Conteúdo, Alunos e Comunidade, Monetização, Assistente e Sistema.' },
      { kind: 'feature', text: 'Busca de seções dentro do menu: digite "anúncio", "prova" ou "RSS" e o painel filtra na hora.' },
      { kind: 'improvement', text: 'No celular, a fileira de abas apertadas virou um menu deslizante com a mesma organização do computador, mais atalhos rápidos para Geral, Apostilas, Exercícios e Materiais.' },
      { kind: 'improvement', text: 'Cada seção mostra uma descrição curta do que faz, evitando cliques às cegas.' },
    ],
  },

  {
    version: "3.16.0",
    date: "2026-08-01",
    title: "Upgrade de Inteligência e Gestão de Anunciantes",
    changes: [
      { kind: 'improvement', text: 'Atualizado modelo da Ella para Gemini 2.0 Flash (maior velocidade e raciocínio).' },
      { kind: 'fix', text: 'Corrigido bug de persistência onde anúncios pausados ainda eram exibidos por falhas no filtro de datas.' },
      { kind: 'feature', text: 'Implementado novo tipo de anúncio: "Patrocinador" para exibição no Media Kit da plataforma.' },
      { kind: 'feature', text: 'Criada aba "Anunciantes" no painel administrativo para gestão centralizada de marcas e logos.' },
      { kind: 'security', text: 'Refinado filtro de data e status no servidor para anúncios (list-ads) com validação atômica.' }
    ]
  },
  {
    version: '3.15.2',
    date: '2026-08-02',
    title: 'Acessibilidade, Segurança e Resiliência (Fase 2)',
    changes: [
      { kind: 'improvement', text: 'Reforço no tratamento de erros do fluxo de clonagem/vínculo de materiais: erros de rede ou permissão agora exibem toasts explicativos em vez de falhas silenciosas.' },
      { kind: 'security', text: 'Proteção de rotas aprimorada em ProtectedRoute: adição de estados de sincronização de sessão para evitar " flashes" de conteúdo ou telas em branco.' },
      { kind: 'improvement', text: 'Sincronização atômica do estado do drawer (localStorage) garantindo que a preferência do aluno seja respeitada entre navegações.' },
      { kind: 'feature', text: 'Implementado conjunto de testes automatizados para o drawer cobrindo focus trap, navegação por teclado (Esc) e labels ARIA.' },
    ],
  },
  {
    version: '3.15.1',
    date: '2026-08-02',
    title: 'Unificação do Drawer e persistência de navegação',
    changes: [
      { kind: 'improvement', text: 'Implementada persistência do estado do menu lateral via localStorage para navegação fluida entre páginas.' },
      { kind: 'improvement', text: 'Refinamento global de dimensões do drawer (320px cap) para exibição consistente em qualquer largura de tela.' },
      { kind: 'fix', text: 'Eliminação de trancamento visual ao navegar: adicionado micro-delay atômico no fechamento para garantir o carregamento da nova rota.' },
      { kind: 'security', text: 'Acessibilidade reforçada: focus trap ativo, navegação por teclado (Esc) e labels ARIA em todos os pontos de entrada do menu.' },
    ],
  },
  {
    version: '3.15.0',
    date: '2026-07-31',
    title: 'Auditoria de segurança: correções críticas',
    changes: [
      { kind: 'security', text: 'Login e recuperação por RA passaram a ser processados no servidor: o e-mail do aluno nunca mais é devolvido ao navegador, encerrando a enumeração de RAs que qualquer visitante podia fazer.' },
      { kind: 'security', text: 'Ranking de alunos, árvore de leitura das apostilas e contador de alertas deixaram de ser consultáveis por visitantes sem login.' },
      { kind: 'security', text: 'Lista de feeds RSS restrita a usuários autenticados.' },
      { kind: 'security', text: 'Conteúdo das apostilas: links maliciosos (javascript:, data:) e atributos de evento agora são neutralizados na renderização.' },
      { kind: 'security', text: 'Leitor de notícias e validador de RSS: filtro anti-SSRF reforçado contra endereços internos disfarçados (decimal, octal, hexadecimal, IPv6 e CGNAT).' },
      { kind: 'improvement', text: 'Mensagens de erro no login e na recuperação de senha ficaram genéricas e claras, sem revelar se um cadastro existe.' },
    ],
  },
  {

    version: '3.14.0',
    date: '2026-07-29',
    title: 'Sugestões automáticas no Plano de Estudos',
    changes: [
      { kind: 'feature', text: 'Nova aba "Sugestões" no Plano de Estudos: a Ella analisa conclusão de atividades por disciplina, apostilas concluídas, acerto em exercícios e dias parados para propor ajustes.' },
      { kind: 'feature', text: 'O aluno escolhe quais sugestões aplicar e o cronograma é reorganizado automaticamente.' },
      { kind: 'improvement', text: 'Cada ajuste guarda a versão anterior no histórico com a nota das sugestões aplicadas.' },
      { kind: 'security', text: 'A análise roda no servidor com verificação de propriedade do plano; nenhum dado de outro aluno é acessível.' },
    ],
  },
  {

    version: '3.13.0',
    date: '2026-07-29',
    title: 'Alertas de segurança para o administrador',
    changes: [
      { kind: 'feature', text: 'Nova aba "Alertas de segurança" no painel do administrador, com filtros (em aberto, críticos, todos), busca e opção de marcar como tratado.' },
      { kind: 'feature', text: 'Aviso em tempo real: sempre que o servidor recusa uma ação, o administrador é notificado na hora, com contador ao vivo no menu lateral.' },
      { kind: 'security', text: 'Três tipos de alerta: tentativa de agir como administrador (crítico), ação fora do catálogo autorizado e acesso a conteúdo fora do escopo da conta.' },
      { kind: 'security', text: 'Tentativas repetidas do mesmo usuário são agrupadas e viram alerta crítico a partir da terceira ocorrência, revelando padrões de sondagem.' },
      { kind: 'security', text: 'Proteção contra uso abusivo da Ella: até 30 mensagens a cada 5 minutos e 300 por dia, por aluno, com aviso amigável quando o limite é atingido.' },
      { kind: 'security', text: 'Suspensão automática de 15 minutos após 5 ações negadas seguidas, com alerta crítico para o administrador.' },
      { kind: 'feature', text: 'Auditoria com filtros avançados (usuário, papel, período, tipo de ação e resultado) e exportação em CSV e PDF.' },
      { kind: 'security', text: 'Os alertas só podem ser criados pelo servidor e só são visíveis para administradores; o conteúdo original não pode ser editado, apenas marcado como tratado.' },
    ],
  },
  {
    version: '3.12.1',
    date: '2026-07-29',
    title: 'Testes automatizados de segurança da Ella',
    changes: [
      { kind: 'security', text: 'Suíte automatizada com 15 cenários de ataque: tentativas de manipulação de contexto, jailbreak e escalada de privilégios são bloqueadas em todas as ações protegidas.' },
      { kind: 'security', text: 'Regra "negar por padrão" testada em nomes de ação desconhecidos, variações de maiúsculas, espaços e caracteres parecidos (homoglifos).' },
      { kind: 'security', text: 'Verificação de que o papel do usuário só vem do servidor: qualquer tentativa de se declarar administrador pela conversa ou pelo corpo da requisição é ignorada.' },
      { kind: 'improvement', text: 'Camada de autorização da Ella isolada em módulo próprio, o que facilita auditoria e manutenção sem alterar o comportamento.' },
    ],
  },
  {
    version: '3.12.0',
    date: '2026-07-29',
    title: 'Plano de Estudos Inteligente',
    changes: [
      { kind: 'feature', text: 'Nova página "Plano de Estudos": a Ella monta um cronograma semanal completo a partir do objetivo, das matérias, do nível e da rotina do aluno.' },
      { kind: 'feature', text: 'Acompanhamento de evolução com atividades marcáveis, percentual concluído, sequência de estudos e disciplinas pendentes.' },
      { kind: 'feature', text: 'Replanejamento assistido: ao ajustar o plano, a versão anterior fica guardada no histórico.' },
      { kind: 'feature', text: 'Exportação do plano em PDF profissional com logo, cores e rodapé oficiais da plataforma.' },
      { kind: 'security', text: 'Cada plano, tarefa e versão é privado do aluno, com validação de propriedade no servidor.' },
    ],
  },
  {
    version: '3.11.0',
    date: '2026-07-29',
    title: 'Segurança da assistente: permissões por perfil e auditoria',
    changes: [
      { kind: 'security', text: 'A Ella passou a executar ações apenas com as permissões reais do usuário autenticado: ações administrativas são bloqueadas no servidor para alunos, mesmo se pedidas no chat.' },
      { kind: 'security', text: 'Proteção contra manipulação por texto: mensagens, contextos e conteúdos colados são tratados como dados, nunca como instruções, e o prompt interno nunca é revelado.' },
      { kind: 'feature', text: 'Nova aba "Auditoria" no painel administrativo com o registro de cada ação da assistente — usuário, perfil, ferramenta, permissão e resultado.' },
    ],
  },
  {

    version: '3.10.0',
    date: '2026-07-29',
    title: 'Plano de estudos com exercícios e gabarito comentado',
    changes: [
      { kind: 'feature', text: 'Botão "Virar plano de estudos" nas respostas da Ella: transforma a explicação em cronograma, pontos-chave, exercícios e gabarito comentado.' },
      { kind: 'improvement', text: 'A Ella passa a seguir um formato padronizado de plano de estudos, com dificuldade crescente e comentário de cada alternativa.' },
    ],
  },
  {
    version: '3.9.0',
    date: '2026-07-29',
    title: 'Ella em tempo real: resposta instantânea e tutoria mais profunda',
    changes: [
      { kind: 'feature', text: 'As respostas da Ella agora aparecem palavra por palavra, começando quase que instantaneamente.' },
      { kind: 'feature', text: 'Pesquisa online sob demanda: quando a resposta depende de dados atuais, a Ella avisa e cita as fontes.' },
      { kind: 'improvement', text: 'Tutoria mais inteligente: explicações passo a passo, exemplos práticos e adaptação ao nível do aluno.' },
      { kind: 'improvement', text: 'Indicador de status mostra quando ela está pesquisando na internet ou consultando o app.' },
      { kind: 'improvement', text: 'Toda a inteligência do app passa exclusivamente pela API oficial do Google, sem provedores intermediários.' },
    ],
  },
  {
    version: '3.8.0',
    date: '2026-07-29',
    title: 'Ella com pesquisa na internet e respostas mais rápidas',
    changes: [
      { kind: 'feature', text: 'A Ella agora pesquisa na internet em tempo real e cita as fontes com link para apoiar os estudos.' },
      { kind: 'improvement', text: 'Respostas muito mais rápidas: histórico enxuto e processamento otimizado no provedor.' },
      { kind: 'improvement', text: 'A Ella passa a usar exclusivamente a chave própria do Google, sem depender de créditos externos.' },
    ],
  },

  {
    version: '3.7.2',
    date: '2026-07-29',
    title: 'Navegação por teclado no menu mobile',
    changes: [
      { kind: 'improvement', text: 'Ao abrir o menu, o foco vai direto para o botão de fechar e segue a ordem visual dos itens.' },
      { kind: 'improvement', text: 'O foco fica preso dentro do menu enquanto ele está aberto e volta para o botão que abriu ao fechar (Esc ou botão).' },
      { kind: 'improvement', text: 'Suíte de testes automatizados cobrindo abertura por teclado, ordem de tabulação, trap de foco e retorno do foco.' },
    ],
  },
  {
    version: '3.7.0',
    date: '2026-07-29',
    title: 'Menu mobile acessível',
    changes: [
      { kind: 'improvement', text: 'O menu lateral no celular agora fecha pelo botão de fechar (maior e mais fácil de tocar) ou pela tecla Esc.' },
      { kind: 'improvement', text: 'Foco visível em todos os itens de navegação, com leitura correta por leitores de tela e destaque da página atual sem depender de passar o mouse.' },
    ],
  },
  {

    version: '3.6.5',
    date: '2026-07-26',
    title: 'Vídeo da página inicial sempre em movimento',
    changes: [
      { kind: 'improvement', text: 'O vídeo de fundo não pausa mais ao rolar a página e não é desativado por economia de dados — fica em movimento contínuo em todos os dispositivos.' },
      { kind: 'fix', text: 'Retomada automática caso o navegador interrompa a reprodução ao voltar para a aba.' },
    ],
  },
  {
    version: '3.6.4',
    date: '2026-07-26',
    title: 'Vídeo de fundo da página inicial de volta',
    changes: [
      { kind: 'fix', text: 'O vídeo de fundo voltou a aparecer também em celulares e tablets — antes ele era desligado em telas menores.' },
      { kind: 'improvement', text: 'A entrada do vídeo ficou mais rápida, com garantia de exibição mesmo em navegadores sem tempo ocioso.' },
    ],
  },
  {
    version: '3.6.3',
    date: '2026-07-26',
    title: 'Imagens do topo em AVIF/WebP',
    changes: [
      { kind: 'improvement', text: 'A logo do topo da landing agora é servida em AVIF/WebP no tamanho exato exibido, com versão de alta resolução só para telas retina.' },
      { kind: 'improvement', text: 'Redução de mais de 1,4 MB no carregamento inicial da página inicial, acelerando o primeiro desenho da tela.' },
    ],
  },
  {
    version: '3.6.2',
    date: '2026-07-26',
    title: 'Hero da landing pinta quase instantâneo (LCP menor)',
    changes: [
      { kind: 'improvement', text: 'Título e chamada do topo deixaram de depender de JavaScript para aparecer — a entrada agora é só CSS e o texto já nasce visível.' },
      { kind: 'improvement', text: 'Fontes movidas do CSS para o <head>, com preconnect e preload da fonte usada no título; as demais famílias carregam sem bloquear a página.' },
      { kind: 'improvement', text: 'Logo do topo com dimensões declaradas e prioridade alta de download, evitando salto de layout.' },
    ],
  },

  {
    version: '3.6.1',
    date: '2026-07-26',
    title: 'Landing page: renderização muito mais rápida',
    changes: [
      { kind: 'improvement', text: 'Seções agora só são montadas quando chegam perto da tela — antes todos os blocos eram baixados de uma vez no carregamento.' },
      { kind: 'improvement', text: 'Vídeo de fundo só carrega em telas grandes, depois do primeiro desenho da página, e pausa quando o usuário rola para longe do topo.' },
      { kind: 'improvement', text: 'Vídeo do tour deixou de baixar antecipadamente; carrega apenas quando a seção aparece.' },
      { kind: 'improvement', text: 'Rolagem otimizada com requestAnimationFrame e pintura adiada de seções fora da viewport.' },
    ],
  },

  {
    version: '3.6.0',
    date: '2026-07-26',
    title: 'Landing page mais rápida e focada em conversão',
    changes: [
      { kind: 'improvement', text: 'Seções abaixo da dobra passaram a carregar sob demanda, reduzindo o bundle inicial e acelerando o primeiro carregamento.' },
      { kind: 'improvement', text: 'Vídeo de fundo agora usa pré-carregamento leve, pausa com a aba oculta e é desativado em modo de economia de dados ou movimento reduzido.' },
      { kind: 'improvement', text: 'Ordem das seções reorganizada: prova social, dúvidas frequentes, app ao vivo, criador e patrocínio.' },
      { kind: 'improvement', text: 'Removida a seção de stack técnica duplicada (o conteúdo já aparece em "Sob o capô").' },
      { kind: 'feature', text: 'Barra fixa de ação no celular com "Começar a estudar" e atalho de instalação.' },
      { kind: 'improvement', text: 'SEO: título e descrição mais específicos, canonical e dados estruturados (organização educacional e perguntas frequentes).' },
    ],
  },

  {
    version: '3.5.0',
    date: '2026-07-26',
    title: 'Alertas, drill-down e exportação do funil comercial',
    changes: [
      {
        kind: 'feature',
        text: 'Alertas automáticos quando a conversão clique → negociação fica abaixo do limite configurável por pacote ou origem.',
      },
      {
        kind: 'feature',
        text: 'Drill-down no funil: cada etapa e cada célula da tabela abre a lista detalhada de leads com pacote, origem, CTA e campanha.',
      },
      {
        kind: 'feature',
        text: 'Exportação do funil e das métricas do período em CSV e PDF para compartilhar com o time.',
      },
      {
        kind: 'improvement',
        text: 'Rastreio ampliado: cada clique guarda o botão exato (CTA) e os UTMs da campanha de origem.',
      },
    ],
  },
  {
    version: '3.4.0',
    date: '2026-07-26',
    title: 'Funil de conversão comercial',
    changes: [
      {
        kind: 'feature',
        text: 'Nova visão de funil na aba Patrocínio: clique no CTA → lead registrado → contato enviado → negociação avançada, com perda por etapa.',
      },
      {
        kind: 'feature',
        text: 'Detalhamento do funil por pacote e por origem do clique, com filtro de 7 dias, 30 dias ou todo o período.',
      },
    ],
  },
  {
    version: '3.3.0',
    date: '2026-07-26',
    title: 'Métricas de cliques nos contatos de patrocínio',
    changes: [
      { kind: 'feature', text: 'Painel de métricas na aba Patrocínio: total de interações, divisão WhatsApp x e-mail, taxa de negociação e filtro por 7 dias, 30 dias ou tudo.' },
      { kind: 'feature', text: 'Comparativo por pacote (Apoiador, Patrocinador de matéria, Master) com barra de canais e resumo por origem do clique.' },
      { kind: 'improvement', text: 'Cada CTA da landing passa a registrar o canal correto (WhatsApp ou e-mail) e o pacote clicado.' },
    ],
  },
  {

    version: '3.2.0',
    date: '2026-07-26',
    title: 'Registro de interessados em patrocínio no painel admin',
    changes: [
      { kind: 'feature', text: 'Cada briefing enviado e cada clique nos contatos comerciais fica gravado no banco com empresa, contato, formato, objetivo e canal usado.' },
      { kind: 'feature', text: 'Nova aba "Patrocínio" no admin com busca, filtro por situação (novo, em contato, negociando, fechado, perdido) e contadores.' },
      { kind: 'feature', text: 'Histórico de contato por interessado: anotações manuais e registro automático das mudanças de situação.' },
    ],
  },
  {

    version: '3.1.0',
    date: '2026-07-26',
    title: 'Página dedicada "Anuncie / Patrocine" com media kit e briefing',
    changes: [
      { kind: 'feature', text: 'Nova página pública em /anuncie (e /patrocine) com media kit, formatos disponíveis e especificações de arte.' },
      { kind: 'feature', text: 'Formulário de briefing com validação que monta a mensagem e envia por WhatsApp, e-mail ou copia para a área de transferência.' },
      { kind: 'improvement', text: 'CTAs de patrocínio na landing page agora abrem WhatsApp e e-mail com o briefing pré-preenchido, inclusive por pacote.' },
    ],
  },
  {

    version: '3.0.0',
    date: '2026-07-26',
    title: 'Seção comercial para anunciantes e patrocinadores',
    changes: [
      { kind: 'feature', text: 'Nova seção "Anuncie / Patrocine" na landing page com proposta de valor, três formatos de patrocínio (Apoiador, Patrocinador de matéria e Master) e chamada para ação.' },
      { kind: 'feature', text: 'Contato comercial direto por WhatsApp e e-mail, com mensagem pré-preenchida sobre patrocínio.' },
      { kind: 'content', text: 'Reforço da política: o aluno nunca paga — a plataforma se mantém por patrocínio.' },
    ],
  },
  {

    version: '2.9.0',
    date: '2026-07-26',
    title: 'Histórico de versões e verificação geral',
    changes: [
      { kind: 'feature', text: 'Nova aba "Histórico" no painel administrativo com todas as versões, data, tipo de alteração e busca.' },
      { kind: 'feature', text: 'Registro automático do build em execução: ambiente (preview/Vercel), data do build e identificador da versão publicada.' },
      { kind: 'fix', text: 'Rascunho automático de anúncios não restaura mais edições antigas de anúncios já apagados.' },
      { kind: 'improvement', text: 'Verificação completa de tipos e rotas após as últimas atualizações.' },
    ],
  },
  {
    version: '2.8.0',
    date: '2026-07-25',
    title: 'Gestão de anúncios completa',
    changes: [
      { kind: 'feature', text: 'Auto-salvamento de rascunho no formulário de anúncios, com restauração após recarregar a página.' },
      { kind: 'feature', text: 'Pré-visualização "na página do aluno" (dentro do formulário e em tela real do dashboard).' },
      { kind: 'feature', text: 'Agendamento de anúncios com início, término e selos de estado (No ar, Agendado, Expirado, Pausado).' },
      { kind: 'feature', text: 'Modelos rápidos: pop-up somente texto e lateral com imagem.' },
      { kind: 'improvement', text: 'Anúncios sem link de destino são suportados em todos os formatos.' },
      { kind: 'improvement', text: 'Visualização ampliada (lightbox) da imagem do anúncio sem cortes, com legenda.' },
      { kind: 'fix', text: 'Anúncios voltaram a ser visíveis para todos os usuários, logados ou não.' },
    ],
  },
  {
    version: '2.7.0',
    date: '2026-07-22',
    title: 'Landing page institucional',
    changes: [
      { kind: 'feature', text: 'Seção dedicada à Ella Ribeiro, a assistente de estudos própria da plataforma.' },
      { kind: 'feature', text: 'Seção "Sob o capô" com infraestrutura, motores de estudo e segurança.' },
      { kind: 'feature', text: 'Depoimentos e casos de uso reais de alunos.' },
      { kind: 'content', text: 'Seção do criador enxuta, focada na plataforma.' },
      { kind: 'fix', text: 'Vídeo de fundo volta a aparecer no celular com contraste correto.' },
    ],
  },
  {
    version: '2.6.0',
    date: '2026-07-18',
    title: 'Sistema de capas e identidade visual',
    changes: [
      { kind: 'feature', text: 'Editor de capas no admin: grade, paleta e tipografia aplicadas a todas as apostilas.' },
      { kind: 'feature', text: 'Pré-visualização em tamanhos reais (card, leitor e impressão) com área segura.' },
      { kind: 'improvement', text: 'Capas em estética editorial científica com paleta por disciplina.' },
      { kind: 'improvement', text: 'Proporção 2:3 e grid mais compacto no celular para as capas.' },
    ],
  },
  {
    version: '2.5.0',
    date: '2026-07-12',
    title: 'Currículo estruturado e novo leitor',
    changes: [
      { kind: 'feature', text: 'Módulos, capítulos e aulas com progresso individual por aluno.' },
      { kind: 'feature', text: 'Novo leitor de apostilas com sumário lateral e tipografia otimizada.' },
      { kind: 'feature', text: 'Organização das disciplinas em pastas expansíveis no dashboard.' },
      { kind: 'content', text: 'Conteúdo completo do ENEM 2026 distribuído entre todas as disciplinas.' },
    ],
  },
  {
    version: '2.4.0',
    date: '2026-07-05',
    title: 'Escopo de conteúdo e contas segmentadas',
    changes: [
      { kind: 'feature', text: 'Escopo de conteúdo por usuário (acesso completo ou somente ENEM).' },
      { kind: 'security', text: 'Regras de acesso ajustadas para que contas ENEM vejam apenas material do ENEM.' },
      { kind: 'improvement', text: 'Menu e ferramentas ocultos automaticamente conforme o escopo do aluno.' },
      { kind: 'feature', text: 'Painel de diagnóstico com logs de autenticação e estado da sessão.' },
    ],
  },
  {
    version: '2.3.0',
    date: '2026-06-28',
    title: 'Estabilidade de sessão e publicação',
    changes: [
      { kind: 'feature', text: 'Sessão persistente com renovação automática e indicador de status.' },
      { kind: 'feature', text: 'Logout sincronizado entre abas abertas.' },
      { kind: 'improvement', text: 'Deep links protegidos preservam a rota após o login.' },
      { kind: 'improvement', text: 'Configuração de publicação com fallback de rotas e cache correto de assets.' },
    ],
  },
  {
    version: '2.2.0',
    date: '2026-06-20',
    title: 'Identidade visual própria',
    changes: [
      { kind: 'improvement', text: 'Remoção de brilhos e gradientes exagerados; ícones objetivos e hierarquia tipográfica.' },
      { kind: 'improvement', text: 'Sistema de animações suaves em toda a navegação.' },
      { kind: 'improvement', text: 'Consolidação do painel administrativo em um único dashboard.' },
    ],
  },
  {
    version: '2.1.0',
    date: '2026-06-10',
    title: 'Notícias, cursos e app Android',
    changes: [
      { kind: 'feature', text: 'Agregador de notícias de tecnologia com gestão de feeds RSS no admin.' },
      { kind: 'feature', text: 'Cursos gratuitos validados, com gestão dedicada no admin.' },
      { kind: 'feature', text: 'Empacotamento do app para Android.' },
    ],
  },
  {
    version: '2.0.0',
    date: '2026-05-28',
    title: 'Ella Ribeiro, a assistente de estudos',
    changes: [
      { kind: 'feature', text: 'Assistente de estudos própria, com respostas contextuais sobre o conteúdo do aluno.' },
      { kind: 'feature', text: 'Ferramentas administrativas comandadas pela assistente.' },
      { kind: 'feature', text: 'Geração de capas e exercícios a partir do conteúdo da apostila.' },
    ],
  },
  {
    version: '1.5.0',
    date: '2026-05-10',
    title: 'Produtividade e gamificação',
    changes: [
      { kind: 'feature', text: 'Pomodoro, flashcards com repetição espaçada, revisão e simulados semanais.' },
      { kind: 'feature', text: 'XP, níveis, sequência de estudos e conquistas.' },
      { kind: 'feature', text: 'Biblioteca digital com leitor de PDF e EPUB e progresso de leitura.' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-04-15',
    title: 'Lançamento da plataforma',
    changes: [
      { kind: 'feature', text: 'Área do aluno com apostilas, exercícios, materiais e avisos.' },
      { kind: 'feature', text: 'Painel administrativo para publicar e organizar conteúdo.' },
      { kind: 'feature', text: 'Login por e-mail ou RA, com recuperação de acesso.' },
      { kind: 'feature', text: 'Instalação como aplicativo (PWA) em celular e computador.' },
    ],
  },
];

export const CURRENT_VERSION = CHANGELOG[0]?.version ?? '0.0.0';

export type BuildInfo = {
  version: string;
  buildTime: string;
  commit: string;
  commitMessage: string;
  environment: string;
  host: string;
};

export function getBuildInfo(): BuildInfo {
  const safe = (fn: () => string) => {
    try {
      return fn();
    } catch {
      return '';
    }
  };

  return {
    version: CURRENT_VERSION,
    buildTime: safe(() => __APP_BUILD_TIME__) || new Date().toISOString(),
    commit: safe(() => __APP_COMMIT__) || 'local',
    commitMessage: safe(() => __APP_COMMIT_MESSAGE__),
    environment: safe(() => __APP_ENVIRONMENT__) || 'development',
    host: typeof window !== 'undefined' ? window.location.host : '',
  };
}
