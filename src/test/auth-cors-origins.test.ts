import { describe, expect, it } from 'vitest';
import { getCorsHeaders, isAllowedOrigin } from '../../supabase/functions/_shared/cors';

describe('origens publicadas para o login por RA', () => {
  it.each([
    'https://decodeanalyticsacademy.vercel.app',
    'https://decodeanalyticsacademy.lovable.app',
    'https://decodeanalyticsacademy.com.br',
  ])('autoriza o preflight de %s', (origin) => {
    const request = new Request('https://wxkkpjpqyrygglbuogsd.supabase.co/functions/v1/ra-auth', {
      method: 'OPTIONS',
      headers: { Origin: origin },
    });
    expect(getCorsHeaders(request)['Access-Control-Allow-Origin']).toBe(origin);
  });

  it('não autoriza um domínio Vercel alheio', () => {
    expect(isAllowedOrigin('https://unrelated.vercel.app')).toBe(false);
  });
});
