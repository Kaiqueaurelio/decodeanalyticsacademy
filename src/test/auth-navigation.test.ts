import { describe, expect, it } from 'vitest';
import { buildLoginRedirect, normalizePostLoginDestination } from '@/lib/auth-navigation';

describe('navegação após autenticação', () => {
  it('preserva um destino interno normal', () => {
    expect(normalizePostLoginDestination('/admin?tab=ads')).toBe('/admin?tab=ads');
    expect(buildLoginRedirect('/admin?tab=ads')).toBe('/login?next=%2Fadmin%3Ftab%3Dads');
  });

  it('remove camadas duplicadas de login e recupera o destino real', () => {
    expect(normalizePostLoginDestination('/login?next=%2Flogin%3Fnext%3D%252Fadmin%253Ftab%253Dads'))
      .toBe('/admin?tab=ads');
    expect(buildLoginRedirect('/login?next=%2Flogin%3Fnext%3D%252Fadmin%253Ftab%253Dads'))
      .toBe('/login?next=%2Fadmin%3Ftab%3Dads');
  });

  it('não permite login recursivo nem redirecionamento externo', () => {
    expect(buildLoginRedirect('/login')).toBe('/login');
    expect(normalizePostLoginDestination('/login?next=%2Flogin')).toBeNull();
    expect(normalizePostLoginDestination('//malicioso.example')).toBeNull();
    expect(normalizePostLoginDestination('https://malicioso.example')).toBeNull();
  });
});
