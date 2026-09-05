import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('grade responsiva do acervo administrativo', () => {
  it('não comprime três pastas na coluna estreita da Central de Comando', () => {
    const dashboard = readFileSync(resolve(process.cwd(), 'src/components/AdminDashboard.tsx'), 'utf8');

    expect(dashboard).toContain('grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3');
    expect(dashboard).toContain('flex min-w-0 flex-1 items-center gap-3');
    expect(dashboard).toContain('shrink-0 whitespace-nowrap');
    expect(dashboard).not.toContain('grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3');
  });
});
