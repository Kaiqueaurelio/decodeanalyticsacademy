// Helper para evitar que ad-blockers bloqueiem imagens dos anúncios.
// Reescreve qualquer URL de Storage que aponte para os buckets de anúncios
// (especialmente caminhos contendo "/ads/") para passar pelo edge function
// `promo-media`, que tem um path neutro e não dispara filtros de bloqueio.

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '') || '';

export function toPromoMediaUrl(rawUrl?: string | null): string | null {
  const value = rawUrl?.trim();
  if (!value) return null;
  
  // Se for uma URL completa, tentamos normalizar se for do nosso domínio de storage
  if (value.startsWith('http')) {
    try {
      const url = new URL(value);
      // Se for do nosso Supabase Storage, tentamos o proxy se necessário
      const marker = '/storage/v1/object/public/';
      const idx = url.pathname.indexOf(marker);
      
      if (idx >= 0 && SUPABASE_URL && url.origin.includes(SUPABASE_URL.split('//')[1]?.split('.')[0])) {
        const storagePath = url.pathname.slice(idx + marker.length).replace(/^\/+/, '');
        const [bucket, ...rest] = storagePath.split('/');
        let path = rest.join('/');
        path = path.replace(/^(ads\/)+/, 'ads/');
        
        if (bucket === 'ads' || bucket === 'announcements') {
           return `${SUPABASE_URL}/functions/v1/promo-media?b=${encodeURIComponent(bucket)}&p=${encodeURIComponent(path)}`;
        }
      }
    } catch {
      return value;
    }
  }

  // Se não for URL mas for um path relativo conhecido
  if (value && !value.includes(':') && !value.startsWith('/') && !value.startsWith('.')) {
    if (SUPABASE_URL && (value.startsWith('ads/') || value.startsWith('announcements/') || value.startsWith('promos/'))) {
      const path = value.replace(/^(ads\/)+/, 'ads/');
      const bucket = path.startsWith('promos/') ? 'announcements' : (path.startsWith('announcements/') ? 'announcements' : 'ads');
      const cleanPath = path.replace(/^(announcements\/|promos\/|ads\/)/, '');
      const finalPath = bucket === 'ads' ? `ads/${cleanPath}` : (path.startsWith('promos/') ? `promos/${cleanPath}` : cleanPath);
      
      return `${SUPABASE_URL}/functions/v1/promo-media?b=${bucket}&p=${encodeURIComponent(finalPath)}`;
    }
  }

  return value;
}
