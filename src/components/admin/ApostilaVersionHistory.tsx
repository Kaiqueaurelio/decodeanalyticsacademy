import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, RotateCcw, X, Clock, User, PenTool } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

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

export function ApostilaVersionHistory({ apostilaId, onRestore }: ApostilaVersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVersions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('apostila_versions')
      .select('*')
      .eq('apostila_id', apostilaId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar histórico');
    } else {
      setVersions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (apostilaId) {
      fetchVersions();
    }
  }, [apostilaId]);

  return (
    <div className="flex flex-col h-full bg-card">
      <header className="p-4 border-b bg-muted/20">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Histórico de Versões
        </h3>
        <p className="text-[10px] text-muted-foreground mt-1">
          Visualizando versões salvas da apostila. Clique em restaurar para carregar no editor.
        </p>
      </header>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
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
              <p className="text-[11px] text-muted-foreground mt-2 max-w-[200px] mx-auto leading-relaxed">
                As versões são geradas automaticamente sempre que você salva alterações importantes.
              </p>
            </div>
          ) : (
            versions.map((v, idx) => {
              const nextVersion = versions[idx + 1];
              const hasDiff = nextVersion && (v.content.length !== nextVersion.content.length);

              return (
                <div 
                  key={v.id} 
                  className="group relative border border-border/60 rounded-xl p-3.5 hover:border-primary/50 transition-all bg-card/50 hover:bg-card hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex justify-between items-start mb-2.5">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold line-clamp-1 text-foreground">{v.title || 'Sem título'}</p>
                        {idx === 0 && (
                          <Badge variant="outline" className="text-[8px] h-4 border-emerald-500/30 text-emerald-500 bg-emerald-500/5">ATUAL</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(v.created_at), "dd/MM/yyyy · HH:mm", { locale: ptBR })}
                        </div>
                        {hasDiff && (
                          <span className="flex items-center gap-0.5 text-[9px] bg-ciano/10 text-ciano px-1.5 py-0.5 rounded-md border border-ciano/20">
                            <PenTool className="h-2.5 w-2.5" />
                            Modificada
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 rounded-lg border-primary/20 text-primary hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      onClick={() => {
                        onRestore({ title: v.title, content: v.content });
                        toast.success('Conteúdo restaurado no editor', {
                          description: 'Lembre-se de salvar para persistir esta versão como a atual.',
                          icon: <RotateCcw className="h-4 w-4" />
                        });
                      }}
                      title="Restaurar esta versão"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="text-[10px] text-muted-foreground/80 bg-muted/30 p-2.5 rounded-lg border border-border/40 font-mono line-clamp-2 leading-relaxed italic">
                    {v.content.substring(0, 100)}...
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
      
      <footer className="p-4 border-t bg-muted/10">
        <Button 
          variant="outline" 
          className="w-full h-8 text-xs gap-2 border-primary/20"
          onClick={fetchVersions}
          disabled={loading}
        >
          <RotateCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Atualizar Histórico
        </Button>
      </footer>
    </div>
  );
}
