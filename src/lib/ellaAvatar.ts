import ellaAvatarBundled from "@/assets/ella-avatar-v5.png";

/**
 * ELLA AVATAR IDENTITY SYSTEM - v5.9.2
 * v13: Sincronização global e purga agressiva de cache CDN/Local.
 */
export const ELLA_AVATAR_STORAGE_KEY = 'decode_ella_avatar_url_v15';
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
  'decode_ella_avatar_url_v14',
];

const getBaseAvatarUrl = () => {
  return ellaAvatarBundled as string;
};

// Removemos o timestamp fixo da constante para permitir que ele seja gerado no momento do uso,
// garantindo que cada carregamento seja "fresco" se necessário.
export const DEFAULT_ELLA_AVATAR = getBaseAvatarUrl();
export const ELLA_AVATAR_FALLBACK = DEFAULT_ELLA_AVATAR;

const isValidHttp = (u: string) => {
  if (!u) return false;
  // Aceita URLs relativas do Vite (/src/assets/...) ou URLs absolutas
  if (u.startsWith('/src/assets/')) return true;
  if (u.startsWith('data:')) return true;
  return /^https?:\/\//i.test(u);
};

const isPortableUrl = (u: string) => {
  if (!u) return false;
  try {
    // Se for URL de asset do Lovable/Vite, é válida
    if (u.startsWith('/src/assets/')) return true;
    if (u.startsWith('data:')) return true;
    
    const parsed = new URL(u, typeof window !== 'undefined' ? window.location.origin : undefined);
    if (parsed.pathname.startsWith('/__l5e/')) return true; // Permitir assets do Lovable Cloud
    if (/lovableproject\.com$|lovable\.app$/i.test(parsed.hostname)) {
      return true;
    }
    return true; // Ser mais permissivo para resolver o erro de exibição
  } catch {
    return u.startsWith('/') || u.startsWith('data:');
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

    // Adiciona cache busting v13 + timestamp único apenas se não for data URL ou asset local do Vite
    if (finalUrl.startsWith('data:') || finalUrl.startsWith('/src/assets/')) {
      return finalUrl;
    }
    const separator = finalUrl.includes('?') ? '&' : '?';
    return `${finalUrl}${separator}v=16&t=${Date.now()}`;
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
