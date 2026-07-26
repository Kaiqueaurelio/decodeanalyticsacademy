import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export const COVER_THEME_KEY = 'cover_theme';

export interface CoverTheme {
  /** Grade / composição */
  grid: {
    enabled: boolean;
    /** espaçamento da malha em px (base 600x900) */
    size: number;
    /** opacidade da malha 0-1 */
    opacity: number;
    /** espessura da barra de acento no topo */
    accentBar: number;
    /** margem interna em px */
    margin: number;
    /** mostra a régua/linhas divisórias entre blocos de texto */
    rules: boolean;
  };
  /** Paleta */
  palette: {
    background: string;
    backgroundAlt: string;
    /** 'subject' usa a cor da matéria, 'fixed' usa accentColor */
    accentMode: 'subject' | 'fixed';
    accentColor: string;
    text: string;
    muted: string;
  };
  /** Tipografia */
  typography: {
    kickerFont: string;
    kickerSize: number;
    kickerTracking: number;
    titleFont: string;
    titleSize: number;
    titleItalic: boolean;
    subtitleFont: string;
    subtitleSize: number;
    signatureFont: string;
    signatureSize: number;
  };
  /** Conteúdo — aceita os tokens {categoria} {titulo} {semestre} */
  content: {
    kicker: string;
    subtitle: string;
    signature: string;
  };
  /** Quando true, usa a capa enviada (cover_url) se existir */
  preferUploaded: boolean;
}

export const DEFAULT_COVER_THEME: CoverTheme = {
  grid: { enabled: true, size: 60, opacity: 0.07, accentBar: 10, margin: 56, rules: true },
  palette: {
    background: '#0B0D12',
    backgroundAlt: '#151A24',
    accentMode: 'subject',
    accentColor: '#7DD3FC',
    text: '#F5F3EE',
    muted: '#9AA4B2',
  },
  typography: {
    kickerFont: "'Space Grotesk', system-ui, sans-serif",
    kickerSize: 20,
    kickerTracking: 6,
    titleFont: "'Instrument Serif', Georgia, serif",
    titleSize: 66,
    titleItalic: false,
    subtitleFont: "'Space Grotesk', system-ui, sans-serif",
    subtitleSize: 22,
    signatureFont: "'Space Grotesk', system-ui, sans-serif",
    signatureSize: 17,
  },
  content: {
    kicker: '{categoria}',
    subtitle: 'Material de estudo · {semestre}',
    signature: 'Decode Analytics Academy',
  },
  preferUploaded: true,
};

function merge(base: CoverTheme, patch: any): CoverTheme {
  if (!patch || typeof patch !== 'object') return base;
  return {
    grid: { ...base.grid, ...(patch.grid || {}) },
    palette: { ...base.palette, ...(patch.palette || {}) },
    typography: { ...base.typography, ...(patch.typography || {}) },
    content: { ...base.content, ...(patch.content || {}) },
    preferUploaded: patch.preferUploaded ?? base.preferUploaded,
  };
}

let cache: CoverTheme | null = null;
let inflight: Promise<CoverTheme> | null = null;
const listeners = new Set<(t: CoverTheme) => void>();

export async function loadCoverTheme(force = false): Promise<CoverTheme> {
  if (cache && !force) return cache;
  if (inflight && !force) return inflight;
  inflight = (async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', COVER_THEME_KEY)
        .maybeSingle();
      cache = merge(DEFAULT_COVER_THEME, data?.value);
    } catch {
      cache = DEFAULT_COVER_THEME;
    }
    listeners.forEach((l) => l(cache!));
    return cache!;
  })();
  const result = await inflight;
  inflight = null;
  return result;
}

export async function saveCoverTheme(theme: CoverTheme): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: COVER_THEME_KEY, value: theme as any }, { onConflict: 'key' });
  if (error) throw error;
  cache = theme;
  listeners.forEach((l) => l(theme));
}

/** Tema atual (síncrono, com fallback no padrão) para renderizações imediatas */
export function getCoverThemeSync(): CoverTheme {
  return cache || DEFAULT_COVER_THEME;
}

export function useCoverTheme(): CoverTheme {
  const [theme, setTheme] = useState<CoverTheme>(getCoverThemeSync());
  useEffect(() => {
    listeners.add(setTheme);
    loadCoverTheme().then(setTheme);
    return () => {
      listeners.delete(setTheme);
    };
  }, []);
  return theme;
}
