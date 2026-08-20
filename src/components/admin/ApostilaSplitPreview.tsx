import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, List, Calendar, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PreviewPage {
  title: string;
  content: string;
  date?: string;
}

interface ApostilaSplitPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  previewData: {
    pages: PreviewPage[];
    totalDates: number;
  };
}

export function ApostilaSplitPreview({
  isOpen,
  onClose,
  onConfirm,
  loading,
  previewData
}: ApostilaSplitPreviewProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'content'>('list');

  return (
    <div className={isOpen ? "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" : "hidden"}>
      <div className="bg-[#050508] border border-ciano/30 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,240,255,0.1)]">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-[#050508] to-[#0A0A15]">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-ciano" />
              Prévia da Separação por Data
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Detectamos {previewData.totalDates} datas diferentes. O conteúdo será segmentado conforme abaixo.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <AlertCircle className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-6">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col">
            <TabsList className="bg-white/5 border border-white/10 p-1 mb-6 self-start">
              <TabsTrigger value="list" className="data-[state=active]:bg-ciano data-[state=active]:text-black">
                <List className="w-4 h-4 mr-2" />
                Lista de Páginas
              </TabsTrigger>
              <TabsTrigger value="content" className="data-[state=active]:bg-ciano data-[state=active]:text-black">
                <FileText className="w-4 h-4 mr-2" />
                Conteúdo Detalhado
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-3">
                  {previewData.pages.map((page, idx) => (
                    <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-lg hover:border-ciano/30 transition-colors group">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="border-ciano/50 text-ciano text-[10px]">
                              PÁGINA {idx + 1}
                            </Badge>
                            {page.date && (
                              <Badge className="bg-roxo text-white text-[10px]">
                                {page.date}
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-white font-medium group-hover:text-ciano transition-colors">
                            {page.title}
                          </h3>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {page.content.length} chars
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="content" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4 border border-white/10 rounded-lg bg-black/40 p-4">
                <div className="space-y-12">
                  {previewData.pages.map((page, idx) => (
                    <div key={idx} className="relative">
                      <div className="sticky top-0 z-10 bg-[#050508]/90 backdrop-blur py-2 border-b border-white/10 mb-4 flex items-center justify-between">
                        <h4 className="text-ciano font-bold text-sm uppercase tracking-wider">
                          {page.title}
                        </h4>
                        <Badge variant="outline" className="text-[10px]">Pág. {idx + 1}</Badge>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none opacity-80">
                        <ReactMarkdown>{page.content}</ReactMarkdown>
                      </div>
                      {idx < previewData.pages.length - 1 && (
                        <div className="mt-8 pt-8 border-t border-dashed border-white/10 text-center">
                          <span className="text-[10px] text-gray-600 font-mono uppercase tracking-[0.2em]">Quebra de Página</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-6 border-t border-white/10 bg-black/40 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading} className="border-white/10 hover:bg-white/5 text-gray-300">
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={loading}
            className="bg-ciano hover:bg-ciano/80 text-black font-bold shadow-[0_0_20px_rgba(0,240,255,0.3)]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              'Aplicar Separação'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
