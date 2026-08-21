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
