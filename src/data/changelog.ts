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
    version: '5.9.10',
    environment: 'production',
    host: typeof window !== 'undefined' ? window.location.host : 'localhost',
    buildTime: '2026-08-15T13:10:00Z',
    commit: 'v5.9.9-content-restoration',
    commitMessage: 'Release v5.9.9: Restauração definitiva de conteúdo teórico e multimídia'
  };
}

export const CHANGELOG: Release[] = [
  {
    version: "5.9.10",
    date: "15/08/2026",
    title: "Mídia Unificada & Fix de Vínculos",
    changes: [
      {
        kind: 'feature',
        text: 'Mídia: Implementação do RibbonMediaButton para upload de áudio, vídeo e documentos diretamente no editor de apostilas.'
      },
      {
        kind: 'fix',
        text: 'Vínculos: Correção na associação automática de materiais via DropZone, garantindo que o ID da apostila seja registrado.'
      }
    ]
  },
  {
    version: "5.9.9",
    date: "15/08/2026",
    title: "Restauração: Aspectos Teóricos",
    changes: [
      {
        kind: 'fix',
        text: 'Conteúdo: Restauração definitiva do texto estruturado e componentes multimídia (áudio-quiz e guia visual) na apostila de Aspectos Teóricos da Computação.'
      },
      {
        kind: 'content',
        text: 'Sincronização: Garantida a publicação da apostila e persistência dos dados no banco.'
      }
    ]
  },
  {
    version: "5.9.8",
    date: "15/08/2026",
    title: "Aula Interativa: Teoria Computacional",
    changes: [
      {
        kind: 'feature',
        text: 'Multimídia: Integrado áudio-aula interativa "Como os robôs e videogames pensam" e Guia Visual HD na apostila de Aspectos Teóricos da Computação.'
      }
    ]
  },
  {
    version: "5.9.7",
    date: "15/08/2026",
    title: "Integração Multimídia & Audioaula",
    changes: [
      {
        kind: 'content',
        text: 'Audioaula: Integrado áudio interativo "Como os robôs e videogames pensam" na apostila de Aspectos Teóricos da Computação.'
      },
      {
        kind: 'improvement',
        text: 'Estruturação: Sincronização de capítulos e refinamento de layout para o workbench acadêmico.'
      }
    ]
  },
  {
    version: "5.9.6",
    date: "15/08/2026",
    title: "Conteúdo Estruturado: Teoria da Computação",
    changes: [
      {
        kind: 'content',
        text: 'Injetado conteúdo técnico profundo cobrindo Máquinas de Estado, Turing, Tese de Church-Turing e Complexidade Computacional.'
      }
    ]
  },
  {
    version: "5.9.5",
    date: "15/08/2026",
    title: "Hardening de Segurança RLS",
    changes: [
      {
        kind: 'security',
        text: 'Correção de vulnerabilidades de RLS que permitiam bypass de escopo acadêmico.'
      },
      {
        kind: 'security',
        text: 'Proteção de gabaritos e conteúdos não publicados no nível do banco de dados.'
      }
    ]
  },
  {
    version: "5.9.4",
    date: "15/08/2026",
    title: "Segurança e Integridade de Dados",
    changes: [
      {
        kind: 'security',
        text: 'Reforçada a política de visibilidade para apostila_pages e exercises.'
      }
    ]
  },
  {
    version: "5.9.3",
    date: "15/08/2026",
    title: "Auditoria e UX Final",
    changes: [
      {
        kind: 'fix',
        text: 'Resolvida sobreposição do FAB da Ella ajustando o z-index para 100.'
      },
      {
        kind: 'improvement',
        text: 'Check-up completo de integridade do banco de dados concluído.'
      }
    ]
  },
  {
    version: "5.9.2",
    date: "15/08/2026",
    title: "Sincronização de Identidade Ella",
    changes: [
      {
        kind: 'improvement',
        text: 'Cache-busting v13 aplicado ao avatar da Ella para garantir atualização em todos os dispositivos.'
      }
    ]
  },
  {
    version: "5.9.1",
    date: "15/08/2026",
    title: "Restauração de Conteúdo Crítico",
    changes: [
      {
        kind: 'fix',
        text: 'Recuperação integral da apostila de Aspectos Teóricos da Computação (24 capítulos).'
      },
      {
        kind: 'security',
        text: 'Limpeza de duplicatas e estabilização de RLS.'
      }
    ]
  },
  {
    version: "5.8.5",
    date: "14/08/2026",
    title: "Estabilidade de Login e RA",
    changes: [
      {
        kind: 'fix',
        text: 'Otimização da Edge Function ra-auth para suporte a múltiplos formatos de RA.'
      }
    ]
  }
];
