import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, RotateCcw, X, Clock, User } from 'lucide-react';
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
  const [open, setOpen] = useState(false);

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
    if (open) {
      fetchVersions();
    }
  }, [open, apostilaId]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
          <History className="h-3 w-3 text-primary" />
          Histórico
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0 sm:w-[400px]">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-sm font-semibold flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico de Versões
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-64px)]">
          <div className="p-4 space-y-4">
            {loading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 w-full bg-muted animate-pulse rounded-md" />
                ))}
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">Nenhuma versão anterior encontrada.</p>
              </div>
            ) : (
              versions.map((v) => (
                <div 
                  key={v.id} 
                  className="group relative border rounded-lg p-3 hover:border-primary/50 transition-colors bg-card"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium line-clamp-1">{v.title || 'Sem título'}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(v.created_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        onRestore({ title: v.title, content: v.content });
                        setOpen(false);
                      }}
                      title="Restaurar esta versão"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 bg-muted/50 p-1.5 rounded">
                    {v.content.substring(0, 100)}...
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
