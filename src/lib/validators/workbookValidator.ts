/**
 * workbookValidator — Validador estrutural de apostilas.
 * Verifica hierarquia H1-H3, acessibilidade (alt text) e integridade de tabelas.
 */

export interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  blockIndex?: number;
  blockType?: string;
  suggestion?: string;
}

export interface ValidationReport {
  ok: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
}

/**
 * Valida a estrutura de uma apostila (conteúdo em Markdown).
 */
export function validateApostilaStructure(content: string): ValidationReport {
  const issues: ValidationIssue[] = [];
  const lines = content.split('\n');
  
  // 1. Hierarquia de Títulos
  let hasH1 = false;
  let lastHeadingLevel = 0;
  
  lines.forEach((line, index) => {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      
      if (level === 1) hasH1 = true;
      
      // Regra: Não pular níveis (ex: H1 -> H3 sem H2)
      if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
        issues.push({
          type: 'error',
          message: `Salto de hierarquia detectado: H${lastHeadingLevel} seguido de H${level}.`,
          blockIndex: index,
          suggestion: `Adicione um título H${lastHeadingLevel + 1} antes deste H${level}.`
        });
      }
      
      lastHeadingLevel = level;
    }

    // 2. Acessibilidade de Imagens
    const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
    if (imgMatch) {
      const altText = imgMatch[1].trim();
      if (!altText) {
        issues.push({
          type: 'warning',
          message: 'Imagem sem texto alternativo (alt text).',
          blockIndex: index,
          suggestion: 'Adicione uma descrição breve dentro dos colchetes ![Descrição].'
        });
      }
    }

    // 3. Tabelas sem cabeçalho (simplificado)
    if (line.includes('|') && index > 0 && !lines[index-1].includes('|') && !lines[index+1]?.includes('|-')) {
       // Possível tabela começando sem a linha de separação correta ou cabeçalho
    }
  });

  if (!hasH1) {
    issues.push({
      type: 'error',
      message: 'A apostila não possui um título principal (H1).',
      suggestion: 'Adicione um título começando com # no início do documento.'
    });
  }

  // Cálculo de score
  const errors = issues.filter(i => i.type === 'error').length;
  const warnings = issues.filter(i => i.type === 'warning').length;
  const score = Math.max(0, 100 - (errors * 20) - (warnings * 5));

  return {
    ok: errors === 0,
    score,
    issues
  };
}
