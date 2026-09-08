import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const dashboard = readFileSync('src/components/AdminDashboard.tsx', 'utf8');

describe('admin command shortcuts', () => {
  it('offers common workflows directly from the command center', () => {
    expect(dashboard).toContain('Adicionar arquivo ou mídia');
    expect(dashboard).toContain("onNavigate('materials')");
    expect(dashboard).toContain('Publicar um aviso');
    expect(dashboard).toContain("onNavigate('announcements')");
    expect(dashboard).toContain('Agendar prova ou evento');
    expect(dashboard).toContain("onNavigate('calendar')");
  });
});
