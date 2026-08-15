/**
 * DECODE ANALYTICS ACADEMY - v5.3.0
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
    version: '5.6.2',
    environment: 'production',
    host: typeof window !== 'undefined' ? window.location.host : 'localhost',
    buildTime: new Date().toISOString(),
    commit: 'v5.4.0-audit-360',
    commitMessage: 'Release v5.3.0: Full Technical Audit, Student Performance & Structural Validation'
  };
}

export const CHANGELOG: Release[] = [
  {
    version: "5.6.2",
    date: "15/08/2026",
    title: "Ella Asset Cache-Busting",
    changes: [
      {
        kind: 'fix',
        text: 'Implementação de versionamento v8 e cache-busting (?v=8) para garantir o carregamento imediato do novo retrato da Ella.'
      },
      {
        kind: 'improvement',
        text: 'Limpeza automática de chaves legadas de armazenamento local (v1-v7) para otimizar o estado do navegador.'
      }
    ]
  },
  {
    version: "5.6.1",
    date: "15/08/2026",
    title: "Ella AI Portrait Refresh",
    changes: [
      {
        kind: 'improvement',
        text: 'Atualização da foto de perfil da Ella para a versão final com badge acadêmico e corte circular otimizado.'
      }
    ]
  },
  {
    version: "5.6.0",
    date: "15/08/2026",
    title: "Ella AI Security Hardening (Prompt Injection)",
    major: true,
    changes: [
      {
        kind: 'security',
        text: 'Implementação da especificação de segurança contra injeção de prompt (Prompt Injection Security Specification).'
      },
      {
        kind: 'improvement',
        text: 'Novo gate de auditoria e telemetria de segurança com classificação de severidade granulada (low, medium, high, critical).'
      },
      {
        kind: 'feature',
        text: 'Suite de testes adversariais para detecção de injeção de prompt e tentativas de escalada de privilégio.'
      }
    ]
  },
  {
    version: "5.5.1",
    date: "15/08/2026",
    title: "Ella AI System Prompt Update",
    changes: [
      {
        kind: 'improvement',
        text: 'Nova especificação de Prompt de Sistema para a Ella AI, focada em excelência acadêmica e operacional.'
      },
      {
        kind: 'security',
        text: 'Reforço nas diretrizes de defesa contra injeção de prompt e controle de autoridade.'
      }
    ]
  },
  {
    version: "5.5.0",
    date: "15/08/2026",
    title: "Visual Identity Evolution",
    changes: [
      {
        kind: 'improvement',
        text: 'Atualização do avatar oficial da Ella Ribeiro para uma identidade visual mais profissional e executiva.'
      },
      {
        kind: 'fix',
        text: 'Restaurados privilégios de administrador para as contas mestre (G802144 e decoanalytics) e corrigida a validação de login via RA.'
      }
    ]
  },
  {
    version: "5.4.0",
    date: "15/08/2026",
    title: "Auditoria & Qualidade 360º",
    major: true,
    changes: [
      {
        kind: 'feature',
        text: 'Lançamento do Prompt de Auditoria Completa: sistema estruturado para identificação de erros funcionais, visuais e de segurança com catalogação por severidade.'
      },
      {
        kind: 'improvement',
        text: 'Implementação de rigorosa validação de apostilas: garantia de hierarquia de títulos, contraste de leitura e integridade de fórmulas/tabelas em todos os dispositivos.'
      },
      {
        kind: 'fix',
        text: 'Correção de responsividade global: eliminados transbordamentos laterais em dispositivos móveis e otimizada a navegação em telas pequenas.'
      },
      {
        kind: 'security',
        text: 'Revisão completa de fluxos de autenticação e sessões, garantindo zero exposição indevida de dados sensíveis durante a auditoria.'
      }
    ]
  },
  {
    version: "5.3.0",
    date: "14/08/2026",
    title: "Performance & Auditoria Pro",
    major: true,
    changes: [
      {
        kind: 'feature',
        text: 'Lançamento do Painel de Performance do Aluno: métricas detalhadas de acertos, erros, XP e evolução por área acadêmica.'
      },
      {
        kind: 'security',
        text: 'Painel de Auditoria Ella consolidado: rastreamento completo de ações de IA com logs de autorização e exportação CSV/PDF.'
      },
      {
        kind: 'improvement',
        text: 'Monitoramento técnico de performance em tempo real com diagnóstico de latência de rede e erros de runtime.'
      },
      {
        kind: 'fix',
        text: 'Sistema de Validação Estrutural de Apostilas: correção automática de hierarquia de títulos, tabelas e acessibilidade.'
      }
    ]
  },
  {
    version: "5.2.0",
    date: "14/08/2026",
    title: "Security Hardening (Patch)",
    changes: [
      {
        kind: 'security',
        text: 'Resolvida vulnerabilidade de bypass em resumos de apostilas não publicadas.'
      },
      {
        kind: 'security',
        text: 'Implementada proteção contra vazamento de gabaritos em exercícios e simulados via Column-Level Security.'
      },
      {
        kind: 'security',
        text: 'Restringido o acesso a configurações globais do aplicativo apenas para administradores.'
      },
      {
        kind: 'security',
        text: 'Endurecidas as políticas de escopo para simulados ENEM, impedindo acesso lateral de usuários não autorizados.'
      },
      {
        kind: 'fix',
        text: 'Revisão de todas as funções SECURITY DEFINER para evitar ataques de schema shadowing.'
      }
    ]
  },
  {
    version: "5.1.0",
    date: "14/08/2026",
    title: "Audioaula Interativa com Quiz",
    major: true,
    changes: [
      {
        kind: 'feature',
        text: 'Lançamento do sistema AudioQuiz: questionários interativos que surgem automaticamente ao final de cada audioaula.'
      },
      {
        kind: 'improvement',
        text: 'Suporte a múltiplos tipos de questões: Múltipla Escolha, Verdadeiro/Falso e Respostas Abertas.'
      },
      {
        kind: 'feature',
        text: 'Persistência de resultados e scores de quiz no banco de dados para acompanhamento de desempenho.'
      }
    ]
  },
  {
    version: "5.0.0",
    date: "14/08/2026",
    title: "Experiência de Áudio Profissional",
    major: true,
    changes: [
      {
        kind: 'feature',
        text: 'Lançamento do Professional Audio Player embutido nas apostilas, com controles de velocidade (2x), progresso arrastável e persistência automática.'
      },
      {
        kind: 'improvement',
        text: 'Implementação de atalhos de teclado globais para controle de áudio (Espaço para Play/Pause, Setas para Volume/Seek).'
      },
      {
        kind: 'feature',
        text: 'Persistência de progresso individual por áudio e volume global no navegador do aluno.'
      }
    ]
  },
  {
    version: "4.99.8",
    date: "14/08/2026",
    title: "Aula Interativa Multimídia",
    changes: [
      {
        kind: 'content',
        text: 'Integração de áudio explicativo "Como os robôs e videogames pensam" na apostila de Aspectos Teóricos da Computação.'
      },
      {
        kind: 'improvement',
        text: 'Adicionada sinalização de material interativo para melhor orientação do aluno.'
      }
    ]
  }
];
