import { BarChart3, Brain, Code2, Database, GraduationCap, Network, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  chart: BarChart3,
  brain: Brain,
  code: Code2,
  database: Database,
  graduation: GraduationCap,
  network: Network,
  shield: ShieldCheck,
  sparkles: Sparkles,
};

export const ICON_OPTIONS: { key: string; label: string }[] = [
  { key: 'graduation', label: 'Formação' },
  { key: 'chart', label: 'Dados' },
  { key: 'database', label: 'Banco de Dados' },
  { key: 'brain', label: 'IA' },
  { key: 'code', label: 'Programação' },
  { key: 'network', label: 'Redes' },
  { key: 'shield', label: 'Segurança' },
  { key: 'sparkles', label: 'Destaque' },
];

export function iconFor(key?: string | null): LucideIcon {
  return ICON_MAP[key || 'graduation'] || GraduationCap;
}
