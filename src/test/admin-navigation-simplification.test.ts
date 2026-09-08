import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const navigation = readFileSync('src/config/adminNav.ts', 'utf8');

describe('simplified admin navigation', () => {
  it('keeps daily work available with clear labels', () => {
    for (const label of ['Conteúdos e Apostilas', 'Arquivos e Materiais', 'Alunos e Acessos', 'Avisos aos Alunos', 'Calendário']) {
      expect(navigation).toContain(label);
    }
  });

  it('does not expose AI administration in the main navigation', () => {
    const visibleGroups = navigation.slice(navigation.indexOf('export const ADMIN_NAV_GROUPS'));
    expect(visibleGroups).not.toContain("id: 'ella-audit'");
    expect(visibleGroups).not.toContain("id: 'ai'");
    expect(visibleGroups).not.toContain("id: 'mcp-settings'");
  });
});
