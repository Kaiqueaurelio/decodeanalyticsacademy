import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('visibilidade das apostilas no painel administrativo', () => {
  it('não elimina páginas distintas por título e categoria no painel principal', () => {
    const dashboard = source('src/components/AdminDashboard.tsx');

    expect(dashboard).not.toContain('const unique = new Map<string, ApostilaRow>()');
    expect(dashboard).toContain('A área administrativa precisa exibir cada registro real');
  });

  it('não elimina páginas distintas por título e categoria no gerenciador', () => {
    const admin = source('src/pages/AdminPage.tsx');

    expect(admin).not.toContain('const uniqueApostilas = new Map<string, Apostila>()');
    expect(admin).toContain('Não desduplicar por título/categoria na administração');
  });
});
