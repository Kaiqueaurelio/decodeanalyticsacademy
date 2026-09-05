import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('extensões do editor de apostilas', () => {
  it('não registra link e sublinhado duas vezes no TipTap', () => {
    const editor = readFileSync(resolve(process.cwd(), 'src/components/MarkdownEditor.tsx'), 'utf8');

    expect(editor).toContain('link: false');
    expect(editor).toContain('underline: false');
    expect(editor).toContain('Link.configure(');
    expect(editor).toContain('Underline,');
  });
});
