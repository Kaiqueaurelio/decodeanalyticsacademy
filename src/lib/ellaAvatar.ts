import ellaAvatarBundled from "@/assets/ella-avatar-v4.png.asset.json";

/**
 * ELLA AVATAR IDENTITY SYSTEM - v5.9.2
 * v13: Sincronização global e purga agressiva de cache CDN/Local.
 */
export const ELLA_AVATAR_STORAGE_KEY = 'decode_ella_avatar_url_v14';
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
  'decode_ella_avatar_url_v12',
  'decode_ella_avatar_url_v13',
];

const LOVABLE_ASSET_ORIGIN = 'https://decodeanalyticsacademy.lovable.app';

const getBaseAvatarUrl = () => {
  const bundledUrl = String((ellaAvatarBundled as any).url || '');
  // Assets /__l5e são relativos ao Lovable e quebravam na Vercel.
  if (bundledUrl.startsWith('/__l5e/')) return `${LOVABLE_ASSET_ORIGIN}${bundledUrl}`;
  if (bundledUrl) return bundledUrl;
  return `${LOVABLE_ASSET_ORIGIN}/__l5e/assets-v1/2f751895-a6a4-4faa-865d-22d187123c1d/ella-avatar-v4.png`;
};

// Removemos o timestamp fixo da constante para permitir que ele seja gerado no momento do uso,
// garantindo que cada carregamento seja "fresco" se necessário.
export const DEFAULT_ELLA_AVATAR = getBaseAvatarUrl();
export const ELLA_AVATAR_FALLBACK = DEFAULT_ELLA_AVATAR;

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
    
    let finalUrl = DEFAULT_ELLA_AVATAR;
    
    // Se temos uma URL personalizada no storage, validamos
    if (stored && isValidHttp(stored) && isPortableUrl(stored)) {
      finalUrl = stored;
    } else if (stored) {
      localStorage.removeItem(ELLA_AVATAR_STORAGE_KEY);
    }

    // Adiciona cache busting v13 + timestamp único
    const separator = finalUrl.includes('?') ? '&' : '?';
    return `${finalUrl}${separator}v=13&t=${Date.now()}`;
  } catch {
    return `${DEFAULT_ELLA_AVATAR}?v=13&t=${Date.now()}`;
  }

};

// Expõe a URL do avatar como CSS var para pseudo-elementos
if (typeof document !== 'undefined') {
  try {
    document.documentElement.style.setProperty('--ella-avatar-url', `url('${getEllaAvatarUrl()}')`);
  } catch {}
}
