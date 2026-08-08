import React from 'react';
import { 
  Plus, 
  Link as LinkIcon, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  FileUp, 
  Sparkles, 
  Wand2, 
  FileText, 
  Check 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { CategorySelect } from '@/components/admin/CategorySelect';

interface ApostilaCreationCardProps {
  batchMode: boolean;
  setBatchMode: (v: boolean) => void;
  importStep: 'input' | 'edit' | 'review';
  setImportStep: (v: 'input' | 'edit' | 'review') => void;
  importMode: 'url' | 'text';
  setImportMode: (v: 'url' | 'text') => void;
  importUrl: string;
  setImportUrl: (v: string) => void;
  importTitle: string;
  setImportTitle: (v: string) => void;
  importTopic: string;
  setImportTopic: (v: string) => void;
  importRawText: string;
  setImportRawText: (v: string) => void;
  batchUrls: string;
  setBatchUrls: (v: string) => void;
  batchRunning: boolean;
  batchProgress: { current: number; total: number; results: any[] };
  cloning: boolean;
  handleExtract: () => Promise<void>;
  handleBatchImport: () => Promise<void>;
  handleSaveReadyText: () => Promise<void>;
  resetImportForm: () => void;
  extractTextFromFile: (file: File, onProgress: (p: { message: string }) => void) => Promise<string>;
  setImportContent: (v: string) => void;
  dbCategories: any[];
}

export function ApostilaCreationCard(props: ApostilaCreationCardProps) {
  const {
    batchMode, setBatchMode, importStep, setImportStep, importMode, setImportMode,
    importUrl, setImportUrl, importTitle, setImportTitle, importTopic, setImportTopic,
    importRawText, setImportRawText, batchUrls, setBatchUrls, batchRunning, batchProgress,
    cloning, handleExtract, handleBatchImport, handleSaveReadyText, resetImportForm,
    extractTextFromFile, setImportContent, dbCategories
  } = props;

  return (
    <Card className="overflow-hidden bg-card/40 backdrop-blur-md border-primary/20 shadow-xl" data-import-card>
      <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary animate-pulse" />
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Central de Criação
        </CardTitle>
        <CardDescription className="text-[11px]">Crie novas apostilas via link, arquivo ou texto estruturado.</CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-5 pt-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Importar Apostila</h3>
          </div>
          <div className="flex items-center gap-2">
            {!batchMode && importStep === 'input' && (
              <div className="inline-flex bg-muted rounded-full p-0.5">
                <button
                  onClick={() => setImportMode('url')}
                  className={`text-[10px] font-medium px-3 py-1 rounded-full transition-colors ${importMode === 'url' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  URL
                </button>
                <button
                  onClick={() => setImportMode('text')}
                  className={`text-[10px] font-medium px-3 py-1 rounded-full transition-colors ${importMode === 'text' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Texto
                </button>
              </div>
            )}
            <button
              onClick={() => { setBatchMode(!batchMode); resetImportForm(); }}
              className={`text-[10px] font-medium px-3 py-1 rounded-full transition-colors ${batchMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
            >
              {batchMode ? 'Lote' : 'Modo Lote'}
            </button>
          </div>
        </div>

        {batchMode ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Cole várias URLs (uma por linha)</Label>
              <Textarea value={batchUrls} onChange={e => setBatchUrls(e.target.value)}
                placeholder={"https://notion.site/pagina-1\nhttps://exemplo.com/artigo"}
                rows={5} className="mt-1 text-xs font-mono" disabled={batchRunning} />
              <p className="text-[10px] text-muted-foreground mt-1">
                {batchUrls.split('\n').filter(u => u.trim().startsWith('http')).length} URL(s) detectada(s)
              </p>
            </div>
            {batchRunning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Importando...</span>
                  <span className="font-medium">{batchProgress.current}/{batchProgress.total}</span>
                </div>
                <Progress value={(batchProgress.current / batchProgress.total) * 100} className="h-2" />
              </div>
            )}
            {batchProgress.results.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {batchProgress.results.map((r, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs p-2 rounded-lg ${r.status === 'ok' ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]' : 'bg-destructive/10 text-destructive'}`}>
                    {r.status === 'ok' ? <CheckCircle className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
                    <span className="truncate">{r.title}</span>
                  </div>
                ))}
              </div>
            )}
            <Button onClick={handleBatchImport} disabled={batchRunning || !batchUrls.trim()} className="w-full gradient-primary text-primary-foreground">
              {batchRunning ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Importando {batchProgress.current}/{batchProgress.total}</> : 'Importar Tudo'}
            </Button>
          </div>
        ) : importStep === 'input' ? (
          <div className="space-y-3">
            {importMode === 'url' ? (
              <>
                <div>
                  <Label htmlFor="import-url" className="text-xs font-medium text-foreground">URL da Página</Label>
                  <div className="flex gap-3 mt-1.5">
                    <div className="relative flex-1">
                      <Input id="import-url" value={importUrl} onChange={e => setImportUrl(e.target.value)} placeholder="Ex: https://youtu.be/… ou https://notion.site/…"
                        className={importUrl.includes('notion') ? 'pr-20' : ''} />
                      {importUrl.includes('notion') && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">Notion</span>
                      )}
                    </div>
                    <Button onClick={handleExtract} disabled={cloning || !importUrl.trim()} className="gradient-primary text-primary-foreground shrink-0">
                      {cloning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Clonar'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div
                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = Array.from(e.dataTransfer.files);
                    const file = files.find(f => /\.(pdf|txt|docx?)$/i.test(f.name));
                    if (!file) { toast.error('Arraste um arquivo PDF, TXT ou DOCX'); return; }
                    const tId = toast.loading(`Lendo ${file.name}...`);
                    try {
                      const text = await extractTextFromFile(file, (p) => {
                        toast.loading(p.message, { id: tId });
                      });
                      if (!text || text.trim().length < 20) {
                        toast.error('Não foi possível extrair texto deste arquivo.', { id: tId });
                        return;
                      }
                      setImportRawText(importRawText ? importRawText + '\n\n' + text : text);
                      if (!importTitle) setImportTitle(file.name.replace(/\.[^.]+$/, ''));
                      toast.success(`"${file.name}" extraído`, { id: tId });
                    } catch (err: any) {
                      toast.error(err?.message || 'Erro ao ler o arquivo', { id: tId });
                    }
                  }}
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.pdf,.txt,.doc,.docx';
                    input.onchange = async (ev) => {
                      const file = (ev.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      const tId = toast.loading(`Lendo ${file.name}...`);
                      try {
                        const text = await extractTextFromFile(file, (p) => {
                          toast.loading(p.message, { id: tId });
                        });
                        if (!text || text.trim().length < 20) {
                          toast.error('Não foi possível extrair texto deste arquivo.', { id: tId });
                          return;
                        }
                        setImportRawText(importRawText ? importRawText + '\n\n' + text : text);
                        if (!importTitle) setImportTitle(file.name.replace(/\.[^.]+$/, ''));
                        toast.success(`"${file.name}" extraído`, { id: tId });
                      } catch (err: any) {
                        toast.error(err?.message || 'Erro ao ler o arquivo', { id: tId });
                      }
                    };
                    input.click();
                  }}
                >
                  <FileUp className="h-6 w-6 mx-auto text-muted-foreground mb-1.5" />
                  <p className="text-xs font-medium text-foreground">Arraste um PDF, TXT ou DOCX aqui</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">ou clique para selecionar</p>
                </div>

                <div className="relative my-2">
                  <div className="absolute inset-x-0 top-1/2 border-t border-border" />
                  <p className="relative bg-card text-[10px] text-muted-foreground text-center w-fit mx-auto px-2">ou cole o texto</p>
                </div>

                <div>
                  <Label className="text-xs font-medium text-foreground mb-1.5 block">Texto da Apostila</Label>
                  <Textarea
                    value={importRawText}
                    onChange={e => setImportRawText(e.target.value)}
                    placeholder={"Cole o conteúdo bruto aqui..."}
                    rows={8}
                    className="min-h-[200px] resize-y leading-6"
                  />
                </div>
              </>
            )}
            <div>
              <Label className="text-xs font-medium text-foreground">Título (opcional)</Label>
              <Input value={importTitle} onChange={e => setImportTitle(e.target.value)} placeholder="Título da apostila" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-xs font-medium text-foreground">Disciplina</Label>
              <Input value={importTopic} onChange={e => setImportTopic(e.target.value)} placeholder="Ex: Redes de Computadores" className="mt-1.5" />
            </div>
            {importMode === 'text' && (
              <div className="grid gap-3 sm:grid-cols-3 mt-4">
                <Button 
                  onClick={handleExtract} 
                  disabled={cloning || !importRawText.trim()} 
                  className="w-full gradient-primary text-primary-foreground shadow-lg shadow-primary/20 h-10"
                >
                  {cloning ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <><Wand2 className="h-4 w-4 mr-2" /> Estruturar com Ella</>}
                </Button>
                <Button 
                  onClick={() => {
                    if (!importTitle.trim()) {
                      toast.error("Dê um título antes");
                      return;
                    }
                    setImportContent(importRawText);
                    setImportStep('edit');
                  }}
                  disabled={cloning || !importRawText.trim()} 
                  variant="outline" 
                  className="w-full h-10"
                >
                  <FileText className="h-4 w-4 mr-2" /> Modo Word
                </Button>
                <Button 
                  onClick={handleSaveReadyText} 
                  disabled={cloning || !importRawText.trim() || !importTitle.trim()} 
                  variant="outline" 
                  className="w-full h-10"
                >
                  {cloning ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <><Check className="h-4 w-4 mr-2" /> Salvar Rápido</>}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 text-center">
            <p className="text-xs text-primary mb-2">Aguardando edição no Modo Word ou estruturação...</p>
            <Button variant="ghost" size="sm" onClick={() => setImportStep('input')} className="h-8">Voltar para Entrada</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import { toast } from 'sonner';
