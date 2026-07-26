import { supabase } from '@/integrations/supabase/client';

export type SponsorLeadChannel = 'whatsapp' | 'email' | 'copia' | 'clique';

export type SponsorCampaign = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

export type SponsorLeadInput = {
  company?: string | null;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
  site?: string | null;
  plan?: string | null;
  goal?: string | null;
  period?: string | null;
  budget?: string | null;
  notes?: string | null;
  channel: SponsorLeadChannel;
  source?: string;
  /** Identificador exato do botão clicado, ex.: "landing-plano-master-whatsapp". */
  ctaId?: string;
};

const NOT_INFORMED = 'Não informado';
const CAMPAIGN_KEY = 'sponsor:campaign';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

const EMPTY_CAMPAIGN: SponsorCampaign = {
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
};

function clean(value: string | null | undefined): string | null {
  const v = (value ?? '').trim();
  return v ? v.slice(0, 120) : null;
}

/**
 * Lê UTMs da URL atual e guarda na sessão, para que o clique feito
 * páginas depois continue atribuído à campanha de origem.
 */
export function captureCampaign(): SponsorCampaign {
  if (typeof window === 'undefined') return EMPTY_CAMPAIGN;
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl: SponsorCampaign = { ...EMPTY_CAMPAIGN };
    let found = false;
    for (const key of UTM_KEYS) {
      const value = clean(params.get(key));
      if (value) {
        fromUrl[key] = value;
        found = true;
      }
    }
    if (found) {
      if (!fromUrl.utm_source) fromUrl.utm_source = clean(document.referrer) ?? 'direto';
      sessionStorage.setItem(CAMPAIGN_KEY, JSON.stringify(fromUrl));
      return fromUrl;
    }
    const stored = sessionStorage.getItem(CAMPAIGN_KEY);
    if (stored) return { ...EMPTY_CAMPAIGN, ...(JSON.parse(stored) as SponsorCampaign) };
    const referrer = clean(document.referrer);
    return referrer
      ? { ...EMPTY_CAMPAIGN, utm_source: referrer, utm_medium: 'referral' }
      : { ...EMPTY_CAMPAIGN, utm_source: 'direto', utm_medium: 'organico' };
  } catch {
    return EMPTY_CAMPAIGN;
  }
}

/**
 * Registra um interesse (ou apenas um clique) de patrocínio.
 * Falha em silêncio: nunca deve bloquear o envio do briefing pelo anunciante.
 */
export async function recordSponsorLead(input: SponsorLeadInput): Promise<void> {
  try {
    const campaign = captureCampaign();
    await supabase.from('sponsor_leads').insert({
      company: (input.company || '').trim() || NOT_INFORMED,
      contact_name: (input.contact || '').trim() || NOT_INFORMED,
      email: (input.email || '').trim() || NOT_INFORMED,
      phone: input.phone?.trim() || null,
      site: input.site?.trim() || null,
      plan: input.plan?.trim() || null,
      goal: input.goal?.trim() || null,
      period: input.period?.trim() || null,
      budget: input.budget?.trim() || null,
      notes: input.notes?.trim() || null,
      channel: input.channel,
      source: input.source || 'anuncie',
      status: 'novo',
      cta_id: clean(input.ctaId),
      ...campaign,
    });
  } catch {
    /* silencioso por design */
  }
}

export const SPONSOR_LEAD_STATUS: { value: string; label: string }[] = [
  { value: 'novo', label: 'Novo' },
  { value: 'em_contato', label: 'Em contato' },
  { value: 'negociando', label: 'Negociando' },
  { value: 'fechado', label: 'Fechado' },
  { value: 'perdido', label: 'Perdido' },
];

export const SPONSOR_LEAD_CHANNEL_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  copia: 'Briefing copiado',
  clique: 'Clique no CTA',
  form: 'Formulário',
};
