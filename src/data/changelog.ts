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
  version: string;
  date: string;
  title: string;
  description: string;
  author: string;
}

export const changelog: Change[] = [
  {
    version: "6.2.0",
    date: "2026-08-18",
    title: "Estabilidade & Resiliência Acadêmica v2",
    description: "Correção crítica na instabilidade do avatar da Ella, visibilidade das apostilas do 6º semestre e resiliência no login especial.",
    author: "Kaique Aurelio & Decode Analytics",
  },
  {
    version: "6.1.0",
    date: "2026-08-17",
    title: "Estabilidade & Resiliência Acadêmica",
    description: "Foco total em estabilidade do sistema, correção de visibilidade de apostilas e bypass de RA administrativo.",
    author: "Kaique Aurelio & Decode Analytics",
  },
  {
    version: "6.0.5",
    date: "2026-08-16",
    title: "Privilégios Administrativos Resilientes",
    description: "Implementado bypass de segurança para usuários DecoAnalytics e G802144 garantindo acesso admin.",
    author: "Kaique Aurelio & Decode Analytics",
  }
];
