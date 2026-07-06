import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Plus, RefreshCw, Rss, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RssFeed {
  id: string;
  url: string;
  source: string;
  enabled: boolean;
  sort_order: number;
}

export function RssFeedsManager() {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [source, setSource] = useState('');
  const [saving, setSaving] = useState(false);

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

  const add = async () => {
    const u = url.trim();
    const s = source.trim();
    if (!u || !s) return toast.error('Informe URL e nome do portal');
    if (!/^https?:\/\//i.test(u)) return toast.error('URL inválida');
    setSaving(true);
    const maxOrder = feeds.reduce((m, f) => Math.max(m, f.sort_order), 0);
    const { error } = await supabase
      .from('rss_feeds' as any)
      .insert({ url: u, source: s, enabled: true, sort_order: maxOrder + 10 } as any);
    setSaving(false);
    if (error) return toast.error(error.message.includes('duplicate') ? 'Este feed já existe' : 'Erro ao adicionar');
    toast.success('Feed adicionado');
    setUrl('');
    setSource('');
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Rss className="h-4 w-4 text-primary" />
            Feeds RSS de Notícias
          </CardTitle>
          <CardDescription>
            Gerencie as fontes usadas na página <b>/noticias</b>. Alterações refletem em até 15 minutos (cache do cliente).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end">
            <div>
              <Label className="text-xs">URL do feed</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
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
            <Button onClick={add} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Adicionar
            </Button>
          </div>
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={load} className="gap-1.5 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Recarregar
            </Button>
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
              {feeds.map((feed) => (
                <div key={feed.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{feed.source}</p>
                    <p className="text-[11px] text-muted-foreground truncate font-mono">{feed.url}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
