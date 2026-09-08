import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const dashboard = readFileSync('src/pages/DashboardPage.tsx', 'utf8');
const progressHook = readFileSync('src/hooks/useApostilaProgressMap.tsx', 'utf8');

describe('dashboard reading progress', () => {
  it('does not report an exercise attempt as a read apostila', () => {
    expect(dashboard).toContain("item.status === 'concluida'");
    expect(dashboard).toContain('apostilas={{ lidas: apostilasConcluidas');
    expect(dashboard).not.toContain('apostilas={{ lidas: apostilasIniciadas');
  });

  it('includes pages created in the editor in the reading total', () => {
    expect(progressHook).toContain("from('apostila_pages' as any)");
    expect(progressHook).toContain("from('apostila_page_progress' as any)");
    expect(progressHook).toContain('completedInDatabase || completedOnDevice');
  });
});
