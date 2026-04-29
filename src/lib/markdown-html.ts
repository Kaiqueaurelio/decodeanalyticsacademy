/**
 * Conversão Markdown ↔ HTML para o editor WYSIWYG.
 * O conteúdo continua sendo persistido como Markdown (compatível com o
 * renderer do aluno, com PDF, com chat, com sumário). O editor só usa HTML
 * em memória enquanto o usuário trabalha.
 *
 * Preserva imagens com width/align (sintaxe HTML inline) que o ApostilaContentRenderer
 * já aceita.
 */
import { marked } from 'marked';
import TurndownService from 'turndown';

marked.setOptions({ gfm: true, breaks: false });

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
});

// Preserva nossas tags inline customizadas (cor, realce, sublinhado, sub/sup, alinhamento)
turndown.keep(['u', 'mark', 'sub', 'sup', 'span', 'div', 'small']);

// Imagens: gera <img> quando há width/align, senão markdown puro
turndown.addRule('imageWithAttrs', {
  filter: (node) => node.nodeName === 'IMG',
  replacement: (_content, node) => {
    const el = node as HTMLImageElement;
    const src = el.getAttribute('src') || '';
    const alt = el.getAttribute('alt') || '';
    const width = el.getAttribute('width') || el.style.width || '';
    const align = el.getAttribute('data-align') || el.getAttribute('align') || '';
    if (width || align) {
      const attrs = [
        `src="${src}"`,
        alt && `alt="${alt}"`,
        width && `width="${width}"`,
        align && `align="${align}"`,
      ]
        .filter(Boolean)
        .join(' ');
      return `\n\n<img ${attrs} />\n\n`;
    }
    return `![${alt}](${src})`;
  },
});

// Tabelas: usa GFM
turndown.addRule('tableHeader', {
  filter: 'th',
  replacement: (content) => ` ${content.trim()} |`,
});

export function markdownToHtml(md: string): string {
  if (!md) return '';
  // marked já preserva HTML inline (rehype-raw equivalent)
  const html = marked.parse(md, { async: false }) as string;
  return html;
}

export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  return turndown.turndown(html).trim();
}
