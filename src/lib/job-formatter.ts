export interface JobDetails {
  overview: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  schedule: string;
  allowance: string;
}

export function formatJobDescription(rawDescription: string): JobDetails {
  if (!rawDescription) {
    return {
      overview: "Detalhes completos da oportunidade disponíveis na plataforma.",
      responsibilities: ["Atuação em projetos de tecnologia e inovação.", "Colaboração com equipes multidisciplinares."],
      requirements: ["Cursando ou formado em tecnologia, engenharia ou áreas correlatas.", "Disponibilidade e vontade de aprender."],
      benefits: ["Plano de saúde e odontológico", "Vale-refeição / Alimentação", "Auxílio home office ou fretado"],
      schedule: "A combinar / Flexível para estudos noturnos",
      allowance: "Compatível com o mercado"
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
  const overviewParts: string[] = [];
  let schedule = "Flexível para estudos noturnos";
  let allowance = "Não informada no anúncio";

  let currentSection = 'overview';

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (lower.includes('bolsa') || lower.includes('remuneração') || lower.includes('salário') || lower.includes('r$')) {
      if (lower.includes('r$') || lower.length < 50) {
        allowance = line.replace(/^(Bolsa|Remuneração|Salário)[:\s]*/i, '');
      }
    }

    if (lower.includes('carga horária') || lower.includes('horário') || lower.includes('jornada') || lower.includes('turno')) {
      if (lower.length < 80) {
        schedule = line.replace(/^(Carga horária|Horário|Jornada|Turno)[:\s]*/i, '');
      }
    }

    if (lower.includes('requisito') || lower.includes('perfil') || lower.includes('experiência') || lower.includes('conhecimento necessário')) {
      currentSection = 'requirements';
      continue;
    }
    if (lower.includes('responsabilidade') || lower.includes('atividades') || lower.includes('o que você vai fazer') || lower.includes('fará')) {
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
    benefits: benefits.length > 0 ? benefits : ["Assistência médica e odontológica", "Vale-refeição ou vale-alimentação", "Programas de desenvolvimento e mentoria"],
    schedule: schedule,
    allowance: allowance
  };
}
