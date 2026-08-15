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
    version: '5.9.5',
    environment: 'production',
    host: typeof window !== 'undefined' ? window.location.host : 'localhost',
    buildTime: '2026-08-15T04:25:00Z',
    commit: 'v5.9.5-rls-hardening-final',
    commitMessage: 'Release v5.9.5: Multi-point RLS Hardening (Pages, Exercises, Chapters, Quizzes)'
  };
}



export const CHANGELOG: Release[] = [
  {
    version: "5.9.5",
    date: "15/08/2026",
    title: "RLS Hardening & Cross-Table Security",
    changes: [
      {
        kind: 'security',
        text: 'Correção de Vazamento Multi-ponto: Reforçadas as políticas RLS para páginas, exercícios, capítulos e quizzes, impedindo o bypass de visibilidade por usuários autenticados.'
      },
      {
        kind: 'security',
        text: 'Integridade de Acesso: Corrigida a lógica de junção redundante em capítulos e endurecido o isolamento de escopo (content_scope) em todo o banco de dados.'
      }
    ]
  },
  {
    version: "5.9.4",
    date: "15/08/2026",
    title: "Security Hardening & Access Control",
    changes: [
      {
        kind: 'security',
        text: 'Hardening de RLS: Corrigido vazamento de dados em exercícios, páginas de apostilas e quizzes, garantindo que o acesso respeite o status de publicação e o escopo do aluno.'
      }
    ]
  },
  {
    version: "5.9.3",
    date: "15/08/2026",
    title: "Ella UI & DB Integrity Audit",
    changes: [
      {
        kind: 'fix',
        text: 'Correção de UI: Ajustado z-index do FAB da Ella (z-100) para evitar sobreposição indevida com elementos da interface.'
      },
      {
        kind: 'security',
        text: 'Auditoria de Banco de Dados: Validada a integridade de 51 apostilas. Confirmado que não houve exclusões; 1 item estava marcado como não publicado e foi restaurado.'
      },
      {
        kind: 'improvement',
        text: 'Check-up de RLS: Revisadas todas as políticas de acesso para garantir que materiais published sejam visíveis conforme o escopo do aluno.'
      }
    ]
  },
  {

    version: "5.9.2",
    date: "15/08/2026",
    title: "Ella Portrait Global Sync",
    changes: [
      {
        kind: 'fix',
        text: 'Ella Portrait Sync v5.9.2: Sincronização final do avatar da Ella Ribeiro em todo o ecossistema com purga total de cache e reforço de carregamento.'
      },
      {
        kind: 'improvement',
        text: 'Implementação de versionamento v13 para ativos estáticos, garantindo atualização visual imediata sem necessidade de limpeza manual de cache.'
      }
    ]
  },
  {

    version: "5.9.1",
    date: "15/08/2026",
    title: "Content Integrity Final Recovery",
    changes: [
      {
        kind: 'content',
        text: 'Restauração integral e profunda de "Aspectos Teóricos da Computação": 24 capítulos, imagens de alta resolução, áudios explicativos e exercícios originais.'
      },
      {
        kind: 'security',
        text: 'Protocolo de Auditoria 360: Identificação e remoção de 7 instâncias duplicadas que causavam instabilidade no banco de dados.'
      },
      {
        kind: 'fix',
        text: 'Sincronização de Faculdade: Restabelecida a integridade de Redes de Computadores, IA e Sistemas Operacionais com multimídia.'
      }
    ]
  },
  {
    version: "5.9.0",
    date: "15/08/2026",
    title: "Content Integrity Restoration",
    changes: [
      {
        kind: 'security',
        text: 'Implementação do sistema de Auditoria 360 e Recuperação de Integridade de Conteúdo.'
      },
      {
        kind: 'content',
        text: 'Restauração completa da apostila "Aspectos Teóricos da Computação" (metadados, páginas e exercícios).'
      },
      {
        kind: 'improvement',
        text: 'Adição de coluna "subject" na tabela de apostilas para melhor categorização acadêmica.'
      }
    ]
  },
  {
    version: "5.8.2",
    date: "15/08/2026",
    title: "Critical Auth & RA Sync",
    changes: [
      {
        kind: 'fix',
        text: 'Correção crítica no login via RA: implementada resolução de e-mail associado para usuários híbridos (ex: administradores com e-mail externo).'
      },
      {
        kind: 'security',
        text: 'Reforço na Edge Function ra-auth para garantir autenticação robusta contra mapeamentos complexos de perfis.'
      }
    ]
  },
  {
    version: "5.8.1",
    date: "15/08/2026",
    title: "Brand & Identity Sync",
    major: true,
    changes: [
      {
        kind: 'fix',
        text: 'Privilégios Administrativos v5.8.4: Reforçada a validação de acesso para o administrador G802144 e relaxamento do padrão de RA no backend.'
      },
      {
        kind: 'fix',
        text: 'Autenticação Flexível v5.8.3: Corrigida a restrição de caracteres no login por RA (agora aceita 2-50 caracteres).'
      },

      {
        kind: 'security',
        text: 'Otimização na Edge Function ra-auth para validação elástica de identificadores acadêmicos.'
      },

      {
        kind: 'improvement',
        text: 'Identidade Visual: Atualização do avatar da Ella Ribeiro na Landing Page com nova imagem oficial v5.8.1.'
      },
      {
        kind: 'improvement',
        text: 'Brand Integrity Recovery: Restauração da identidade visual clássica (logo original) em toda a Landing Page.'
      }
    ]
  },
  {
    version: "5.7.2",
    date: "15/08/2026",
    title: "Ella Identity Critical Fix",
    changes: [
      {
        kind: 'fix',
        text: 'Correção crítica da sincronização do avatar da Ella Ribeiro (v12) com purga total de cache legado e reforço no carregamento de assets.'
      }
    ]
  },
  {
    version: "5.7.1",
    date: "15/08/2026",
    title: "Ella Identity Forced Sync",
    changes: [
      {
        kind: 'fix',
        text: 'Sincronização forçada v11 do avatar da Ella com limpeza profunda de cache local para garantir a versão final.'
      }
    ]
  },
  {
    version: "5.7.0",
    date: "15/08/2026",
    title: "Ella Dynamic Identity & Admin Panel",
    major: true,
    changes: [
      {
        kind: 'feature',
        text: 'Implementado painel de gerenciamento dinâmico da Ella no admin, permitindo upload de novo avatar sem alteração de código.'
      },
      {
        kind: 'improvement',
        text: 'Sistema de versionamento v10 com cache-busting agressivo para garantir propagação instantânea da nova identidade visual.'
      },
      {
        kind: 'security',
        text: 'Restrição de URLs portáteis para o avatar da Ella, garantindo integridade visual em diferentes domínios de deploy.'
      }
    ]
  },
  {
    version: "5.6.3",
    date: "15/08/2026",
    title: "Ella Final Portrait Sync",
    changes: [
      {
        kind: 'fix',
        text: 'Substituição forçada do asset da Ella para a versão final (v4 asset / v9 system) com cache-busting temporal para garantir atualização em todos os clientes.'
      }
    ]
  },
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
