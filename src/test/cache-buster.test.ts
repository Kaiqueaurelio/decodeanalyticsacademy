import { describe, expect, it } from 'vitest';
import { isObsoleteDecodeCache } from '@/lib/cacheBuster';

describe('limpeza segura de caches do PWA', () => {
  it('identifica caches de runtime v4 e v5 como obsoletos', () => {
    expect(isObsoleteDecodeCache('decode-html-v4')).toBe(true);
    expect(isObsoleteDecodeCache('decode-scripts-v5')).toBe(true);
    expect(isObsoleteDecodeCache('decode-css-v5')).toBe(true);
    expect(isObsoleteDecodeCache('decode-images-v4')).toBe(true);
  });

  it('preserva a geração atual e versões futuras', () => {
    expect(isObsoleteDecodeCache('decode-scripts-v6')).toBe(false);
    expect(isObsoleteDecodeCache('decode-images-v7')).toBe(false);
  });

  it('não remove caches que não pertencem ao runtime do app', () => {
    expect(isObsoleteDecodeCache('workbox-precache-v2')).toBe(false);
    expect(isObsoleteDecodeCache('supabase-session-cache')).toBe(false);
    expect(isObsoleteDecodeCache('decode-content-v5')).toBe(false);
  });
});
