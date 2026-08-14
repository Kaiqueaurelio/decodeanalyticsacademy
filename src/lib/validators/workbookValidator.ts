/**
 * workbookValidator — Validador estrutural de apostilas.
 * Verifica hierarquia H1-H3, acessibilidade (alt text) e integridade de tabelas.
 */

export type IssueSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: IssueSeverity;
  code: string;
  message: string;
  /** Sugestão curta de como resolver. */
  hint?: string;
  blockIndex?: number;
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

/**
 * Valida a estrutura de uma apostila (conteúdo em Markdown).
 */
export function validateApostilaStructure(content: string): ValidationReport {
  const issues: ValidationIssue[] = [];
  const lines = (content || '').split('\n');
  
  const headings: Array<{ level: number; text: string; index: number }> = [];
  let inFence = false;
  
  lines.forEach((raw, index) => {
    const line = raw.trimEnd();
    if (/^(```|~~~)/.test(line.trim())) { 
      inFence = !inFence; 
      return; 
    }
    if (inFence) return;
    
    const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) {
      headings.push({ level: m[1].length, text: m[2].trim(), index });
    }

    // Acessibilidade de Imagens
    const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
    if (imgMatch) {
      const altText = imgMatch[1].trim();
      if (!altText) {
        issues.push({
          severity: 'warning',
          code: 'alt-missing',
          message: 'Imagem sem texto alternativo (alt text).',
          blockIndex: index,
          hint: 'Adicione uma descrição breve dentro dos colchetes ![Descrição].'
        });
      }
    }
  });

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

  // 1) Quantidade de H2
  if (h2.length === 0) {
    issues.push({
      severity: 'error',
      code: 'no-h2',
      message: 'Nenhuma seção principal (H2) encontrada.',
      hint: 'Use "## Título da seção" para criar as seções principais.',
    });
  } else if (h2.length < EXPECTED_H2) {
    issues.push({
      severity: 'error',
      code: 'h2-too-few',
      message: `Encontradas ${h2.length} seções H2 (esperado ${EXPECTED_H2}).`,
      hint: `Faltam ${EXPECTED_H2 - h2.length} seção(ões). Adicione com "## Nome da seção".`,
    });
  }

  // 2) Hierarquia (Salto de níveis)
  let lastLevel = 0;
  headings.forEach(h => {
    if (lastLevel > 0 && h.level > lastLevel + 1) {
      issues.push({
        severity: 'error',
        code: 'heading-jump',
        message: `Salto de hierarquia: H${lastLevel} seguido de H${h.level}.`,
        blockIndex: h.index,
        hint: `Adicione um título H${lastLevel + 1} antes deste H${h.level}.`
      });
    }
    lastLevel = h.level;
  });

  if (h2WithoutH3.length > 0) {
    issues.push({
      severity: 'warning',
      code: 'h2-without-h3',
      message: `${h2WithoutH3.length} seção(ões) sem subtópicos (H3).`,
      hint: 'Adicione "### Subtítulo" para facilitar a leitura.',
    });
  }

  const words = countWords(content);
  if (words < 300) {
    issues.push({
      severity: 'error',
      code: 'too-short',
      message: `Conteúdo muito curto (${words} palavras).`,
      hint: 'Apostilas do padrão têm cerca de 1.500 palavras.',
    });
  }

  return {
    ok: !issues.some(i => i.severity === 'error'),
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
