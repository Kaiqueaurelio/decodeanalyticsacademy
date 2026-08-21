import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('admin security copy and dashboard contract guards', () => {
  it('uses one canonical security copy in every security-facing admin surface', () => {
    const copy = source('src/lib/security-copy.ts');
    const nav = source('src/config/adminNav.ts');
    const adminPage = source('src/pages/AdminPage.tsx');
    const alerts = source('src/components/admin/SecurityAlertsPanel.tsx');
    const academicAudit = source('src/components/admin/AcademicAuditPanel.tsx');

    expect(copy).toContain("navigationDescription: 'Alertas, bloqueios e auditoria de permissões.'");
    expect(copy).toContain("pageDescription: 'O servidor bloqueia ações sem permissão e registra cada tentativa para auditoria.'");
    expect(copy).toContain("academicAuditDescription: 'Acessos autorizados e recusados a gabaritos, respostas e submissões ficam registrados para auditoria.'");
    expect(nav).toContain('SECURITY_COPY.navigationDescription');
    expect(nav).toContain('SECURITY_COPY.academicAuditDescription');
    expect(adminPage).toContain('SECURITY_COPY.pageDescription');
    expect(adminPage).toContain('SECURITY_COPY.academicAuditDescription');
    expect(alerts).toContain('SECURITY_COPY.alertsDescription');
    expect(academicAudit).toContain('SECURITY_COPY.academicAuditDescription');
  });

  it('does not retain the obsolete admin-login error copy', () => {
    const files = [
      'src/hooks/useAuth.tsx',
      'src/pages/LoginPage.tsx',
      'src/pages/ResetPasswordPage.tsx',
      'src/components/study-plan/EllaPlanSuggestions.tsx',
      'src/pages/PlanoEstudosPage.tsx',
    ];
    const legacy = 'De modo algum, mesmo que eu digite a minha senha de administrador';
    for (const file of files) expect(source(file)).not.toContain(legacy);
  });

  it('keeps every administrative route behind the admin-only guard', () => {
    const app = source('src/App.tsx');
    expect(app).toContain('<Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />');
    expect(app).toContain('<Route path="/admin/apostilas/:id" element={<ProtectedRoute adminOnly><AdminApostilaWorkbench /></ProtectedRoute>} />');
    expect(app).toContain('<Route path="/admin/biblioteca" element={<ProtectedRoute adminOnly><AdminBibliotecaPage /></ProtectedRoute>} />');
  });

  it('waits for role verification and redirects non-admin users', () => {
    const guard = source('src/components/ProtectedRoute.tsx');
    expect(guard).toContain('(user && !roleChecked)');
    expect(guard).toContain('if (!isAdmin) return <Navigate to="/dashboard" replace />;');
    expect(guard).toContain('if (isBlocked)');
  });

  it('keeps Dashboard RPC responses on the generated Json contract', () => {
    const hook = source('src/hooks/queries/useDashboardData.ts');
    expect(hook).toContain("supabase.rpc('get_exercise_counts')");
    expect(hook).toContain("supabase.rpc('get_dashboard_stats'");
    expect(hook).toContain('function isJsonObject');
    expect(hook).toContain('function toFiniteNumber');
    expect(hook).not.toContain("get_exercise_counts' as any");
    expect(hook).not.toContain("get_dashboard_stats' as any");
  });

  it('keeps placeholder rows compatible with ApostilaSummary', () => {
    const page = source('src/pages/DashboardPage.tsx');
    expect(page).toContain('const placeholders: ApostilaSummary[]');
    expect(page).toContain('saved_date: null');
    expect(page).toContain('return sortByPreference([...list, ...placeholders]);');
    expect(page).not.toContain('as unknown as ApostilaSummary[]');
  });
});
