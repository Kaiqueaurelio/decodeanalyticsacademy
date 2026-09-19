import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const appSource = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8');
const dashboardSource = readFileSync(resolve(process.cwd(), 'src/pages/DashboardPage.tsx'), 'utf8');
const protectedRouteSource = readFileSync(resolve(process.cwd(), 'src/components/ProtectedRoute.tsx'), 'utf8');

describe('optional profile completion', () => {
  it('removes the obsolete profile prompt component entirely', () => {
    expect(existsSync(resolve(process.cwd(), 'src/components/RANamePrompt.tsx'))).toBe(false);
  });

  it('keeps profile completion outside authentication and route guards', () => {
    expect(appSource).not.toContain('RANamePrompt');
    expect(dashboardSource).not.toContain('data-ra-prompt-trigger');
    expect(dashboardSource).not.toContain('Perfil Incompleto');
    expect(protectedRouteSource).not.toContain('full_name');
    expect(protectedRouteSource).not.toContain('profile.email');
    expect(protectedRouteSource).not.toContain('RANamePrompt');
  });
});
