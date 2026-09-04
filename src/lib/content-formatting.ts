export function decodeHtmlEntities(value: string): string {
  if (!value || !value.includes('&')) return value || '';

  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
  }

  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);?/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);?/gi, (_match, code: string) => String.fromCodePoint(parseInt(code, 16)));
}

/** Normaliza entidades e quebras sem executar HTML vindo do conteúdo editorial. */
export function normalizeRichContent(value: string): string {
  return decodeHtmlEntities(value || '').replace(/\r\n/g, '\n');
}

/**
 * Normaliza escapes de Markdown gerados por importadores/IA.
 *
 * Alguns conteúdos legados chegam como `1\\. Título`; isso é um marcador
 * numerado válido, mas o parser não o reconhece enquanto a barra existir.
 * A regra é restrita ao início de uma linha para não alterar código ou texto
 * comum no meio de um parágrafo.
 */
export function normalizeMarkdownEscapes(value: string): string {
  return normalizeRichContent(value || '')
    .replace(/^(\s*\d+(?:\.\d+)*)(\\)([.)])(\s+)/gm, '$1$3$4')
    .replace(/^(\s*)\\(#{1,6}\s+)/gm, '$1$2')
    .replace(/^(\s*)\\([-+*]\s+)/gm, '$1$2')
    .replace(/^(\s*)\\((?:---+|___+|\*\*\*+)\s*)$/gm, '$1$2');
}

/** Remove tags/markdown residuais dos títulos, preservando o texto legível. */
export function stripInlineMarkup(value: string): string {
  return normalizeMarkdownEscapes(value || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~=`]+/g, '')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Chave para identificar conteúdo repetido entre o campo principal e páginas estruturadas. */
export function normalizeContentForComparison(value: string): string {
  return stripInlineMarkup(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

export function isEffectivelySameContent(first: string, second: string): boolean {
  const left = normalizeContentForComparison(first);
  const right = normalizeContentForComparison(second);
  return Boolean(left && right && left === right);
}

/**
 * Detecta cópias exatas ou quase exatas sem confundir um resumo curto com a
 * apostila completa. A antiga comparação por simples `includes` escondia uma
 * página inteira quando ela continha apenas um pequeno trecho já estruturado.
 */
export function isSubstantialDuplicateContent(first: string, second: string): boolean {
  const left = normalizeContentForComparison(first);
  const right = normalizeContentForComparison(second);
  if (!left || !right) return false;
  if (left === right) return true;

  const shorter = left.length <= right.length ? left : right;
  const longer = left.length > right.length ? left : right;
  const coverage = shorter.length / longer.length;

  if (coverage >= 0.9 && longer.includes(shorter)) return true;

  // Conteúdos longos importados pelo editor podem voltar com parágrafos
  // reordenados, títulos extras ou outra pontuação. Nesses casos, comparar só
  // por `includes` faz o leitor renderizar a apostila principal e a cópia da
  // página logo abaixo. Shingles preservam a ordem local e reconhecem a cópia
  // sem tratar um resumo curto como se fosse a apostila completa.
  if (shorter.length < 800) return false;
  if (longer.includes(shorter)) return true;

  const makeShingles = (content: string, size = 8, stride = 1) => {
    const words = content.split(' ').filter(Boolean);
    const shingles = new Set<string>();
    for (let index = 0; index <= words.length - size; index += stride) {
      shingles.add(words.slice(index, index + size).join(' '));
    }
    return shingles;
  };

  const shorterWordCount = shorter.split(' ').length;
  const shortStride = Math.max(1, Math.ceil(shorterWordCount / 2500));
  const shortShingles = makeShingles(shorter, 8, shortStride);
  const longShingles = makeShingles(longer);
  if (shortShingles.size === 0 || longShingles.size === 0) return false;

  let matchingShingles = 0;
  shortShingles.forEach((shingle) => {
    if (longShingles.has(shingle)) matchingShingles += 1;
  });

  return matchingShingles / shortShingles.size >= 0.78;
}

export function mergeDistinctPages<T extends { content?: string; id: string }>(pages: T[]): T[] {
  return pages.reduce<T[]>((distinct, page) => {
    const content = page.content || '';
    const key = normalizeContentForComparison(content);
    if (!key) return distinct;

    const duplicateIndex = distinct.findIndex((saved) =>
      isSubstantialDuplicateContent(saved.content || '', content),
    );
    if (duplicateIndex === -1) {
      distinct.push(page);
      return distinct;
    }

    const savedLength = normalizeContentForComparison(distinct[duplicateIndex].content || '').length;
    if (key.length > savedLength) distinct[duplicateIndex] = page;
    return distinct;
  }, []);
}

export function getPageDisplayTitle(value: string, fallback = 'Nova Página'): string {
  const clean = stripInlineMarkup(value)
    .replace(/\b([\p{L}\p{N}]+)(?:\s+\1\b)+/giu, '$1')
    .replace(/\b(\d{2}\/\d{2}\/\d{4})(?:\s+\1\b)+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return clean || fallback;
}

export function getPageHeading(title: string, position: number): string {
  return getPageDisplayTitle(title, `Página ${position + 1}`);
}

export function isBlankContent(value: string): boolean {
  return !normalizeContentForComparison(value);
}

/** Identifica marcadores técnicos que não devem aparecer como conteúdo editorial para o aluno. */
export function isPlaceholderPageContent(value: string): boolean {
  const normalized = normalizeContentForComparison(value);
  if (!normalized) return true;
  return [
    'conteúdo em processamento',
    'material em fase de estruturação',
    'este conteúdo está sendo estruturado',
  ].some((marker) => normalized === normalizeContentForComparison(marker));
}

export function contentHasMarkup(value: string): boolean {
  return /<[^>]+>|&(?:lt|gt|amp|quot|#\d+);/i.test(value || '');
}

export function cleanDisplayTitle(value: string): string {
  return stripInlineMarkup(value);
}

export function cleanDisplayContent(value: string): string {
  return normalizeRichContent(value);
}

export function pageContentForRenderer(value: string): string {
  return normalizeRichContent(value);
}

export function pageTitleForRenderer(value: string, fallback = 'Nova Página'): string {
  return getPageDisplayTitle(value, fallback);
}

export function pageContentKey(value: string): string {
  return normalizeContentForComparison(value);
}

export function isDuplicatePageContent(first: string, second: string): boolean {
  return isEffectivelySameContent(first, second);
}

export function normalizeSectionTitle(value: string): string {
  return stripInlineMarkup(value);
}

export function normalizeSectionContent(value: string): string {
  return normalizeRichContent(value);
}
