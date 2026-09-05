import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('atalhos da Central de Comando', () => {
  it('oferece ações frequentes em um toque e grade responsiva', () => {
    const dashboard = readFileSync(resolve(process.cwd(), 'src/components/AdminDashboard.tsx'), 'utf8');

    expect(dashboard).toContain('aria-label="Ações rápidas da administração"');
    expect(dashboard).toContain('grid-cols-2 gap-2 px-2 sm:grid-cols-4');
    expect(dashboard).toContain('Nova apostila');
    expect(dashboard).toContain('Buscar e editar');
    expect(dashboard).toContain("onNavigate('users')");
    expect(dashboard).toContain("onNavigate('ads')");
  });
});
