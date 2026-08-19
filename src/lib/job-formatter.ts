export function formatJobDescription(rawDescription: string): {
  overview: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
} {
  if (!rawDescription) {
    return {
      overview: "Detalhes completos da oportunidade na plataforma.",
      responsibilities: ["Atuação em projetos de tecnologia e inovação.", "Colaboração com equipes multidisciplinares."],
      requirements: ["Cursando ou formado em tecnologia, engenharia ou áreas correlatas.", "Disponibilidade e vontade de aprender."],
      benefits: ["Ambiente de aprendizado acelerado", "Flexibilidade de horários"]
    };
  }

  const cleaned = rawDescription
    .replace(/\*\*/g, '')
    .replace(/#{1,6}\s?/g, '')
    .trim();

  const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);

  const responsibilities: string[] = [];
  const requirements: string[] = [];
  const benefits: string[] = [];
  let overviewParts: string[] = [];

  let currentSection = 'overview';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('requisito') || lower.includes('perfil') || lower.includes('experiência') || lower.includes('conhecimento')) {
      currentSection = 'requirements';
      continue;
    }
    if (lower.includes('responsabilidade') || lower.includes('atividades') || lower.includes('o que você vai fazer') || lower.includes('desafios')) {
      currentSection = 'responsabilities';
      continue;
    }
    if (lower.includes('benefício') || lower.includes('oferecemos') || lower.includes('vantagens')) {
      currentSection = 'benefits';
      continue;
    }

    if (currentSection === 'requirements') {
      requirements.push(line.replace(/^[-*•]\s*/, ''));
    } else if (currentSection === 'responsabilities') {
      responsibilities.push(line.replace(/^[-*•]\s*/, ''));
    } else if (currentSection === 'benefits') {
      benefits.push(line.replace(/^[-*•]\s*/, ''));
    } else {
      overviewParts.push(line);
    }
  }

  return {
    overview: overviewParts.join(' ') || cleaned.slice(0, 300) + '...',
    responsibilities: responsibilities.length > 0 ? responsibilities : ["Desenvolvimento e acompanhamento de projetos tecnológicos.", "Participação em ritos ágeis e alinhamentos de equipe."],
    requirements: requirements.length > 0 ? requirements : ["Familiaridade com conceitos modernos de desenvolvimento e engenharia.", "Boa comunicação e autonomia."],
    benefits: benefits.length > 0 ? benefits : ["Oportunidade de crescimento acelerado", "Mentoria com profissionais seniores"]
  };
}
