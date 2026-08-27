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
  return normalizeRichContent(value || '').replace(
    /^(\s*\d+(?:\.\d+)*)(\\)([.)])(\s+)/gm,
    '$1$3$4',
  );
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
    .replace(/[>#-]+/g, ' ')
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

  return coverage >= 0.9 && longer.includes(shorter);
}

export function mergeDistinctPages<T extends { content?: string; id: string }>(pages: T[]): T[] {
  const seen = new Set<string>();
  return pages.filter((page) => {
    const key = normalizeContentForComparison(page.content || '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getPageDisplayTitle(value: string, fallback = 'Nova Página'): string {
  return stripInlineMarkup(value) || fallback;
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
  ].some((marker) => normalized.includes(marker));
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
