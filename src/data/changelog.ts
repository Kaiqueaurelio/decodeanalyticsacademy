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
  description?: string;
  author?: string;
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
    version: "8.5.2",
    date: "2026-08-30",
    title: "Correção crítica de acesso",
    changes: [
      { kind: 'fix', text: 'Login restaurado: o app voltou a apontar para o backend oficial com os dados de alunos, em vez do projeto vazio criado na migração.' },
    ],
  },
  {
    version: "8.5.1",
    date: "2026-08-26",
    title: "Inicialização e Leitura Resilientes",
    description: "Correção emergencial do falso alerta de atualização e do carregamento incompleto das apostilas.",
    changes: [
      { kind: "fix", text: "Removido o bloqueio automático que confundia inicialização lenta com navegador desatualizado." },
      { kind: "fix", text: "Leitor de apostilas agora preserva listas numeradas e encerra corretamente estados de carregamento." },
      { kind: "improvement", text: "Limpeza de cache restrita aos artefatos do app, preservando notificações e outros dados." }
    ],
    author: "Kaique Aurelio & Decode Analytics"
  },
  {
    version: "8.5.0",
    date: "2026-08-24",
    title: "Proteção de Dados & Busca Semântica",
    major: true,
    description: "Implementada Busca Semântica (RAG) para conceitos acadêmicos e endurecimento total de RLS e segurança de segredos no servidor.",
    changes: [
      { kind: "feature", text: "Busca Semântica (RAG): Agora você pode encontrar conteúdos por conceitos, não apenas por palavras-chave." },
      { kind: "security", text: "Harden DB Protection: Reforço de RLS em todas as tabelas e proteção de chaves no servidor." },
      { kind: "improvement", text: "Refatoração do Diagnostics Hub com maior foco em segurança operacional e transparência de tokens." },
      { kind: "security", text: "Implementada auditoria de segurança para monitorar tentativas de injeção e acessos administrativos." }
    ],
    author: "Kaique Aurelio & Decode Analytics"
  },
  {
    version: "7.7.0",
    date: "2026-08-24",
    title: "Auditoria Full Stack 360º & Refatoração Estrutural",
    description: "Implementação massiva de correções técnicas resultantes da auditoria sênior, focando em compatibilidade de Refs, estabilidade de banco de dados (RLS) e fluidez visual.",
    changes: [
      { kind: 'security', text: "Endurecimento de RLS nas tabelas de estudo com validação WITH CHECK (auth.uid())" },
      { kind: 'fix', text: "Refatoração de componentes UI (Toaster, Sonner, SplashScreen) para suporte a forwardRef, eliminando avisos no console" },
      { kind: 'improvement', text: "Sincronização de transição do SplashScreen para reduzir Layout Shift e melhorar o LCP" },
      { kind: 'fix', text: "Ajuste de responsividade na Landing Page para evitar sobreposição de elementos no cabeçalho mobile" }
    ],
    author: "Kaique Aurelio & Decode Analytics"
  },
  {
    version: "7.6.0",
    date: "2026-08-24",
    title: "Estabilização de Gamificação & Auditoria de Infra",
    description: "Correção crítica de falhas de tempo de execução no sistema de gamificação e provisionamento de infraestrutura de persistência para histórico e metas de estudo.",
    changes: [
      { kind: 'fix', text: "Corrigido erro 'Cannot read properties of undefined (reading rest)' no hook useGamification" },
      { kind: 'security', text: "Provisionadas tabelas public.study_history, public.study_goals e public.study_milestones com RLS restrito" },
      { kind: 'fix', text: "Implementada função RPC log_study_activity ausente no banco de dados para rastreamento de progresso" },
      { kind: 'improvement', text: "Refatoração de chamadas RPC no hook de gamificação para maior estabilidade e tipagem robusta" }
    ],
    author: "Kaique Aurelio & Decode Analytics"
  },
  {
    version: "7.5.0",
    date: "2026-08-24",
    title: "Gamificação & Analytics 360º",
    description: "Lançamento do sistema completo de gamificação com metas persistentes no banco de dados, gráficos de radar/competências, histórico de evolução temporal e hub de conquistas Cyberpunk.",
    changes: [
      { kind: 'feature', text: "Persistência de metas e milestones no banco de dados (public.study_goals, public.study_milestones)" },
      { kind: 'feature', text: "Novo componente ProgressCharts com Radar de competências e Área de evolução temporal" },
      { kind: 'feature', text: "Novo grid de Conquistas e Recompensas com desbloqueio visual" },
      { kind: 'improvement', text: "Integração do hook useGamification com persistência server-side" },
      { kind: 'improvement', text: "Refinamento estético Industrial/Cyberpunk em widgets de gamificação" }
    ],
    author: "Kaique Aurelio & Decode Analytics"
  },
  {

    version: "7.4.0",
    date: "24/08/2026",
    title: "Gamificação Avançada: Metas & Milestones",
    major: true,
    changes: [
      { kind: "feature", text: "Implementado StudyGoalsWidget com metas de exercícios, capítulos e streaks" },
      { kind: "improvement", text: "Integrado sistema de Milestones na dashboard com estética Cyberpunk Pro" },
      { kind: "improvement", text: "Refinada a barra de progresso e feedbacks visuais de conquistas" }
    ]
  },
  {
    version: "7.3.0",
    date: "23/08/2026",
    title: "Estabilidade de Anúncios, Telemetria & Dual-Theme",
    major: true,
    changes: [
      { kind: "fix", text: "Corrigido erro 401 na Edge Function de anúncios quando o usuário não está logado" },
      { kind: "feature", text: "Implementado sistema de Telemetria Técnica e logs de rede detalhados" },
      { kind: "feature", text: "Lançado seletor de Estilo Visual (Industrial vs Minimalista) no Dashboard" },
      { kind: "improvement", text: "Padronização de tipografia Mono em metadados e remoção de redundâncias visuais" }
    ]
  },

  {

    version: "7.2.0",
    date: "23/08/2026",
    title: "Otimização Visual Industrial & De-AI",
    major: true,
    changes: [
      { kind: "improvement", text: "Removida estética 'App de IA' em favor de uma identidade Tech/Industrial Cyberpunk" },
      { kind: "improvement", text: "Substituídas sombras suaves e gradientes genéricos por bordas neon e cyber-grids" },
      { kind: "improvement", text: "Refinada tipografia de metadados para DM Mono e enxugamento de descrições textuais" },
      { kind: "improvement", text: "Otimização de performance visual em dispositivos móveis reduzindo efeitos de desfoque excessivos" }
    ]
  },
  {
    version: "7.1.0",
    date: "23/08/2026",
    title: "Performance Hub & Clonagem IA",
    changes: [
      { kind: "feature", text: "Lançado Hub de Performance Avançado com 8 KPIs em tempo real e insights de área" },
      { kind: "feature", text: "Implementado sistema de Clonagem Inteligente por Link no painel administrativo" },
      { kind: "improvement", text: "Unificado Dashboard com widgets de gamificação e atalhos rápidos de performance" },
      { kind: "fix", text: "Corrigida instabilidade de CORS e tratamento de erros de rede no login" }
    ]
  },
  {
    version: "7.0.2",
    date: "23/08/2026",
    title: "Estabilidade de Acesso & CORS",
    changes: [
      { kind: "fix", text: "Corrigida falha 'Failed to fetch' no login liberando origens de preview e domínios próprios" },
      { kind: "improvement", text: "Refinado tratamento de erros de rede no login para evitar bloqueio indevido por tentativas falhas" },
      { kind: "security", text: "Atualizada política de CORS para suportar múltiplos ambientes de desenvolvimento com segurança" }
    ]
  },
  {
    version: "7.0.1",
    date: "23/08/2026",
    title: "Branding & Identidade High-Tech",
    changes: [
      { kind: "improvement", text: "Restaurada a identidade 'Decode Analytics Academy' com efeitos de glitch e branding persistente" },
      { kind: "improvement", text: "Integrado rodapé obrigatório de autoria no terminal de login" }
    ]
  },
  {
    version: "6.9.9",
    date: "23/08/2026",
    title: "Auditoria de Erros Acadêmicos",
    changes: [
      { kind: "improvement", text: "Implementada auditoria de integridade para detecção de inconsistências no fluxo do aluno" },
      { kind: "security", text: "Reforçado o Compliance Guard para monitoramento de rotas administrativas" }
    ]
  },
  {
    version: "6.9.8",
    date: "23/08/2026",
    title: "Hub de Hackathons & Eventos Ativos",
    changes: [
      { kind: "feature", text: "Integrado feed de Hackathons reais (Academia LED, HACKTUDO, Fnesp) na aba de Eventos" },
      { kind: "improvement", text: "Atualizado o banco de dados com eventos válidos para o segundo semestre de 2026" },
      { kind: "content", text: "Cadastrados 5 novos hackatons com foco em IA, Educação e Cidadania" }
    ]
  },
  {
    version: "6.9.7",
    date: "23/08/2026",
    title: "Central de Eventos & Acadêmico",
    changes: [
      { kind: "feature", text: "Lançada a nova aba de 'Eventos' para publicação de palestras e hackatons" },
      { kind: "improvement", text: "Integrada a gestão de eventos ao calendário oficial da Decode Academy" },
      { kind: "fix", text: "Corrigida a visibilidade de tipos de eventos customizados no painel administrativo" }
    ]
  },
  {
    version: "6.9.6",
    date: "22/08/2026",
    title: "Conformidade e Localização de Segurança",
    changes: [
      { kind: "improvement", text: "Localizados os rótulos técnicos dos painéis de auditoria para termos acadêmicos amigáveis" },
      { kind: "fix", text: "Removidos placeholders de depuração do pipeline de estabilidade no painel administrativo" },
      { kind: "security", text: "Padronizada a exibição de conformidade para auditoria Ella AI e logs de manutenção" }
    ]
  },
  {
    version: "6.9.5",
    date: "21/08/2026",
    title: "Gabaritos por Disciplina",
    changes: [
      { kind: "content", text: "Gabaritos das Unidades I e II disponíveis em cada matéria correspondente" },
      { kind: "feature", text: "Nova página 'Gabaritos' com busca por disciplina e código da turma" },
      { kind: "improvement", text: "Correspondência de disciplina mais precisa, evitando gabarito exibido na matéria errada" }
    ]
  },
  {
    version: "6.9.4",
    date: "21/08/2026",
    title: "Login Restaurado em Preview e Produção",
    changes: [
      { kind: "fix", text: "Liberadas com segurança as origens oficiais de preview para o serviço de autenticação por RA e e-mail" },
      { kind: "fix", text: "Falhas de conexão deixaram de consumir tentativas de login ou aparecer como senha incorreta" },
      { kind: "improvement", text: "Adicionado fallback pelo serviço nativo de autenticação quando a função de RA estiver temporariamente inacessível" }
    ]
  },
  {
    version: "6.9.3",
    date: "21/08/2026",
    title: "Fim das Versões Antigas em Cache",
    changes: [
      { kind: "fix", text: "Removido o cache de aplicativo que fazia o site voltar para uma versão antiga sem aviso" },
      { kind: "improvement", text: "Aparelhos que já tinham o app instalado recebem uma limpeza automática e passam a abrir sempre a versão publicada mais recente" }
    ]
  },
  {
    version: "6.9.2",
    date: "21/08/2026",
    title: "Estabilidade de Atualização do Aplicativo",
    changes: [
      { kind: "fix", text: "Corrigido o fluxo de atualização que podia exibir temporariamente uma versão antiga do aplicativo" },
      { kind: "improvement", text: "O PWA agora verifica novas versões ao abrir, ao retornar para a aba e periodicamente, com recarga única e segura" }
    ]
  },
  {
    version: "6.9.1",
    date: "21/08/2026",
    title: "Proteção de Ferramentas e Conteúdo Administrativo",
    changes: [
      { kind: "security", text: "Ferramentas internas de extração de anúncios e configuração de modelos agora exigem autorização administrativa no servidor" },
      { kind: "security", text: "Logs de manutenção ficaram restritos aos administradores e materiais acadêmicos passaram a respeitar publicação e escopo de conteúdo" }
    ]
  },
  {
    version: "6.9.0",
    date: "21/08/2026",
    title: "Segurança Administrativa & Dashboard Tipado",
    major: true,
    changes: [
      { kind: "security", text: "Padronizados os textos de segurança em navegação, alertas, auditoria acadêmica e renovação de sessão, removendo mensagens antigas da interface" },
      { kind: "security", text: "Reforçada a validação de autorização: rotas administrativas aguardam a confirmação do papel e redirecionam usuários sem permissão" },
      { kind: "fix", text: "Corrigida a sincronização de tipos do Dashboard com validação explícita das respostas JSON dos RPCs e fallback seguro de dados" },
      { kind: "fix", text: "Ajustada a montagem de placeholders e datas das apostilas para que todas as seções do Dashboard carreguem com o contrato correto" }
    ]
  },
  {
    version: "6.8.0",
    date: "21/08/2026",
    title: "Academic Versioning & PDF Hub",
    major: true,
    changes: [
      { kind: "feature", text: "Novo sistema de histórico de versões com snapshots automáticos após cada salvamento no Workbench" },
      { kind: "feature", text: "Implementado motor de exportação PDF de alta fidelidade com branding e marcas d'água dinâmicas (RA/Nome)" },
      { kind: "feature", text: "Adicionado botão 'Apostila do Dia' no Dashboard para acesso rápido à aula mais recente" },
      { kind: "improvement", text: "Novo filtro de ordenação por Data de Aula vs Matéria no painel do aluno e admin" },
      { kind: "improvement", text: "Sistema de restauração instantânea de versões anteriores com interface visual intuitiva" }
    ]
  },
  {
    version: "6.7.4",
    date: "21/08/2026",
    title: "Visualização Acadêmica & Sincronização",
    changes: [
      { kind: "feature", text: "Restaurado botão de 'Visualizar' que abre a apostila em nova aba no modo aluno direto do editor" },
      { kind: "improvement", text: "Mantida a pré-visualização em modal para ajustes rápidos de rascunho sem sair da página" },
      { kind: "fix", text: "Estabilizada a comunicação entre o ID da apostila e o cabeçalho do Workbench" }
    ]
  },
  {
    version: "6.7.3",
    date: "21/08/2026",
    title: "Verificação de Persistência & Status de Sincronização",
    changes: [
      { kind: "improvement", text: "Reforçada a confirmação de salvamento no Workbench com validação server-side pós-save" },
      { kind: "improvement", text: "Novo indicador visual 'SALVO NO BANCO' para maior clareza sobre o status da sincronização" },
      { kind: "fix", text: "Corrigida notificação de sucesso para garantir que o usuário saiba que os dados estão seguros" }
    ]
  },
  {
    version: "6.7.2",
    date: "20/08/2026",
    title: "Controles de Seleção no Smart Paste",
    changes: [
      { kind: "feature", text: "Adicionados botões de atalho: Selecionar Tudo, Limpar e Resetar Seleção no modal Smart Paste" },
      { kind: "improvement", text: "Interface aprimorada com ícones minimalistas para gestão rápida de trechos de texto" }
    ]
  },
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
