import { ApostilaCoverCard } from '@/components/dashboard/ApostilaCoverCard';
import type { ApostilaSummary } from '@/hooks/queries/useDashboardData';

const SAMPLES = [
  { id: 'v1', title: 'Matemática e suas Tecnologias', category: 'ENEM', semester: 1 },
  { id: 'v2', title: 'Linguagens, Códigos e Redação', category: 'ENEM', semester: 2 },
  { id: 'v3', title: 'Ciências da Natureza — Química Orgânica Aplicada', category: 'ENEM', semester: 3 },
  { id: 'v4', title: 'Ciências Humanas — História do Brasil República', category: 'ENEM', semester: 4 },
] as unknown as ApostilaSummary[];

/**
 * Página de harness usada apenas pelos testes visuais (screenshot) por breakpoint.
 * Reproduz a mesma grade usada em SubjectPage / Dashboard.
 */
export default function CoverCardVisualPage() {
  return (
    <main className="min-h-screen bg-background px-2 py-4 sm:px-4">
      <div
        data-testid="cover-grid"
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
      >
        {SAMPLES.map((a) => (
          <ApostilaCoverCard key={a.id} apostila={a} />
        ))}
      </div>
    </main>
  );
}
