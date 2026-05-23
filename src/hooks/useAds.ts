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

      // Buscamos TODOS os anúncios ativos. O filtro por ad_type é aplicado
      // depois no cliente — assim, se o admin só cadastrou anúncios "banner",
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
        // Se não houver anúncio do tipo pedido, faz fallback para todos
        validAds = matching.length > 0 ? matching : baseValid;
      }

      const withProxy = validAds.map((ad: any) => ({
        ...ad,
        image_url: toPromoMediaUrl(ad.image_url),
      }));
      setAds(withProxy);
    } catch (error) {
      console.error('Erro ao carregar anúncios:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordAdView = async (adId: string) => {
    try {
      const sessionId = sessionStorage.getItem('session_id') || `session_${Date.now()}`;
      if (!sessionStorage.getItem('session_id')) {
        sessionStorage.setItem('session_id', sessionId);
      }

      await supabase.from('ad_views').insert({
        ad_id: adId,
        user_id: user?.id || null,
        session_id: user ? null : sessionId,
      });
    } catch (error) {
      console.error('Erro ao registrar visualização de anúncio:', error);
    }
  };

  const recordAdClick = async (adId: string) => {
    try {
      const sessionId = sessionStorage.getItem('session_id') || `session_${Date.now()}`;
      if (!sessionStorage.getItem('session_id')) {
        sessionStorage.setItem('session_id', sessionId);
      }

      await supabase.from('ad_clicks').insert({
        ad_id: adId,
        user_id: user?.id || null,
        session_id: user ? null : sessionId,
      });
    } catch (error) {
      console.error('Erro ao registrar clique de anúncio:', error);
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
