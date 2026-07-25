import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Network, Wand2, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { MermaidDiagram } from './MermaidDiagram';

interface Props {
  apostilaId: string;
  apostilaTitle: string;
}

interface SummaryData {
  summary_md: string;
  mindmap_mermaid: string;
}

/**
 * Botão "Resumo Express + Mapa Mental" — gera ou exibe a versão cacheada.
 */
export function ApostilaSummaryDialog({ apostilaId, apostilaTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SummaryData | null>(null);
  const [tab, setTab] = useState<'summary' | 'mindmap'>('summary');

  const load = async (force = false) => {
    setLoading(true);
    try {
      const { data: resp, error } = await supabase.functions.invoke('apostila-summary', {
        body: { apostila_id: apostilaId, force },
      });
      if (error) throw error;
      const r = resp as SummaryData & { error?: string };
      if (r?.error) throw new Error(r.error);
      setData({ summary_md: r.summary_md, mindmap_mermaid: r.mindmap_mermaid });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao gerar resumo');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (v: boolean) => {
    setOpen(v);
    if (v && !data) load(false);
  };

  const downloadSummary = () => {
    if (!data?.summary_md) return;
    const blob = new Blob([`# ${apostilaTitle}\n\n${data.summary_md}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${apostilaTitle.replace(/[^\w]+/g, '_')}_resumo.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Resumo baixado');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Wand2 className="h-3.5 w-3.5" />
          Resumo + Mapa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Wand2 className="h-4 w-4 text-primary" />
            <span className="line-clamp-1">{apostilaTitle}</span>
          </DialogTitle>
        </DialogHeader>

        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-12">
            <Wand2 className="h-10 w-10 text-primary animate-pulse mb-3" />
            <p className="text-sm font-medium">Gerando resumo e mapa mental...</p>
            <p className="text-xs text-muted-foreground mt-1">Pode levar 10-20 segundos</p>
          </div>
        )}

        {data && (
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'summary' | 'mindmap')} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <TabsList>
                <TabsTrigger value="summary" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Resumo Express</TabsTrigger>
                <TabsTrigger value="mindmap" className="gap-1.5"><Network className="h-3.5 w-3.5" /> Mapa Mental</TabsTrigger>
              </TabsList>
              <div className="flex gap-1">
                {tab === 'summary' && (
                  <Button size="sm" variant="ghost" onClick={downloadSummary} className="h-8 gap-1.5">
                    <Download className="h-3.5 w-3.5" /> Baixar
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => load(true)} disabled={loading} className="h-8 gap-1.5">
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Regenerar
                </Button>
              </div>
            </div>

            <TabsContent value="summary" className="flex-1 overflow-y-auto mt-3 pr-2">
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-h2:text-lg prose-h2:mt-5 prose-h2:mb-2 prose-ul:my-2 prose-li:my-0.5">
                <ReactMarkdown>{data.summary_md}</ReactMarkdown>
              </div>
            </TabsContent>

            <TabsContent value="mindmap" className="flex-1 overflow-auto mt-3 pr-2">
              <MermaidDiagram chart={data.mindmap_mermaid} className="min-h-[400px]" />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
