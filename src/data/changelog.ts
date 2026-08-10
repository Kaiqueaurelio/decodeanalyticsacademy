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
    version: '4.38.0',
    environment: 'production',
    host: typeof window !== 'undefined' ? window.location.host : 'localhost',
    buildTime: new Date().toISOString(),
    commit: 'v4.10.0-release',
    commitMessage: 'Release v4.10.0: Autoridade e Transparência Acadêmica'
  };
}

export const CHANGELOG: Release[] = [
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
