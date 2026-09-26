import { describe, expect, it } from 'vitest';
import {
  buildRaEmail,
  isEmailIdentifier,
  isSpecialIdentifier,
  isValidEmail,
  isValidRa,
  normalizeIdentifier,
  normalizeRa,
} from '@/lib/login-identifiers';

describe('login identifiers', () => {
  it('normalizes RA with spaces, dots and hyphens', () => {
    expect(normalizeRa(' g-802.144 ')).toBe('G802144');
    expect(buildRaEmail('g-802.144')).toBe('g802144@ra.unip.local');
  });

  it('routes real e-mail identifiers to email auth', () => {
    expect(isEmailIdentifier('Aluno@Example.com')).toBe(true);
    expect(isValidEmail('Aluno@Example.com')).toBe(true);
    expect(isEmailIdentifier('g802144@ra.unip.local')).toBe(false);
  });

  it('preserves email punctuation while the user is still typing', () => {
    expect(normalizeIdentifier('vivi.')).toBe('vivi.');
    expect(normalizeIdentifier('nome.sobrenome+teste')).toBe('nome.sobrenome+teste');
    expect(normalizeIdentifier('nome_sobrenome')).toBe('nome_sobrenome');
  });

  it('accepts the supported RA format and rejects malformed values', () => {
    expect(isValidRa('G802144')).toBe(true);
    expect(isValidRa('A1234567')).toBe(true);
    expect(isValidRa('abc')).toBe(false);
    expect(isValidRa('G802144!')).toBe(false);
  });

  it('recognizes the legacy special identifier without case sensitivity', () => {
    expect(isSpecialIdentifier('Juliana')).toBe(true);
    expect(isSpecialIdentifier('DECOANALYTICS@OUTLOOK.COM.BR')).toBe(true);
    expect(isSpecialIdentifier('outro@empresa.com')).toBe(false);
  });
});
