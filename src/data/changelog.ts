/**
 * DECODE ANALYTICS ACADEMY - v4.38.0
 * 
 * - Chicago Click Game: Integração de mecânica de gamificação para engajamento.
 * - Monitoramento & Estabilidade: Painel de diagnóstico em tempo real.
 * - Hall da Fama: Ranking de performance dinâmica.
 * - Privacidade Avançada: Gestão granular de cookies.
 */

export type ChangeKind = 'feature' | 'fix' | 'improvement' | 'security' | 'content';

export const CHANGE_KIND_LABEL: Record<ChangeKind, string> = {
  feature: 'Nova Função',
  fix: 'Correção',
  improvement: 'Melhoria',
  security: 'Segurança',
  content: 'Conteúdo',
};

export interface Change {
  kind: ChangeKind;
  text: string;
}

export interface Release {
  version: string;
  date: string;
  title: string;
  major?: boolean;
  changes: Change[];
}

export function getBuildInfo() {
  return {
    version: '4.99.4',
    environment: 'production',
    host: typeof window !== 'undefined' ? window.location.host : 'localhost',
    buildTime: new Date().toISOString(),
    commit: 'v4.99.4-release',
    commitMessage: 'Release v4.99.4: KaTeX/MD robust conversion for theoretical computer science formulas'
  };
}


export const CHANGELOG: Release[] = [
  {
    version: "4.99.4",
    date: "14/08/2026",
    title: "Renderização Matemática Avançada",
    changes: [
      {
        kind: "fix",
        text: "Melhorada a detecção de fórmulas KaTeX inline ($x$, $O(n)$) para garantir exibição correta em Aspectos Teóricos da Computação."
      },
      {
        kind: "improvement",
        text: "Heurística de reconhecimento matemático robusta para notações acadêmicas complexas."
      }
    ]
  },
  {
    version: "4.99.3",
    date: "14/08/2026",
    title: "Polimento de Conteúdo Acadêmico",
    changes: [
      {
        kind: "content",
        text: "Refinamento final da apostila 'Aspectos Teóricos da Computação': organização visual superior, tabelas comparativas detalhadas e exercícios estruturados."
      },
      {
        kind: "improvement",
        text: "Otimização de espaçamento e hierarquia de títulos para leitura mobile fluida."
      }
    ]
  },
  {
    version: "4.99.2",
    date: "14/08/2026",
    title: "Otimização Acadêmica Extrema",
    changes: [
      {
        kind: "content",
        text: "Reescrita completa da apostila 'Aspectos Teóricos da Computação' com estruturação lógica rigorosa e suporte a KaTeX."
      },
      {
        kind: "fix",
        text: "Correção na identificação de blocos MD e normalização de fórmulas matemáticas para renderização correta."
      }
    ]
  },
  {
    version: "4.99.0",
    date: "14/08/2026",
    title: "Limpeza de Interface & UX Final",
    changes: [
      {
        kind: "fix",
        text: "Remoção definitiva de toolbars duplicadas e botões sobrepostos no modo expansão do Workbench."
      },
      {
        kind: "improvement",
        text: "Ajuste de espaçamento vertical (padding) para garantir que o conteúdo não seja cortado pela barra de ferramentas fixa."
      }
    ]
  },
  {
    version: "4.98.0",
    date: "14/08/2026",
    title: "Limpeza Visual do Workbench",
    changes: [
      {
        kind: "fix",
        text: "Remoção de elementos de interface duplicados e correção do espaçamento excessivo no editor (pt-10 removido)."
      },
      {
        kind: "improvement",
        text: "Otimização do z-index e isolamento do editor para evitar sobreposições em dispositivos móveis."
      }
    ]
  },
  {
    version: "4.97.0",
    date: "14/08/2026",
    title: "Reformatação Estrutural Acadêmica",
    changes: [
      {
        kind: "content",
        text: "Reestruturação completa da apostila 'Aspectos Teóricos da Computação' com nova hierarquia visual, suporte a fórmulas KaTeX e tabelas de complexidade."
      },
      {
        kind: "improvement",
        text: "Adicionada seção de exercícios de fixação e dicas contextuais (callouts) para melhor aprendizado."
      }
    ]
  },
  {
    version: "4.96.0",
    date: "14/08/2026",
    title: "Otimização de Empilhamento & UX",
    changes: [
      {
        kind: "fix",
        text: "Corrigida sobreposição visual no Workbench: botões de controle e barra de ferramentas agora respeitam o empilhamento correto (z-index) no modo expansão."
      },
      {
        kind: "improvement",
        text: "Adicionado espaçamento superior (padding-top) na área de conteúdo do editor para evitar conflitos com a toolbar persistente."
      },
      {
        kind: "improvement",
        text: "Isolamento de contexto visual no editor (isolate) para garantir integridade da interface em todos os níveis de zoom."
      }
    ]
  },
  {
    version: "4.95.0",
    date: "14/08/2026",
    title: "Refinamento de UX & Cleanup de UI",
    changes: [
      {
        kind: "fix",
        text: "Remoção de botões flutuantes e zonas de adição duplicadas no Workbench para evitar poluição visual."
      },
      {
        kind: "improvement",
        text: "Melhoria no QuickCreateDialog: Categoria agora permite entrada livre via Input para facilitar a criação de matérias específicas."
      },
      {
        kind: "fix",
        text: "Correção na lógica de seleção de semestre no diálogo de criação rápida."
      }
    ]
  },
  {
    version: "4.94.0",
    date: "13/08/2026",
    title: "Atualização de Conteúdo Acadêmico",
    changes: [
      {
        kind: "content",
        text: "Atualizado o material de 'Aspectos Teóricos da Computação' com conteúdo estruturado sobre Máquinas de Estado, Mealy/Moore e Máquinas de Turing."
      }
    ]
  },
  {
    version: "4.93.0",
    date: "13/08/2026",
    title: "Hiper-Facilitação de Estrutura",
    changes: [
      { kind: 'feature', text: "Adicionado botão flutuante 'Nova Página' de alta visibilidade no canto inferior do editor." },
      { kind: 'improvement', text: "Implementada zona de adição rápida pontilhada entre o cabeçalho e o conteúdo." },
      { kind: 'improvement', text: "Otimizada a visibilidade da ação de estruturação em dispositivos móveis." },
    ]
  },
  {
    version: "4.92.0",
    date: "13/08/2026",
    title: "Acesso Especial e Restrições de Conteúdo",
    changes: [
      { kind: 'feature', text: "Implementado acesso para usuário especial 'Juliana' com escopo de conteúdo restrito." },
      { kind: 'security', text: "Adicionado suporte para 'no_enem' no content_scope, ocultando matérias ENEM para perfis específicos." },
      { kind: 'improvement', text: "Fluxo de login unificado para aceitar identificadores especiais via ra-auth." },
    ]
  },
  {
    version: "4.91.0",
    date: "13/08/2026",
    title: "Ubiquidade e Acesso Transversal",
    changes: [
      { kind: 'feature', text: "Botão 'Nova Página' adicionado aos cards da galeria administrativa para criação instantânea." },
      { kind: 'improvement', text: "Apostilas bônus ('Canivete Suíço') agora são visíveis em todos os semestres (exceto ENEM)." },
      { kind: 'improvement', text: "Foco automático no editor após adicionar uma nova página via modal rápido." },
    ]
  },
  {
    version: "4.90.0",
    date: "13/08/2026",
    title: "Edição Rápida e Navegação Inteligente",
    changes: [
      { kind: 'feature', text: "Botão '+ PAGE' pulsante de alta visibilidade na toolbar do editor." },
      { kind: 'feature', text: "Auto-numeração inteligente de seções (1.1, 1.2) baseada no conteúdo atual." },
      { kind: 'improvement', text: "Feedback visual aprimorado e rolagem automática para novas seções." },
      { kind: 'improvement', text: "Atalho global Ctrl+Shift+P para adicionar conteúdo instantaneamente." },
    ]
  },
  {
    version: "4.89.0",
    date: "13/08/2026",
    title: "Unificação de Fluxos e Limpeza de Legado",
    changes: [
      { kind: 'improvement', text: 'Removidos diálogos de edição legados em favor do Workbench de Apostilas (Notion Pro).' },
      { kind: 'improvement', text: 'Redirecionamento automático de todas as ações de "Editar" para o editor em tela cheia.' },
      { kind: 'fix', text: 'Eliminação de conflitos entre múltiplos modais de edição abertos simultaneamente.' }
    ]
  },
  {
    version: "4.88.0",
    date: "13/08/2026",
    title: "Auditoria Global e Estabilização de Botões",
    changes: [
      { kind: 'fix', text: 'Restaurada a funcionalidade do botão de "Nova Apostila" em todo o painel administrativo.' },
      { kind: 'improvement', text: 'Unificação do fluxo de criação rápida via QuickCreateApostilaDialog em todas as abas do admin.' },
      { kind: 'improvement', text: 'Auditoria técnica completa para garantir que todas as funções de edição e estruturação estão operacionais.' }
    ]
  },
  {
    version: "4.87.0",
    date: "13/08/2026",
    title: "Criação Rápida de Páginas/Seções",
    changes: [
      { kind: 'feature', text: 'Adicionado botão "+ Add Página" na toolbar do editor para criação instantânea de divisões.' },
      { kind: 'feature', text: 'Implementado modal de adição rápida com suporte a Seções, Subseções e Templates de estrutura.' },
      { kind: 'feature', text: 'Adicionado atalho global Ctrl+Shift+P para abrir o diálogo de nova página.' },
      { kind: 'improvement', text: 'Implementado botão flutuante mobile para adição de conteúdo sem sair do fluxo de escrita.' },
      { kind: 'improvement', text: 'Sugestão automática de numeração de seção baseada no conteúdo atual.' }
    ]
  },
  {
    version: "4.86.0",
    date: "13/08/2026",
    title: "Visibilidade do Botão de Criação Rápida",
    changes: [
      { kind: 'fix', text: 'Botão de Adicionar Caderno (Plus) agora é permanentemente visível nos cards de matéria para facilitar o acesso.' },
      { kind: 'improvement', text: 'Ajuste de opacidade para garantir que a ação de criação rápida esteja sempre disponível ao administrador.' }
    ]
  },
  {
    version: "4.85.0",
    date: "13/08/2026",
    title: "Criação Rápida Contextual",
    changes: [
      { kind: 'feature', text: 'Integração do botão Novo Caderno dentro da visualização de matérias e pastas no AdminDashboard.' },
      { kind: 'improvement', text: 'Melhoria na UX de criação contextual com preenchimento automático de categoria e semestre.' },
      { kind: 'improvement', text: 'Refinamento visual dos cards de pasta no painel administrativo com ícone Plus flutuante.' }
    ]
  },
  {
    version: "4.84.0",
    date: "13/08/2026",
    title: "Criação Rápida Contextual",
    changes: [
      { kind: 'feature', text: "Relocação do botão 'Novo Caderno' para dentro de cada pasta de disciplina no dashboard administrativo." },
      { kind: 'feature', text: "Preenchimento automático de categoria e semestre ao criar apostila a partir de uma disciplina." },
      { kind: 'improvement', text: "Remoção do botão flutuante global para evitar poluição visual no admin." },
      { kind: 'improvement', text: "Melhoria na UX de organização de conteúdos acadêmicos." }
    ]
  },
  {
    version: '4.83.0',
    date: '2026-08-13',
    title: 'Criação Rápida de Cadernos',
    changes: [
      {
        kind: 'feature',
        text: 'Implementado botão flutuante pulsante de "Novo Caderno" com acesso rápido em todo o painel admin.'
      },
      {
        kind: 'feature',
        text: 'Adicionado modal de criação rápida com suporte a templates e atalho global (Ctrl+Alt+N).'
      },
      {
        kind: 'improvement',
        text: 'Otimizado o fluxo de criação para permitir início imediato de novas apostilas em menos de 10 segundos.'
      }
    ]
  },
  {
    version: '4.82.0',
    date: '2026-08-13',
    title: 'Notion Pro UX Hyper-Optimization',
    changes: [
      {
        kind: 'feature',
        text: 'Auto-save inteligente a cada 1 segundo com feedback visual de sucesso no cabeçalho (v4.82.0).'
      },
      {
        kind: 'improvement',
        text: 'Reorganização da toolbar em 3 grupos funcionais: Estrutura, Conteúdo e Publicação.'
      },
      {
        kind: 'feature',
        text: 'Implementação de atalhos de teclado avançados (Ctrl+S, Ctrl+Alt+1-3, Ctrl+E, Ctrl+/) e Snippets de "/" (Slack style).'
      },
      {
        kind: 'improvement',
        text: 'Refinamento de Breadcrumbs clicáveis e controle de sidebar colapsável para maximizar a área de edição.'
      }
    ]
  },
  {
    version: '4.81.0',
    date: '2026-08-13',
    title: 'Notion Pro High-Fidelity Interactive Workbench',
    changes: [
      {
        kind: 'improvement',
        text: 'Implementação de cabeçalho interativo com status de pendências fixo (v4.81.0).'
      },
      {
        kind: 'improvement',
        text: 'Barra de ferramentas administrativa horizontal com atalhos de IA, ENEM e visualização como aluno.'
      },
      {
        kind: 'feature',
        text: 'Sistema de salvamento automático a cada 30 segundos para maior segurança.'
      },
      {
        kind: 'improvement',
        text: 'Otimização de responsividade mobile e indicador de progresso dinâmico.'
      }
    ]
  },
  {
    version: '4.80.0',
    date: '2026-08-13',
    title: 'Refinamento High-Fidelity Notion Pro',
    changes: [
      {
        kind: 'improvement',
        text: 'Reestruturação da barra de ferramentas administrativa em 3 camadas: Navegação (Notion breadcrumbs), Métricas (Saúde da apostila) e Ações Rápidas (Barra secundária com atalhos de IA e capa).'
      },
      {
        kind: 'improvement',
        text: 'Estilização 1:1 baseada na imagem de referência, incluindo chips de pendências coloridos, badges de curso e botões de ação com bordas suaves e fundos semi-transparentes.'
      },
      {
        kind: 'fix',
        text: 'Correção da posição da barra de ferramentas, agora fixa no topo do workbench para acesso persistente durante a edição.'
      }
    ]
  },
  {
    version: '4.79.0',
    date: '2026-08-13',
    title: 'Restauração Notion Pro Editor',
    changes: [
      {
        kind: 'fix',
        text: 'Reintegração da ApostilaHealthBar e EditorRibbon para acesso imediato ao Colar Inteligente e formatação Office em todos os dispositivos.'
      }
    ]
  },
  {
    version: '4.78.0',
    date: '2026-08-13',
    title: 'Atualização de Conteúdo Acadêmico',
    changes: [
      { kind: 'content', text: 'Atualizado o conteúdo da apostila de Gestão de Projetos I com material acadêmico detalhado sobre fundamentos, PMI/PMBOK e aplicação prática.' },
    ]
  },
  {
    version: '4.77.0',
    date: '2026-08-13',
    title: 'Visibilidade de Navegação Universal',
    changes: [
      { kind: 'improvement', text: 'Implementado indicador de rolagem lateral neon para dispositivos móveis no editor administrativo.' },
      { kind: 'improvement', text: 'Aumentado o contraste da barra de rolagem e do indicador de posição para garantir orientação espacial clara.' },
      { kind: 'fix', text: 'Corrigida falha de percepção de scroll em materiais extensos através de feedback visual persistente.' },
    ]
  },
  {
    version: '4.76.0',
    date: '2026-08-13',
    title: 'Destaque de Rolagem Administrativa',
    changes: [
      { kind: 'improvement', text: 'Aumentado o contraste e a espessura da barra de rolagem no editor para máxima visibilidade.' },
      { kind: 'improvement', text: 'Indicador lateral de posição agora utiliza brilho neon e trilha contrastante.' },
    ]
  },
  {
    version: '4.75.0',
    date: '2026-08-13',
    title: 'Navegação & Visibilidade no Editor',
    changes: [
      { kind: 'improvement', text: 'Adicionada barra de rolagem personalizada e indicadora de posição no Workbench administrativo.' },
      { kind: 'improvement', text: 'Melhorada a visibilidade da rolagem para facilitar a navegação em materiais extensos.' },
    ]
  },
  {
    version: '4.74.0',
    date: '2026-08-13',
    title: 'Correção de Rolagem Mobile',
    changes: [
      { kind: 'fix', text: 'Habilitada rolagem vertical no Workbench administrativo em dispositivos móveis.' },
      { kind: 'improvement', text: 'Otimização da altura mínima do editor para melhor experiêncira de escrita no celular.' },
    ]
  },
  {
    version: '4.73.0',
    date: '2026-08-13',
    title: 'Otimização Visual do Workbench',
    changes: [
      { kind: 'improvement', text: 'Redução de espaçamentos excessivos no editor administrativo para melhor aproveitamento de tela.' },
      { kind: 'improvement', text: 'Estabilização definitiva da barra de status e ferramentas Notion Pro no Workbench.' },
    ]
  },
  {
    version: '4.72.0',
    date: '2026-08-13',
    title: 'Restauração Total Edição Mobile',
    changes: [
      { kind: 'fix', text: 'Restauração do botão Colar Inteligente visível em todas as telas mobile.' },
      { kind: 'improvement', text: 'Ajuste de ícones e botões de modo para melhor precisão touch no celular.' },
      { kind: 'feature', text: 'Restauração da aba Arquivo e melhoria do scroll horizontal no Editor Ribbon.' },
      { kind: 'fix', text: 'Garantia de persistência de ferramentas de edição no cabeçalho Notion Pro.' },
    ],
  },
  {
    version: '4.71.5',
    date: '2026-08-12',
    title: 'Otimização Mobile & Edição Pro',
    changes: [
      { kind: 'improvement', text: 'Melhorada a visibilidade do botão "Colar Inteligente" em telas pequenas (v4.71.5).' },
      { kind: 'improvement', text: 'Otimizado o scroll e área de toque do Editor Ribbon para dispositivos móveis.' },
      { kind: 'fix', text: 'Ajustada a sensibilidade de toque nos cards de galeria administrativa.' },
    ],
  },
  {
    version: '4.71.0',
    date: '2026-08-12',
    title: 'Restauração de Ferramentas Administrativas Pro',
    changes: [
      { kind: 'fix', text: 'Restaurada a funcionalidade "Colar Inteligente" e ferramentas de edição avançada no Workbench de apostilas.' },
      { kind: 'improvement', text: 'Unificação da barra de status administrativa com atalhos para produtividade e colagem estruturada.' },
      { kind: 'fix', text: 'Corrigida regressão visual no cabeçalho do editor Notion Pro.' },
    ],
  },
  {
    version: '4.70.0',
    date: '2026-08-12',
    title: 'Módulo Bônus: Canivete Suíço do Estudante',
    changes: [
      { kind: 'feature', text: 'Integrada a nova disciplina bônus "Canivete Suíço do Estudante" com materiais exclusivos do Notion.' },
    ],
  },
];
