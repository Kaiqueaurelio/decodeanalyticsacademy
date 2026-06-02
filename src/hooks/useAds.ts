import { useState, useEffect } from 'react';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
const supabase = supabaseTyped as any;
import { useAuth } from './useAuth';
import { toPromoMediaUrl } from '@/lib/promo-media';

export interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string;
  ad_type: 'banner' | 'popup' | 'inline' | 'sidebar' | 'footer';
  position: number;
  display_duration: number;
  view_count: number;
  click_count: number;
}

const viewedInSession = new Set<string>();
const clickedInFlight = new Set<string>();

function getSessionId() {
  const current = sessionStorage.getItem('session_id');
  if (current) return current;

  const next = `session_${Date.now()}`;
  sessionStorage.setItem('session_id', next);
  return next;
}

function isAbortLikeError(error: unknown) {
  const text = `${(error as any)?.name || ''} ${(error as any)?.message || ''}`.toLowerCase();
  return (
    text.includes('abort') ||
    text.includes('cancelled') ||
    text.includes('canceled') ||
    text.includes('failed to fetch') ||
    text.includes('networkerror')
  );
}

function sentenceCase(value: string) {
  const lower = value.toLocaleLowerCase('pt-BR');
  return lower.replace(/(^|[.!?]\s+)([a-záàâãéêíóôõúç])/g, (match) => match.toLocaleUpperCase('pt-BR'));
}

function cleanAdCopy(value: string | null | undefined, fallback = '') {
  if (!value) return fallback;

  let text = value
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, ' ')
    .replace(/[🎓🔥🚀✨⭐💥✅❌👉⚡📚🎯💡🏆]/g, ' ')
    .replace(/([a-záàâãéêíóôõúç])([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])/g, '$1 $2')
    .replace(/\b(domine|imperdivel|imperdível|incrivel|incrível|top|sensacional|promoção|promocao)\b/gi, '')
    .replace(/[!]{2,}/g, '.')
    .replace(/[?]{2,}/g, '?')
    .replace(/\s+/g, ' ')
    .trim();

  const letters = text.replace(/[^A-Za-zÁÀÂÃÉÊÍÓÔÕÚÇáàâãéêíóôõúç]/g, '');
  const uppercaseLetters = letters.replace(/[^A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/g, '');
  if (letters.length > 12 && uppercaseLetters.length / letters.length > 0.72) {
    text = sentenceCase(text);
  }

  return text || fallback;
}

function professionalizeAd(ad: any): Ad {
  const title = cleanAdCopy(ad.title, 'Oferta educacional');
  const description = cleanAdCopy(ad.description, null as any);

  return {
    ...ad,
    title,
    description,
    image_url: toPromoMediaUrl(ad.image_url),
  };
}

export function useAds(adType?: 'banner' | 'popup' | 'inline' | 'sidebar' | 'footer', targetPage?: string) {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAds();
  }, [adType, targetPage]);

  const loadAds = async () => {
    try {
      setLoading(true);

      // Buscamos TODOS os anuncios ativos. O filtro por ad_type e aplicado
      // depois no cliente; assim, se o admin so cadastrou anuncios "banner",
      // eles ainda servem como fallback para popup/sidebar/footer/inline.
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (error) throw error;

      const now = new Date();
      const baseValid = (data || []).filter((ad: any) => {
        if (ad.start_date && new Date(ad.start_date) > now) return false;
        if (ad.end_date && new Date(ad.end_date) < now) return false;
        if (targetPage && Array.isArray(ad.target_pages) && ad.target_pages.length > 0) {
          if (!ad.target_pages.includes('all') && !ad.target_pages.includes(targetPage)) return false;
        }
        return true;
      });

      let validAds = baseValid;
      if (adType) {
        const matching = baseValid.filter((ad: any) => ad.ad_type === adType);
        // Se nao houver anuncio do tipo pedido, faz fallback para todos
        validAds = matching.length > 0 ? matching : baseValid;
      }

      setAds(validAds.map(professionalizeAd));
    } catch (error) {
      if (!isAbortLikeError(error)) {
        console.error('Erro ao carregar anuncios:', error);
      }
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  const recordAdView = async (adId: string) => {
    const sessionId = getSessionId();
    const viewKey = `${user?.id || sessionId}:${adId}`;
    if (viewedInSession.has(viewKey)) return;
    viewedInSession.add(viewKey);

    try {
      await supabase.from('ad_views').insert({
        ad_id: adId,
        user_id: user?.id || null,
        session_id: user ? null : sessionId,
      });
    } catch (error) {
      if (!isAbortLikeError(error)) {
        console.error('Erro ao registrar visualizacao de anuncio:', error);
      }
    }
  };

  const recordAdClick = async (adId: string) => {
    const sessionId = getSessionId();
    const clickKey = `${user?.id || sessionId}:${adId}`;
    if (clickedInFlight.has(clickKey)) return;
    clickedInFlight.add(clickKey);

    try {
      await supabase.from('ad_clicks').insert({
        ad_id: adId,
        user_id: user?.id || null,
        session_id: user ? null : sessionId,
      });
    } catch (error) {
      if (!isAbortLikeError(error)) {
        console.error('Erro ao registrar clique de anuncio:', error);
      }
    } finally {
      window.setTimeout(() => clickedInFlight.delete(clickKey), 2500);
    }
  };

  return {
    ads,
    loading,
    recordAdView,
    recordAdClick,
    reloadAds: loadAds,
  };
}
