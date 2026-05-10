import { useState, useEffect } from 'react';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
const supabase = supabaseTyped as any;
import { useAuth } from './useAuth';

export interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string;
  ad_type: 'banner' | 'popup' | 'inline';
  position: number;
  display_duration: number;
  view_count: number;
  click_count: number;
}

export function useAds(adType?: 'banner' | 'popup' | 'inline') {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAds();
  }, [adType]);

  const loadAds = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (adType) {
        query = query.eq('ad_type', adType);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtra anúncios por data de validade
      const now = new Date();
      const validAds = (data || []).filter((ad) => {
        if (ad.end_date && new Date(ad.end_date) < now) return false;
        return true;
      });

      setAds(validAds);
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
