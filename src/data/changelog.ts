/**
 * DECODE ANALYTICS ACADEMY - v6.2.0
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
    version: CHANGELOG[0]?.version || "0.0.0",
    environment: "production",
    host: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    buildTime: new Date().toISOString(),
    commit: "main",
    commitMessage: "Automated Build"
  };
}

export const CHANGELOG: Release[] = [
  {
    version: "6.7.1",
    date: "20/08/2026",
    title: "Seleção Inteligente no Smart Paste",
    changes: [
      { kind: "feature", text: "Implementada seleção parcial de texto no Smart Paste para processamento segmentado" },
      { kind: "improvement", text: "Desbloqueada a seleção nativa e adicionada detecção de cursor no editor de texto original" },
      { kind: "fix", text: "Correção na persistência de modo de inserção ao alternar entre seleção e texto completo" }
    ]
  },

  {
    version: "6.7.0",
    date: "20/08/2026",
    title: "Sistema Avançado de Integridade Cronológica",
    major: true,
    changes: [
      { kind: "feature", text: "Implementada prévia híbrida (lista/conteúdo) antes de separar aulas por data" },
      { kind: "feature", text: "Automação de separação inteligente ao importar links (Smart Paste)" },
      { kind: "improvement", text: "Filtro temporal persistente no cabeçalho do leitor de apostilas" },
      { kind: "improvement", text: "Banners dinâmicos de status (Em Manutenção/Crítico) para alunos" }
    ]
  },

  {
    version: "6.6.8",
    date: "20/08/2026",
    title: "Diagnóstico Acadêmico & Estabilidade do Workbench",
    changes: [
      { kind: "fix", text: "Corrigida falha de sincronização na criação de páginas do Workbench" },
      { kind: "feature", text: "Novo painel de diagnóstico de integridade cronológica e auditoria acadêmica" },
      { kind: "feature", text: "Implementada exportação de relatórios em CSV para alunos e admin" },
      { kind: "improvement", text: "Sistema de logs detalhados para operações críticas no editor" }
    ]
  },
  {
    version: "6.6.7",
    date: "20/08/2026",
    title: "Auditoria Avançada & Sistema Anti-Mistura v2",
    changes: [
      { kind: "feature", text: "Implementada paginação e busca profunda no painel de auditoria" },
      { kind: "improvement", text: "Adicionada exportação CSV e banner de integridade no leitor" },
      { kind: "security", text: "Reforçada segurança de rate limiting com feedback visual" }
    ]
  },
  {
    version: "6.6.6",
    date: "20/08/2026",
    title: "Auditoria Acadêmica & Desempenho",
    changes: [
      { kind: "feature", text: "Criado painel de auditoria acadêmica no Admin" },
      { kind: "feature", text: "Exportação de relatórios de desempenho em PDF" },
      { kind: "security", text: "Implementado Rate Limiting para tentativas de login" }
    ]
  }
];
