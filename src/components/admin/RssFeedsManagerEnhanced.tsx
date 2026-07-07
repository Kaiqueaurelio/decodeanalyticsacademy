import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Plus, RefreshCw, Rss, Loader2, CheckCircle2, XCircle, ShieldCheck, History, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface RssFeed {
  id: string;
  url: string;
  source: string;
  enabled: boolean;
  sort_order: number;
}

interface ValidateResult {
  ok: boolean;
  itemCount: number;
  source: string | null;
  error?: string;
  statusCode?: number;
  responseTime?: number;
}

interface ValidationHistory {
  id: string;
  feed_id: string;
  validated_at: string;
  is_valid: boolean;
  error_reason: string | null;
  item_count: number | null;
  response_time_ms: number | null;
  status_code: number | null;
}

export function RssFeedsManagerEnhanced() {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [source, setSource] = useState('');
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidateResult | null>(null);
  const [revalidating, setRevalidating] = useState(false);
  const [feedStatus, setFeedStatus] = useState<Record<string, ValidateResult>>({});
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<RssFeed | null>(null);
  const [history, setHistory] = useState<ValidationHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rss_feeds' as any)
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) toast.error('Erro ao carregar feeds');
    setFeeds((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const validateUrl = async (targetUrl: string, feedId?: string): Promise<ValidateResult | null> => {
    if (!/^https?:\/\//i.test(targetUrl)) {
      const res = { ok: false, itemCount: 0, source: null, error: 'URL inválida' };
      setValidation(res);
      return res;
    }
    setValidating(true);
    setValidation(null);
    try {
      const { data, error } = await supabase.functions.invoke<ValidateResult>('validate-rss', {
        body: { url: targetUrl, feedId: feedId || null },
      });
      if (error) throw error;
      setValidation(data || null);
      if (data?.ok && data.source && !source.trim()) {
        setSource(data.source.slice(0, 60));
      }
      return data || null;
    } catch (e: any) {
      const res = { ok: false, itemCount: 0, source: null, error: e?.message || 'Falha ao validar' };
      setValidation(res);
      return res;
    } finally {
      setValidating(false);
    }
  };

  const add = async () => {
    const u = url.trim();
    const s = source.trim();
    if (!u || !s) return toast.error('Informe URL e nome do portal');
    if (!/^https?:\/\//i.test(u)) return toast.error('URL inválida');

    // Sempre revalida na hora de adicionar
    const check = validation?.ok ? validation : await validateUrl(u);
    if (!check?.ok) {
      toast.error(`Feed indisponível: ${check?.error || 'não retorna itens'}`);
      return;
    }

    setSaving(true);
    const maxOrder = feeds.reduce((m, f) => Math.max(m, f.sort_order), 0);
    const { error } = await supabase
      .from('rss_feeds' as any)
      .insert({ url: u, source: s, enabled: true, sort_order: maxOrder + 10 } as any);
    setSaving(false);
    if (error) return toast.error(error.message.includes('duplicate') ? 'Este feed já existe' : 'Erro ao adicionar');
    toast.success(`Feed "${s}" adicionado — ${check.itemCount} notícias detectadas`);
    setUrl('');
    setSource('');
    setValidation(null);
    load();
  };

  const toggle = async (feed: RssFeed) => {
    const { error } = await supabase
      .from('rss_feeds' as any)
      .update({ enabled: !feed.enabled } as any)
      .eq('id', feed.id);
    if (error) return toast.error('Erro ao atualizar');
    setFeeds((prev) => prev.map((f) => (f.id === feed.id ? { ...f, enabled: !f.enabled } : f)));
  };

  const remove = async (feed: RssFeed) => {
    if (!confirm(`Remover "${feed.source}"?`)) return;
    const { error } = await supabase.from('rss_feeds' as any).delete().eq('id', feed.id);
    if (error) return toast.error('Erro ao remover');
    setFeeds((prev) => prev.filter((f) => f.id !== feed.id));
    toast.success('Feed removido');
  };

  const revalidateAll = async () => {
    if (feeds.length === 0) return;
    setRevalidating(true);
    try {
      const { data, error } = await supabase.functions.invoke<{ results: (ValidateResult & { url: string })[] }>(
        'validate-rss',
        { body: { urls: feeds.map((f) => f.url) } },
      );
      if (error) throw error;
      const map: Record<string, ValidateResult> = {};
      const byUrl = new Map(data?.results?.map((r) => [r.url, r]) || []);
      for (const f of feeds) {
        const r = byUrl.get(f.url);
        if (r) map[f.id] = r;
      }
      setFeedStatus(map);
      const broken = Object.values(map).filter((r) => !r.ok).length;
      toast.success(broken === 0 ? 'Todos os feeds estão funcionando' : `${broken} feed(s) fora do ar`);
    } catch {
      toast.error('Falha ao revalidar');
    } finally {
      setRevalidating(false);
    }
  };

  const disableBroken = async () => {
    const brokenIds = Object.entries(feedStatus).filter(([, r]) => !r.ok).map(([id]) => id);
    if (brokenIds.length === 0) return toast('Nenhum feed quebrado detectado');
    if (!confirm(`Pausar ${brokenIds.length} feed(s) fora do ar?`)) return;
    const { error } = await supabase.from('rss_feeds' as any).update({ enabled: false } as any).in('id', brokenIds);
    if (error) return toast.error('Erro ao pausar');
    toast.success('Feeds quebrados pausados');
    load();
  };

  const loadHistory = async (feed: RssFeed) => {
    setSelectedFeed(feed);
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('rss_validation_history')
        .select('*')
        .eq('feed_id', feed.id)
        .order('validated_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setHistory((data as any) || []);
      setHistoryOpen(true);
    } catch (e) {
      toast.error('Erro ao carregar histórico');
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Rss className="h-4 w-4 text-primary" />
            Feeds RSS de Notícias
          </CardTitle>
          <CardDescription>
            Gerencie as fontes usadas na página <b>/noticias</b>. Cada link é validado ao vivo antes de ser salvo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end">
            <div>
              <Label className="text-xs">URL do feed</Label>
              <Input
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setValidation(null);
                }}
                onBlur={() => url.trim() && validateUrl(url.trim())}
                placeholder="https://site.com/feed"
                className="text-xs font-mono"
              />
            </div>
            <div>
              <Label className="text-xs">Nome do portal</Label>
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Ex: Meio Bit"
                className="text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => validateUrl(url.trim())}
                disabled={!url.trim() || validating}
                className="gap-1.5"
              >
                {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Validar
              </Button>
              <Button onClick={add} disabled={saving || !validation?.ok} className="gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Adicionar
              </Button>
            </div>
          </div>

          {/* Feedback de validação em tempo real */}
          {validating && (
            <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 flex items-center gap-2 text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              Verificando se o feed responde…
            </div>
          )}
          {!validating && validation && (
            <div
              className={cn(
                'rounded-lg border px-3 py-2 flex items-start gap-2 text-xs',
                validation.ok
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : 'border-red-500/40 bg-red-500/10 text-red-200',
              )}
            >
              {validation.ok ? (
                <>
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Feed válido — {validation.itemCount} notícias detectadas.</p>
                    {validation.source && (
                      <p className="opacity-80 text-[11px] mt-0.5">Portal detectado: {validation.source}</p>
                    )}
                    {validation.responseTime && (
                      <p className="opacity-80 text-[11px] mt-0.5">Tempo de resposta: {validation.responseTime}ms</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Feed indisponível.</p>
                    <p className="opacity-80 text-[11px] mt-0.5">{validation.error || 'Não retornou itens válidos.'}</p>
                    {validation.statusCode && (
                      <p className="opacity-80 text-[11px] mt-0.5">Status HTTP: {validation.statusCode}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex justify-between items-center gap-2 flex-wrap">
            <Button size="sm" variant="ghost" onClick={load} className="gap-1.5 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Recarregar lista
            </Button>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={revalidateAll}
                disabled={revalidating || feeds.length === 0}
                className="gap-1.5 text-xs"
              >
                {revalidating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                Revalidar todos
              </Button>
              {Object.values(feedStatus).some((r) => !r.ok) && (
                <Button size="sm" variant="destructive" onClick={disableBroken} className="gap-1.5 text-xs">
                  Pausar quebrados
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando feeds…
            </div>
          ) : feeds.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Nenhum feed cadastrado.</div>
          ) : (
            <div className="divide-y divide-border">
              {feeds.map((feed) => {
                const status = feedStatus[feed.id];
                return (
                  <div key={feed.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{feed.source}</p>
                        {status && (
                          <span
                            className={cn(
                              'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                              status.ok
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/20 text-red-300',
                            )}
                          >
                            {status.ok ? `✓ ${status.itemCount} itens` : `✗ ${status.error || 'fora do ar'}`}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate font-mono">{feed.url}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => loadHistory(feed)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title="Ver histórico de validações"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1.5">
                        <Switch checked={feed.enabled} onCheckedChange={() => toggle(feed)} />
                        <span className="text-[10px] text-muted-foreground w-10">
                          {feed.enabled ? 'Ativo' : 'Pausado'}
                        </span>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => remove(feed)} className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de histórico */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de Validações
            </DialogTitle>
            <DialogDescription>
              {selectedFeed ? `Últimas validações de "${selectedFeed.source}"` : 'Carregando...'}
            </DialogDescription>
          </DialogHeader>

          {historyLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando histórico…
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma validação registrada ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    'rounded-lg border p-3 text-xs',
                    entry.is_valid
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-red-500/30 bg-red-500/10'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {entry.is_valid ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                      )}
                      <span className="font-semibold">
                        {entry.is_valid ? 'Válido' : 'Inválido'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTime(entry.validated_at)}
                    </div>
                  </div>

                  {entry.is_valid ? (
                    <div className="space-y-1">
                      <p>✓ {entry.item_count || 0} itens encontrados</p>
                      {entry.response_time_ms && (
                        <p className="text-[10px] text-muted-foreground">
                          Tempo de resposta: {entry.response_time_ms}ms
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-semibold">Motivo da falha:</p>
                      <p className="text-[11px] opacity-90">{entry.error_reason || 'Erro desconhecido'}</p>
                      {entry.status_code && (
                        <p className="text-[10px] text-muted-foreground">
                          HTTP {entry.status_code}
                          {entry.response_time_ms && ` · ${entry.response_time_ms}ms`}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
