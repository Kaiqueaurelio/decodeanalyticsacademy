import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RotateCcw, Save, BookImage } from 'lucide-react';
import { toast } from 'sonner';
import {
  DEFAULT_COVER_THEME,
  loadCoverTheme,
  saveCoverTheme,
  type CoverTheme,
} from '@/lib/cover-theme';
import { buildCoverDataUri } from '@/lib/cover-render';
import { CoverPreviewSizes } from '@/components/admin/CoverPreviewSizes';

const FONTS = [
  { label: 'Instrument Serif', value: "'Instrument Serif', Georgia, serif" },
  { label: 'Space Grotesk', value: "'Space Grotesk', system-ui, sans-serif" },
  { label: 'Georgia (serifada)', value: 'Georgia, serif' },
  { label: 'Sistema (sem serifa)', value: 'system-ui, sans-serif' },
  { label: 'Monoespaçada', value: "'JetBrains Mono', ui-monospace, monospace" },
];

const SAMPLES = [
  { title: 'Matemática e suas Tecnologias', category: 'ENEM', semester: null },
  { title: 'Arquitetura de Redes de Computadores', category: 'Arquitetura de Redes de Computadores', semester: 5 },
  { title: 'Teoria dos Grafos', category: 'Teoria dos Grafos', semester: 5 },
];

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9 font-mono text-xs" />
      </div>
    </div>
  );
}

function SliderField({
  label, value, min, max, step = 1, suffix = '', onChange,
}: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs text-muted-foreground tabular-nums">{value}{suffix}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} aria-label={label} />
    </div>
  );
}

function FontField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          {FONTS.map((f) => (
            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Editor de capas: grade, paleta e tipografia (kicker, subtítulo e assinatura).
 * O tema é salvo em app_settings e aplicado a todas as apostilas.
 */
export function CoverDesignEditor() {
  const [theme, setTheme] = useState<CoverTheme>(DEFAULT_COVER_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCoverTheme(true).then((t) => {
      setTheme(t);
      setLoading(false);
    });
  }, []);

  const set = <K extends keyof CoverTheme>(key: K, patch: Partial<CoverTheme[K]>) =>
    setTheme((prev) => ({ ...prev, [key]: { ...(prev[key] as any), ...patch } }));

  const previews = useMemo(
    () => SAMPLES.map((s) => ({ s, uri: buildCoverDataUri(s, theme) })),
    [theme],
  );

  const save = async () => {
    setSaving(true);
    try {
      await saveCoverTheme(theme);
      toast.success('Padrão de capas atualizado em todas as apostilas');
    } catch (e: any) {
      toast.error('Falha ao salvar: ' + (e?.message || 'erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookImage className="h-5 w-5 text-primary" />
          Design das capas
        </CardTitle>
        <CardDescription>
          Ajuste grade, paleta e tipografia. O mesmo padrão é aplicado às capas de todas as apostilas.
          Tokens disponíveis nos textos: <code>{'{categoria}'}</code>, <code>{'{titulo}'}</code>, <code>{'{semestre}'}</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Tabs defaultValue="grade">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="grade">Grade</TabsTrigger>
            <TabsTrigger value="paleta">Paleta</TabsTrigger>
            <TabsTrigger value="tipografia">Tipografia</TabsTrigger>
            <TabsTrigger value="textos">Textos</TabsTrigger>
          </TabsList>

          <TabsContent value="grade" className="space-y-4 pt-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="grid-enabled" className="text-sm">Malha visível</Label>
              <Switch id="grid-enabled" checked={theme.grid.enabled} onCheckedChange={(v) => set('grid', { enabled: v })} />
            </div>
            <SliderField label="Espaçamento da malha" value={theme.grid.size} min={20} max={120} suffix="px" onChange={(v) => set('grid', { size: v })} />
            <SliderField label="Opacidade da malha" value={Math.round(theme.grid.opacity * 100)} min={0} max={40} suffix="%" onChange={(v) => set('grid', { opacity: v / 100 })} />
            <SliderField label="Margem interna" value={theme.grid.margin} min={24} max={100} suffix="px" onChange={(v) => set('grid', { margin: v })} />
            <SliderField label="Barra de acento" value={theme.grid.accentBar} min={0} max={28} suffix="px" onChange={(v) => set('grid', { accentBar: v })} />
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="grid-rules" className="text-sm">Linhas divisórias</Label>
              <Switch id="grid-rules" checked={theme.grid.rules} onCheckedChange={(v) => set('grid', { rules: v })} />
            </div>
          </TabsContent>

          <TabsContent value="paleta" className="space-y-4 pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <ColorField label="Fundo (topo)" value={theme.palette.background} onChange={(v) => set('palette', { background: v })} />
              <ColorField label="Fundo (base)" value={theme.palette.backgroundAlt} onChange={(v) => set('palette', { backgroundAlt: v })} />
              <ColorField label="Texto" value={theme.palette.text} onChange={(v) => set('palette', { text: v })} />
              <ColorField label="Texto secundário" value={theme.palette.muted} onChange={(v) => set('palette', { muted: v })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cor de acento</Label>
              <Select value={theme.palette.accentMode} onValueChange={(v) => set('palette', { accentMode: v as 'subject' | 'fixed' })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="subject">Cor da matéria (recomendado)</SelectItem>
                  <SelectItem value="fixed">Cor fixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {theme.palette.accentMode === 'fixed' && (
              <ColorField label="Acento fixo" value={theme.palette.accentColor} onChange={(v) => set('palette', { accentColor: v })} />
            )}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="prefer-uploaded" className="text-sm">Priorizar capa enviada</Label>
                <p className="text-xs text-muted-foreground">Quando desligado, todas as apostilas usam este padrão.</p>
              </div>
              <Switch id="prefer-uploaded" checked={theme.preferUploaded} onCheckedChange={(v) => setTheme((p) => ({ ...p, preferUploaded: v }))} />
            </div>
          </TabsContent>

          <TabsContent value="tipografia" className="space-y-4 pt-4">
            <FontField label="Fonte do kicker" value={theme.typography.kickerFont} onChange={(v) => set('typography', { kickerFont: v })} />
            <SliderField label="Tamanho do kicker" value={theme.typography.kickerSize} min={12} max={34} onChange={(v) => set('typography', { kickerSize: v })} />
            <SliderField label="Espaçamento do kicker" value={theme.typography.kickerTracking} min={0} max={14} onChange={(v) => set('typography', { kickerTracking: v })} />
            <FontField label="Fonte do título" value={theme.typography.titleFont} onChange={(v) => set('typography', { titleFont: v })} />
            <SliderField label="Tamanho do título" value={theme.typography.titleSize} min={34} max={96} onChange={(v) => set('typography', { titleSize: v })} />
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="title-italic" className="text-sm">Título em itálico</Label>
              <Switch id="title-italic" checked={theme.typography.titleItalic} onCheckedChange={(v) => set('typography', { titleItalic: v })} />
            </div>
            <FontField label="Fonte do subtítulo" value={theme.typography.subtitleFont} onChange={(v) => set('typography', { subtitleFont: v })} />
            <SliderField label="Tamanho do subtítulo" value={theme.typography.subtitleSize} min={12} max={34} onChange={(v) => set('typography', { subtitleSize: v })} />
            <FontField label="Fonte da assinatura" value={theme.typography.signatureFont} onChange={(v) => set('typography', { signatureFont: v })} />
            <SliderField label="Tamanho da assinatura" value={theme.typography.signatureSize} min={10} max={28} onChange={(v) => set('typography', { signatureSize: v })} />
          </TabsContent>

          <TabsContent value="textos" className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="cover-kicker" className="text-xs">Kicker (linha superior)</Label>
              <Input id="cover-kicker" value={theme.content.kicker} onChange={(e) => set('content', { kicker: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cover-subtitle" className="text-xs">Subtítulo</Label>
              <Input id="cover-subtitle" value={theme.content.subtitle} onChange={(e) => set('content', { subtitle: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cover-signature" className="text-xs">Assinatura</Label>
              <Input id="cover-signature" value={theme.content.signature} onChange={(e) => set('content', { signature: e.target.value })} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-3">
          <Tabs defaultValue="amostras">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="amostras">Amostras</TabsTrigger>
              <TabsTrigger value="tamanhos">Tamanhos reais</TabsTrigger>
            </TabsList>
            <TabsContent value="amostras" className="pt-4">
              <div className="grid grid-cols-3 gap-3">
                {previews.map(({ s, uri }) => (
                  <img
                    key={s.title}
                    src={uri}
                    alt={`Prévia da capa: ${s.title}`}
                    className="w-full rounded-lg border border-border/60 shadow-sm"
                  />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="tamanhos" className="pt-4">
              <CoverPreviewSizes samples={SAMPLES} theme={theme} />
            </TabsContent>
          </Tabs>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar padrão
            </Button>
            <Button variant="outline" onClick={() => setTheme(DEFAULT_COVER_THEME)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restaurar padrão
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
