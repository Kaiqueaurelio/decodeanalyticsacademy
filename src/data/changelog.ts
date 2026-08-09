/**
 * DECODE ANALYTICS ACADEMY - v4.12.0
 * 
 * - Sound Design: Feedback sonoro para gamificação e interações.
 * - Modo Foco: Experiência de leitura imersiva.
 * - Hall da Fama: Ranking de performance.
 * - Checklist de Publicação: Garantia de qualidade acadêmica.
 * - Páginas Institucionais: Conteúdo completo de Termos e Transparência.
 * - Privacidade Avançada: Banner de consentimento de cookies.
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
    version: '4.10.0',
    environment: 'production',
    host: typeof window !== 'undefined' ? window.location.host : 'localhost',
    buildTime: new Date().toISOString(),
    commit: 'v4.10.0-release',
    commitMessage: 'Release v4.10.0: Autoridade e Transparência Acadêmica'
  };
}

export const CHANGELOG: Release[] = [
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
