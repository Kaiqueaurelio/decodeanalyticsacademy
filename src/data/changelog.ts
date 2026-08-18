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

export const CHANGELOG: Release[] = [
  {
    version: "6.2.0",
    date: "2026-08-18",
    title: "Estabilidade & Resiliência Acadêmica v2",
    major: true,
    changes: [
      { kind: 'fix', text: 'Correção crítica na instabilidade do avatar da Ella.' },
      { kind: 'improvement', text: 'Melhoria na visibilidade das apostilas do 6º semestre.' },
      { kind: 'security', text: 'Resiliência aprimorada no login especial via RA.' },
    ],
  },
  {
    version: "6.1.0",
    date: "2026-08-17",
    title: "Estabilidade & Resiliência Acadêmica",
    changes: [
      { kind: 'fix', text: 'Foco total em estabilidade do sistema e correção de visibilidade.' },
    ],
  },
];

export function getBuildInfo() {
  return {
    version: '6.2.0',
    environment: 'production',
    host: 'lovable.app',
    buildTime: new Date().toISOString(),
    commit: 'v6.2.0-stable',
    commitMessage: 'Release stable v6.2.0',
  };
}
