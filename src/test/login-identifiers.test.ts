import { describe, expect, it } from 'vitest';
import {
  buildRaEmail,
  isEmailIdentifier,
  isSpecialIdentifier,
  isValidEmail,
  isValidRa,
  normalizeEmail,
  normalizeRa,
} from '@/lib/login-identifiers';

describe('login identifiers', () => {
  it('normalizes RA with spaces, dots and hyphens', () => {
    expect(normalizeRa(' g-802.144 ')).toBe('G802144');
    expect(buildRaEmail('g-802.144')).toBe('g802144@ra.unip.local');
  });

  it('normalizes valid e-mails using only trim and lowercase', () => {
    const cases = [
      ['vivi.viick@gmail.com', 'vivi.viick@gmail.com'],
      ['Vivi.Viick@GMAIL.COM', 'vivi.viick@gmail.com'],
      ['  vivi.viick@gmail.com', 'vivi.viick@gmail.com'],
      ['vivi+teste@gmail.com', 'vivi+teste@gmail.com'],
      ['joao.silva@hotmail.com', 'joao.silva@hotmail.com'],
      ['maria.eduarda@outlook.com', 'maria.eduarda@outlook.com'],
      ['nome_sobrenome@gmail.com', 'nome_sobrenome@gmail.com'],
      ['nome-sobrenome@gmail.com', 'nome-sobrenome@gmail.com'],
      ['nome.sobrenome+recuperacao@gmail.com', 'nome.sobrenome+recuperacao@gmail.com'],
    ] as const;

    for (const [input, expected] of cases) {
      expect(normalizeEmail(input)).toBe(expected);
      expect(normalizeEmail(input).includes('.')).toBe(expected.includes('.'));
    }
  });

  it('preserves dots and other valid local-part characters while typing', () => {
    const partialInputs = [
      'vivi.',
      'vivi+teste',
      'nome.sobrenome',
      'nome_sobrenome',
      'nome-sobrenome',
    ];

    for (const input of partialInputs) {
      expect(isEmailIdentifier(input)).toBe(true);
      expect(normalizeEmail(input)).toBe(input.toLowerCase());
    }
  });

  it('does not classify formatted RA input as an e-mail candidate', () => {
    expect(isEmailIdentifier('G-802.144')).toBe(false);
    expect(isEmailIdentifier('G802.144')).toBe(false);
    expect(normalizeRa('G-802.144')).toBe('G802144');
  });

  it('preserves dots in the local-part exactly', () => {
    expect(normalizeEmail('Vivi.Viick@Gmail.com')).toBe('vivi.viick@gmail.com');
    expect(normalizeEmail('joao.silva@hotmail.com')).toBe('joao.silva@hotmail.com');
    expect(normalizeEmail('maria.eduarda@outlook.com')).toBe('maria.eduarda@outlook.com');
  });

  it('routes real e-mail identifiers to email auth', () => {
    expect(isEmailIdentifier('Aluno@Example.com')).toBe(true);
    expect(isValidEmail('Aluno@Example.com')).toBe(true);
    expect(isEmailIdentifier('g802144@ra.unip.local')).toBe(false);
  });

  it('requires a complete address for final e-mail validation', () => {
    expect(isValidEmail('vivi.')).toBe(false);
    expect(isValidEmail('vivi.viick@gmail.com')).toBe(true);
    expect(isValidEmail('vivi+teste@gmail.com')).toBe(true);
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
