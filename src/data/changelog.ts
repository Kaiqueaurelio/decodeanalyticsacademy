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
