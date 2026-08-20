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
    version: "6.6.4",
    date: "20/08/2026",
    title: "Correção de Integridade de Conteúdo",
    changes: [
      { kind: "fix", text: "Resolução de duplicidade de páginas na apostila de Gestão de Projetos Operacionais" },
      { kind: "improvement", text: "Otimização do algoritmo de merge de páginas no leitor de apostilas" }
    ]
  },
  {
    version: "6.6.3",
    date: "19/08/2026",
    title: "Estabilidade de Login Admin v2",
    changes: [
      { kind: "fix", text: "Correção de validação de e-mail na Edge Function ra-auth para acesso administrativo" },
      { kind: "improvement", text: "Refinamento do roteamento de autenticação para decoanalytics e G802144" }
    ]
  },
  {
    version: "6.6.1",
    date: "18/08/2026",
    title: "Login Runaway & Acesso Restaurado",
    changes: [
      { kind: "fix", text: "Estabilização das mensagens de erro administrativas para conformidade com auditoria visual" },
      { kind: "fix", text: "Botões do login agora se movimentam fielmente ao estilo Runaway da referência" },
      { kind: "fix", text: "Fluxos de autenticação por RA e e-mail estabilizados" },
      { kind: "improvement", text: "Redirecionamento correto para o painel administrativo ou dashboard do aluno" }
    ]
  },
  {
    version: "6.6.0",
    date: "18/08/2026",
    title: "Estabilidade Total & Ella v18",
    changes: [
      { kind: "fix", text: "Fim do loading infinito no login via RA/Email" },
      { kind: "improvement", text: "Ella: Cache-busting v18 e fallback automático de imagem" },
      { kind: "security", text: "Admin: Normalização de permissões para G802144" },
      { kind: "improvement", text: "UX: Purga de cache de avatar legado no storage" }
    ]
  },
  {
    version: "6.5.0",
    date: "2026-08-18",
    title: "Gestão Híbrida v2 & Ella AI Jobs",
    major: true,
    changes: [
      { kind: 'feature', text: 'Importação Inteligente: Use a Ella para extrair vagas de qualquer texto desestruturado.' },
      { kind: 'improvement', text: 'Admin UI: Nova lista detalhada com visualização rápida da descrição e filtros avançados.' },
      { kind: 'fix', text: 'Remoção de duplicidades na navegação administrativa.' },
    ],
  },
  {
    version: "6.4.1",
    date: "2026-08-18",
    title: "Gestão Híbrida de Vagas & Importação MD",
    major: true,
    changes: [
      { kind: 'feature', text: 'Novo Importador MD: Publique dezenas de vagas em segundos via Markdown.' },
      { kind: 'improvement', text: 'Refinamento do Dashboard: Melhor visibilidade das oportunidades de carreira.' },
      { kind: 'fix', text: 'Correção de botões duplicados no Gestor de Vagas.' },
    ],
  },
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
    version: '6.4.1',
    environment: 'production',
    host: 'lovable.app',
    buildTime: new Date().toISOString(),
    commit: 'v6.2.0-stable',
    commitMessage: 'Release stable v6.2.0',
  };
}
