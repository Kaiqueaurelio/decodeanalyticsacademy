import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('gestão de usuários responsiva', () => {
  it('renderiza somente o gerenciador responsivo do painel', () => {
    const admin = readFileSync(resolve(process.cwd(), 'src/pages/AdminPage.tsx'), 'utf8');

    expect(admin).not.toContain("import { AdminUserManagement }");
    expect(admin.match(/tab === 'users'/g)).toHaveLength(1);
    expect(admin).toContain('Cadastre, bloqueie ou ajuste o acesso das contas.');
  });
});
