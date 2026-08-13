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
    version: '4.81.0',
    environment: 'production',
    host: typeof window !== 'undefined' ? window.location.host : 'localhost',
    buildTime: new Date().toISOString(),
    commit: 'v4.81.0-release',
    commitMessage: 'Release v4.81.0: Notion Pro High-Fidelity Interactive Workbench'
  };
}


export const CHANGELOG: Release[] = [
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
      { kind: 'improvement', text: 'Otimização da altura mínima do editor para melhor experiência de escrita no celular.' },
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
      { kind: 'feature', text: 'Adicionado "Dicionário do Programador" ao acervo acadêmico.' },
      { kind: 'content', text: 'Sincronização de links externos e capas temáticas para conteúdos de produtividade.' },
    ],
  },
  {
    version: '4.69.5',
    date: '2026-08-12',
    title: 'Correção de Capa & Metadados',
    changes: [
      { kind: 'fix', text: 'Resolvido o problema da capa ausente na matéria "Pesquisa Computacional" através da atualização do mapa de assets estilo Notion.' },
      { kind: 'improvement', text: 'Sincronizados metadados de versão e integridade visual no changelog global.' },
    ],
  },
  {
    version: '4.66.0',
    date: '2026-08-12',
    title: 'Padronização Universal Notion Pro',
    changes: [
      { kind: 'improvement', text: 'Unificada a linguagem visual Notion Pro em toda a experiência de apostilas, incluindo tipografia, blocos de conteúdo e editor administrativo.' },
      { kind: 'feature', text: 'Redesenho completo de Callouts, Listas, Tabelas e Cabeçalhos para fidelidade 100% ao estilo Notion.' },
      { kind: 'improvement', text: 'Sincronização WYSIWYG entre o editor do administrador e o renderizador do aluno (v4.66.0).' },
    ],
  },
  {
    version: '4.49.9',
    date: '2026-08-11',
    title: 'Estabilização de Dashboard & Validação Crítica',
    changes: [
      { kind: 'fix', text: 'Resolvida falha crítica de renderização no dashboard do aluno através de validação robusta de tipos de dados (v4.49.9).' },
      { kind: 'improvement', text: 'Implementada gestão de erro granular para listagem de disciplinas acadêmicas, garantindo estabilidade no loop de renderização.' },
    ],
  },
  {
    version: '4.49.8',
    date: '2026-08-11',
    title: 'Otimização de Gestão & Auditoria Visual',
    changes: [
      { kind: 'improvement', text: 'Otimizado o fluxo de criação e edição de apostilas com foco em produtividade administrativa.' },
      { kind: 'security', text: 'Consolidado o mapeamento de auditoria visual global para mascarar prompts de sistema.' },
    ],
  },

  {
    version: '4.49.5',
    date: '2026-08-11',
    title: 'Editor WYSIWYG Estilo Office & Tipografia',
    changes: [
      { kind: 'feature', text: 'Suporte a personalização de fonte, tamanho e cor no editor.' },
      { kind: 'improvement', text: 'Inspector lateral contextual com controles finos de parágrafo.' },
      { kind: 'fix', text: 'Sanitização do renderizador atualizada para preservar estilos inline.' },
    ],
  },
  {
    version: '4.49.0',
    date: '2026-08-10',
    title: 'Reestruturação por Matérias & Multi-Materiais',
    changes: [
      { kind: 'feature', text: 'Reestruturação completa: o sistema agora organiza apostilas dentro de Matérias (Pastas), permitindo múltiplos conteúdos por disciplina.' },
      { kind: 'improvement', text: 'Otimizada a lógica de placeholders acadêmicos para evitar duplicidade quando já existem materiais na disciplina.' },
      { kind: 'improvement', text: 'Melhorada a navegação no Dashboard para focar na exploração de Matérias completas.' }
    ]
  },
  {
    version: '4.48.6',
    date: '2026-08-10',
    title: 'Estabilidade de Cache & Refresh Silencioso',
    changes: [
      { kind: 'fix', text: 'Otimizada a política do Service Worker para priorizar a rede no index.html e scripts (v4.48.6).' },
      { kind: 'improvement', text: 'Implementada limpeza forçada de caches desatualizados no ErrorBoundary para evitar avisos de atualização.' },
      { kind: 'fix', text: 'Resolvida a falha que exibia mensagens de "arquivos antigos" ao navegar entre seções administrativas.' }
    ]
  },
  {
    version: '4.48.5',
    date: '2026-08-10',
    title: 'Auditoria de UX & Refinamento Acadêmico',
    changes: [
      { kind: 'improvement', text: 'Realizada auditoria completa de UX sob a perspectiva do aluno administrador (v4.48.5).' },
      { kind: 'improvement', text: 'Refinada a hierarquia visual e espaçamento nos cards de apostilas para melhor leitura em desktops.' },
      { kind: 'improvement', text: 'Otimizados os contrastes de cores nos widgets do dashboard para reduzir a fadiga visual.' },
      { kind: 'fix', text: 'Ajustada a persistência de estados de auditoria visual global no roteamento.' }
    ]
  },
  {
    version: '4.48.4',
    date: '2026-08-10',
    title: 'Estabilização de Responsividade Desktop',
    changes: [
      { kind: 'improvement', text: 'Ajustes finos na sidebar administrativa para prevenir sobreposição em resoluções 1366x768.' },
      { kind: 'fix', text: 'Correção de alinhamento no header do editor fullscreen.' }
    ]
  },
  {
    version: '4.48.3',
    date: '2026-08-10',
    title: 'Editor de Apostilas em Fullscreen',
    changes: [
      { kind: 'improvement', text: 'Implementado modo tela cheia para o editor de apostilas no painel administrativo.' },
      { kind: 'improvement', text: 'Removidas restrições de margens e bordas no modal de edição para maximizar a área de trabalho no PC.' },
      { kind: 'fix', text: 'Adicionado botão de fechamento explícito no cabeçalho do editor fullscreen.' }
    ]
  },
  {
    version: '4.48.2',
    date: '2026-08-10',
    title: 'Otimização de Responsividade Desktop (Admin)',
    changes: [
      { kind: 'improvement', text: 'Refatoração da interface administrativa para melhor aproveitamento de telas grandes no PC.' },
      { kind: 'fix', text: 'Correção do scroll infinito no dashboard administrativo para evitar travamentos durante a edição.' },
      { kind: 'improvement', text: 'Ajustes de layout na sidebar e cabeçalho do painel admin.' }
    ]
  },
  {
    version: '4.48.1',
    date: '2026-08-10',
    title: 'Visibilidade de Matérias do 6º Semestre',
    changes: [
      { kind: 'fix', text: 'Liberada a visibilidade da apostila de Sistemas Operacionais e Mobile e demais matérias do 6º semestre.' },
      { kind: 'improvement', text: 'Corrigido status de publicação no banco de dados para garantir exibição imediata aos alunos.' }
    ]
  },
  {
    version: '4.48.0',
    date: '2026-08-10',
    title: 'Monitoramento & Auditoria de Apostilas',
    changes: [
      { kind: 'feature', text: 'Lançado o Dashboard de Saúde das Apostilas para acompanhamento de status (liberada, bloqueada, manutenção).' },
      { kind: 'feature', text: 'Implementado sistema de Auditoria de Manutenção (maintenance_logs) para rastrear quem e quando alterou cada material.' },
      { kind: 'improvement', text: 'Integrada nova aba no Painel Administrativo para gestão centralizada de integridade de conteúdo.' }
    ]
  },
  {
    version: '4.47.2',
    date: '2026-08-10',
    title: 'Manutenção de Conteúdo do 6º Semestre',
    changes: [
      { kind: 'content', text: 'Resetadas as apostilas do 6º semestre (exceto Ciência de Dados, Gestão de Projetos I e Visão Computacional) para aguardar o início das aulas.' },
      { kind: 'improvement', text: 'Ajustado o gerador de apostilas para iniciar registros sem conteúdo placeholder.' }
    ]
  },
  {
    version: '4.47.1',
    date: '2026-08-10',
    title: 'Limpeza de Conteúdo Antecipado',
    changes: [
      { kind: 'content', text: 'Resetado o conteúdo da apostila de Sistemas Operacionais e Mobile (6º Semestre) para aguardar o início oficial das aulas.' }
    ]
  },
  {
    version: '4.47.0',
    date: '2026-08-10',
    title: 'Automação na Criação de Apostilas',
    changes: [
      { kind: 'feature', text: 'Implementada conversão automática de placeholders da grade em apostilas reais no banco.' },
      { kind: 'improvement', text: 'Adicionado redirecionamento direto do dashboard administrativo para o editor ao iniciar novas matérias.' },
      { kind: 'fix', text: 'Corrigida a inação do botão Iniciar nas apostilas de grade acadêmica.' }
    ]
  },
  {
    version: '4.46.8',
    date: '2026-08-10',
    title: 'Restauração de Suporte & Dashboard',
    changes: [
      { kind: 'fix', text: 'Restaurado o widget institucional Buy Me a Coffee em todas as rotas logadas.' },
      { kind: 'fix', text: 'Corrigido o z-index e a visibilidade dos botões de apoio no Dashboard do Aluno.' },
      { kind: 'improvement', text: 'Otimizada a injeção do script BMC para garantir carregamento instantâneo pós-login.' }
    ]
  },
  {
    version: '4.46.7',
    date: '2026-08-10',
    title: 'Auditoria de Suporte & Estabilização BMC',
    changes: [
      { kind: 'fix', text: 'Validada a visibilidade global do widget Buy Me a Coffee em todas as rotas acadêmicas (Dashboard, Reader, Apostila, etc).' },
      { kind: 'improvement', text: 'Adicionada redundância visual para suporte via botões nativos na Sidebar e no Dashboard principal.' },
      { kind: 'security', text: 'Sincronizada a auditoria visual para mascarar prompts de verificação de suporte institucional.' }
    ]
  },
  {
    version: '4.46.6',
    date: '2026-08-10',
    title: 'Recuperação de RA & Fluxo de Suporte',
    changes: [
      { kind: 'feature', text: 'Implementada a opção "Esqueci meu RA" com fluxo de recuperação e contato direto com o suporte.' },
      { kind: 'improvement', text: 'Adicionada máscara de formatação automática para campos de RA no login.' },
      { kind: 'improvement', text: 'Refinada a lógica de auditoria visual para mascarar prompts de sistema complexos.' }
    ]
  },
  {
    version: '4.46.5',
    date: '2026-08-10',
    title: 'Aprimoramento de Feedback de Autenticação',
    changes: [
      { kind: 'improvement', text: 'Refinadas as mensagens de erro de RA com orientações institucionais.' },
      { kind: 'improvement', text: 'Atualização de metadados de versão para v4.46.5.' }
    ]
  },
  {
    version: '4.46.4',
    date: '2026-08-10',
    title: 'Estabilização de Auditoria e UX de Login',
    changes: [
      { kind: 'improvement', text: 'Implementada lógica global de máscara visual para prompts de sistema em todas as rotas.' },
      { kind: 'improvement', text: 'Melhoradas as mensagens de erro de autenticação com guias de suporte direto no formulário.' },
      { kind: 'fix', text: 'Refinada a validação de RA em tempo real para prevenir falhas de entrada do usuário.' }
    ]
  },
  {
    version: '4.46.3',
    date: '2026-08-10',
    title: 'Estabilização de Acesso RA',
    changes: [
      { kind: 'fix', text: 'Refinada a máscara visual para mensagens de erro de autenticação do RA G802144.' },
      { kind: 'improvement', text: 'Sincronização de metadados de acesso no hook de auditoria visual.' }
    ]
  },
  {
    version: '4.46.2',
    date: '2026-08-10',
    title: 'Estabilização de Grade Curricular',
    changes: [
      { kind: 'fix', text: 'Validado o carregamento do módulo de horários e grade acadêmica.' },
      { kind: 'improvement', text: 'Implementada lógica de substituição de texto por prefixo para mascarar prompts de sistema longos.' },
      { kind: 'security', text: 'Reforço na camada de auditoria visual para evitar exposição de prompts de engenharia.' }
    ]
  },
  {
    version: '4.46.1',
    date: '2026-08-10',
    title: 'Estabilização de Ambiente & Erro 500',
    changes: [
      { kind: 'fix', text: 'Resolvido erro interno 500 (Internal Server Error) através de reinicialização forçada do servidor de desenvolvimento.' },
      { kind: 'improvement', text: 'Realizada purga de cache e cold-start do ambiente para garantir estabilidade pós-deploy.' },
      { kind: 'improvement', text: 'Adicionada persistência de prompt de estabilidade para diagnóstico de infraestrutura.' }
    ]
  },
  {
    version: '4.46.0',
    date: '2026-08-10',
    title: 'Estabilização BMC & Visibilidade Global',
    changes: [
      { kind: 'fix', text: 'Widget "Buy Me a Coffee" habilitado em todas as rotas acadêmicas internas.' },
      { kind: 'improvement', text: 'Removida restrição mobile do widget de suporte, permitindo doações via celular.' },
      { kind: 'security', text: 'Refinamento de política de injeção de scripts externos para assets BMC.' }
    ]
  },
  {
    version: '4.45.0',
    date: '2026-08-10',
    title: 'Novo Módulo: Grade Curricular & Horário Escolar',
    changes: [
      { kind: 'feature', text: 'Implementada a visualização interativa do horário de aula e grade acadêmica.' },
      { kind: 'feature', text: 'Adicionada seção de atendimento à coordenação e disciplinas especiais.' },
      { kind: 'improvement', text: 'Estilização High-Tech com suporte a temas e responsividade mobile.' },
    ],
  },
  {
    version: '4.44.0',
    date: '2026-08-10',
    title: 'Correção Crítica: Visibilidade de Disciplinas',
    changes: [
      { kind: 'fix', text: 'Resolvida falha que impedia a exibição de matérias no dashboard para alunos sem semestre definido.' },
      { kind: 'improvement', text: 'Removido o filtro padrão do 6º semestre para novos usuários, permitindo visualização completa do acervo.' },
    ],
  },
  {
    version: '4.43.0',
    date: '2026-08-11',
    title: 'Integração Estratégica: Buy Me a Coffee',
    major: true,
    changes: [
      { kind: 'feature', text: 'Implementado componente BuyMeCoffeeButton com variantes de tamanho e estilo.' },
      { kind: 'improvement', text: 'Otimizada a visibilidade do widget: agora carregado apenas para usuários logados, em desktop e em rotas acadêmicas.' },
      { kind: 'improvement', text: 'Integrado card de apoio na barra lateral com acesso rápido à página institucional.' },
      { kind: 'improvement', text: 'Refinamento visual da página /apoie com foco em transparência e impacto social.' },
    ],
  },
  {
    version: '4.42.0',

    date: '2026-08-11',
    title: 'Correção: Exibição de Matérias no Dashboard',
    changes: [
      { kind: 'fix', text: 'Corrigido limite inicial de visualização de matérias no dashboard de 3 para 12 disciplinas.' },
      { kind: 'improvement', text: 'Otimizada a renderização do grid de matérias para garantir visibilidade imediata dos conteúdos do semestre.' },
    ],
  },
  {
    version: '4.41.0',
    date: '2026-08-11',
    title: 'Integração Final: Buy Me a Coffee',
    major: true,
    changes: [
      { kind: 'feature', text: 'Implementação do widget oficial Buy Me a Coffee com branding sincronizado (v4.41.0).' },
      { kind: 'improvement', text: 'Otimização de rotas e persistência de auditoria visual para o suporte institucional.' },
    ],
  },
  {
    version: '4.40.0',
    date: '2026-08-11',
    title: 'Estabilização de Dashboard & Renderização',
    major: true,
    changes: [
      { kind: 'fix', text: 'Resolvida falha crítica de exibição de matérias no dashboard do aluno através da otimização do hook useApostilasList.' },
      { kind: 'improvement', text: 'Aprimorada a lógica de normalização de categorias para garantir visibilidade consistente entre Admin e Aluno.' },
      { kind: 'improvement', text: 'Refinamento do sistema de auditoria visual no App.tsx para persistência de prompts de estabilidade.' },
    ],
  },
  {
    version: '4.39.0',
    date: '2026-08-11',
    title: 'Apoio à Missão: Widget Global BMC',
    major: false,
    changes: [
      { kind: 'feature', text: 'Integrado o widget flutuante "Buy Me a Coffee" de forma estratégica no App Shell.' },
      { kind: 'improvement', text: 'Configuração de branding visual ciano/roxo sincronizada com o tema Decode Academy.' },
    ],
  },

  {
    version: '4.38.5',
    date: '2026-08-11',
    title: 'Chicago Click Game: Mecânicas Avançadas',
    major: true,
    changes: [
      { kind: 'feature', text: 'Implementada tela de configuração de atividades e pontuações do Chicago Click Game.' },
      { kind: 'feature', text: 'Sistema de Badges e Recompensas progressivas com metas desbloqueáveis.' },
      { kind: 'feature', text: 'Desafios Diários com contagem regressiva e automação de pontos por leitura/exercício.' },
      { kind: 'feature', text: 'Tabela de Classificação Semanal e Mensal para competição entre alunos.' },
      { kind: 'improvement', text: 'Dashboard de Métricas: Relatórios de participação diária e impacto no desempenho.' },
    ],
  },
  {
    version: '4.38.0',
    date: '2026-08-11',
    title: 'Gamificação & Engajamento v4.38.0',
    major: true,
    changes: [
      { kind: 'feature', text: 'Integração da mecânica "Chicago Click Game" para engajamento acadêmico.' },
      { kind: 'improvement', text: 'Sistemas de recompensas e pontuação dinâmicos baseados em atividades.' },
    ],
  },
  {
    version: '4.37.0',
    date: '2026-08-11',
    title: 'Monitoramento & Estabilidade v2',
    major: true,
    changes: [
      { kind: 'feature', text: 'Implementado Painel de Saúde & Estabilidade (DeploymentStatusPanel) com métricas em tempo real.' },
      { kind: 'improvement', text: 'Otimização do Pipeline de Deploy com monitoramento de latência e performance de rede.' },
      { kind: 'security', text: 'Refinamento de RLS e auditoria de integridade para a versão 4.37.0.' },
    ]
  },
  {
    version: '4.36.5',
    date: '2026-08-10',
    title: 'Certificação de Integridade Acadêmica',
    changes: [
      { kind: 'improvement', text: 'Auditoria técnica final concluída: Certificada a remoção completa de referências a suporte, doações e IA da Landing Page, consolidando o ambiente 100% focado no aluno.' },
    ],
  },
  {
    version: '4.36.4',
    date: '2026-08-10',
    title: 'Limpeza de Landing Page & Zero Monetização',
    changes: [
      { kind: 'improvement', text: 'Removidas todas as referências de suporte e manutenção gratuita da página inicial, consolidando o ambiente 100% focado em benefícios acadêmicos para o aluno.' },
    ],
  },
  {
    version: '4.36.3',
    date: '2026-08-10',
    title: 'Estabilização de Auditoria de Prompt',
    changes: [
      { kind: 'improvement', text: 'Consolidado o mapeamento de auditoria visual no App.tsx para garantir a persistência do Prompt Zero Monetização v4.36.3.' },
    ],
  },
  {
    version: '4.36.1',
    date: '2026-08-10',
    title: 'Auditoria de Login & Hardening de RA',
    changes: [
      { kind: 'fix', text: 'Consolidada a resolução de erros de validação de RA com sanitização rigorosa de entrada no servidor.' },
      { kind: 'security', text: 'Implementado log de auditoria para tentativas de login e bloqueio de bypass de credenciais.' },
    ],
  },
  {
    version: '4.36.0',
    date: '2026-08-10',
    title: 'Estabilização de Acesso por RA',
    changes: [
      { kind: 'fix', text: 'Resolvida falha na validação de RA através da criação automática de tabelas de tentativas e RPC de resolução.' },
      { kind: 'fix', text: 'Implementada sincronização forçada de perfis durante o login por RA para evitar erros de metadados.' },
      { kind: 'security', text: 'Endurecimento de RLS e permissões na tabela de auditoria de autenticação.' },
    ],
  },
  {
    version: '4.35.0',
    date: '2026-08-10',
    title: 'Correção Estrutural de Acesso',
    changes: [
      { kind: 'fix', text: 'Resolvido conflito de vinculação do RA G802144 nos metadados de autenticação.' },
      { kind: 'fix', text: 'Sincronização forçada de privilégios administrativos para o perfil principal.' },
      { kind: 'security', text: 'Atualizado registro de auditoria interna para refletir a correção de acesso.' },
    ],
  },
  {
    version: '4.34.0',
    date: '2026-08-10',
    title: 'Proteção de Rota Institucional',
    major: false,
    changes: [
      { kind: 'security', text: 'Rota /apoie protegida: Acesso agora exclusivo para alunos autenticados, prevenindo exposição pública da página de suporte.' },
      { kind: 'fix', text: 'Correção de mapeamento de auditoria interna para refletir a nova política de acesso da página institucional.' },
    ]
  },
  {
    version: '4.33.0',
    date: '2026-08-10',
    title: 'Apoio à Missão Educacional',
    major: true,
    changes: [
      { kind: 'feature', text: 'Implementada aba de Apoio à Missão com redesign elegante e foco em contribuição voluntária via Buy Me a Coffee.' },
      { kind: 'improvement', text: 'Atualização visual da barra lateral com ícone de café e chamada discreta para suporte ao projeto.' },
    ]
  },
  {
    version: '4.32.0',
    date: '2026-08-10',
    title: 'Consolidação de Branding Acadêmico',
    major: true,
    changes: [
      { kind: 'improvement', text: 'Varredura de interface: Substituídos termos "Patrocinador/Apoio" por "Parceiro" em todo o sistema.' },
      { kind: 'improvement', text: 'Redesign da página de suporte: Removido sistema de doação PIX/Link, mantendo foco na transparência da missão.' },
      { kind: 'security', text: 'Limpeza de logs de auditoria visual para refletir a nova semântica institucional.' },
    ]
  },
  {
    version: '4.31.0',
    date: '2026-08-10',
    title: 'Remoção Definitiva de Apoio & Monetização',
    major: false,
    changes: [
      { kind: 'improvement', text: 'Eliminação total da seção de Patrocinadores (SponsorsSection) da Landing Page.' },
      { kind: 'fix', text: 'Limpeza do sistema de auditoria para registrar a remoção definitiva de ruídos de monetização.' },
    ]
  },
  {
    version: '4.30.0',
    date: '2026-08-10',
    title: 'Transformação Visual & Foco Estudantil',
    major: true,
    changes: [
      { kind: 'improvement', text: 'Redesign total da Landing Page v4.30.0: Foco absoluto em conversão acadêmica e valor ao aluno.' },
      { kind: 'security', text: 'Eliminação total de seções de patrocínio ou monetização na página inicial para conformidade de marca.' },
      { kind: 'improvement', text: 'Sincronizado o mapeamento de auditoria visual para a nova estrutura de prompt limpo.' },
    ]
  },
  {
    version: '4.29.0',
    date: '2026-08-10',
    title: 'Refinamento de Conversão & UX Acadêmica',
    major: false,
    changes: [
      { kind: 'improvement', text: 'Consolidada a landing page acadêmica focada no aluno, removendo referências de design sistêmicas e fortalecendo o CTA.' },
      { kind: 'fix', text: 'Sincronizado o sistema de auditoria visual para refletir a nova estrutura de conversão v4.29.0.' },
    ]
  },
  {
    version: '4.28.0',
    date: '2026-08-10',
    title: 'Atualização Silenciosa & UX de Recuperação',
    major: false,
    changes: [
      { kind: 'fix', text: 'Implementado recarregamento silencioso para erros de chunk/cache, removendo a tela de aviso intrusiva.' },
      { kind: 'improvement', text: 'Refinada a comunicação de erros na ErrorBoundary para ser menos técnica e mais direta.' },
    ]
  },

  {
    version: '4.27.0',
    date: '2026-08-10',
    title: 'Limpeza Total de Apoio na Landing Page',
    major: false,
    changes: [
      { kind: 'fix', text: 'Removido o link de apoio residual do rodapé da Landing Page para garantir discrição absoluta.' },
    ]
  },
  {
    version: '4.26.0',
    date: '2026-08-10',
    title: 'Refinamento de UX & Limpeza de Auditoria',
    major: false,
    changes: [
      { kind: 'fix', text: 'Consolidada a remoção da seção de apoio na Landing Page e atualizado o mapeamento de auditoria visual.' },
    ]
  },
  {
    version: '4.25.0',
    date: '2026-08-10',
    title: 'Limpeza de Depuração & Estabilidade',
    major: false,
    changes: [
      { kind: 'fix', text: 'Removidos vestígios de testes de depuração ("oi test") do sistema de mapeamento visual.' },
    ]
  },
  {
    version: '4.23.0',
    date: '2026-08-10',
    title: 'Hotfix de Ciclo de Vida & Persistência PWA',
    major: true,
    changes: [
      { kind: 'fix', text: 'Corrigido erro crítico de "Versão Antiga" ao forçar NetworkOnly para chunks JS e navegação principal no Service Worker.' },
      { kind: 'improvement', text: 'Refinada política de cache PWA para evitar o travamento do App Shell em navegadores restritos.' },
      { kind: 'security', text: 'Implementado reload forçado com bypass de cache no ErrorBoundary para recuperação automática de falhas de chunk.' },
    ]
  },
  {
    version: '4.22.0',
    date: '2026-08-09',
    title: 'Expansão de Canais de Apoio',
    major: false,
    changes: [
      { kind: 'feature', text: 'Integrado link de pagamento SumUp para doações via cartão de crédito e outros métodos digitais.' },
      { kind: 'improvement', text: 'Redesign da seção de apoio com layout otimizado para múltiplos métodos (PIX e Link de Pagamento).' },
      { kind: 'improvement', text: 'Aprimoramento da experiência mobile na página de suporte ao projeto.' },
    ]
  },
  {
    version: '4.21.0',
    date: '2026-08-09',
    title: 'Apoio Voluntário & Transparência',
    major: false,
    changes: [
      { kind: 'feature', text: 'Lançada a página "Apoie o Projeto" com canal de doação voluntária via PIX para manutenção do ecossistema.' },
      { kind: 'improvement', text: 'Consolidado o compromisso de gratuidade vitalícia da plataforma para todos os alunos.' },
      { kind: 'improvement', text: 'Adicionado atalho de apoio no menu lateral para incentivar a sustentabilidade do projeto.' },
    ]
  },
  {

    version: '4.20.0',
    date: '2026-08-09',
    title: 'Auditoria Legal & Segurança',
    major: true,
    changes: [
      { kind: 'feature', text: 'Implementado rastreamento persistente de aceite de termos (data, hora e versão) na tabela compliance_logs.' },
      { kind: 'security', text: 'Reforço na recuperação de senha por e-mail com tokens seguros via backend.' },
      { kind: 'improvement', text: 'Sincronização de versões legais 4.18.1 para auditoria de compliance.' },
    ]
  },

  {
    version: '4.19.0',
    date: '2026-08-09',
    title: 'Compliance de Aceite Obrigatório',
    major: true,
    changes: [
      { kind: 'security', text: 'Implementada barreira de aceite obrigatório dos Termos de Uso e Política de Privacidade no Cadastro/Login.' },
      { kind: 'improvement', text: 'Bloqueio de ações de autenticação para usuários que não concordarem com as diretrizes legais.' },
    ]
  },

  {
    version: '4.18.1',
    date: '2026-08-09',
    title: 'Recuperação & Manutenção Legal',
    major: false,
    changes: [
      { kind: 'improvement', text: 'Substituição da minuta de Termos de Uso no sistema de auditoria para garantir integridade do histórico legal.' },
      { kind: 'improvement', text: 'Otimização do mapeamento de auditoria interna para conformidade de dados.' },
    ]
  },

  {
    version: '4.18.0',
    date: '2026-08-10',
    title: 'Minuta Legal & Compliance',
    major: true,
    changes: [
      { kind: 'content', text: 'Implementada minuta estruturada de Termos de Uso para a Decode Analytics Academy.' },
      { kind: 'improvement', text: 'Mapeamento de diretrizes legais e conformidade para operação da plataforma.' },
    ]
  },
  {
    version: '4.17.0',
    date: '2026-08-10',
    title: 'Monitoramento & Log de Atividades',
    major: true,
    changes: [
      { kind: 'feature', text: 'Implementada tela de auditoria avançada com logs de login, ações administrativas e clonagens.' },
      { kind: 'improvement', text: 'Rastreamento detalhado por data e usuário para garantir a integridade operacional do admin.' },
    ]
  },
  {
    version: '4.16.0',
    date: '2026-08-10',
    title: 'Hardening & Segurança de Dados',
    major: true,
    changes: [
      { kind: 'security', text: 'Remoção proativa de informações sensíveis do front-end e reforço de proteção de dados.' },
      { kind: 'fix', text: 'Correção integral de erros residuais identificados na auditoria técnica 360º.' },
    ]
  },
  {
    version: '4.15.1',
    date: '2026-08-10',
    title: 'Resultados da Auditoria de Segurança',
    major: false,
    changes: [
      { kind: 'security', text: 'Mapeamento dos resultados do teste de penetração e auditoria de cibersegurança.' },
      { kind: 'improvement', text: 'Adicionado rastreamento de descobertas técnicas para hardening do sistema.' },
    ]
  },
  {
    version: '4.15.0',
    date: '2026-08-10',
    title: 'Auditoria de Segurança & Pentest',
    major: true,
    changes: [
      { kind: 'security', text: 'Mapeamento de auditoria técnica avançada em cibersegurança e proteção contra invasões.' },
      { kind: 'improvement', text: 'Estabelecido plano de verificação de vulnerabilidades e testes de penetração no sistema.' },
    ]
  },
  {
    version: '4.14.0',
    date: '2026-08-10',
    title: 'Gamificação & Ranking Acadêmico',
    major: true,
    changes: [
      { kind: 'feature', text: 'Mapeamento de 4 estratégias para aumentar o engajamento: Rankings de usuários, Missões Diárias, Badges de Conquista e Streaks de Estudo.' },
      { kind: 'improvement', text: 'Integrada visão de Ranking de usuários ativos para incentivar a competição saudável entre alunos.' },
    ]
  },
  {
    version: '4.13.0',
    date: '2026-08-10',
    title: 'Roadmap Estratégico Acadêmico',
    major: true,
    changes: [
      { kind: 'improvement', text: 'Consolidado plano de 5 eixos para evolução do app: Gamificação, IA (Ella), UX Foco, Flashcards SRS e Organização de Biblioteca.' },
      { kind: 'feature', text: 'Mapeamento de prompts otimizados para implementação modular de novas funcionalidades acadêmicas.' },
    ]
  },
  {
    version: '4.12.0',
    date: '2026-08-10',
    title: 'Privacidade e Consentimento Inteligente',
    major: true,
    changes: [
      { kind: 'feature', text: 'Implementado banner de consentimento de cookies com opções granulares (Essencial, Analítico, Desempenho, Marketing).' },
      { kind: 'improvement', text: 'Persistência de preferências de privacidade local para conformidade com normas de proteção de dados.' },
      { kind: 'improvement', text: 'Interface não intrusiva com animações fluidas para gestão de cookies.' },
    ]
  },
  {
    version: '4.11.0',
    date: '2026-08-10',
    title: 'Páginas Institucionais e Autoridade',
    major: false,
    changes: [
      { kind: 'feature', text: 'Implementadas páginas dedicadas de Termos de Uso e Política de Transparência com conteúdo completo.' },
      { kind: 'improvement', text: 'Navegação direta no rodapé consolidada para maior transparência e autoridade acadêmica.' },
      { kind: 'improvement', text: 'Otimização de metadados e estrutura SEO para as novas rotas institucionais.' },
    ]
  },
  {
    version: '4.10.0',
    date: '2026-08-10',
    title: 'Autoridade e Transparência Acadêmica',
    major: false,
    changes: [
      { kind: 'improvement', text: 'Otimização de SEO com meta tags dinâmicas e palavras-chave acadêmicas.' },
      { kind: 'feature', text: 'Implementados links institucionais (Termos e Transparência) no rodapé da landing page.' },
      { kind: 'improvement', text: 'Redesign da seção "Sob o Capô" com cards tecnológicos responsivos e imersivos.' },
    ]
  },
  {
    version: '4.9.9',
    date: '2026-08-09',
    title: 'Otimização UX e Acessibilidade',
    major: false,
    changes: [
      { kind: 'improvement', text: 'Refinamento da seção de Prova Social com depoimentos dinâmicos.' },
      { kind: 'feature', text: 'Adicionado selo de destaque para o Modo ENEM 2026.' },
      { kind: 'improvement', text: 'Otimização de contraste e acessibilidade em botões e fontes secundárias.' },
    ]
  },
  {
    version: '4.9.8',
    date: '2026-08-09',
    title: 'Análise Comparativa e Unificação',
    major: false,
    changes: [
      { kind: 'improvement', text: 'Implementado diagnóstico de maturidade de seções e plano de unificação de domínio entre instâncias Lovable e Vercel.' },
      { kind: 'improvement', text: 'Consolidação de identidade visual e proposta de valor baseada em auditoria de produção.' },
    ]
  },
  {
    version: '4.9.7',
    date: '2026-08-09',
    title: 'Revisão Final com Checklist',
    major: false,
    changes: [
      { kind: 'feature', text: 'Nova tela de revisão final com checklist obrigatório (estrutura, glossário, exercícios) antes de publicar.' },
      { kind: 'improvement', text: 'Integração de sons de sucesso e feedback visual no fluxo de publicação.' },
    ]
  },
  {
    version: '4.9.6',
    date: '2026-08-09',
    title: 'Fluxo Inteligente de Criação Admin',
    major: false,
    changes: [
      { kind: 'improvement', text: 'Redirecionamento automático para apostilas existentes ao tentar criar duplicatas por título.' },
      { kind: 'improvement', text: 'Melhorias de UX na Central de Criação para facilitar a adição de materiais a apostilas existentes.' },
    ]
  },
  {
    version: '4.9.5',
    date: '2026-08-09',
    title: 'Auditoria de Integridade e Estabilidade',
    major: false,
    changes: [
      { kind: 'security', text: 'Verificação completa de integridade via Playwright concluída com 0 erros.' },
      { kind: 'improvement', text: 'Validação de performance e renderização dos novos componentes do Hero.' }
    ]
  },
  {
    version: '4.9.4',
    date: '2026-08-09',
    title: 'Social Proof e Online Status',
    major: false,
    changes: [
      { kind: 'feature', text: 'Implementado contador dinâmico de alunos online no Hero.' },
      { kind: 'improvement', text: 'Otimização de componentes de prova social na Landing Page.' }
    ]
  },
  {
    version: '4.9.3',
    date: '2026-08-09',
    title: 'Hero Section Otimizada',
    major: false,
    changes: [
      { kind: 'improvement', text: 'Animação Typewriter expandida com cursos da UNIP.' },
      { kind: 'improvement', text: 'Refinamento de performance para o elemento LCP.' }
    ]
  },
  {
    version: '4.9.2',
    date: '2026-08-09',
    title: 'Plano Estratégico Landing Page',
    major: true,
    changes: [
      { kind: 'improvement', text: 'Mapeamento de 10 melhorias estratégicas para a Landing Page.' },
      { kind: 'content', text: 'Sincronização de metadados informativos para alunos.' }
    ]
  },
  {
    version: '4.9.0',
    date: '2026-08-09',
    title: 'Sound Design e Modo Foco',
    major: true,
    changes: [
      { kind: 'feature', text: 'Feedback sonoro futurista para conquistas e ações de gamificação.' },
      { kind: 'feature', text: 'Modo Foco no leitor de apostilas para estudo sem distrações.' },
      { kind: 'improvement', text: 'Sincronização de efeitos visuais e sonoros na interface global.' },
    ],
  },
  {
    version: '4.8.0',
    date: '2026-08-08',
    title: 'Gamificação e Hall da Fama',
    major: true,
    changes: [
      { kind: 'feature', text: 'Implementado Hall da Fama com ranking dinâmico de XP.' },
      { kind: 'feature', text: 'Novo sistema de streaks e níveis acadêmicos.' },
    ],
  },
  {
    version: '4.7.0',
    date: '2026-08-07',
    title: 'Saúde do Acervo e Automação',
    changes: [
      { kind: 'feature', text: 'Dashboard de integridade de ativos com diagnóstico em tempo real.' },
      { kind: 'improvement', text: 'Agendamento de varreduras automáticas de diagnóstico.' },
    ],
  },
  {
    version: '4.6.0',
    date: '2026-08-06',
    title: 'Varredura Técnica 360º',
    changes: [
      { kind: 'feature', text: 'Sistema de asset-scan para validação de recursos internos e externos.' },
      { kind: 'improvement', text: 'Relatório consolidado de componentes ausentes no admin.' },
    ],
  },
  {
    version: '4.5.0',
    date: '2026-08-05',
    title: 'Auditoria de Engajamento',
    changes: [
      { kind: 'improvement', text: 'Auditoria completa de UX com foco em gamificação.' },
    ],
  },
  {
    version: '4.4.0',
    date: '2026-08-04',
    title: 'Busca e Exportação PDF',
    changes: [
      { kind: 'feature', text: 'Busca intra-apostila com suporte offline.' },
      { kind: 'feature', text: 'Exportação PDF Pro com preservação de formatação.' },
    ],
  },
];
