import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getSafeNavigationUrl } from '@/lib/safe-navigation';

function source(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8').replace(/\r\n/g, '\n');
}

describe('security hardening regression guards', () => {
  it('keeps the one-off login maintenance endpoint closed by default', () => {
    const code = source('supabase/functions/fix-user-login/index.ts');

    expect(code).toContain("requireUser(req, corsHeaders, { requireAdmin: true })");
    expect(code).toContain("Deno.env.get(\"ENABLE_FIX_USER_LOGIN\") !== \"true\"");
    expect(code).toContain("status: 410");
  });

  it('keeps admin user creation behind the shared admin guard and scoped CORS', () => {
    const code = source('supabase/functions/admin-create-user/index.ts');

    expect(code).toContain("const corsHeaders = getCorsHeaders(req)");
    expect(code).toContain("requireUser(req, corsHeaders, { requireAdmin: true })");
    expect(code).not.toContain("getCorsHeaders(req), 'Content-Type'");
    expect(code).toContain("Não foi possível criar a conta.");
  });

  it('keeps answer RPCs on the separated answer table and the jsonb contract', () => {
    const sql = source('supabase/migrations/20260820060000_security_audit_and_login_rate_limit.sql');

    expect(sql).toContain('DROP FUNCTION IF EXISTS public.check_exercise_answer(uuid, text);');
    expect(sql).toContain('RETURNS jsonb');
    expect(sql).toContain('FROM public.exercise_answers ea');
    expect(sql).not.toContain('SELECT e.correct_answer');
    expect(sql).not.toContain('SELECT e.explanation');
    expect(sql).not.toContain('SELECT e.reference_answer');
  });

  it('does not expose ad audience counters in public ad payloads or fallback queries', () => {
    const edge = source('supabase/functions/list-ads/index.ts');
    const hook = source('src/hooks/useAds.ts');

    expect(edge).not.toContain('view_count, click_count');
    expect(hook).not.toContain(".select('*')");
    expect(hook).toContain('id,title,description,image_url,link_url,ad_type,position,display_duration');
  });

  it('routes dynamic ad links through the shared safe-navigation helper', () => {
    const popup = source('src/components/AdPopup.tsx');
    const banner = source('src/components/AdBanner.tsx');
    const sidebar = source('src/components/AdSidebar.tsx');
    const footer = source('src/components/AdFooterMobile.tsx');
    const persistent = source('src/components/PersistentAdSpot.tsx');

    for (const code of [popup, banner, sidebar, footer, persistent]) {
      expect(code).toContain('openSafeExternalUrl');
      expect(code).not.toContain("window.open(currentAd.link_url, '_blank', 'noopener,noreferrer')");
      expect(code).not.toContain("window.open(current.link_url, '_blank', 'noopener,noreferrer')");
    }
  });

  it('rejects unsafe navigation schemes before they reach a browser sink', () => {
    expect(getSafeNavigationUrl('javascript:alert(1)')).toBeNull();
    expect(getSafeNavigationUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(getSafeNavigationUrl('ftp://example.com/file')).toBeNull();
    expect(getSafeNavigationUrl('https://example.com/path')).toBe('https://example.com/path');
  });

  it('keeps Mermaid in strict mode and sanitizes generated SVG', () => {
    const mermaid = source('src/components/MermaidDiagram.tsx');
    expect(mermaid).toContain("securityLevel: 'strict'");
    expect(mermaid).toContain("DOMPurify.sanitize(svg");
    expect(mermaid).toContain("FORBID_TAGS: ['script', 'foreignObject']");
    expect(mermaid).not.toContain("securityLevel: 'loose'");
  });

  it('fails closed when admin authorization lacks the service role', () => {
    const guard = source('supabase/functions/_shared/auth-guard.ts');
    expect(guard).toContain('if (!SERVICE_ROLE)');
    expect(guard).not.toContain('SERVICE_ROLE || SUPABASE_ANON_KEY');
    expect(guard).toContain('Admin authorization is not configured');
  });

  it('does not bypass an enabled biometric lock', () => {
    const gate = source('src/components/BiometricLockGate.tsx');
    expect(gate).toContain('if (user && locked && isBiometricEnabled())');
    expect(gate).not.toContain('if (false && locked');
    expect(gate).not.toContain("sessionStorage.setItem(STORAGE_KEY, 'unlocked');\n\n    /*");
  });

  it('keeps cache invalidation aligned to the build without deleting user storage', () => {
    const html = source('index.html');
    const cacheBuster = source('src/lib/cacheBuster.ts');
    const vite = source('vite.config.ts');

    expect(html).not.toContain('localStorage.clear()');
    expect(cacheBuster).toContain("typeof __APP_COMMIT__ === 'string'");
    expect(cacheBuster).toContain('isObsoleteDecodeCache');
    expect(cacheBuster).not.toContain('.unregister()');
    expect(cacheBuster).not.toContain('window.location.reload');
    expect(vite).toContain('buildVersion,');
  });

  it('keeps Ella navigation inside the application instead of opening uncontrolled external tabs', () => {
    const builder = source('src/components/AdsChatBuilder.tsx');
    expect(builder).toContain('const PAGE_TARGETS');
    expect(builder).toContain("path: '/admin'");
    expect(builder).not.toContain('window.open(');
  });

  it('hardens the public technology news feed fetcher', () => {
    const techNews = source('supabase/functions/tech-news/index.ts');
    expect(techNews).toContain("import { isSafePublicUrl } from '../_shared/ssrf.ts';");
    expect(techNews).toContain("redirect: 'manual'");
    expect(techNews).toContain('MAX_FEED_BYTES');
    expect(techNews).toContain('isSafePublicUrl(link)');
    expect(techNews).not.toContain("redirect: 'follow'");
    expect(techNews).not.toContain('message: String(e)');
  });

  it('hardens admin content extraction from remote pages', () => {
    const extractor = source('supabase/functions/extract-content/index.ts');
    expect(extractor).toContain('fetchSafePublicPage');
    expect(extractor).toContain('MAX_REMOTE_BYTES');
    expect(extractor).toContain("redirect: 'manual'");
    expect(extractor).toContain("status: 413");
    expect(extractor).not.toContain('return url.includes("notion.site")');
  });

  it('hardens admin RSS validation', () => {
    const validator = source('supabase/functions/validate-rss/index.ts');
    expect(validator).toContain("import { isSafePublicUrl } from '../_shared/ssrf.ts';");
    expect(validator).toContain("redirect: 'manual'");
    expect(validator).toContain('MAX_XML_BYTES');
    expect(validator).toContain('.slice(0, 20)');
    expect(validator).not.toContain("redirect: 'follow'");
    expect(validator).not.toContain('error: String(e)');
  });

  it('bounds and validates promo-media uploads', () => {
    const edge = source('supabase/functions/promo-media/index.ts');
    expect(edge).toContain('MAX_IMAGE_BYTES = 5 * 1024 * 1024');
    expect(edge).toContain('ALLOWED_IMAGE_TYPES');
    expect(edge).toContain('isSafeFileName');
    expect(edge).toContain('FILE_SIGNATURES');
    expect(edge).toContain('Não foi possível enviar a imagem.');
    expect(edge).not.toContain('error: uploadError.message');
  });

  it('does not return internal extraction errors to the client', () => {
    const edge = source('supabase/functions/extract-content/index.ts');
    expect(edge).toContain('extract-content failed');
    expect(edge).toContain('Não foi possível extrair o conteúdo informado.');
    expect(edge).not.toContain('error: error instanceof Error ? error.message');
  });

  it('keeps remote article fetching bounded and private', () => {
    const reader = source('supabase/functions/news-reader/index.ts');
    expect(reader).toContain("redirect: 'manual'");
    expect(reader).toContain('MAX_HTML_BYTES');
    expect(reader).toContain('MAX_REDIRECTS');
    expect(reader).toContain("Cache-Control': 'private, no-store'");
    expect(reader).not.toContain("redirect: 'follow'");
    expect(reader).not.toContain("status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }");
  });

  it('routes material files through signed storage access', () => {
    const storage = source('supabase/migrations/20260920047000_make_materials_private.sql');
    const helper = source('src/lib/storage-access.ts');
    const image = source('src/components/ui/app-image.tsx');
    const widget = source('src/components/MaterialWidget.tsx');
    const mediaUpload = source('src/components/editor/RibbonMediaButton.tsx');

    expect(storage).toContain("UPDATE storage.buckets");
    expect(storage).toContain("WHERE id = 'materials';");
    expect(storage).toContain('SET public = false');
    expect(helper).toContain("createSignedUrl(path, expiresIn)");
    expect(helper).toContain('/storage/v1/object/public/');
    expect(image).toContain("createSignedStorageUrl(normalized, 'materials')");
    expect(image).not.toContain("const PUBLIC_IMAGE_BUCKETS = ['materials'");
    expect(widget).toContain("createSignedStorageUrl(material.file_url, 'materials')");
    expect(mediaUpload).toContain('file_path: path');
  });

  it('restricts content-scope lookups to the current user or an admin', () => {
    const sql = source('supabase/migrations/20260920046000_harden_content_scope_rpc.sql');
    expect(sql).toContain("IF auth.role() <> 'service_role'::text AND auth.uid() IS NULL THEN");
    expect(sql).toContain("_user_id <> auth.uid()");
    expect(sql).toContain("NOT public.has_role(auth.uid(), 'admin'::public.app_role)");
    expect(sql).toContain('REVOKE EXECUTE ON FUNCTION public.get_content_scope(uuid) FROM anon;');
  });

  it('blocks direct quiz-question table reads that expose answer keys', () => {
    const sql = source('supabase/migrations/20260920045000_lockdown_quiz_question_reads.sql');
    expect(sql).toContain('REVOKE SELECT ON public.quiz_questions FROM anon, authenticated;');
  });

  it('keeps audio quiz answers behind the safe question RPC', () => {
    const sql = source('supabase/migrations/20260820160000_quiz_question_surface_hardening.sql');
    expect(sql).toContain('REVOKE SELECT ON public.quiz_questions FROM anon, authenticated;');
    expect(sql).toContain('CREATE FUNCTION public.get_quiz_questions(_quiz_id uuid)');
    expect(sql).not.toContain('qq.correct_answer');
    expect(sql).not.toContain('qq.explanation');
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.get_quiz_questions(uuid) TO authenticated;');
  });

  it('keeps privileged functions on the shared guard and safe HTTP methods', () => {
    const deleteAccount = source('supabase/functions/delete-account/index.ts');
    const setPassword = source('supabase/functions/admin-set-password/index.ts');
    const exportData = source('supabase/functions/export-user-data/index.ts');

    for (const code of [deleteAccount, setPassword, exportData]) {
      expect(code).toContain('requireUser(req, corsHeaders');
      expect(code).toContain('req.method !== "POST"');
      expect(code).not.toContain('error: err.message');
      expect(code).not.toContain('error: (e as Error).message');
    }
    expect(setPassword).toContain('requireAdmin: true');
    expect(deleteAccount).toContain('body.confirmation !== "EXCLUIR"');
    const auditMigration = source('supabase/migrations/20260821230000_security_audit_rpc_hardening.sql');
    expect(auditMigration).toContain('SECURITY DEFINER');
    expect(auditMigration).toContain('VALUES (\n    auth.uid()');
    expect(auditMigration).toContain('REVOKE INSERT ON public.admin_audit_logs FROM authenticated;');
    expect(exportData).toContain('TABLE_COLUMNS');
    expect(exportData).toContain('Cache-Control": "private, no-store"');
    expect(exportData).not.toContain('.select("*")');
  });

  it('does not treat profile account_type as an administrative role', () => {
    const auth = source('src/hooks/useAuth.tsx');
    const sql = source('supabase/migrations/20260825050000_profile_admin_fields_hardening.sql');

    expect(auth).toContain(".from('user_roles').select('role')");
    expect(auth).toContain("supabase.rpc('has_role', { _user_id: userId, _role: 'admin' } as any)");
    expect(auth).toContain('const adminValue = adminRoleRes.data === true || Boolean(adminRes.data);');
    expect(auth).not.toContain("account_type === 'admin'");
    expect(sql).toContain('prevent_profile_admin_field_escalation');
    expect(sql).toContain("NEW.account_type IS DISTINCT FROM OLD.account_type");
    expect(sql).toContain("NEW.content_scope IS DISTINCT FROM OLD.content_scope");
    expect(sql).toContain("NEW.is_blocked IS DISTINCT FROM OLD.is_blocked");
    expect(sql).toContain("auth.role() <> 'service_role'");
    expect(sql).toContain("public.has_role(auth.uid(), 'admin'::app_role)");
  });

  it('keeps semantic search scoped to the authenticated user', () => {
    const edge = source('supabase/functions/semantic-search/index.ts');
    const sql = source('supabase/migrations/20260825043000_semantic_search_scope_hardening.sql');

    expect(edge).toContain('requireUser(req, getCorsHeaders(req))');
    expect(edge).toContain('SUPABASE_ANON_KEY');
    expect(edge).toContain('global: { headers: { Authorization: authorization || "" } }');
    expect(edge).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(edge).not.toContain('createClient(SUPABASE_URL, SERVICE_ROLE)');
    expect(edge).toContain('between 2 and 1000 characters');
    expect(edge).not.toContain('error: e.message');

    expect(sql).toContain('v_user_id uuid := auth.uid()');
    expect(sql).toContain("v_scope := public.get_content_scope(v_user_id)");
    expect(sql).toContain("v_is_admin := public.has_role(v_user_id, 'admin'::app_role)");
    expect(sql).toContain("a.category NOT IN ('ENEM', 'Simulados ENEM')");
    expect(sql).toContain("a.category IN ('ENEM', 'Simulados ENEM')");
    expect(sql).toContain('a.published = true');
    expect(sql).toContain('REVOKE EXECUTE ON FUNCTION public.match_semantic_content(vector, float, int) FROM PUBLIC, anon;');
  });

  it('does not re-open unauthenticated ad access through the client fallback', () => {
    const cors = source('supabase/functions/_shared/cors.ts');
    const edge = source('supabase/functions/list-ads/index.ts');
    const hook = source('src/hooks/useAds.ts');

    expect(cors).not.toContain("origin.endsWith('.lovable.app')");
    expect(edge).toContain('requireUser(req, corsHeaders)');
    expect(edge).toContain('select("is_blocked,content_scope")');
    expect(hook).toContain('res.status === 401 || res.status === 403 || !token');
    expect(hook).toContain('Mantém fallback somente para falhas transitórias');
    const auditComponent = source('src/components/admin/AdminUserManagement.tsx');
    expect(auditComponent).toContain('supabase.rpc');
    expect(auditComponent).toMatch(/supabase\.rpc[\s\S]{0,40}['"]log_admin_audit['"]/);
  });
  it('never authorizes an admin route from mutable local role cache', () => {
    const auth = source('src/hooks/useAuth.tsx');
    expect(auth).toContain('Nunca usamos o cache local como autorização');
    expect(auth).toContain('setIsAdmin(false);');
    expect(auth).toContain('setRoleChecked(false);');
    expect(auth).toContain('void checkRoles(nextUser.id);');
  });

  it('does not bypass RA rate limiting or email confirmation through a 401 fallback', () => {
    const login = source('src/pages/LoginPage.tsx');
    expect(login).toContain('authResult.status === 503');
    expect(login).toContain('authResult.status === 408');
    expect(login).toContain('authResult.status === 0');
    expect(login).not.toContain('authResult.status === 401');
    expect(login).toContain("code === 'email_not_confirmed'");
  });

  it('fails closed when admin user creation cannot persist profile or role', () => {
    const edge = source('supabase/functions/admin-create-user/index.ts');
    expect(edge).toContain('cleanup after profile failure failed');
    expect(edge).toContain('cleanup after role failure failed');
    expect(edge).toContain("return json({ error: 'Não foi possível concluir o cadastro do usuário.' }, 500);");
  });

  it('blocks anonymous role introspection at the database boundary', () => {
    const sql = source('supabase/migrations/20260920040000_lockdown_has_role_execution.sql');
    expect(sql).toContain("auth.role() <> 'service_role'::text and auth.uid() is null");
    expect(sql).toContain('revoke all on function public.has_role(uuid, public.app_role) from public, anon;');
    expect(sql).toContain('grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;');
  });

  it('hides weekly simulado answer keys from direct client reads', () => {
    const sql = source('supabase/migrations/20260920041000_lockdown_weekly_simulado_answer_columns.sql');
    expect(sql).toContain('revoke select on table public.weekly_simulado_answers from anon, authenticated;');
    expect(sql).toContain('question,');
    expect(sql).not.toContain('correct_answer,');
    expect(sql).not.toContain('explanation,');
  });

  it('keeps response photos private in storage', () => {
    const sql = source('supabase/migrations/20260920042000_make_response_photos_private.sql');
    expect(sql).toContain("set public = false");
    expect(sql).toContain('where id = \'respostas-foto\';');
    expect(sql).toContain('drop policy if exists "Public read access for respostas-foto"');
  });

  it('bounds and validates admin ad image uploads', () => {
    const edge = source('supabase/functions/admin-upload-ad-image/index.ts');
    expect(edge).toContain('MAX_IMAGE_BYTES = 5 * 1024 * 1024');
    expect(edge).toContain('ALLOWED_IMAGE_TYPES');
    expect(edge).toContain('isSafeFileName');
    expect(edge).toContain('FILE_SIGNATURES');
    expect(edge).toContain('Permission denied: admin only');
  });

  it('keeps weekly simulado grading and lifecycle server-side', () => {
    const page = source('src/pages/SimuladoPage.tsx');
    const generation = source('supabase/functions/generate-weekly-simulado/index.ts');
    const lifecycle = source('supabase/migrations/20260920030000_harden_weekly_simulado_lifecycle.sql');
    const reveal = source('supabase/migrations/20260920031000_harden_weekly_simulado_reveal.sql');
    const answer = source('supabase/migrations/20260920032000_harden_weekly_simulado_answer_rpc.sql');

    expect(page).toContain("supabase.functions.invoke('generate-weekly-simulado'");
    expect(page).toContain("supabase.rpc('finish_weekly_simulado'");
    expect(page).not.toContain(".from('weekly_simulado_answers' as any)\n        .insert");
    expect(page).not.toContain(".from('weekly_simulados').update");
    expect(generation).toContain('const restart = body?.restart === true;');
    expect(generation).toContain('weeklyExisting.status === "finished"');
    expect(lifecycle).toContain('REVOKE INSERT, UPDATE, DELETE ON public.weekly_simulado_answers FROM authenticated;');
    expect(lifecycle).toContain('CREATE OR REPLACE FUNCTION public.finish_weekly_simulado');
    expect(reveal).toContain('CREATE OR REPLACE FUNCTION public.get_simulado_answer_reveals');
    expect(answer).toContain("IF v_row.status <> 'in_progress' THEN");
    expect(answer).toContain("REVOKE ALL ON FUNCTION public.answer_simulado_question(uuid, text) FROM PUBLIC, anon;");
  });

  it('keeps book files private and resolved only through signed URLs', () => {
    const storage = source('supabase/migrations/20260920043000_make_books_private.sql');
    const api = source('src/modules/playbooks/api.ts');
    const reader = source('src/modules/playbooks/components/PlayBooksReader.tsx');
    expect(storage).toContain("set public = false");
    expect(storage).toContain("where id = 'books';");
    expect(storage).toContain('drop policy if exists "Books are publicly accessible"');
    expect(api).toContain("from('books').createSignedUrl(path, 3600)");
    expect(api).toContain(".from('books')");
    expect(api).toContain('createSignedUrls(entries.map((entry) => entry.path), 3600)');
    expect(reader).toContain('createBookSignedUrl(book.fileUrl)');
    expect(reader).not.toContain('url: book.fileUrl, withCredentials: false');
  });

  it('keeps gamification mutations behind server-side RPCs', () => {
    const hook = source('src/hooks/useGamification.tsx');
    const migration = source('supabase/migrations/20260920017000_harden_gamification_mutations.sql');
    expect(hook).toContain("supabase.rpc('record_study_streak'");
    expect(hook).toContain("supabase.rpc('award_badge'");
    expect(hook).not.toContain("from('study_streaks').upsert");
    expect(hook).not.toContain("from('user_badges').insert");
    expect(migration).toContain('revoke insert, update, delete on table public.user_xp from authenticated;');
    expect(migration).toContain('revoke insert, update, delete on table public.user_badges from authenticated;');
    expect(migration).toContain('revoke insert, update, delete on table public.study_streaks from authenticated;');
    expect(migration).toContain("America/Sao_Paulo");
  });

});
