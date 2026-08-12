// Mapa de capas (Unsplash CDN, sem chave) para cada disciplina.
// Estilo Notion: imagem temática como capa do card de apostila.

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/${id}?w=600&q=70&auto=format&fit=crop`;

// Pool de capas neutras/acadêmicas para fallback
const FALLBACK_COVERS = [
  UNSPLASH('photo-1517694712202-14dd9538aa97'), // code dark
  UNSPLASH('photo-1551288049-bebda4e38f71'), // dashboard
  UNSPLASH('photo-1581091226825-a6a2a5aee158'), // notebook desk
  UNSPLASH('photo-1518770660439-4636190af475'), // circuits
  UNSPLASH('photo-1488590528505-98d2b5aba04b'), // laptop code
  UNSPLASH('photo-1526374965328-7f61d4dc18c5'), // matrix code
  UNSPLASH('photo-1531403009284-440f080d1e12'), // network cables
  UNSPLASH('photo-1454165804606-c3d57bc86b40'), // analytics
];

const COVERS: Record<string, string> = {
  // 5º semestre — chaves devem casar parcialmente com a categoria (lowercase)
  'inteligência artificial': UNSPLASH('photo-1620712943543-bcc4688e7485'),
  'sistemas operacionais': UNSPLASH('photo-1518770660439-4636190af475'),
  'arquitetura de redes': UNSPLASH('photo-1558494949-ef010cbdcc31'),
  'arquitetura de computadores': UNSPLASH('photo-1591488320449-011701bb6704'),
  'teoria dos grafos': UNSPLASH('photo-1551288049-bebda4e38f71'),
  'linguagens formais': UNSPLASH('photo-1526374965328-7f61d4dc18c5'),
  'computação gráfica': UNSPLASH('photo-1550745165-9bc0b252726f'),
  'análise matemática': UNSPLASH('photo-1635070041078-e363dbe005cb'),
  'metodologia': UNSPLASH('photo-1456513080510-7bf3a84b82f8'),
  'extensão': UNSPLASH('photo-1523240795612-9a054b0db644'),
  'aps': UNSPLASH('photo-1573164574572-cb89e39749b4'),
  'atividade prática': UNSPLASH('photo-1573164574572-cb89e39749b4'),
  'estudos disciplinares': UNSPLASH('photo-1456513080510-7bf3a84b82f8'),
  'pesquisa operacional': UNSPLASH('photo-1460925895917-afdab827c52f'),
  'pesquisa computacional': UNSPLASH('photo-1460925895917-afdab827c52f'),
  'canivete suíço do estudante': UNSPLASH('photo-1484480974693-6ca0a78fb36b'), // checklist/tools
  'dicionário do programador': UNSPLASH('photo-1516414447565-b14be0adc13e'), // library/dictionary
  // outras
  'banco de dados': UNSPLASH('photo-1544383835-bda2bc66a55d'),
  'estrutura de dados': UNSPLASH('photo-1555949963-aa79dcee981c'),
  'engenharia de software': UNSPLASH('photo-1517245386807-bb43f82c33c4'),
  'sistemas distribuídos': UNSPLASH('photo-1451187580459-43490279c0fa'),
  'ciência de dados': UNSPLASH('photo-1551288049-bebda4e38f71'),
  'compiladores': UNSPLASH('photo-1542831371-29b0f74f9713'),
  'orientada a objetos': UNSPLASH('photo-1517694712202-14dd9538aa97'),
  'lógica de programação': UNSPLASH('photo-1488590528505-98d2b5aba04b'),
};

export function getApostilaCover(category: string | null | undefined, seedId?: string): string {
  const cat = (category || '').toLowerCase().trim();
  if (cat) {
    if (COVERS[cat]) return COVERS[cat];
    for (const key of Object.keys(COVERS)) {
      if (cat.includes(key) || key.includes(cat)) return COVERS[key];
    }
  }
  // Hash determinístico para fallback estável
  const src = seedId || cat || 'geral';
  let h = 0;
  for (let i = 0; i < src.length; i++) h = (h * 31 + src.charCodeAt(i)) | 0;
  return FALLBACK_COVERS[Math.abs(h) % FALLBACK_COVERS.length];
}
