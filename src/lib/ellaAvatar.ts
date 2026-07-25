import ellaAvatarBundled from "@/assets/ella-avatar.jpg";

// v4: novo retrato oficial da Ella empacotado pelo Vite (web, PWA e Capacitor).
export const ELLA_AVATAR_STORAGE_KEY = 'decode_ella_avatar_url_v4';
const LEGACY_KEYS = ['decode_ella_avatar_url', 'decode_ella_avatar_url_v2', 'decode_ella_avatar_url_v3'];

export const DEFAULT_ELLA_AVATAR = ellaAvatarBundled as string;

// Expõe a URL do avatar como CSS var para pseudo-elementos (::before em AdsChatBuilder).
if (typeof document !== 'undefined') {
  try {
    document.documentElement.style.setProperty('--ella-avatar-url', `url('${DEFAULT_ELLA_AVATAR}')`);
  } catch {}
}

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
