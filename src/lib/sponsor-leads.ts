import { supabase } from '@/integrations/supabase/client';

export type SponsorLeadChannel = 'whatsapp' | 'email' | 'copia' | 'clique';

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
};

const NOT_INFORMED = 'Não informado';

/**
 * Registra um interesse (ou apenas um clique) de patrocínio.
 * Falha em silêncio: nunca deve bloquear o envio do briefing pelo anunciante.
 */
export async function recordSponsorLead(input: SponsorLeadInput): Promise<void> {
  try {
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
