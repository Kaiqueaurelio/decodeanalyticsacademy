import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, ShieldCheck, AlertTriangle, Cloud, KeyRound, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';

const SETTING_KEY = 'ai_provider';

interface ProviderSetting {
  preferGoogle: boolean;
}

export function AIProviderSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [preferGoogle, setPreferGoogle] = useState(false);
  const [testOutput, setTestOutput] = useState<string>('');
  const [usedProvider, setUsedProvider] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', SETTING_KEY)
        .maybeSingle();
      if (data?.value && typeof data.value === 'object') {
        const v = data.value as unknown as ProviderSetting;
        setPreferGoogle(!!v.preferGoogle);
      }
      setLoading(false);
    })();
  }, []);

  const save = async (next: boolean) => {
    setSaving(true);
    setPreferGoogle(next);
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: SETTING_KEY, value: { preferGoogle: next } as any }, { onConflict: 'key' });
    setSaving(false);
    if (error) {
      toast.error('Falha ao salvar: ' + error.message);
      setPreferGoogle(!next);
    } else {
      try { localStorage.setItem('ai_prefer_google_hint', next ? '1' : '0'); } catch {}
      toast.success(next ? 'Usando chave própria (Google)' : 'Usando provedor padrão');
    }
  };

  const test = async () => {
    setTesting(true);
    setTestOutput('');
    setUsedProvider('');
    try {
      const { getCurrentAccessToken } = await import('@/lib/auth-session');
      const accessToken = getCurrentAccessToken();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-direct`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken ?? ''}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          systemPrompt: 'Responda em uma frase curta em português.',
          messages: [{ role: 'user', content: 'Diga olá e mencione qual modelo você é.' }],
        }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        toast.error('Falha no teste: ' + (t || resp.status));
        setTesting(false);
        return;
      }

      const ctype = resp.headers.get('Content-Type') || '';
      if (ctype.includes('application/json')) {
        const j = await resp.json().catch(() => null);
        if (j?.error) {
          toast.error(j.error);
          setTestOutput(j.error);
          setUsedProvider(resp.headers.get('X-AI-Provider') || 'erro');
          setTesting(false);
          return;
        }
      }

      setUsedProvider(resp.headers.get('X-AI-Provider') || 'desconhecido');

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setTestOutput(acc);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
      toast.success('Teste concluído');
    } catch (e) {
      toast.error('Erro: ' + (e instanceof Error ? e.message : 'desconhecido'));
    } finally {
      setTesting(false);
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
    <div className="space-y-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Provedor do Assistente
          </CardTitle>
          <CardDescription>
            Escolha entre o provedor padrão (sem configuração) ou usar sua própria chave (Google).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className={`flex items-center justify-between gap-4 p-4 rounded-lg border-2 transition ${preferGoogle ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-amber-500/60 bg-amber-500/5'}`}>
            <div className="space-y-1">
              <Label className="text-base font-medium flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                Usar minha chave própria (Google)
              </Label>
              <p className="text-xs text-muted-foreground">
                {preferGoogle
                  ? '✅ ATIVO: as respostas do assistente usam sua chave própria. Sem consumo do provedor padrão.'
                  : '⚠️ INATIVO: o app está usando o provedor padrão. Ative para usar sua chave própria.'}
              </p>
            </div>
            <Switch checked={preferGoogle} onCheckedChange={save} disabled={saving} />
          </div>

          {!preferGoogle && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/40 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs">
                <strong>Toggle desligado.</strong> Mesmo com sua chave configurada, o app continua usando o provedor padrão até você ligar o switch acima.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2 text-xs font-semibold mb-1">
                <Cloud className="h-3.5 w-3.5 text-primary" />
                Status atual
              </div>
              <Badge variant={preferGoogle ? 'default' : 'secondary'}>
                {preferGoogle ? 'Chave própria (Google)' : 'Provedor padrão'}
              </Badge>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2 text-xs font-semibold mb-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Chave configurada
              </div>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                GOOGLE_AI_API_KEY ✓
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={test} disabled={testing} className="gap-2">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
              Testar assistente
            </Button>
            {(testOutput || usedProvider) && (
              <div className="p-3 rounded-lg border bg-muted/30 text-xs space-y-2">
                {usedProvider && (
                  <div>
                    <span className="font-semibold">Provedor usado:</span>{' '}
                    <Badge variant={usedProvider === 'google-direct' ? 'default' : 'secondary'}>
                      {usedProvider}
                    </Badge>
                  </div>
                )}
                {testOutput && (
                  <div className="whitespace-pre-wrap text-foreground">{testOutput}</div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Se você expôs uma chave em chat ou mensagem pública, <strong>revogue-a</strong> em
              {' '}<a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="underline text-primary">aistudio.google.com/apikey</a>{' '}
              e gere uma nova.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
