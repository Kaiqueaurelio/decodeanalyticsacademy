import type { Highlighter, BundledLanguage } from 'shiki';

let highlighterPromise: Promise<Highlighter> | null = null;
const loadedLangs = new Set<string>();

const SUPPORTED_LANGS: BundledLanguage[] = [
  'csharp', 'javascript', 'typescript', 'jsx', 'tsx', 'python', 'java',
  'cpp', 'c', 'html', 'css', 'scss', 'sql', 'php', 'ruby', 'go', 'rust',
  'kotlin', 'swift', 'bash', 'shell', 'json', 'xml', 'yaml',
];

const ALIAS: Record<string, BundledLanguage> = {
  cs: 'csharp', js: 'javascript', ts: 'typescript', py: 'python',
  sh: 'bash', yml: 'yaml',
};

export function normalizeLang(lang: string): BundledLanguage | 'text' {
  const l = (lang || '').toLowerCase();
  if (ALIAS[l]) return ALIAS[l];
  if ((SUPPORTED_LANGS as string[]).includes(l)) return l as BundledLanguage;
  return 'text';
}

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then(async ({ createHighlighter }) => {
      const h = await createHighlighter({
        themes: ['github-dark-dimmed'],
        langs: ['csharp', 'javascript', 'typescript', 'python'],
      });
      ['csharp', 'javascript', 'typescript', 'python'].forEach((l) => loadedLangs.add(l));
      return h;
    });
  }
  return highlighterPromise;
}

export async function highlightCode(code: string, lang: string): Promise<string | null> {
  const normalized = normalizeLang(lang);
  if (normalized === 'text') return null;
  try {
    const h = await getHighlighter();
    if (!loadedLangs.has(normalized)) {
      await h.loadLanguage(normalized);
      loadedLangs.add(normalized);
    }
    return h.codeToHtml(code, { lang: normalized, theme: 'github-dark-dimmed' });
  } catch {
    return null;
  }
}
