import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src/components/RANamePrompt.tsx'), 'utf8');

describe('mandatory profile completion', () => {
  it('does not allow students to dismiss incomplete identity data', () => {
    expect(source).not.toContain('Lembrar depois');
    expect(source).not.toContain('ra_name_prompt_dismissed');
    expect(source).toContain('onEscapeKeyDown={(event) => event.preventDefault()}');
    expect(source).toContain('onPointerDownOutside={(event) => event.preventDefault()}');
  });

  it('requires a valid full name and a verified recovery email for RA accounts', () => {
    expect(source).toContain('normalizedName.split(" ").length >= 2');
    expect(source).toContain('supabase.auth.updateUser({ email: recoveryEmail })');
    expect(source).toContain('authStillUsesSyntheticEmail');
    expect(source).toContain('Já confirmei meu e-mail');
    expect(source).toContain('supabase.auth.refreshSession()');
  });
});
