import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Link2, Save, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const SETTING_KEY = 'share_app_url';
const DEFAULT_URL = 'https://decodeanalyticsacademydev.vercel.app/';

export function ShareLinkSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [url, setUrl] = useState<string>(DEFAULT_URL);
  const [original, setOriginal] = useState<string>(DEFAULT_URL);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', SETTING_KEY)
        .maybeSingle();
      const value = typeof data?.value === 'string'
        ? data.value
        : (data?.value as string | undefined) ?? DEFAULT_URL;
      setUrl(value);
      setOriginal(value);
      setLoading(false);
    })();
  }, []);

  const isValidUrl = (() => {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  })();

  const dirty = url.trim() !== original.trim();

  const save = async () => {
    if (!isValidUrl) {
      toast.error('URL inválida. Use https://...');
      return;
    }
    setSaving(true);
    const trimmed = url.trim();
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: SETTING_KEY, value: trimmed as any }, { onConflict: 'key' });
    setSaving(false);
    if (error) {
      toast.error('Falha ao salvar: ' + error.message);
    } else {
      setOriginal(trimmed);
      toast.success('Link de compartilhamento atualizado');
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
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Link de compartilhamento do app
        </CardTitle>
        <CardDescription>
          URL usada nos botões "Compartilhar com a turma" da Landing Page (WhatsApp, Telegram, X e copiar link).
          Coloque aqui o endereço público do app que você quer divulgar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="share-url" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            URL pública
          </Label>
          <Input
            id="share-url"
            type="url"
            inputMode="url"
            placeholder="https://decodeanalyticsacademydev.vercel.app/"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="font-mono text-sm"
          />
          {!isValidUrl && url.trim() !== '' && (
            <p className="text-xs text-destructive">URL inválida — comece com https://</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={save} disabled={!dirty || saving || !isValidUrl} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
          {isValidUrl && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir link
            </a>
          )}
          {dirty && (
            <button
              type="button"
              onClick={() => setUrl(original)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
            >
              Descartar
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
