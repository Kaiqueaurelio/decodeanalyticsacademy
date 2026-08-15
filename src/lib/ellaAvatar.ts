import ellaAvatarBundled from "@/assets/ella-avatar-v4.png.asset.json";

/**
 * ELLA AVATAR IDENTITY SYSTEM - v5.7.2
 * v12: Correção crítica de sincronização. Purga total de cache v1-v11.
 * Cache-busting agressivo para garantir propagação instantânea.
 */
export const ELLA_AVATAR_STORAGE_KEY = 'decode_ella_avatar_url_v12';
const LEGACY_KEYS = [
  'decode_ella_avatar_url',
  'decode_ella_avatar_url_v2',
  'decode_ella_avatar_url_v3',
  'decode_ella_avatar_url_v4',
  'decode_ella_avatar_url_v5',
  'decode_ella_avatar_url_v6',
  'decode_ella_avatar_url_v7',
  'decode_ella_avatar_url_v8',
  'decode_ella_avatar_url_v9',
  'decode_ella_avatar_url_v10',
  'decode_ella_avatar_url_v11',
];

const getBaseAvatarUrl = () => {
  const bundledUrl = (ellaAvatarBundled as any).url;
  if (bundledUrl) return bundledUrl;
  return '/ella-avatar.png';
};

export const DEFAULT_ELLA_AVATAR = `${getBaseAvatarUrl()}?v=12&t=${Date.now()}`;
export const ELLA_AVATAR_FALLBACK = `/ella-avatar.png?v=12&t=${Date.now()}`;

if (typeof document !== 'undefined') {
  try {
    document.documentElement.style.setProperty('--ella-avatar-url', `url('${DEFAULT_ELLA_AVATAR}')`);
  } catch {}
}

const isValidHttp = (u: string) => /^https?:\/\//i.test(u);

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
    if (typeof window === 'undefined') return DEFAULT_ELLA_AVATAR;

    // Purga agressiva de chaves legadas
    for (const key of LEGACY_KEYS) {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    }

    const stored = localStorage.getItem(ELLA_AVATAR_STORAGE_KEY);
    
    // Se temos uma URL personalizada no storage, validamos
    if (stored && isValidHttp(stored) && isPortableUrl(stored)) {
      return stored;
    }
    
    // Caso contrário, removemos qualquer lixo e retornamos o padrão
    if (stored) {
      localStorage.removeItem(ELLA_AVATAR_STORAGE_KEY);
    }

    return DEFAULT_ELLA_AVATAR;
  } catch {
    return DEFAULT_ELLA_AVATAR;
  }
};
