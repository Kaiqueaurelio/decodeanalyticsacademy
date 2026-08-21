import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, RotateCcw, Clock, User, PenTool, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Version {
  id: string;
  title: string;
  content: string;
  created_at: string;
  created_by: string | null;
}

interface ApostilaVersionHistoryProps {
  apostilaId: string;
  onRestore: (version: { title: string; content: string }) => void;
}

function versionDateLabel(value: string) {
  return format(new Date(value), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function ApostilaVersionHistory({ apostilaId, onRestore }: ApostilaVersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState<Version | null>(null);

  const fetchVersions = async () => {
    if (!apostilaId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('apostila_versions')
      .select('*')
      .eq('apostila_id', apostilaId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar histórico');
    } else {
      setVersions((data || []) as Version[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchVersions();
  }, [apostilaId]);

  const groupedVersions = useMemo(() => {
    const groups = new Map<string, Version[]>();
    versions.forEach((version) => {
      const key = new Date(version.created_at).toISOString().slice(0, 10);
      const current = groups.get(key) || [];
      current.push(version);
      groups.set(key, current);
    });
    return [...groups.entries()];
  }, [versions]);

  const restoreVersion = async (version: Version) => {
    if (!apostilaId || restoringId) return;
    setRestoringId(version.id);

    try {
      const [{ data: current, error: currentError }, { data: authData }] = await Promise.all([
        supabase.from('apostilas').select('title, content').eq('id', apostilaId).single(),
        supabase.auth.getUser(),
      ]);

      if (currentError || !current) {
        throw currentError || new Error('Apostila atual não encontrada.');
      }

      const { error: snapshotError } = await supabase.from('apostila_versions').insert({
        apostila_id: apostilaId,
        title: current.title || 'Sem título',
        content: current.content || '',
        created_by: authData.user?.id || null,
      });

      if (snapshotError) throw snapshotError;

      const { error: updateError } = await supabase
        .from('apostilas')
        .update({ title: version.title || 'Sem título', content: version.content || '' })
        .eq('id', apostilaId);

      if (updateError) throw updateError;

      onRestore({ title: version.title, content: version.content });
      await fetchVersions();
      setPreviewVersion(null);
      toast.success('Versão restaurada e salva no banco de dados.', {
        description: `Versão de ${format(new Date(version.created_at), 'dd/MM/yyyy às HH:mm', { locale: ptBR })}.`,
        icon: <RotateCcw className="h-4 w-4" />,
      });
    } catch (error: any) {
      console.error('Version restore error', error);
      toast.error(error?.message || 'Não foi possível restaurar esta versão.');
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <header className="p-4 border-b bg-muted/20">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Histórico de Versões
        </h3>
        <p className="text-[10px] text-muted-foreground mt-1">
          As versões são agrupadas por data. Visualize o conteúdo ou restaure uma versão específica.
        </p>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 w-full bg-muted animate-pulse rounded-lg border border-border/40" />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-border">
                <Clock className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <h4 className="text-sm font-medium text-foreground">Nenhuma versão anterior</h4>
              <p className="text-[11px] text-muted-foreground mt-2 max-w-[220px] mx-auto leading-relaxed">
                As versões são geradas automaticamente antes de alterações importantes.
              </p>
            </div>
          ) : (
            groupedVersions.map(([dateKey, dateVersions]) => (
              <section key={dateKey} className="space-y-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <CalendarMark />
                  <span>{versionDateLabel(dateVersions[0].created_at)}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                {dateVersions.map((version, idx) => {
                  const nextVersion = versions[versions.indexOf(version) + 1];
                  const hasDiff = nextVersion && version.content.length !== nextVersion.content.length;
                  const isRestoring = restoringId === version.id;

                  return (
                    <div
                      key={version.id}
                      className="group relative border border-border/60 rounded-xl p-3.5 hover:border-primary/50 transition-all bg-card/50 hover:bg-card hover:shadow-lg hover:shadow-primary/5"
                    >
                      <div className="flex justify-between items-start gap-3 mb-2.5">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold line-clamp-1 text-foreground">{version.title || 'Sem título'}</p>
                            {versions.indexOf(version) === 0 && (
                              <Badge variant="outline" className="text-[8px] h-4 border-emerald-500/30 text-emerald-500 bg-emerald-500/5">MAIS RECENTE</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground font-medium">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(version.created_at), 'HH:mm', { locale: ptBR })}</span>
                            {version.created_by && <span className="flex items-center gap-1"><User className="h-3 w-3" />Administrador</span>}
                            {hasDiff && (
                              <span className="flex items-center gap-0.5 text-ciano bg-ciano/10 px-1.5 py-0.5 rounded-md border border-ciano/20">
                                <PenTool className="h-2.5 w-2.5" /> Modificada
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground/80 bg-muted/30 p-2.5 rounded-lg border border-border/40 font-mono line-clamp-2 leading-relaxed italic">
                        {(version.content || '').substring(0, 180)}{version.content && version.content.length > 180 ? '…' : ''}
                      </div>
                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1.5" onClick={() => setPreviewVersion(version)}>
                          <Eye className="h-3.5 w-3.5" /> Visualizar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] gap-1.5 border-primary/20 text-primary hover:bg-primary hover:text-white"
                          onClick={() => void restoreVersion(version)}
                          disabled={Boolean(restoringId)}
                        >
                          {isRestoring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                          {isRestoring ? 'Salvando…' : 'Restaurar e salvar'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </section>
            ))
          )}
        </div>
      </ScrollArea>

      <footer className="p-4 border-t bg-muted/10">
        <Button
          variant="outline"
          className="w-full h-8 text-xs gap-2 border-primary/20"
          onClick={() => void fetchVersions()}
          disabled={loading || Boolean(restoringId)}
        >
          <RotateCcw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Atualizar Histórico
        </Button>
      </footer>

      <Dialog open={Boolean(previewVersion)} onOpenChange={(open) => !open && setPreviewVersion(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{previewVersion?.title || 'Versão sem título'}</DialogTitle>
            <DialogDescription>
              Versão criada em {previewVersion ? format(new Date(previewVersion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ''}.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] rounded-lg border bg-muted/20 p-4">
            <div className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground">
              {previewVersion?.content || 'Esta versão não possui conteúdo.'}
            </div>
          </ScrollArea>
          {previewVersion && (
            <div className="flex justify-end">
              <Button className="gap-2" onClick={() => void restoreVersion(previewVersion)} disabled={Boolean(restoringId)}>
                {restoringId === previewVersion.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Restaurar e salvar esta versão
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CalendarMark() {
  return <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />;
}
