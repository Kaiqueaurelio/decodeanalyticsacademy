// Helper para evitar que ad-blockers bloqueiem imagens dos anúncios.
// Reescreve qualquer URL de Storage que aponte para os buckets de anúncios
// (especialmente caminhos contendo "/ads/") para passar pelo edge function
// `promo-media`, que tem um path neutro e não dispara filtros de bloqueio.

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '') || '';

export function toPromoMediaUrl(rawUrl?: string | null): string | null {
  const value = rawUrl?.trim();
  if (!value) return null;
  if (!SUPABASE_URL) return value;

  // Já está passando pelo proxy.
  if (value.includes('/functions/v1/promo-media')) return value;

  // data:/blob: — devolve como está.
  if (/^(data:|blob:)/i.test(value)) return value;

  try {
    const url = value.startsWith('http') ? new URL(value) : null;

    // Caminho de Storage público: extrair bucket/path.
    if (url) {
      const marker = '/storage/v1/object/public/';
      const idx = url.pathname.indexOf(marker);
      if (idx >= 0) {
        const storagePath = url.pathname.slice(idx + marker.length).replace(/^\/+/, '');
        const [bucket, ...rest] = storagePath.split('/');
        let path = rest.join('/');
        // Normaliza duplicações tipo "ads/ads/..."
        path = path.replace(/^(ads\/)+/, 'ads/');
        if (!bucket || !path) return value;
        if (bucket !== 'ads' && bucket !== 'announcements') return value;
        return `${SUPABASE_URL}/functions/v1/promo-media?b=${encodeURIComponent(bucket)}&p=${encodeURIComponent(path)}`;
      }
      return value;
    }

    // Caminho relativo cru (ex.: "ads/xxx.png" ou "promos/xxx.png").
    const path = value.replace(/^\/+/, '').replace(/^(ads\/)+/, 'ads/');
    const bucket = path.startsWith('promos/') ? 'announcements' : 'ads';
    return `${SUPABASE_URL}/functions/v1/promo-media?b=${bucket}&p=${encodeURIComponent(path)}`;
  } catch {
    return value;
  }
}
