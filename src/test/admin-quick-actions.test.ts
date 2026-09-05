import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('atalhos da Central de Comando', () => {
  it('oferece fluxos frequentes em um toque, com explicações e poucos ícones', () => {
    const dashboard = readFileSync(resolve(process.cwd(), 'src/components/AdminDashboard.tsx'), 'utf8');

    expect(dashboard).toContain('aria-label="Ações rápidas da administração"');
    expect(dashboard).toContain('grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3');
    expect(dashboard).toContain('O que você precisa fazer?');
    expect(dashboard).toContain('Criar uma apostila');
    expect(dashboard).toContain('Continuar última edição');
    expect(dashboard).toContain('Localizar e editar conteúdo');
    expect(dashboard).toContain('Informe matéria, semestre e título no mesmo formulário.');
    expect(dashboard).toContain("onNavigate('users')");
    expect(dashboard).toContain("onNavigate('ads')");
    expect(dashboard).toContain("onNavigate('exercises')");
  });
});
