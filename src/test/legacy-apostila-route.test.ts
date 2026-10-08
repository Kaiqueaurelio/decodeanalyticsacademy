import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('rota legada de apostila', () => {
  it('redireciona links antigos para o leitor estruturado', () => {
    const source = readFileSync('src/App.tsx', 'utf8');
    expect(source).toContain('function LegacyApostilaRedirect()');
    expect(source).toContain('`/reader/${id || \'\'}${location.search}${location.hash}`');
    expect(source).toContain('<Route path="/apostila/:id" element={<ProtectedRoute><LegacyApostilaRedirect /></ProtectedRoute>} />');
    expect(source).not.toContain("const ApostilaPage = lazy(() => import('@/pages/ApostilaPage'));");
  });
});
