import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const srcRoot = resolve(process.cwd(), 'src');
const appSource = readFileSync(resolve(srcRoot, 'App.tsx'), 'utf8');
const dashboardSource = readFileSync(resolve(srcRoot, 'pages/DashboardPage.tsx'), 'utf8');
const protectedRouteSource = readFileSync(resolve(srcRoot, 'components/ProtectedRoute.tsx'), 'utf8');

function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = resolve(dir, entry);
    if (entry === 'test' || entry === '__tests__') continue;
    if (statSync(fullPath).isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('optional profile completion', () => {
  it('removes the obsolete profile prompt component entirely', () => {
    expect(existsSync(resolve(srcRoot, 'components/RANamePrompt.tsx'))).toBe(false);
  });

  it('keeps profile completion outside authentication and route guards', () => {
    expect(appSource).not.toContain('RANamePrompt');
    expect(dashboardSource).not.toContain('data-ra-prompt-trigger');
    expect(dashboardSource).not.toContain('Perfil Incompleto');
    expect(protectedRouteSource).not.toContain('full_name');
    expect(protectedRouteSource).not.toContain('profile.email');
    expect(protectedRouteSource).not.toContain('RANamePrompt');
  });

  it('contains no remaining mandatory-profile UI or trigger anywhere in application source', () => {
    // Scan application code, excluding test fixtures that intentionally name the forbidden markers.
    const forbidden = [
      'RANamePrompt',
      'data-ra-prompt-trigger',
      'Complete seu perfil',
      'Perfil Incompleto',
      'perfil incompleto',
    ];

    const violations = collectSourceFiles(srcRoot)
      .filter((filePath) => !filePath.endsWith('mandatory-profile-completion.test.ts'))
      .flatMap((filePath) => {
        const source = readFileSync(filePath, 'utf8');
        return forbidden
          .filter((marker) => source.includes(marker))
          .map((marker) => ({ file: filePath.replace(srcRoot, 'src'), marker }));
      });

    expect(violations).toEqual([]);
  });
});
