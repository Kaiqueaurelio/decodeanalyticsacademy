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

  it('requires a valid full name and a recovery email for RA accounts', () => {
    expect(source).toContain('normalizedName.split(" ").length >= 2');
    expect(source).toContain('supabase.auth.updateUser({ email: recoveryEmail })');
    expect(source).toContain('authStillUsesSyntheticEmail');
    expect(source).toContain('Já confirmei meu e-mail');
    expect(source).toContain('supabase.auth.refreshSession()');
  });

  it('refreshes a stale Auth session and retries the email update once', () => {
    expect(source).toContain('if (authEmailError && isSessionError(authEmailError))');
    expect(source).toContain('({ data: authUpdate, error: authEmailError } = await supabase.auth.updateUser({ email: recoveryEmail }))');
    expect(source).toContain('temporarily indisponível');
  });

  it('keeps the saved profile and distinguishes duplicate email failures', () => {
    expect(source).toContain('isEmailAlreadyRegisteredError(authEmailError)');
    expect(source).toContain('Este e-mail já está vinculado a outra conta.');
    expect(source).toContain('O perfil foi salvo, mas não foi possível concluir o vínculo do e-mail. Tente novamente.');
    expect(source).toContain('console.error("RANamePrompt: recovery email update failed"');
  });

  it('does not change the RA login identifier', () => {
    expect(source).not.toContain('updateUser({ password:');
    expect(source).not.toContain('signUp(');
    expect(source).toContain('Você continuará entrando com o RA.');
  });
});
