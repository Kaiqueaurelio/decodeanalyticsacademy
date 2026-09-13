import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('login identifier entry', () => {
  it('does not normalize an identifier as RA while it is being typed', () => {
    const page = readFileSync(resolve(process.cwd(), 'src/pages/LoginPage.tsx'), 'utf8');
    expect(page).toContain('setIdentifier(normalizeIdentifier(e.target.value))');
    expect(page).not.toContain('setIdentifier(looksLikeEmail(v) ?');
  });
});
