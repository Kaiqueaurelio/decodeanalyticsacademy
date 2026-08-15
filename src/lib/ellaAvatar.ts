import ellaAvatarBundled from "@/assets/ella-avatar-v4.png.asset.json";

/**
 * ELLA AVATAR IDENTITY SYSTEM - v5.6.3
 * v9: Retrato final consolidado (badge acadêmico ciano, fundo escuro).
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
  // Se for um build de produção no Lovable, o asset JSON tem a URL correta
  const bundledUrl = (ellaAvatarBundled as any).url;
  if (bundledUrl) return bundledUrl;
  
  // Fallback para desenvolvimento local ou se o asset falhar
  return '/ella-avatar.png';
};

export const DEFAULT_ELLA_AVATAR = `${getBaseAvatarUrl()}?v=12&t=${Date.now()}`;

// Fallback estático servido pelo próprio host
export const ELLA_AVATAR_FALLBACK = `/ella-avatar.png?v=12&t=${Date.now()}`;

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
    if (typeof window === 'undefined') return DEFAULT_ELLA_AVATAR;

    // Limpeza profunda de chaves legadas e v11
    LEGACY_KEYS.forEach((k) => {
      if (localStorage.getItem(k)) {
        localStorage.removeItem(k);
      }
    });

    const stored = localStorage.getItem(ELLA_AVATAR_STORAGE_KEY);
    
    // Se temos uma URL válida e ela é portátil/segura, usamos ela
    if (stored && isValidHttp(stored) && isPortableUrl(stored)) return stored;
    
    // Se a URL armazenada for inválida ou insegura, removemos
    if (stored && !isPortableUrl(stored)) {
      localStorage.removeItem(ELLA_AVATAR_STORAGE_KEY);
    }

    // Se não há nada no storage, ou se limpamos, garantimos que o padrão esteja lá
    // Mas retornamos a URL padrão COM cache busting para garantir carregamento.
    return DEFAULT_ELLA_AVATAR;
  } catch {
    return DEFAULT_ELLA_AVATAR;
  }
};
