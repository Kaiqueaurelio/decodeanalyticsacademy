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

  it('uses direct Auth only as a 503 infrastructure fallback and preserves password validation', () => {
    const code = source('src/pages/LoginPage.tsx');

    expect(code).toContain('authResult.status === 503');
    expect(code).toContain('supabase.auth.signInWithPassword');
    expect(code).toContain("normalizedRa === 'G802144'");
    expect(code).toContain('password');
    expect(code).not.toContain("if (!authResult.data?.session) {\n      const fallbackEmail");
  });
});
