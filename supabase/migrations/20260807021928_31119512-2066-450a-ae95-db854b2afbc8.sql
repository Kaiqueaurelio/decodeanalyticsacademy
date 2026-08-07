
-- 1. Função para atualizar contadores de anúncios
CREATE OR REPLACE FUNCTION public.update_ad_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (TG_TABLE_NAME = 'ad_views') THEN
            UPDATE public.ads SET view_count = view_count + 1 WHERE id = NEW.ad_id;
        ELSIF (TG_TABLE_NAME = 'ad_clicks') THEN
            UPDATE public.ads SET click_count = click_count + 1 WHERE id = NEW.ad_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (TG_TABLE_NAME = 'ad_views') THEN
            UPDATE public.ads SET view_count = GREATEST(0, view_count - 1) WHERE id = OLD.ad_id;
        ELSIF (TG_TABLE_NAME = 'ad_clicks') THEN
            UPDATE public.ads SET click_count = GREATEST(0, click_count - 1) WHERE id = OLD.ad_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Gatilhos para ad_views
DROP TRIGGER IF EXISTS tr_ad_views_counter ON public.ad_views;
CREATE TRIGGER tr_ad_views_counter
AFTER INSERT OR DELETE ON public.ad_views
FOR EACH ROW EXECUTE FUNCTION public.update_ad_counters();

-- 3. Gatilhos para ad_clicks
DROP TRIGGER IF EXISTS tr_ad_clicks_counter ON public.ad_clicks;
CREATE TRIGGER tr_ad_clicks_counter
AFTER INSERT OR DELETE ON public.ad_clicks
FOR EACH ROW EXECUTE FUNCTION public.update_ad_counters();

-- 4. Sincronização retroativa: atualizar totais atuais baseados nos logs existentes
UPDATE public.ads a
SET 
  view_count = (SELECT count(*) FROM public.ad_views v WHERE v.ad_id = a.id),
  click_count = (SELECT count(*) FROM public.ad_clicks c WHERE c.ad_id = a.id);

-- 5. Garantir que o funil comercial (sponsor_leads) considere cliques passados
-- Inserir cliques passados de ad_clicks na tabela sponsor_leads como 'clique'
INSERT INTO public.sponsor_leads (company, contact_name, email, channel, source, cta_id, status, created_at)
SELECT 
    COALESCE(a.title, 'Anúncio Antigo'),
    'Visitante',
    'lead@decode.academy',
    'clique',
    'migration_sync',
    c.ad_id::text,
    'novo',
    c.created_at
FROM public.ad_clicks c
JOIN public.ads a ON c.ad_id = a.id
WHERE NOT EXISTS (
    SELECT 1 FROM public.sponsor_leads sl 
    WHERE sl.cta_id = c.ad_id::text AND sl.channel = 'clique' AND sl.created_at = c.created_at
);
