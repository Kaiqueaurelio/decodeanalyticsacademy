import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/AppHeader';
import { NotionBlockEditor, BlockData } from '@/components/notion/NotionBlockEditor';
import { toast } from 'sonner';
import { GlitchLoader } from '@/components/GlitchLoader';

export default function NotebookPage() {
  const { notebookId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<any[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [pageBlocks, setPageBlocks] = useState<BlockData[]>([]);
  const [saving, setSaving] = useState(false);
  const [notebookTitle, setNotebookTitle] = useState('');

  useEffect(() => {
    if (!notebookId || !user) return;
    fetchNotebookData();
  }, [notebookId, user]);

  const fetchNotebookData = async () => {
    setLoading(true);
    // @ts-ignore
    const { data: notebook } = await supabase
      .from('notebooks' as any)
      .select('title')
      .eq('id', notebookId)
      .single();
    
    if (notebook) setNotebookTitle((notebook as any).title);

    // @ts-ignore
    const { data: pagesData } = await supabase
      .from('notebook_pages' as any)
      .select('*')
      .eq('notebook_id', notebookId)
      .order('position', { ascending: true });

    if (pagesData) {
      setPages(pagesData as any[]);
      if ((pagesData as any[]).length > 0 && !currentPageId) {
        setCurrentPageId((pagesData as any[])[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentPageId) {
      fetchPageContent(currentPageId);
    }
  }, [currentPageId]);

  const fetchPageContent = async (pageId: string) => {
    // @ts-ignore
    const { data: contents } = await supabase
      .from('notebook_page_contents' as any)
      .select('*')
      .eq('page_id', pageId)
      .order('position', { ascending: true });

    if (contents) {
      setPageBlocks((contents as any[]).map(c => ({
        id: c.id,
        type: c.type as any,
        content: c.content
      })));
    } else {
      setPageBlocks([]);
    }
  };

  const createPage = async () => {
    if (!notebookId) return;
    // @ts-ignore
    const { data: newPage } = await supabase
      .from('notebook_pages' as any)
      .insert({
        notebook_id: notebookId,
        title: 'Nova Página',
        position: pages.length
      })
      .select()
      .single();

    if (newPage) {
      setPages([...pages, newPage]);
      setCurrentPageId((newPage as any).id);
      toast.success('Página criada');
    }
  };

  const saveContent = async () => {
    if (!currentPageId) return;
    setSaving(true);
    try {
      // @ts-ignore
      await supabase.from('notebook_page_contents' as any).delete().eq('page_id', currentPageId);
      
      const toInsert = pageBlocks.map((b, idx) => ({
        page_id: currentPageId,
        type: b.type,
        content: b.content,
        position: idx
      }));

      if (toInsert.length > 0) {
        // @ts-ignore
        await supabase.from('notebook_page_contents' as any).insert(toInsert);
      }
      toast.success('Alterações salvas');
    } catch (e) {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><GlitchLoader text="Abrindo Caderno..." /></div>;

  const activePage = pages.find(p => p.id === currentPageId);

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      <div className="max-w-6xl mx-auto flex gap-6 px-4 py-8">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 space-y-6">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Páginas</h3>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={createPage}><Plus className="h-3 w-3" /></Button>
            </div>
            <div className="space-y-1">
              {pages.map(page => (
                <button
                  key={page.id}
                  onClick={() => setCurrentPageId(page.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    currentPageId === page.id ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-accent/5'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="truncate">{page.title}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Editor Area */}
        <main className="flex-1 bg-card/20 rounded-3xl border border-border/40 backdrop-blur-md overflow-hidden min-h-[70vh]">
          {activePage ? (
            <div className="p-8 sm:p-12 space-y-8">
              <header className="flex items-start justify-between border-b border-border/40 pb-6">
                <div className="space-y-2">
                  <h1 className="text-4xl font-display font-black tracking-tight">{activePage.title}</h1>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Caderno: {notebookTitle}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveContent} disabled={saving} className="gap-2 shadow-xl shadow-primary/20">
                    <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </header>

              <div className="prose prose-invert max-w-none">
                <NotionBlockEditor 
                  blocks={pageBlocks} 
                  onChange={setPageBlocks} 
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
              <FileText className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-semibold">Nenhuma página selecionada</p>
              <Button variant="outline" size="sm" onClick={createPage} className="mt-4">Criar primeira página</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
