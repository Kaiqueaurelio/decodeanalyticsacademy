import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('ra-auth resilience guards', () => {
  it('does not turn an unavailable rate-limit RPC into a global login outage', () => {
    const code = source('supabase/functions/ra-auth/index.ts');

    expect(code).toContain('if (rateLimitError) {');
    expect(code).toContain('console.error("ra-auth rate limit check:", rateLimitError.message);');
    expect(code).toContain('if (!rateLimitError && rateLimit?.allowed === false) {');
    expect(code).not.toContain('return json({ error: "Serviço indisponível no momento." }, 503, corsHeaders);');
  });

  it('keeps persistent lockout enforcement when the rate-limit RPC is available', () => {
    const code = source('supabase/functions/ra-auth/index.ts');

    expect(code).toContain('status: 429');
    expect(code).toContain('Retry-After');
    expect(code).toContain('auth_rate_limit_record');
  });

  it('uses direct Auth only for safe infrastructure or known-identifier fallbacks and preserves password validation', () => {
    const code = source('src/pages/LoginPage.tsx');

    expect(code).toContain('authResult.status === 503');
    expect(code).toContain('authResult.status === 0');
    expect(code).toContain("authResult.status === 401 && (isEmail || normalizedRa === 'G802144')");
    expect(code).toContain('authResult.status !== 429');
    expect(code).toContain('supabase.auth.signInWithPassword');
    expect(code).toContain("normalizedRa === 'G802144'");
    expect(code).toContain('password');
    expect(code).toContain('const MAX_LOGIN_ATTEMPTS = 5;');
    expect(code).toContain('registerLoginFailure(isEmail ? false : true, message);');
    expect(code).not.toContain('if (message) toast.error(message);');
    expect(code).not.toContain("if (!authResult.data?.session) {\n      const fallbackEmail");
  });

  it('opens the student dashboard by default and never restores a persisted admin route', () => {
    const code = source('src/pages/LoginPage.tsx');

    expect(code).toContain("navigate(validLastRoute ? lastRoute : '/dashboard', { replace: true });");
    expect(code).toContain("!lastRoute.startsWith('/admin')");
    expect(code).not.toContain("validLastRoute ? lastRoute : isAdmin ? '/admin' : '/dashboard'");
  });
});
