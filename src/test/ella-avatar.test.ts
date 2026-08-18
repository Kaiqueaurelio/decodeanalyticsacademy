import { beforeEach, describe, expect, it } from 'vitest';
import { ELLA_AVATAR_STORAGE_KEY, getEllaAvatarUrl } from '@/lib/ellaAvatar';

describe('Ella avatar URL stability', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns the same URL across repeated renders when the avatar did not change', () => {
    const first = getEllaAvatarUrl();
    const second = getEllaAvatarUrl();

    expect(first).toBe(second);
    expect(first).toContain('ella_v=18');
  });

  it('keeps a configured custom avatar stable', () => {
    const custom = 'https://example.com/ella-avatar.png?v=custom';
    localStorage.setItem(ELLA_AVATAR_STORAGE_KEY, custom);

    const first = getEllaAvatarUrl();
    const second = getEllaAvatarUrl();

    expect(first).toBe(second);
    expect(first).toContain('https://example.com/ella-avatar.png?v=custom');
    expect(first).toContain('ella_v=18');
  });
});
