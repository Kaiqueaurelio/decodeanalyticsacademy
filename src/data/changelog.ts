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
