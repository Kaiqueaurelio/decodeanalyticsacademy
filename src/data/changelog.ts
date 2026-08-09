/**
 * DECODE ANALYTICS ACADEMY - v4.9.0
 * 
 * - Sound Design: Feedback sonoro para gamificação e interações.
 * - Modo Foco: Experiência de leitura imersiva.
 * - Hall da Fama: Ranking de performance.
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
    version: '4.9.4',
    environment: 'production',
    host: typeof window !== 'undefined' ? window.location.host : 'localhost',
    buildTime: new Date().toISOString(),
    commit: 'v4.9.4-release',
    commitMessage: 'Release v4.9.4: Social Proof e Online Status'
  };
}

export const CHANGELOG: Release[] = [
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
