// Subject color mapping — grade UNIP Ciência da Computação
export const SUBJECT_COLORS: Record<string, string> = {
  // 1º semestre
  'Logica de Programacao': '#A3E635',
  'Matematica Discreta': '#60A5FA',
  'Introducao a Computacao': '#94A3B8',
  'Comunicacao e Expressao': '#F472B6',
  'Fundamentos de Sistemas de Informacao': '#FB923C',
  'Sociedade e Tecnologia': '#A78BFA',
  
  // 2º semestre
  'Linguagem de Programacao Orientada a Objeto': '#F87171',
  'Calculo Diferencial e Integral I': '#FCD34D',
  'Algebra Linear': '#5EEAD4',
  'Arquitetura e Organizacao de Computadores': '#FCD34D',
  'Fisica para Computacao': '#22D3EE',
  
  // 3º semestre
  'Estrutura de Dados': '#F472B6',
  'Banco de Dados I': '#60A5FA',
  'Probabilidade e Estatistica': '#5EEAD4',
  'Engenharia de Software': '#C084FC',

  // 4º semestre
  'Programacao Web': '#22D3EE',
  'Analise e Projeto de Sistemas': '#FB923C',
  'Compiladores': '#FBBF24',
  'Computabilidade': '#F9A8D4',
  'Banco de Dados II': '#3B82F6',
  'Redes de Computadores I': '#6EE7B7',

  // 5º semestre
  'Inteligencia Artificial': '#E8FF47',
  'Arquitetura de Redes': '#6EE7B7',
  'Redes de Computadores II': '#34D399',
  'Sistemas Operacionais I': '#93C5FD',
  'Teoria dos Grafos': '#F9A8D4',
  'Arquitetura de Computadores Modernos': '#FCD34D',
  'Linguagens Formais e Automatos': '#A78BFA',
  'Computacao Grafica': '#FB923C',
  'Analise Matematica': '#5EEAD4',

  // 6º semestre
  'Pesquisa Operacional': '#E8FF47',
  'Sistemas Operacionais e Mobile': '#93C5FD',
  'Calculo Numerico Computacional': '#FCD34D',
  'Aspectos Teoricos da Computacao': '#A78BFA',
  'Ciencia de Dados': '#4ADE80',
  'Processamento de Imagem e Visao Computacional': '#FB923C',

  // 7º semestre
  'Seguranca da Informacao': '#F87171',
  'Computacao em Nuvem': '#22D3EE',
  'Aprendizado de Maquina (Machine Learning)': '#4ADE80',
  'Trabalho de Conclusao de Curso I (TCC)': '#94A3B8',

  // 8º semestre
  'Trabalho de Conclusao de Curso II (TCC)': '#94A3B8',
  'Empreendedorismo': '#FB923C',
  'Gestao de Projetos II': '#C084FC',
  
  'APS': '#FF8FA3',
  'Atividade Prática Supervisionada': '#FF8FA3',
  'Extensão Curricular': '#B5F5C8',
  'Atividade de Extensão Curricular': '#B5F5C8',
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
