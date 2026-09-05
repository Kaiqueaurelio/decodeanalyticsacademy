import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('ads loading resilience', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/hooks/useAds.ts'), 'utf8');

  it('uses the validated Supabase endpoint instead of a possibly missing raw env value', () => {
    expect(source).toContain('`${SUPABASE_URL}/functions/v1/list-ads');
    expect(source).toContain('apikey: SUPABASE_PUBLISHABLE_KEY');
    expect(source).not.toContain('`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-ads');
  });

  it('reuses the central auth session without requesting another auth lock', () => {
    expect(source).toContain('getCurrentSession()');
    expect(source).not.toContain('supabase.auth.getSession()');
  });
});
