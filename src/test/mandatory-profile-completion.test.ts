import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src/components/RANamePrompt.tsx'), 'utf8');

describe('optional profile completion', () => {
  it('does not block students with incomplete identity data', () => {
    expect(source).toContain('onOpenChange={setOpen}');
    expect(source).toContain('Agora não');
    expect(source).not.toContain('setOpen(true);');
  });

  it('requires a valid full name and a verified recovery email for RA accounts', () => {
    expect(source).toContain('normalizedName.split(" ").length >= 2');
    expect(source).toContain('supabase.auth.updateUser({ email: recoveryEmail })');
    expect(source).toContain('authStillUsesSyntheticEmail');
    expect(source).toContain('Já confirmei meu e-mail');
    expect(source).toContain('supabase.auth.refreshSession()');
  });
});
