/**
 * subjectGroups — Mapeia qualquer categoria/disciplina livre da apostila para
 * um dos 6 grupos canônicos do Decode Academy:
 *   Redes · IA · Segurança · Cloud · Programação · Outros
 *
 * Heurística por palavras-chave (case-insensitive, sem acento).
 * Mantém a categoria original visível, mas permite filtrar/agrupar por grupo
 * canônico no dashboard.
 */

export type CanonicalGroup =
  | 'Redes'
  | 'IA'
  | 'Segurança'
  | 'Cloud'
  | 'Programação'
  | 'Outros';

export const CANONICAL_GROUPS: CanonicalGroup[] = [
  'Programação',
  'Redes',
  'IA',
  'Segurança',
  'Cloud',
  'Outros',
];

interface GroupMeta {
  icon: string;
  color: string; // hsl
  description: string;
}

export const GROUP_META: Record<CanonicalGroup, GroupMeta> = {
  Programação: {
    icon: '💻',
    color: 'hsl(186, 100%, 50%)', // ciano
    description: 'Algoritmos, linguagens, POO, estruturas',
  },
  Redes: {
    icon: '🌐',
    color: 'hsl(210, 100%, 60%)',
    description: 'Protocolos, infraestrutura, telecom',
  },
  IA: {
    icon: '🧠',
    color: 'hsl(280, 100%, 65%)',
    description: 'Machine learning, dados, ciência de dados',
  },
  Segurança: {
    icon: '🛡️',
    color: 'hsl(0, 85%, 60%)',
    description: 'Criptografia, defesa, conformidade',
  },
  Cloud: {
    icon: '☁️',
    color: 'hsl(195, 90%, 55%)',
    description: 'AWS, Azure, GCP, DevOps',
  },
  Outros: {
    icon: '📚',
    color: 'hsl(220, 10%, 60%)',
    description: 'Demais disciplinas',
  },
};

const KEYWORDS: Record<Exclude<CanonicalGroup, 'Outros'>, string[]> = {
  Redes: [
    'rede', 'redes', 'network', 'tcp', 'ip', 'roteamento', 'roteador',
    'switch', 'protocolo', 'telecomunicacao', 'telecom', 'wan', 'lan', 'wifi',
    'wireless', 'cabeamento', 'osi', 'dns', 'dhcp', 'cisco', 'ccna',
    'sistemas distribuidos', 'distribuidos', 'comunicacao de dados',
  ],
  IA: [
    'ia ', 'inteligencia artificial', 'ai ', 'machine learning', 'aprendizado de maquina',
    'deep learning', 'rede neural', 'neural', 'nlp', 'data science', 'ciencia de dados',
    'mineracao de dados', 'data mining', 'big data', 'analytics',
    'estatistica', 'probabilidade', 'algoritmos geneticos', 'sistemas inteligentes',
  ],
  Segurança: [
    'seguranca', 'segurança', 'cyber', 'cibersegurança', 'ciberseguranca',
    'cripto', 'criptografia', 'pentest', 'forense', 'auditoria', 'lgpd',
    'iso 27', 'ethical hack', 'firewall', 'malware', 'vulnerab',
    'gestao de risco', 'governanca de ti', 'governança',
  ],
  Cloud: [
    'cloud', 'nuvem', 'aws', 'azure', 'gcp', 'google cloud', 'devops',
    'kubernetes', 'docker', 'container', 'serverless', 'iaas', 'paas', 'saas',
    'computacao em nuvem', 'computação em nuvem', 'infraestrutura como',
  ],
  Programação: [
    'programa', 'programação', 'programacao', 'algoritmo', 'estrutura de dados',
    'logica', 'lógica', 'poo', 'orientada a objeto', 'java', 'python',
    'javascript', 'typescript', 'c++', 'csharp', 'c#', 'kotlin', 'swift', 'php',
    'desenvolvimento', 'engenharia de software', 'engenharia de soft',
    'banco de dados', 'sql', 'web', 'mobile', 'frontend', 'backend',
    'fullstack', 'full stack', 'compilador', 'sistemas operacionais',
    'arquitetura de computador', 'arquitetura de sistema',
  ],
};

const stripAccents = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/**
 * Determina o grupo canônico a partir de category (e opcionalmente title como reforço).
 */
export function getCanonicalGroup(category?: string | null, title?: string | null): CanonicalGroup {
  const haystack = stripAccents(`${category || ''} ${title || ''}`);
  if (!haystack.trim()) return 'Outros';

  // 1) Match exato pelo nome do grupo
  for (const g of CANONICAL_GROUPS) {
    if (haystack.includes(stripAccents(g))) return g;
  }

  // 2) Heurística por keywords (ordem importa: Segurança/IA antes de Programação,
  //    pois "engenharia de software de segurança" deve cair em Segurança).
  const order: Exclude<CanonicalGroup, 'Outros'>[] = ['Segurança', 'IA', 'Cloud', 'Redes', 'Programação'];
  for (const group of order) {
    for (const kw of KEYWORDS[group]) {
      if (haystack.includes(stripAccents(kw))) return group;
    }
  }

  return 'Outros';
}

/**
 * Conta itens por grupo canônico.
 */
export function groupByCanonical<T extends { category?: string | null; title?: string | null }>(
  items: T[],
): Record<CanonicalGroup, T[]> {
  const acc: Record<CanonicalGroup, T[]> = {
    Programação: [], Redes: [], IA: [], Segurança: [], Cloud: [], Outros: [],
  };
  for (const it of items) {
    const g = getCanonicalGroup(it.category, it.title);
    acc[g].push(it);
  }
  return acc;
}
