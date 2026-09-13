import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('ra-auth resilience guards', () => {
  it('resolves RA login through the linked Auth identity and never falls back to a contact email', () => {
    const code = source('supabase/functions/ra-auth/index.ts');
    expect(code).toContain('.from("profiles")');
    expect(code).toContain('.select("user_id,email,ra")');
    expect(code).toContain('.eq("ra", identifier)');
    expect(code).toContain('admin.auth.admin.getUserById(profile.user_id)');
    expect(code).toContain('resolvedEmail = authUser?.user?.email || null;');
    expect(code).not.toContain('profile?.email?.includes("@")');
  });

  it('does not turn an unavailable rate-limit RPC into a global login outage', () => {
    const code = source('supabase/functions/ra-auth/index.ts');
    expect(code).toContain('admin.rpc("auth_rate_limit_check"');
    expect(code).toContain('console.error("ra-auth rate limit check:", error.message);');
    expect(code).toContain('if (!error && data?.allowed === false)');
    expect(code).toContain('catch (e) { console.error("ra-auth rate limit unavailable", e); }');
  });

  it('keeps persistent lockout enforcement when the rate-limit RPC is available', () => {
    const code = source('supabase/functions/ra-auth/index.ts');
    expect(code).toContain('}, 429, {');
    expect(code).toContain('"Retry-After"');
    expect(code).toContain('auth_rate_limit_record');
  });

  it('pins RA auth to the production Supabase project and preserves password validation', () => {
    const code = source('supabase/functions/ra-auth/index.ts');
    expect(code).toContain('const ACTIVE_PROJECT_URL = "https://wxkkpjpqyrygglbuogsd.supabase.co";');
    expect(code).toContain('if (SUPABASE_URL !== ACTIVE_PROJECT_URL)');
    expect(code).toContain('const ACTIVE_PROJECT_PUBLIC_KEY = "sb_publishable_Zh6H3y8GJ2J_wkRVXxyTng_eylbCAVM";');
    expect(code).toContain('authClient.auth.signInWithPassword');
    expect(code).toContain('password');
  });

  it('uses direct Auth only for safe infrastructure or known-identifier fallbacks and preserves password validation', () => {
    const code = source('src/pages/LoginPage.tsx');
    expect(code).toContain('authResult.status === 503');
    expect(code).toContain('authResult.status === 0');
    expect(code).toContain("authResult.status === 401 && (isEmail || isValidRa(normalizedRa) || normalizedRa === 'G802144')");
    expect(code).toContain('authResult.status !== 429');
    expect(code).toContain('supabase.auth.signInWithPassword');
    expect(code).toContain("normalizedRa === 'G802144'");
    expect(code).toContain('password');
    expect(code).toContain('const MAX_LOGIN_ATTEMPTS = 5;');
    expect(code).toContain('registerLoginFailure(isEmail ? false : true, message);');
    expect(code).not.toContain('if (message) toast.error(message);');
  });

  it('opens the student dashboard by default and never restores a persisted admin route', () => {
    const code = source('src/pages/LoginPage.tsx');
    expect(code).toContain("navigate(validLastRoute ? lastRoute : '/dashboard', { replace: true });");
    expect(code).toContain("!lastRoute.startsWith('/admin')");
    expect(code).not.toContain("validLastRoute ? lastRoute : isAdmin ? '/admin' : '/dashboard'");
  });

  it('keeps the independent-platform recovery copy free of external portal guidance', () => {
    const code = source('src/pages/LoginPage.tsx');
    expect(code).toContain('Fale com o suporte da plataforma para recuperar seu RA.');
    expect(code).not.toContain('Consulte o portal acadêmico');
  });
});
