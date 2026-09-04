import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthRequestTimeout, fetchAuthResponse } from '@/lib/auth-request';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('authentication request deadline', () => {
  it('keeps server status and rate limit responses intact', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'blocked' }), { status: 429 }));
    vi.stubGlobal('fetch', fetchMock);
    const { response, body } = await fetchAuthResponse('/auth', { method: 'POST' });
    expect(response.status).toBe(429);
    expect(body.error).toBe('blocked');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('aborts a stalled request without retrying', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    vi.stubGlobal('fetch', fetchMock);
    const assertion = expect(fetchAuthResponse('/auth', {}, 50)).rejects.toBeInstanceOf(AuthRequestTimeout);
    await vi.advanceTimersByTimeAsync(50);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('also bounds a stalled response body', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(async (_url, init) => ({
      json: () => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')))),
    })));
    const assertion = expect(fetchAuthResponse('/auth', {}, 50)).rejects.toBeInstanceOf(AuthRequestTimeout);
    await vi.advanceTimersByTimeAsync(50);
    await assertion;
  });
});
