// Subject color mapping
export const SUBJECT_COLORS: Record<string, string> = {
  'Inteligência Artificial': '#E8FF47',
  'Redes de Computadores': '#6EE7B7',
  'Sistemas Operacionais': '#93C5FD',
  'Teoria dos Grafos': '#F9A8D4',
  'Arquitetura': '#FCD34D',
  'Linguagens Formais': '#A78BFA',
  'Computação Gráfica': '#FB923C',
  'Metodologia': '#34D399',
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
