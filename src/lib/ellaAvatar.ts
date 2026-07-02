import ellaAvatarAsset from "@/assets/ella-ribeiro-avatar.jpg.asset.json";

// v2: bumped to invalidate stale/broken overrides saved during earlier iterations.
export const ELLA_AVATAR_STORAGE_KEY = 'decode_ella_avatar_url_v2';
const LEGACY_KEY = 'decode_ella_avatar_url';

export const DEFAULT_ELLA_AVATAR = ellaAvatarAsset.url;

const isValidHttpOrAsset = (u: string) =>
  /^https?:\/\//i.test(u) || u.startsWith('/__l5e/') || u.startsWith('/');

export const getEllaAvatarUrl = () => {
  try {
    // Clean legacy key (may hold stale/broken URL)
    if (localStorage.getItem(LEGACY_KEY)) {
      localStorage.removeItem(LEGACY_KEY);
    }
    const stored = localStorage.getItem(ELLA_AVATAR_STORAGE_KEY);
    if (stored && isValidHttpOrAsset(stored)) return stored;
    return DEFAULT_ELLA_AVATAR;
  } catch {
    return DEFAULT_ELLA_AVATAR;
  }
};
