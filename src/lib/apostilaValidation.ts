/**
 * validateApostilaStructure — verifica se uma apostila atende ao padrão
 * editorial Decode Analytics:
 *
 *  - Exatamente 6 seções H2 (## ...) — corresponde à estrutura Perplexity
 *    (Introdução, Conceitos, Aplicações, Desafios, Conclusão, Referências
 *    ou equivalentes).
 *  - Cada H2 deve conter ao menos 1 subtópico H3 (### ...).
 *  - O total de palavras deve estar próximo de ~1500 (sinaliza se < 800
 *    ou > 3000 como aviso "soft").
 *
 * Retorna severidade `error` (impede salvar sem confirmação), `warning`
 * (apenas alerta) ou `ok`. NÃO bloqueia: o admin sempre pode "salvar
 * mesmo assim", mas vê os problemas antes.
 */

export type IssueSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: IssueSeverity;
  code: string;
  message: string;
  /** Sugestão curta de como resolver. */
  hint?: string;
}

export interface ValidationReport {
  ok: boolean;
  issues: ValidationIssue[];
  stats: {
    h2Count: number;
    h3Count: number;
    h2WithoutH3: string[];
    words: number;
    expectedH2: number;
  };
}

const EXPECTED_H2 = 6;

/** Lê os headings markdown (## e ###) sem capturar `#####+` por engano. */
function extractHeadings(content: string): Array<{ level: number; text: string }> {
  const lines = (content || '').split('\n');
  const out: Array<{ level: number; text: string }> = [];
  let inFence = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
    // Pula blocos de código cercados (``` ou ~~~) — headings dentro deles
    // são literais, não estrutura.
    if (/^(```|~~~)/.test(line.trim())) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    out.push({ level: m[1].length, text: m[2].trim() });
  }
  return out;
}

function countWords(content: string): number {
  const stripped = (content || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*_~`-]/g, ' ');
  const words = stripped.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

export function validateApostilaStructure(content: string): ValidationReport {
  const headings = extractHeadings(content);
  const h2 = headings.filter((h) => h.level === 2);
  const h3Total = headings.filter((h) => h.level === 3).length;

  // Identifica H2 sem H3 entre ele e o próximo H2.
  const h2WithoutH3: string[] = [];
  for (let i = 0; i < headings.length; i++) {
    const cur = headings[i];
    if (cur.level !== 2) continue;
    let hasH3 = false;
    for (let j = i + 1; j < headings.length; j++) {
      if (headings[j].level === 2) break;
      if (headings[j].level === 3) { hasH3 = true; break; }
    }
    if (!hasH3) h2WithoutH3.push(cur.text);
  }

  const words = countWords(content);
  const issues: ValidationIssue[] = [];

  // 1) Quantidade de H2
  if (h2.length === 0) {
    issues.push({
      severity: 'error',
      code: 'no-h2',
      message: 'Nenhuma seção principal (H2) encontrada.',
      hint: 'Use "## Título da seção" para criar as 6 seções principais.',
    });
  } else if (h2.length < EXPECTED_H2) {
    issues.push({
      severity: 'error',
      code: 'h2-too-few',
      message: `Encontradas ${h2.length} seções H2 (esperado ${EXPECTED_H2}).`,
      hint: `Faltam ${EXPECTED_H2 - h2.length} seção(ões). Adicione com "## Nome da seção".`,
    });
  } else if (h2.length > EXPECTED_H2) {
    issues.push({
      severity: 'warning',
      code: 'h2-too-many',
      message: `Encontradas ${h2.length} seções H2 (padrão é ${EXPECTED_H2}).`,
      hint: 'Considere agrupar conteúdos próximos em uma mesma seção.',
    });
  }

  // 2) Subtópicos por seção
  if (h2WithoutH3.length > 0) {
    issues.push({
      severity: 'warning',
      code: 'h2-without-h3',
      message: `${h2WithoutH3.length} seção(ões) sem subtópicos (H3): ${h2WithoutH3.slice(0, 3).map((t) => `"${t}"`).join(', ')}${h2WithoutH3.length > 3 ? '…' : ''}.`,
      hint: 'Adicione "### Subtítulo" dentro de cada seção para facilitar a leitura.',
    });
  }

  if (h3Total === 0 && h2.length > 0) {
    issues.push({
      severity: 'warning',
      code: 'no-h3',
      message: 'Nenhum subtópico H3 em toda a apostila.',
      hint: 'Subtópicos ajudam o aluno a navegar e revisar. Adicione "### …" sob cada H2.',
    });
  }

  // 3) Densidade de conteúdo
  if (words < 300) {
    issues.push({
      severity: 'error',
      code: 'too-short',
      message: `Conteúdo muito curto (${words} palavras).`,
      hint: 'Apostilas do padrão têm cerca de 1.500 palavras.',
    });
  } else if (words < 800) {
    issues.push({
      severity: 'warning',
      code: 'short',
      message: `Conteúdo abaixo do esperado (${words} palavras, ideal ~1.500).`,
    });
  } else if (words > 3500) {
    issues.push({
      severity: 'warning',
      code: 'long',
      message: `Conteúdo muito extenso (${words} palavras, ideal ~1.500).`,
      hint: 'Considere quebrar em mais de uma apostila.',
    });
  }

  return {
    ok: issues.length === 0,
    issues,
    stats: {
      h2Count: h2.length,
      h3Count: h3Total,
      h2WithoutH3,
      words,
      expectedH2: EXPECTED_H2,
    },
  };
}
