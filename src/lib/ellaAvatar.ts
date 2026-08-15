import ellaAvatarBundled from "@/assets/ella-avatar-v3.png.asset.json";

// v7: retrato oficial da Ella (perfil circular com badge). Empacotado pelo Vite + cópia estática em /public
// para funcionar em qualquer host (Vercel, PWA, Capacitor).
export const ELLA_AVATAR_STORAGE_KEY = 'decode_ella_avatar_url_v7';
const LEGACY_KEYS = [
  'decode_ella_avatar_url',
  'decode_ella_avatar_url_v2',
  'decode_ella_avatar_url_v3',
  'decode_ella_avatar_url_v4',
];

export const DEFAULT_ELLA_AVATAR = (ellaAvatarBundled as any).url || '/ella-avatar.png';

// Fallback estático servido pelo próprio host (usado em onError das <img>).
export const ELLA_AVATAR_FALLBACK = '/ella-avatar.png';

// Expõe a URL do avatar como CSS var para pseudo-elementos (::before em AdsChatBuilder).
if (typeof document !== 'undefined') {
  try {
    document.documentElement.style.setProperty('--ella-avatar-url', `url('${DEFAULT_ELLA_AVATAR}')`);
  } catch {}
}

const isValidHttp = (u: string) => /^https?:\/\//i.test(u);

// URLs salvas apontando para hosts de preview/CDN interno quebram em outros
// domínios (ex.: Vercel). Só aceitamos storage do backend ou o próprio host.
const isPortableUrl = (u: string) => {
  try {
    const parsed = new URL(u);
    if (parsed.pathname.startsWith('/__l5e/')) return false;
    if (/lovableproject\.com$|lovable\.app$/i.test(parsed.hostname)) {
      return typeof window !== 'undefined' && parsed.origin === window.location.origin;
    }
    return true;
  } catch {
    return false;
  }
};

export const getEllaAvatarUrl = () => {
  try {
    LEGACY_KEYS.forEach((k) => localStorage.getItem(k) && localStorage.removeItem(k));
    const stored = localStorage.getItem(ELLA_AVATAR_STORAGE_KEY);
    if (stored && isValidHttp(stored) && isPortableUrl(stored)) return stored;
    if (stored && !isPortableUrl(stored)) localStorage.removeItem(ELLA_AVATAR_STORAGE_KEY);
    // Force new avatar if v6 is not set yet
    if (!stored) {
      localStorage.setItem(ELLA_AVATAR_STORAGE_KEY, DEFAULT_ELLA_AVATAR);
    }
    return DEFAULT_ELLA_AVATAR;
  } catch {
    return DEFAULT_ELLA_AVATAR;
  }
};
