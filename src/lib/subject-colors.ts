// Subject color mapping — grade UNIP Ciência da Computação
export const SUBJECT_COLORS: Record<string, string> = {
  // 5º semestre (foco atual)
  'Inteligência Artificial': '#E8FF47',
  'Arquitetura de Redes de Computadores': '#6EE7B7',
  'Sistemas Operacionais': '#93C5FD',
  'Teoria dos Grafos': '#F9A8D4',
  'Arquitetura de Computadores Modernos': '#FCD34D',
  'Linguagens Formais e Autômatos': '#A78BFA',
  'Computação Gráfica': '#FB923C',
  'Análise Matemática': '#5EEAD4',
  'Metodologia do Trabalho Acadêmico': '#34D399',
  // Outras matérias com cor fixa
  'Banco de Dados': '#60A5FA',
  'Estrutura de Dados': '#F472B6',
  'Engenharia de Software': '#C084FC',
  'Sistemas Distribuídos': '#22D3EE',
  'Ciência de Dados': '#4ADE80',
  'Compiladores e Computabilidade': '#FBBF24',
  'Linguagem de Programação Orientada a Objetos': '#F87171',
  'Lógica de Programação e Algoritmos': '#A3E635',
};

export const DEFAULT_SUBJECT_COLOR = '#94A3B8';

export function getSubjectColor(category: string): string {
  // Try exact match first
  if (SUBJECT_COLORS[category]) return SUBJECT_COLORS[category];
  
  // Try partial match
  const lowerCat = category.toLowerCase();
  for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
    if (lowerCat.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCat)) {
      return color;
    }
  }
  
  // Generate consistent color from string hash
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = Object.values(SUBJECT_COLORS);
  return colors[Math.abs(hash) % colors.length] || DEFAULT_SUBJECT_COLOR;
}
