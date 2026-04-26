import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, BookPlus, Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { Book } from '@/modules/library/types';
import { detectFileType } from '@/modules/library/types';

export default function AdminBibliotecaPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { void load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    setBooks((data || []) as Book[]);
  };

  const upload = async () => {
    if (!user || !bookFile || !title) {
      toast.error('Título e arquivo são obrigatórios');
      return;
    }
    setUploading(true);
    try {
      const ext = bookFile.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileType = detectFileType(bookFile.name);
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('books').upload(path, bookFile);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('books').getPublicUrl(path);

      let coverUrl: string | null = null;
      if (coverFile) {
        const cExt = coverFile.name.split('.').pop() || 'jpg';
        const cPath = `${user.id}/covers/${Date.now()}.${cExt}`;
        const { error: cErr } = await supabase.storage.from('books').upload(cPath, coverFile);
        if (!cErr) coverUrl = supabase.storage.from('books').getPublicUrl(cPath).data.publicUrl;
      }

      const { error } = await supabase.from('books').insert({
        title, author: author || null, description: description || null,
        cover_url: coverUrl, file_url: publicUrl, file_type: fileType, created_by: user.id,
        published: false,
      });
      if (error) throw error;
      toast.success('Livro adicionado como rascunho. Publique quando estiver pronto.');
      setTitle(''); setAuthor(''); setDescription(''); setCoverFile(null); setBookFile(null);
      void load();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao enviar');
    } finally {
      setUploading(false);
    }
  };

  const togglePublished = async (book: Book) => {
    const next = !book.published;
    const { error } = await supabase.from('books').update({ published: next }).eq('id', book.id);
    if (error) {
      toast.error(error.message || 'Erro ao atualizar');
      return;
    }
    toast.success(next ? 'Livro publicado' : 'Livro despublicado');
    setBooks((prev) => prev.map((b) => (b.id === book.id ? { ...b, published: next } : b)));
  };

  const remove = async (id: string) => {
    if (!confirm('Remover este livro?')) return;
    await supabase.from('books').delete().eq('id', id);
    toast.success('Removido');
    void load();
  };

  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-sm">Acesso restrito.</p></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="w-full max-w-screen-lg mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao Admin
        </Button>
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><BookPlus className="h-5 w-5" /> Biblioteca — Admin</h1>

        <Card className="p-5 mb-8 space-y-3">
          <h2 className="font-semibold">Adicionar Livro</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Título *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label>Autor</Label><Input value={author} onChange={(e) => setAuthor(e.target.value)} /></div>
          </div>
          <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Capa (imagem)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label>Arquivo (PDF ou EPUB) *</Label>
              <Input type="file" accept=".pdf,.epub,application/pdf,application/epub+zip" onChange={(e) => setBookFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <Button onClick={upload} disabled={uploading || !title || !bookFile}>
            {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</> : 'Adicionar'}
          </Button>
        </Card>

        <h2 className="font-semibold mb-3">Livros ({books.length})</h2>
        <div className="space-y-2">
          {books.map((b) => (
            <Card key={b.id} className="p-3 flex items-center gap-3">
              <div className="w-10 h-14 bg-muted rounded flex-shrink-0 overflow-hidden">
                {b.cover_url && <img src={b.cover_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{b.title}</p>
                <p className="text-xs text-muted-foreground truncate">{b.author || '—'} · {b.file_type.toUpperCase()}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(b.id)} className="h-8 w-8 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
