import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src/components/RANamePrompt.tsx'), 'utf8');
const appSource = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8');
const dashboardSource = readFileSync(resolve(process.cwd(), 'src/pages/DashboardPage.tsx'), 'utf8');

describe('optional profile completion', () => {
  it('does not block students with incomplete identity data', () => {
    expect(source).toContain('onOpenChange={setOpen}');
    expect(source).toContain('Agora não');
    expect(source).not.toContain('setOpen(true);');
  });

  it('keeps profile completion optional and outside the authentication gate', () => {
    expect(appSource).not.toContain("import { RANamePrompt }");
    expect(appSource).not.toContain('<RANamePrompt />');
    expect(dashboardSource).not.toContain('data-ra-prompt-trigger');
    expect(dashboardSource).not.toContain('Perfil Incompleto');
  });
});
