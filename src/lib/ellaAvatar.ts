import ellaAvatarBundled from "@/assets/ella-avatar.jpg";

// v3: usa asset empacotado pelo Vite (funciona em web, PWA e Capacitor).
export const ELLA_AVATAR_STORAGE_KEY = 'decode_ella_avatar_url_v3';
const LEGACY_KEYS = ['decode_ella_avatar_url', 'decode_ella_avatar_url_v2'];

export const DEFAULT_ELLA_AVATAR = ellaAvatarBundled as string;

const isValidHttp = (u: string) => /^https?:\/\//i.test(u);

export const getEllaAvatarUrl = () => {
  try {
    LEGACY_KEYS.forEach((k) => localStorage.getItem(k) && localStorage.removeItem(k));
    const stored = localStorage.getItem(ELLA_AVATAR_STORAGE_KEY);
    // Só aceita URLs http(s) absolutas em storage; caminhos relativos /__l5e/
    // quebram em Capacitor/PWA, então caímos no bundle.
    if (stored && isValidHttp(stored)) return stored;
    return DEFAULT_ELLA_AVATAR;
  } catch {
    return DEFAULT_ELLA_AVATAR;
  }
};
