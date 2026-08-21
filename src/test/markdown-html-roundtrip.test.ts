import { describe, expect, it } from 'vitest';
import { htmlToMarkdown, markdownToHtml } from '../lib/markdown-html';

describe('round-trip de formatação do editor de apostilas', () => {
  it('preserva a formatação principal ao converter Markdown para HTML e de volta', () => {
    const original = [
      '# Aula formatada',
      '',
      'Texto com **negrito**, *itálico* e [link](https://example.com).',
      '',
      '- Primeiro item',
      '- Segundo item',
      '',
      '![Imagem da aula](https://example.com/imagem.png)',
    ].join('\n');

    const roundTrip = htmlToMarkdown(markdownToHtml(original));

    expect(roundTrip).toContain('# Aula formatada');
    expect(roundTrip).toContain('**negrito**');
    expect(roundTrip).toContain('*itálico*');
    expect(roundTrip).toContain('[link](https://example.com)');
    expect(roundTrip).toMatch(/^-\s+Primeiro item$/m);
    expect(roundTrip).toMatch(/^-\s+Segundo item$/m);
    expect(roundTrip).toContain('![Imagem da aula](https://example.com/imagem.png)');
  });
});

