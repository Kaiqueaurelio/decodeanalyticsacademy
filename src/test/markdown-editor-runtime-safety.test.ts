import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src/components/MarkdownEditor.tsx'), 'utf8');

describe('MarkdownEditor runtime safety', () => {
  it('does not invoke a React hook inline inside conditional editor markup', () => {
    expect(source).not.toContain('sel={useEditorSelection(editor)}');
    expect(source).toContain('<MobileInspector editor={editor} stats={stats} />');
  });

  it('handles quick-add before the regular preview shortcut', () => {
    const quickAdd = source.indexOf("key === 'p' && e.shiftKey");
    const preview = source.indexOf("key === 'p')");
    expect(quickAdd).toBeGreaterThan(-1);
    expect(preview).toBeGreaterThan(quickAdd);
  });
});
